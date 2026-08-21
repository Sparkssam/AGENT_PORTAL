/** Private Supabase Storage bucket for application documents. */
export const DOCUMENTS_BUCKET = "application-documents"

export function storageObjectPath(opts: {
  userId: string
  applicationId: string
  documentType: string
  objectId: string
  extension: string
}) {
  const ext = opts.extension.replace(/^\.+/, "").toLowerCase()
  return `${opts.userId}/${opts.applicationId}/${opts.documentType}/${opts.objectId}.${ext}`
}
