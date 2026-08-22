import { NextResponse } from "next/server"
import { BackendError } from "@/lib/backend/errors"
import { documentTypeSchema } from "@/lib/backend/zod"
import { requestDocumentUpload } from "@/lib/documents/upload-request"
import { uploadUrlRequestSchema, maxBytesForCategory, isAllowedMimeForCategory } from "@/lib/storage/validators"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = uploadUrlRequestSchema.parse(body)

    const limit = maxBytesForCategory(input.category)
    if (input.fileSize > limit) {
      throw new BackendError("STORAGE", `File is too large (max ${Math.round(limit / (1024 * 1024))}MB)`, 400)
    }

    const mime = input.contentType === "image/jpg" ? "image/jpeg" : input.contentType
    if (!isAllowedMimeForCategory(mime, input.category)) {
      throw new BackendError("STORAGE", "Invalid file type", 400)
    }

    if (input.entityType === "application-document") {
      const documentType = documentTypeSchema.parse(input.subPath)
      const result = await requestDocumentUpload({
        applicationId: input.entityId,
        documentType,
        fileName: input.fileName,
        contentType: mime,
        fileSize: input.fileSize,
        replace: Boolean((body as { replace?: boolean }).replace),
        onBehalf: Boolean((body as { onBehalf?: boolean }).onBehalf),
      })
      return NextResponse.json(result)
    }

    throw new BackendError("STORAGE", "Unsupported entity type", 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload URL generation failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}
