import { NextResponse } from "next/server"
import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { getAuthContext } from "@/lib/backend/session"
import { uuidSchema } from "@/lib/backend/zod"
import { getPrisma } from "@/lib/prisma"
import { assertAgentOwnsApplication, isStaffRole } from "@/lib/db/ownership"
import { storedDocumentFileName } from "@/lib/domain"
import { assertSafeObjectKey } from "@/lib/storage/keys"
import { resolveDownloadUrl } from "@/lib/storage/service"
import { clientIp } from "@/lib/backend/request"
import { writeAudit } from "@/lib/db/events"

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const documentId = url.searchParams.get("documentId")
    const rawKey = url.searchParams.get("key")
    const disposition = url.searchParams.get("disposition") === "attachment" ? "attachment" : "inline"

    if (documentId) {
      return NextResponse.json(await signedDocumentDownload(documentId, disposition))
    }

    throw new BackendError("STORAGE", "Provide documentId to download a file", 400)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed"
    const status = error instanceof BackendError ? error.status : 400
    return NextResponse.json({ error: message }, { status })
  }
}

async function signedDocumentDownload(documentId: string, disposition: "inline" | "attachment") {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const id = uuidSchema.parse(documentId)

  const doc = await prisma.document.findFirst({
    where: { id, deletedAt: null },
    include: { type: true, application: true },
  })
  if (!doc) throw new NotFoundError("Document not found")
  if (!doc.storageKey) throw new BackendError("DOCUMENT", "No file uploaded")

  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, doc.application.agentId)
  }

  const safeKey = assertSafeObjectKey(doc.storageKey)
  const owner = await prisma.agent.findUnique({
    where: { id: doc.application.agentId },
    select: { agentCode: true },
  })
  const filename = storedDocumentFileName({
    agentName: doc.application.agentName ?? "agent",
    agentCode: owner?.agentCode,
    agentId: doc.application.agentId,
    documentType: doc.type?.code ?? doc.documentType,
    extension: doc.fileExtension ?? "png",
  })

  const signed = await resolveDownloadUrl({ key: safeKey, filename, disposition })

  if (disposition === "attachment") {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Document",
      action: "Downloaded document",
      detail: `${filename} for ${doc.application.agentName ?? "agent"} (${doc.documentType})`,
      entityType: "document",
      entityId: documentId,
      target: doc.application.applicationNumber ?? doc.application.id,
      ipAddress: await clientIp(),
    })
  }

  return { downloadUrl: signed.downloadUrl, filename, expiresIn: signed.expiresIn }
}
