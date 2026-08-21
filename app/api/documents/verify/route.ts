import { NextResponse } from "next/server"
import { getAuthContext } from "@/lib/backend/session"
import { runDocumentPipeline, type VerifiableDocumentType } from "@/lib/verification"
import { documentTypeSchema } from "@/lib/backend/zod"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    await getAuthContext()
    const form = await request.formData()
    const file = form.get("file")
    const documentType = documentTypeSchema.parse(String(form.get("documentType") ?? "other"))
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ passed: false, issues: ["Choose a file to upload"], extracted: {}, confidence: 0 }, { status: 400 })
    }
    const result = await runDocumentPipeline({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      documentType: documentType as VerifiableDocumentType,
    })
    return NextResponse.json(result, { status: result.quality.passed ? 200 : 422 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed"
    return NextResponse.json({ passed: false, issues: [message], extracted: {}, confidence: 0 }, { status: 400 })
  }
}
