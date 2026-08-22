import { randomUUID } from "node:crypto"
import { getApplication } from "@/lib/actions/applications"
import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { canAgentChangeDocument, isClosedStatus } from "@/lib/backend/status"
import { getAuthContext } from "@/lib/backend/session"
import { clientIp, extensionFromMime } from "@/lib/backend/request"
import { documentTypeSchema, uuidSchema } from "@/lib/backend/zod"
import { storedDocumentFileName } from "@/lib/domain"
import { assertSafeObjectKey, buildDocumentStorageKey, isR2StorageKey } from "@/lib/storage/keys"
import { MAX_DOCUMENT_BYTES } from "@/lib/storage/config"
import { assertBufferMatchesMime, normalizeMimeType, resolveDocumentMime } from "@/lib/storage/mime"
import { deleteObject, getObjectBuffer, headObject } from "@/lib/storage/service"
import { isAllowedDocumentMime } from "@/lib/storage/validators"
import { removeStoredObject, fetchStoredObject } from "@/lib/storage/resolver"
import { getPrisma } from "@/lib/prisma"
import { writeAudit } from "@/lib/db/events"
import { withDbGuards } from "@/lib/db/guards"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { insertDocumentVerification } from "@/lib/db/verification-store"
import { runDocumentPipeline, type VerifiableDocumentType } from "@/lib/verification"
import { isR2Configured } from "@/lib/storage/r2-client"

function isoDate(value?: Date | string | null) {
  if (!value) return ""
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

export interface ConfirmDocumentUploadInput {
  applicationId: string
  documentType: string
  key: string
  originalName?: string
  contentType: string
  fileSize: number
  replace?: boolean
  onBehalf?: boolean
}

function assertKeyMatchesApplication(
  key: string,
  opts: { agentId: string; applicationId: string; documentType: string },
) {
  const safeKey = assertSafeObjectKey(key)
  const prefix = `documents/applications/${opts.agentId}/${opts.applicationId}/${opts.documentType}/`
  if (!safeKey.startsWith(prefix)) {
    throw new BackendError("STORAGE", "Invalid upload key for this application", 403)
  }
  return safeKey
}

export async function confirmDocumentUpload(input: ConfirmDocumentUploadInput) {
  if (!isR2Configured()) {
    throw new BackendError("STORAGE", "Cloudflare R2 is not configured", 503)
  }

  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const applicationId = uuidSchema.parse(input.applicationId)
  const documentType = documentTypeSchema.parse(input.documentType)
  const mime = normalizeMimeType(resolveDocumentMime({ declared: input.contentType, fileName: input.originalName ?? "" }))

  if (input.fileSize <= 0) throw new BackendError("DOCUMENT", "Choose a file to upload")
  if (input.fileSize > MAX_DOCUMENT_BYTES) throw new BackendError("DOCUMENT", "File is too large (max 10MB)")
  if (!isAllowedDocumentMime(mime)) {
    throw new BackendError("DOCUMENT", "Only PDF, JPG, JPEG, and PNG files are allowed")
  }

  const type = await prisma.documentType.findUnique({ where: { code: documentType } })
  if (!type) throw new BackendError("DOCUMENT", "Unknown document type")

  const app = await prisma.application.findFirst({ where: { id: applicationId, deletedAt: null } })
  if (!app) throw new NotFoundError("Application not found")

  const owner = await prisma.agent.findUnique({
    where: { id: app.agentId },
    include: { profile: { select: { fullName: true, phone: true, email: true } } },
  })
  if (!owner) throw new NotFoundError("Agent record not found")

  const storageKey = assertKeyMatchesApplication(input.key, {
    agentId: owner.id,
    applicationId: app.id,
    documentType,
  })

  const replacing = Boolean(input.replace)
  const onBehalf = Boolean(input.onBehalf)

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
  if (onBehalf && !isAdmin) throw new BackendError("DOCUMENT", "Only staff can upload on behalf of an agent")

  const head = await headObject(storageKey)
  if (!head.contentLength || head.contentLength <= 0) {
    throw new BackendError("STORAGE", "Uploaded file is empty", 400)
  }
  if (head.contentLength > type.maxSizeBytes) {
    await deleteObject({ key: storageKey }).catch(() => undefined)
    throw new BackendError("DOCUMENT", "File is too large")
  }
  if (Math.abs(head.contentLength - input.fileSize) > 1024) {
    await deleteObject({ key: storageKey }).catch(() => undefined)
    throw new BackendError("STORAGE", "Uploaded file size does not match", 400)
  }

  const { buffer } = await getObjectBuffer(storageKey)
  assertBufferMatchesMime(buffer, mime)

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
    await deleteObject({ key: storageKey }).catch(() => undefined)
    throw new BackendError("DOCUMENT_QUALITY", verification.issues.join(". ") || "Retake the photo and try again", 422)
  }
  if (verification.identity && !verification.identity.passed) {
    await deleteObject({ key: storageKey }).catch(() => undefined)
    throw new BackendError(
      "DOCUMENT_IDENTITY",
      verification.identity.issues.join(" ") || "This document does not match the registered agent details.",
      422,
    )
  }

  const ext = extensionFromMime(mime, input.originalName?.split(".").pop() ?? "bin")
  const fileName = storedDocumentFileName({
    agentName: app.agentName || owner.profile?.fullName || "agent",
    agentCode: owner.agentCode,
    agentId: owner.id,
    documentType: documentType === "other" ? `${documentType}_${randomUUID().slice(0, 8)}` : documentType,
    extension: ext,
  })

  const existing =
    documentType === "other"
      ? null
      : await prisma.document.findFirst({
          where: { applicationId: app.id, documentType, deletedAt: null },
        })

  if (existing?.storageKey && existing.status !== "missing" && existing.status !== "rejected" && !replacing && !onBehalf) {
    await deleteObject({ key: storageKey }).catch(() => undefined)
    throw new BackendError("DOCUMENT", "This document is already uploaded. Choose Replace to send a new file.")
  }

  const autoAccept = Boolean(isAdmin && (onBehalf || (replacing && existing?.adminUploaded)))
  const payload = {
    storageKey,
    originalName: input.originalName ?? fileName,
    mimeType: mime,
    fileSize: BigInt(head.contentLength),
    fileExtension: ext,
    status: autoAccept ? ("verified" as const) : ("unverified" as const),
    rejectionReason: null,
    uploadedAt: new Date(),
    adminUploaded: autoAccept,
    verifiedById: autoAccept ? profile.id : null,
    verifiedAt: autoAccept ? new Date() : null,
  }

  let documentId = existing?.id
  const previousKey = existing?.storageKey

  if (existing) {
    await withDbGuards(async (tx) => {
      await tx.document.update({ where: { id: existing.id }, data: payload })
    })
  } else {
    const inserted = await withDbGuards(async (tx) =>
      tx.document.create({
        data: { applicationId: app.id, documentType, ...payload },
      }),
    )
    documentId = inserted.id
  }

  if (previousKey && previousKey !== storageKey) {
    await removeStoredObject(previousKey).catch(() => undefined)
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
    detail: `${documentType} for ${agentLabel} as ${fileName} (original ${input.originalName ?? fileName})`,
    entityType: "document",
    entityId: documentId,
    target: app.applicationNumber ?? app.id,
    ipAddress: await clientIp(),
  })

  return { documentId, application: await getApplication(app.id), verification }
}

/** Legacy server-side upload path — kept for backward compatibility during migration. */
export async function processDocumentUpload(formData: FormData) {
  const { supabase, profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const applicationId = uuidSchema.parse(String(formData.get("applicationId") ?? ""))
  const documentType = documentTypeSchema.parse(String(formData.get("documentType") ?? ""))
  const incoming = formData.get("file")
  if (!(incoming instanceof File) || incoming.size === 0) throw new BackendError("DOCUMENT", "Choose a file to upload")

  const mime = resolveDocumentMime({ declared: incoming.type, fileName: incoming.name })
  if (incoming.size > MAX_DOCUMENT_BYTES) throw new BackendError("DOCUMENT", "File is too large (max 10MB)")
  if (!isAllowedDocumentMime(mime)) {
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
  assertBufferMatchesMime(buffer, mime)

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

  const path = isR2Configured()
    ? buildDocumentStorageKey({
        agentId: owner.id,
        applicationId: app.id,
        documentType,
        mimeType: mime,
        fallbackExtension: ext,
      })
    : `${owner.userId}/${app.id}/${fileName}`

  if (isR2Configured()) {
    const { putObjectBuffer } = await import("@/lib/storage/service")
    await putObjectBuffer(path, buffer, mime)
  } else {
    const { DOCUMENTS_BUCKET } = await import("@/lib/storage/paths")
    const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: true,
    })
    if (storageError) throw new BackendError("DOCUMENT", storageError.message)
  }

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
      await removeStoredObject(existing.storageKey)
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
