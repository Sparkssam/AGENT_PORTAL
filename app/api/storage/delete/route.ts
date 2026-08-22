import { NextResponse } from "next/server"
import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { getAuthContext } from "@/lib/backend/session"
import { uuidSchema } from "@/lib/backend/zod"
import { getPrisma } from "@/lib/prisma"
import { assertAgentOwnsApplication, isStaffRole } from "@/lib/db/ownership"
import { assertSafeObjectKey } from "@/lib/storage/keys"
import { removeStoredObject } from "@/lib/storage/resolver"
import { deleteObjectRequestSchema } from "@/lib/storage/validators"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = deleteObjectRequestSchema.parse(body)
    const documentId = typeof (body as { documentId?: unknown }).documentId === "string"
      ? (body as { documentId: string }).documentId
      : undefined

    if (documentId) {
      await authorizeDocumentKey(documentId, input.key)
    } else {
      throw new BackendError("STORAGE", "Provide documentId to delete a file", 400)
    }

    await removeStoredObject(assertSafeObjectKey(input.key))
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "File deletion failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}

async function authorizeDocumentKey(documentId: string, key: string) {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const id = uuidSchema.parse(documentId)

  const doc = await prisma.document.findFirst({
    where: { id, deletedAt: null },
    include: { application: true },
  })
  if (!doc) throw new NotFoundError("Document not found")
  if (!doc.storageKey || doc.storageKey !== assertSafeObjectKey(key)) {
    throw new BackendError("STORAGE", "File access denied", 403)
  }

  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, doc.application.agentId)
  }
}
