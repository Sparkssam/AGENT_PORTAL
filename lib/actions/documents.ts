"use server"

import { storedDocumentFileName } from "@/lib/domain"
import { BackendError, ForbiddenError, NotFoundError } from "@/lib/backend/errors"
import { canAgentChangeDocument, isClosedStatus } from "@/lib/backend/status"
import { getAuthContext } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import { getPrisma } from "@/lib/prisma"
import { withDbGuards } from "@/lib/db/guards"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { processDocumentUpload } from "@/lib/documents/process-upload"
import { getApplication } from "@/lib/actions/applications"
import { removeStoredObject, signedStoredUrl } from "@/lib/storage/resolver"

async function getOwnedDocument(documentId: string) {
  const { profile } = await getAuthContext()
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

  return { prisma, profile, isAdmin, doc, app: doc.application, type: doc.type }
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
        adminUploaded: false,
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
      data: { status: "rejected", rejectionReason: reason, verifiedById: null, verifiedAt: null, adminUploaded: false },
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
  const { profile, isAdmin, doc, app, type } = await getOwnedDocument(documentId)
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
        adminUploaded: false,
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
    await removeStoredObject(doc.storageKey)
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
  const { profile, doc, app, type } = await getOwnedDocument(documentId)
  if (!doc.storageKey) throw new BackendError("DOCUMENT", "No file uploaded")

  const owner = await getPrisma().agent.findUnique({ where: { id: app.agentId }, select: { agentCode: true } })
  const filename = storedDocumentFileName({
    agentName: app.agentName ?? "agent",
    agentCode: owner?.agentCode,
    agentId: app.agentId,
    documentType: type?.code ?? doc.documentType,
    extension: doc.fileExtension ?? "png",
  })

  const getUrl = await signedStoredUrl(doc.storageKey, { filename, disposition })

  if (disposition === "attachment") {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Document",
      action: "Downloaded document",
      detail: `${filename} for ${app.agentName ?? "agent"} (${doc.documentType})`,
      entityType: "document",
      entityId: documentId,
      target: app.applicationNumber ?? app.id,
      ipAddress: await clientIp(),
    })
  }
  return { getUrl, filename }
}
