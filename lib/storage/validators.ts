import { z } from "zod"
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_DOCUMENT_MIME,
  ALLOWED_IMAGE_MIME,
  ALLOWED_PDF_MIME,
  MAX_DOCUMENT_BYTES,
  STORAGE_LIMITS,
} from "@/lib/storage/config"
import type { StorageCategory } from "@/lib/storage/types"

export const storageCategorySchema = z.enum(["image", "document"])

export const storageEntityTypeSchema = z.enum(["application-document"])

export const uploadUrlRequestSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().min(1).max(100),
  fileSize: z.number().int().positive(),
  category: storageCategorySchema,
  entityType: storageEntityTypeSchema,
  entityId: z.string().uuid(),
  subPath: z.string().trim().max(120).optional(),
})

export const downloadUrlRequestSchema = z.object({
  key: z.string().trim().min(1).max(512),
  filename: z.string().trim().max(200).optional(),
  disposition: z.enum(["inline", "attachment"]).default("inline"),
})

export const deleteObjectRequestSchema = z.object({
  key: z.string().trim().min(1).max(512),
})

export const documentConfirmUploadSchema = z.object({
  applicationId: z.string().uuid(),
  documentType: z.string().min(1).max(80),
  key: z.string().trim().min(1).max(512),
  originalName: z.string().trim().max(200).optional(),
  contentType: z.string().trim().min(1).max(100),
  fileSize: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  replace: z.boolean().optional(),
  onBehalf: z.boolean().optional(),
})

export function maxBytesForCategory(category: StorageCategory) {
  return category === "image" ? STORAGE_LIMITS.image : STORAGE_LIMITS.pdf
}

export function isAllowedDocumentMime(mime: string) {
  return ALLOWED_DOCUMENT_MIME.includes(mime as (typeof ALLOWED_DOCUMENT_MIME)[number])
}

export function isAllowedMimeForCategory(mime: string, category: StorageCategory) {
  if (category === "image") {
    return ALLOWED_IMAGE_MIME.includes(mime as (typeof ALLOWED_IMAGE_MIME)[number])
  }
  return ALLOWED_PDF_MIME.includes(mime as (typeof ALLOWED_PDF_MIME)[number])
}

export function extensionFromFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? ""
  return ext.replace(/[^a-z0-9]/g, "")
}

export function validateExtensionForMime(mime: string, extension: string) {
  const ext = extension.toLowerCase()
  if (mime === "application/pdf") return ext === "pdf"
  if (mime === "image/jpeg" || mime === "image/jpg") return ext === "jpg" || ext === "jpeg"
  if (mime === "image/png") return ext === "png"
  if (mime === "image/webp") return ext === "webp"
  return ALLOWED_DOCUMENT_EXTENSIONS.includes(ext as (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number])
}
