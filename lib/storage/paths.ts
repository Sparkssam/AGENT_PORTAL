/** Private Supabase Storage bucket for application documents. */
export const DOCUMENTS_BUCKET = "application-documents"

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
