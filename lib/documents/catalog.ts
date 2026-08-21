import { ALLOWED_DOCUMENT_MIME, MAX_DOCUMENT_BYTES } from "@/lib/backend/zod"
import type { Document, DocumentStatus } from "@/lib/admin-data"

export const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/jpg,image/png,.pdf,.jpg,.jpeg,.png"

export const DOCUMENT_TYPE_OPTIONS = [
  { code: "id_front", name: "National ID Card (Front)", required: true },
  { code: "id_back", name: "National ID Card (Back)", required: true },
  { code: "tin", name: "TIN Certificate", required: true },
  { code: "portrait", name: "Portrait", required: true },
  { code: "shop_image", name: "Shop Image", required: true },
  { code: "contract", name: "Agreement Contract", required: true },
  { code: "licence", name: "Business Licence", required: false },
  { code: "other", name: "Other (Optional)", required: false },
  { code: "deposit_proof", name: "Deposit Proof", required: false },
] as const

export type DocumentTypeCode = (typeof DOCUMENT_TYPE_OPTIONS)[number]["code"]

export type DocumentDisplayStatus = "required" | "uploaded" | "pending" | "approved" | "rejected"

export const displayStatusLabels: Record<DocumentDisplayStatus, string> = {
  required: "Required",
  uploaded: "Uploaded",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

export function documentTypeLabel(code: string) {
  return DOCUMENT_TYPE_OPTIONS.find((item) => item.code === code)?.name ?? code
}

export function isRequiredDocumentType(code: string) {
  return DOCUMENT_TYPE_OPTIONS.find((item) => item.code === code)?.required ?? false
}

export function mimeFromFile(file: File) {
  const raw = file.type === "image/jpg" ? "image/jpeg" : file.type
  if (raw && ALLOWED_DOCUMENT_MIME.includes(raw as (typeof ALLOWED_DOCUMENT_MIME)[number])) return raw
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "pdf") return "application/pdf"
  return raw
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateUploadFile(file: File, maxBytes = MAX_DOCUMENT_BYTES) {
  const mime = mimeFromFile(file)
  if (!ALLOWED_DOCUMENT_MIME.includes(mime as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    return "Only PDF, JPG, JPEG, and PNG files are allowed"
  }
  if (file.size === 0) return "The selected file is empty"
  if (file.size > maxBytes) return `File is too large (max ${formatBytes(maxBytes)})`
  return null
}

export function displayDocumentStatus(doc: Pick<Document, "status" | "required">): DocumentDisplayStatus {
  if (doc.status === "rejected") return "rejected"
  if (doc.status === "verified") return "approved"
  if (doc.status === "unverified") return "pending"
  return doc.required === false ? "required" : "required"
}

export function reviewStatusFromDb(status: DocumentStatus): DocumentDisplayStatus {
  if (status === "verified") return "approved"
  if (status === "rejected") return "rejected"
  if (status === "unverified") return "pending"
  return "required"
}

export function documentSummary(documents: Document[]) {
  const required = documents.filter((doc) => doc.required !== false)
  return {
    total: documents.length,
    required: required.length,
    requiredRemaining: required.filter((doc) => doc.status === "missing" || doc.status === "rejected").length,
    uploaded: documents.filter((doc) => doc.status === "unverified" || doc.status === "verified").length,
    pending: documents.filter((doc) => doc.status === "unverified").length,
    approved: documents.filter((doc) => doc.status === "verified").length,
    rejected: documents.filter((doc) => doc.status === "rejected").length,
  }
}

export function isFilledDocumentStatus(status: DocumentStatus) {
  return status === "unverified" || status === "verified"
}

export function isPersistedDocumentId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function supportingDocumentCatalog(includeDepositProof = false) {
  return DOCUMENT_TYPE_OPTIONS.filter((item) => includeDepositProof || item.code !== "deposit_proof")
}

export function mergeDocumentSlots(documents: Document[], includeDepositProof = false): Document[] {
  return supportingDocumentCatalog(includeDepositProof).map((option) => {
    const found = documents.find((doc) => doc.type === option.code)
    if (found) {
      return { ...found, name: option.name, required: option.required }
    }
    return {
      id: `slot-${option.code}`,
      name: option.name,
      type: option.code,
      status: "missing",
      fileType: option.code === "tin" || option.code === "contract" || option.code === "licence" ? "pdf" : "image",
      required: option.required,
    }
  })
}

export function documentSlotProgress(documents: Document[], includeDepositProof = false) {
  const slots = mergeDocumentSlots(documents, includeDepositProof)
  const required = slots.filter((doc) => doc.required !== false)
  const uploaded = slots.filter((doc) => isFilledDocumentStatus(doc.status)).length
  const requiredUploaded = required.filter((doc) => isFilledDocumentStatus(doc.status)).length
  const rejected = slots.some((doc) => doc.status === "rejected")
  const remaining = required.filter((doc) => doc.status === "missing" || doc.status === "rejected").length
  const cardStatus: "EMPTY" | "REJECTED" | "INCOMPLETE" | "COMPLETE" =
    rejected ? "REJECTED" : uploaded === 0 ? "EMPTY" : remaining > 0 ? "INCOMPLETE" : "COMPLETE"
  return {
    slots,
    uploaded,
    total: slots.length,
    requiredUploaded,
    requiredTotal: required.length,
    remaining,
    cardStatus,
  }
}
