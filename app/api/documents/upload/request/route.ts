import { NextResponse } from "next/server"
import { BackendError } from "@/lib/backend/errors"
import { requestDocumentUpload } from "@/lib/documents/upload-request"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await requestDocumentUpload({
      applicationId: String(body.applicationId ?? ""),
      documentType: String(body.documentType ?? ""),
      fileName: String(body.fileName ?? ""),
      contentType: String(body.contentType ?? ""),
      fileSize: Number(body.fileSize ?? 0),
      replace: Boolean(body.replace),
      onBehalf: Boolean(body.onBehalf),
    })
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload URL generation failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}
