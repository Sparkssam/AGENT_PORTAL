/** Centralized storage limits — adjust here as product requirements change. */
export const STORAGE_LIMITS = {
  image: 5 * 1024 * 1024,
  pdf: 10 * 1024 * 1024,
} as const

/** Application documents use the larger PDF limit for all types. */
export const MAX_DOCUMENT_BYTES = STORAGE_LIMITS.pdf

export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const
export const ALLOWED_PDF_MIME = ["application/pdf"] as const

export const ALLOWED_DOCUMENT_MIME = [
  ...ALLOWED_IMAGE_MIME.filter((m) => m !== "image/webp"),
  ...ALLOWED_PDF_MIME,
] as const

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const
export const ALLOWED_PDF_EXTENSIONS = ["pdf"] as const
export const ALLOWED_DOCUMENT_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"] as const

export const PUT_URL_TTL_SECONDS = 5 * 60
export const GET_URL_TTL_SECONDS = 10 * 60

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIME)[number]
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number]
export type AllowedPdfMime = (typeof ALLOWED_PDF_MIME)[number]
