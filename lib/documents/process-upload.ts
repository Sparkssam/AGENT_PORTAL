import { randomUUID } from "node:crypto"
import { getApplication } from "@/lib/actions/applications"
import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { canAgentChangeDocument, isClosedStatus } from "@/lib/backend/status"
import { getAuthContext } from "@/lib/backend/session"
import { clientIp, extensionFromMime } from "@/lib/backend/request"
import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES, documentTypeSchema, uuidSchema } from "@/lib/backend/zod"
import { storedDocumentFileName } from "@/lib/domain"
import { DOCUMENTS_BUCKET, storageObjectPath } from "@/lib/storage/paths"
import { getPrisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/db/events"
import { withDbGuards } from "@/lib/db/guards"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { insertDocumentVerification } from "@/lib/db/verification-store"
import { runDocumentPipeline, type VerifiableDocumentType } from "@/lib/verification"
import { mimeFromFile } from "@/lib/documents/catalog"
import { assertUploadRateLimit } from "@/lib/rate-limit"

function isoDate(value?: Date | string | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export async function processDocumentUpload(formData: FormData) {
  const { supabase, profile } = await getAuthContext()
  await assertUploadRateLimit(profile.id)
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const applicationId = uuidSchema.parse(String(formData.get("applicationId") ?? ""))
  const documentType = documentTypeSchema.parse(String(formData.get("documentType") ?? ""))
  const incoming = formData.get("file")
  if (!(incoming instanceof File) || incoming.size === 0) throw new BackendError("DOCUMENT", "Choose a file to upload")

  const mime = mimeFromFile(incoming)
  if (incoming.size > MAX_DOCUMENT_BYTES) throw new BackendError("DOCUMENT", "File is too large (max 10MB)")
  if (!ALLOWED_DOCUMENT_MIME.includes(mime as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    throw new BackendError("DOCUMENT", "Only PDF, JPG, JPEG, and PNG files are allowed")
  }

  const type = await prisma.documentType.findUnique({ where: { code: documentType } })
  if (!type) throw new BackendError("DOCUMENT", "Unknown document type")
  if (incoming.size > type.maxSizeBytes) throw new BackendError("DOCUMENT", "File is too large")
  if (!type.allowedMime.includes(mime) && !type.allowedMime.includes(incoming.type)) {
    throw new BackendError("DOCUMENT", "File type is not allowed for this document")
  }

  const app = await prisma.application.findFirst({ where: { id: applicationId, deletedAt: null } })
  if (!app) throw new NotFoundError("Application not found")

  const owner = await prisma.agent.findUnique({
    where: { id: app.agentId },
    include: { profile: { select: { fullName: true, phone: true, email: true } } },
  })
  if (!owner) throw new NotFoundError("Agent record not found")

  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, app.agentId)
    assertAgentWritable(agent?.status)
    if (!canAgentChangeDocument(app.status, type.required)) {
      throw new BackendError(
        "DOCUMENT",
        isClosedStatus(app.status)
          ? "This application is closed for uploads"
          : "Required documents cannot be changed after submission",
      )
    }
  }

  const buffer = Buffer.from(await incoming.arrayBuffer())
  const verification = await runDocumentPipeline({
    buffer,
    mimeType: mime,
    documentType: documentType as VerifiableDocumentType,
    identity: {
      fullName: app.agentName || owner.profile.fullName || "",
      phone: app.phone || owner.profile.phone || "",
      email: app.email || owner.profile.email || "",
      idType: app.idType ?? "",
      idNumber: app.idNumber ?? "",
      tinNumber: app.tinNumber ?? "",
      issuedPlace: app.issuedPlace ?? "",
      issuedDate: isoDate(app.issuedDate),
      expireDate: isoDate(app.expireDate),
      gender: app.gender ?? "",
    },
  })
  if (!verification.quality.passed) {
    throw new BackendError("DOCUMENT_QUALITY", verification.issues.join(". ") || "Retake the photo and try again", 422)
  }
  if (verification.identity && !verification.identity.passed) {
    throw new BackendError(
      "DOCUMENT_IDENTITY",
      verification.identity.issues.join(" ") || "This document does not match the registered agent details.",
      422,
    )
  }

  const ext = extensionFromMime(mime, incoming.name.split(".").pop() ?? "bin")
  const uniqueSuffix = documentType === "other" ? `_${randomUUID().slice(0, 8)}` : ""
  const fileName = storedDocumentFileName({
    agentName: app.agentName || owner.profile?.fullName || "agent",
    agentCode: owner.agentCode,
    agentId: owner.id,
    documentType: `${documentType}${uniqueSuffix}`,
    extension: ext,
  })
  const path = storageObjectPath({
    userId: owner.userId,
    applicationId: app.id,
    documentType,
    fileName,
    extension: ext,
  })

  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer, {
    contentType: mime,
    upsert: true,
  })
  if (storageError) throw new BackendError("DOCUMENT", storageError.message)

  const existing =
    documentType === "other"
      ? null
      : await prisma.document.findFirst({
          where: { applicationId: app.id, documentType, deletedAt: null },
        })

  const replacing = String(formData.get("replace") ?? "") === "true"
  const onBehalf = isAdmin && String(formData.get("onBehalf") ?? "") === "true"
  if (existing?.storageKey && existing.status !== "missing" && existing.status !== "rejected" && !replacing && !onBehalf) {
    throw new BackendError("DOCUMENT", "This document is already uploaded. Choose Replace to send a new file.")
  }
  if (onBehalf && !isAdmin) throw new BackendError("DOCUMENT", "Only staff can upload on behalf of an agent")

  const autoAccept = Boolean(isAdmin && (onBehalf || (replacing && existing?.adminUploaded)))
  const payload = {
    storageKey: path,
    originalName: incoming.name,
    mimeType: mime,
    fileSize: BigInt(incoming.size),
    fileExtension: ext,
    status: autoAccept ? ("verified" as const) : ("unverified" as const),
    rejectionReason: null,
    uploadedAt: new Date(),
    adminUploaded: autoAccept,
    verifiedById: autoAccept ? profile.id : null,
    verifiedAt: autoAccept ? new Date() : null,
  }

  let documentId = existing?.id
  if (existing) {
    await withDbGuards(async (tx) => {
      await tx.document.update({ where: { id: existing.id }, data: payload })
    })
    if (existing.storageKey && existing.storageKey !== path) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([existing.storageKey])
    }
  } else {
    const inserted = await withDbGuards(async (tx) =>
      tx.document.create({
        data: { applicationId: app.id, documentType, ...payload },
      }),
    )
    documentId = inserted.id
  }

  if (documentType === "deposit_proof" && documentId) {
    await prisma.depositRecord.update({
      where: { applicationId: app.id },
      data: { proofDocumentId: documentId, status: "SUBMITTED" },
    })
  }

  if (documentId) {
    await insertDocumentVerification({
      documentId,
      userId: owner.userId,
      applicationId: app.id,
      documentType,
      passed: verification.passed,
      issues: verification.issues,
      extracted: verification.extracted,
      quality: verification.quality,
      confidence: verification.confidence,
      provider: verification.authenticity.provider,
      authenticity: verification.authenticity,
      reviewStatus: verification.passed ? "pending" : "flagged",
    })
  }

  const agentLabel = app.agentName || owner.profile.fullName || "agent"
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Document",
    action: onBehalf
      ? "Uploaded document on behalf of agent"
      : replacing
        ? autoAccept
          ? "Replaced admin-uploaded document"
          : "Replaced document"
        : isAdmin
          ? "Uploaded document (staff)"
          : "Uploaded document",
    detail: `${documentType} for ${agentLabel} as ${fileName} (original ${incoming.name})`,
    entityType: "document",
    entityId: documentId,
    target: app.applicationNumber ?? app.id,
    ipAddress: await clientIp(),
  })

  return { documentId, application: await getApplication(app.id), verification }
}
