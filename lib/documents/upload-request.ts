import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { canAgentChangeDocument, isClosedStatus } from "@/lib/backend/status"
import { getAuthContext } from "@/lib/backend/session"
import { extensionFromMime } from "@/lib/backend/request"
import { documentTypeSchema, uuidSchema } from "@/lib/backend/zod"
import { buildDocumentStorageKey } from "@/lib/storage/keys"
import { MAX_DOCUMENT_BYTES } from "@/lib/storage/config"
import { normalizeMimeType, resolveDocumentMime } from "@/lib/storage/mime"
import { presignPut } from "@/lib/storage/service"
import { isAllowedDocumentMime } from "@/lib/storage/validators"
import { getPrisma } from "@/lib/prisma"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import { isR2Configured } from "@/lib/storage/r2-client"

export interface DocumentUploadRequestInput {
  applicationId: string
  documentType: string
  fileName: string
  contentType: string
  fileSize: number
  replace?: boolean
  onBehalf?: boolean
}

export async function requestDocumentUpload(input: DocumentUploadRequestInput) {
  if (!isR2Configured()) {
    throw new BackendError("STORAGE", "Cloudflare R2 is not configured", 503)
  }

  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const applicationId = uuidSchema.parse(input.applicationId)
  const documentType = documentTypeSchema.parse(input.documentType)
  const mime = resolveDocumentMime({ declared: input.contentType, fileName: input.fileName })
  const normalizedMime = normalizeMimeType(mime)

  if (input.fileSize <= 0) throw new BackendError("DOCUMENT", "Choose a file to upload")
  if (input.fileSize > MAX_DOCUMENT_BYTES) throw new BackendError("DOCUMENT", "File is too large (max 10MB)")
  if (!isAllowedDocumentMime(normalizedMime)) {
    throw new BackendError("DOCUMENT", "Only PDF, JPG, JPEG, and PNG files are allowed")
  }

  const type = await prisma.documentType.findUnique({ where: { code: documentType } })
  if (!type) throw new BackendError("DOCUMENT", "Unknown document type")
  if (input.fileSize > type.maxSizeBytes) throw new BackendError("DOCUMENT", "File is too large")
  if (!type.allowedMime.includes(normalizedMime) && !type.allowedMime.includes(input.contentType)) {
    throw new BackendError("DOCUMENT", "File type is not allowed for this document")
  }

  const app = await prisma.application.findFirst({ where: { id: applicationId, deletedAt: null } })
  if (!app) throw new NotFoundError("Application not found")

  const owner = await prisma.agent.findUnique({ where: { id: app.agentId } })
  if (!owner) throw new NotFoundError("Agent record not found")

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

  const existing =
    documentType === "other"
      ? null
      : await prisma.document.findFirst({
          where: { applicationId: app.id, documentType, deletedAt: null },
        })

  if (existing?.storageKey && existing.status !== "missing" && existing.status !== "rejected" && !replacing && !onBehalf) {
    throw new BackendError("DOCUMENT", "This document is already uploaded. Choose Replace to send a new file.")
  }

  const ext = extensionFromMime(normalizedMime, input.fileName.split(".").pop() ?? "bin")
  const key = buildDocumentStorageKey({
    agentId: owner.id,
    applicationId: app.id,
    documentType,
    mimeType: normalizedMime,
    fallbackExtension: ext,
  })

  const signed = await presignPut(key, normalizedMime)

  return {
    uploadUrl: signed.uploadUrl,
    key: signed.key,
    expiresIn: signed.expiresIn,
    contentType: normalizedMime,
  }
}
