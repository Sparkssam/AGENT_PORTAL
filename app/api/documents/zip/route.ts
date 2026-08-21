import { NextResponse } from "next/server"
import { BackendError } from "@/lib/backend/errors"
import { zipAcceptedDocuments } from "@/lib/documents/bulk-download"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { documentIds?: unknown }
    const documentIds = Array.isArray(body.documentIds) ? body.documentIds.filter((id) => typeof id === "string") : []
    const result = await zipAcceptedDocuments(documentIds)
    if (result.included.length === 0) {
      return NextResponse.json(
        {
          error: "No documents to download",
          skipped: result.skipped,
          requested: result.requested,
        },
        { status: 422 },
      )
    }

    return new NextResponse(new Uint8Array(result.zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="documents.zip"`,
        "X-Documents-Included": String(result.included.length),
        "X-Documents-Skipped": String(result.skipped),
        "X-Documents-Requested": String(result.requested),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}
