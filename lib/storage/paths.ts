/** @deprecated Application documents are stored in Cloudflare R2. Legacy Supabase bucket name kept for migration reads. */
export const DOCUMENTS_BUCKET = "application-documents"

export { applicationDocumentKey, buildDocumentStorageKey, isR2StorageKey } from "@/lib/storage/keys"

/** @deprecated Use buildDocumentStorageKey or applicationDocumentKey */
export function storageObjectPath(opts: {
  userId: string
  applicationId: string
  documentType: string
  objectId?: string
  fileName?: string
  extension: string
}) {
  const ext = opts.extension.replace(/^\.+/, "").toLowerCase()
  const fileName = opts.fileName?.replace(/^\/+/, "") || `${opts.documentType}/${opts.objectId ?? "file"}.${ext}`
  return `${opts.userId}/${opts.applicationId}/${fileName}`
}
