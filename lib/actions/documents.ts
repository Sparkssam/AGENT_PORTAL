"use server"

import { buildDocumentFileName } from "@/lib/domain"
import { BackendError, ForbiddenError, NotFoundError } from "@/lib/backend/errors"
import { canAgentChangeDocument, isClosedStatus } from "@/lib/backend/status"
import { getAuthContext } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import { DOCUMENTS_BUCKET } from "@/lib/storage/paths"
import { getPrisma } from "@/lib/prisma"
import { withDbGuards } from "@/lib/db/guards"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { processDocumentUpload } from "@/lib/documents/process-upload"
import { getApplication } from "@/lib/actions/applications"

async function getOwnedDocument(documentId: string) {
  const { supabase, profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const doc = await prisma.document.findFirst({
    where: { id: documentId, deletedAt: null },
    include: { type: true, application: true },
  })
  if (!doc) throw new NotFoundError("Document not found")

  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, doc.application.agentId)
  }

  return { supabase, prisma, profile, isAdmin, doc, app: doc.application, type: doc.type }
}

export async function uploadDocumentFile(formData: FormData) {
  return processDocumentUpload(formData)
}

export async function verifyDocument(documentId: string) {
  const { profile, isAdmin, doc, app } = await getOwnedDocument(documentId)
  if (!isAdmin) throw new ForbiddenError("Admin only")
  await withDbGuards(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: {
        status: "verified",
        verifiedById: profile.id,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    })
  })
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Document",
    action: "Verified document",
    detail: doc.documentType,
    entityType: "document",
    entityId: documentId,
    target: app.applicationNumber ?? app.id,
    ipAddress: await clientIp(),
  })
}

export async function rejectDocument(documentId: string, reason: string) {
  if (!reason.trim()) throw new BackendError("DOCUMENT", "A rejection reason is required")
  const { profile, isAdmin, doc, app } = await getOwnedDocument(documentId)
  if (!isAdmin) throw new ForbiddenError("Admin only")
  const prisma = getPrisma()

  await withDbGuards(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: { status: "rejected", rejectionReason: reason, verifiedById: null, verifiedAt: null },
    })
  })

  const open = await prisma.correctionRequest.findFirst({
    where: { applicationId: app.id, resolvedAt: null },
  })
  let requestId = open?.id
  if (!requestId) {
    const created = await prisma.correctionRequest.create({
      data: { applicationId: app.id, requestedById: profile.id, summary: reason },
    })
    requestId = created.id
  }
  await prisma.correctionItem.create({
    data: {
      correctionRequestId: requestId,
      kind: "document",
      target: doc.documentType,
      reason,
    },
  })

  const agent = await prisma.agent.findUnique({ where: { id: app.agentId } })
  if (agent) {
    await emitNotification({
      userId: agent.userId,
      category: "document",
      title: "Document rejected",
      message: reason,
      entityType: "document",
      entityId: documentId,
      email: true,
    })
  }
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Document",
    action: "Rejected document",
    detail: reason,
    entityType: "document",
    entityId: documentId,
    target: app.applicationNumber ?? app.id,
    ipAddress: await clientIp(),
  })
}

export async function clearDocumentFile(documentId: string) {
  const { supabase, profile, isAdmin, doc, app, type } = await getOwnedDocument(documentId)
  if (!isAdmin) {
    const agent = await getPrisma().agent.findUnique({ where: { userId: profile.id } })
    assertAgentWritable(agent?.status)
  }
  if (!isAdmin && !canAgentChangeDocument(app.status, Boolean(type?.required))) {
    throw new BackendError(
      "DOCUMENT",
      isClosedStatus(app.status)
        ? "This application is closed for document changes"
        : "Required documents cannot be changed after submission",
    )
  }
  if (doc.status === "missing" && !doc.storageKey) {
    return { application: await getApplication(app.id) }
  }

  await withDbGuards(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: {
        status: "missing",
        storageKey: null,
        originalName: null,
        mimeType: null,
        fileSize: null,
        fileExtension: null,
        rejectionReason: null,
        uploadedAt: null,
        verifiedById: null,
        verifiedAt: null,
      },
    })
    if (doc.documentType === "deposit_proof") {
      await tx.depositRecord.updateMany({
        where: { applicationId: app.id, proofDocumentId: documentId },
        data: { proofDocumentId: null, status: "AWAITING_PROOF" },
      })
    }
  })

  if (doc.storageKey) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.storageKey])
  }

  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Document",
    action: "Removed document file",
    detail: doc.documentType,
    entityType: "document",
    entityId: documentId,
    target: app.applicationNumber ?? app.id,
    ipAddress: await clientIp(),
  })

  return { application: await getApplication(app.id) }
}

export async function signedGet(documentId: string, disposition: "inline" | "attachment" = "inline") {
  const { supabase, profile, doc, app, type } = await getOwnedDocument(documentId)
  if (!doc.storageKey) throw new BackendError("DOCUMENT", "No file uploaded")

  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.storageKey, 60 * 10, {
    download: disposition === "attachment" ? true : undefined,
  })
  if (error || !data?.signedUrl) throw new BackendError("DOCUMENT", error?.message ?? "Could not sign download")

  const filename =
    disposition === "attachment"
      ? buildDocumentFileName({
          agentName: app.agentName ?? "Agent",
          docName: type?.name ?? doc.documentType,
          network: "Network",
          extension: doc.fileExtension ?? "png",
        })
      : undefined

  if (disposition === "attachment") {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Document",
      action: "Downloaded document",
      detail: filename ?? doc.documentType,
      entityType: "document",
      entityId: documentId,
      target: app.applicationNumber ?? app.id,
      ipAddress: await clientIp(),
    })
  }
  return { getUrl: data.signedUrl, filename }
}
