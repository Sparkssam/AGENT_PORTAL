import { randomUUID } from "node:crypto"
import { extensionFromMime } from "@/lib/backend/request"

const KEY_SEGMENT = /^[a-z0-9_-]+$/i

function assertSafeSegment(value: string, label: string) {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\")) {
    throw new Error(`Invalid ${label} for storage key`)
  }
  if (!KEY_SEGMENT.test(trimmed)) {
    throw new Error(`Invalid ${label} characters for storage key`)
  }
  return trimmed
}

export function normalizeExtension(extension: string) {
  return extension.replace(/^\.+/, "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** R2 object key for application documents (private). */
export function applicationDocumentKey(opts: {
  agentId: string
  applicationId: string
  documentType: string
  extension: string
  objectId?: string
}) {
  const agentId = assertSafeSegment(opts.agentId, "agentId")
  const applicationId = assertSafeSegment(opts.applicationId, "applicationId")
  const documentType = assertSafeSegment(opts.documentType, "documentType")
  const ext = normalizeExtension(opts.extension) || "bin"
  const objectId = opts.objectId ? assertSafeSegment(opts.objectId, "objectId") : randomUUID()
  return `documents/applications/${agentId}/${applicationId}/${documentType}/${objectId}.${ext}`
}

export function buildDocumentStorageKey(opts: {
  agentId: string
  applicationId: string
  documentType: string
  mimeType: string
  fallbackExtension?: string
}) {
  const extension = normalizeExtension(
    extensionFromMime(opts.mimeType, opts.fallbackExtension ?? "bin"),
  )
  return applicationDocumentKey({
    agentId: opts.agentId,
    applicationId: opts.applicationId,
    documentType: opts.documentType,
    extension,
  })
}

/** Detect whether a storage key belongs to R2 (vs legacy Supabase paths). */
export function isR2StorageKey(key: string) {
  return key.startsWith("documents/") || key.startsWith("agents/") || key.startsWith("images/")
}

/** Prevent path traversal in client-supplied keys. */
export function assertSafeObjectKey(key: string) {
  const trimmed = key.trim()
  if (!trimmed || trimmed.startsWith("/") || trimmed.includes("..") || trimmed.includes("\\")) {
    throw new Error("Invalid object key")
  }
  return trimmed
}
