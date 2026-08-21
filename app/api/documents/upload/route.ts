import { NextResponse } from "next/server"
import { BackendError } from "@/lib/backend/errors"
import { processDocumentUpload } from "@/lib/documents/process-upload"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const result = await processDocumentUpload(await request.formData())
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message, issues: [message] }, { status })
  }
}
