import { NextResponse } from "next/server"
import { BackendError } from "@/lib/backend/errors"
import { confirmDocumentUpload } from "@/lib/documents/confirm-upload"
import { documentConfirmUploadSchema } from "@/lib/storage/validators"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = documentConfirmUploadSchema.parse(body)
    const result = await confirmDocumentUpload(input)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload confirmation failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message, issues: [message] }, { status })
  }
}
