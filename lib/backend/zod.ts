import { z } from "zod"

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const ALLOWED_DOCUMENT_MIME = ["image/jpeg", "image/jpg", "image/png", "application/pdf"] as const

export const uuidSchema = z.string().uuid()

export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).toLowerCase(),
  phone: z.string().trim().min(7).max(32),
  password: z.string().min(8).max(72),
})

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(32).optional(),
})

export const applicationDraftSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(32).optional(),
    email: z.string().trim().email().max(160).optional().or(z.literal("")),
    idType: z.string().max(80).optional(),
    idNumber: z.string().max(80).optional(),
    gender: z.string().max(40).optional(),
    businessName: z.string().max(160).optional(),
    sector: z.string().max(80).optional(),
    channel: z.string().max(80).optional(),
    province: z.string().max(80).optional(),
    district: z.string().max(80).optional(),
    ward: z.string().max(80).optional(),
    street: z.string().max(200).optional(),
    houseNumber: z.string().max(80).optional(),
    tinNumber: z.string().max(40).optional(),
    notes: z.string().max(2000).optional(),
    country: z.string().max(80).optional(),
    issuedPlace: z.string().max(120).optional(),
    issuedDate: z.string().max(40).optional(),
    expireDate: z.string().max(40).optional(),
    channelParentType: z.string().max(80).optional(),
    channelParentName: z.string().max(160).optional(),
    channelManagerType: z.string().max(80).optional(),
    channelManagerName: z.string().max(160).optional(),
    channelType: z.string().max(80).optional(),
    lat: z.number().gte(-90).lte(90).optional(),
    lng: z.number().gte(-180).lte(180).optional(),
    locationAccuracy: z.number().optional(),
  })
  .strict()

export const documentTypeSchema = z.enum([
  "id_front",
  "id_back",
  "tin",
  "portrait",
  "shop_image",
  "contract",
  "licence",
  "other",
  "deposit_proof",
])

export const uploadMetaSchema = z.object({
  applicationId: uuidSchema,
  documentType: documentTypeSchema,
  mime: z.enum(ALLOWED_DOCUMENT_MIME),
  size: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  originalName: z.string().max(200).optional(),
})

export const correctionRequestSchema = z.object({
  applicationId: uuidSchema,
  summary: z.string().trim().min(3).max(2000),
  items: z
    .array(
      z.object({
        kind: z.enum(["field", "document"]),
        target: z.string().min(1).max(80),
        reason: z.string().min(2).max(500),
      }),
    )
    .max(20)
    .default([]),
})

export const appStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "PENDING_REVIEW",
  "IN_PROGRESS",
  "NEEDS_CORRECTION",
  "COMPLETED",
  "REJECTED",
])
