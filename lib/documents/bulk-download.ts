import { uuidSchema } from "@/lib/backend/zod"
import { clientIp } from "@/lib/backend/request"
import { requireAdmin } from "@/lib/backend/session"
import { storedDocumentFileName } from "@/lib/domain"
import { zipStoredFiles } from "@/lib/documents/zip"
import { writeAudit } from "@/lib/db/events"
import { getPrisma } from "@/lib/prisma"
import { fetchStoredObject } from "@/lib/storage/resolver"

const BULK_LIMIT = 50

export async function zipAcceptedDocuments(rawIds: string[]) {
  const { profile } = await requireAdmin()
  const ids = [...new Set(rawIds.map((id) => uuidSchema.parse(id)))].slice(0, BULK_LIMIT)
  if (ids.length === 0) {
    return {
      zip: zipStoredFiles([]),
      included: [] as string[],
      skipped: 0,
      requested: 0,
    }
  }

  const prisma = getPrisma()
  const rows = await prisma.document.findMany({
    where: { id: { in: ids }, deletedAt: null },
    include: {
      type: true,
      application: { include: { agent: { select: { agentCode: true } } } },
    },
  })

  const byId = new Map(rows.map((row) => [row.id, row]))
  const files: Array<{ name: string; data: Uint8Array }> = []
  const included: string[] = []
  let skipped = 0

  for (const id of ids) {
    const row = byId.get(id)
    if (!row?.storageKey) {
      skipped += 1
      continue
    }
    try {
      const stored = await fetchStoredObject(row.storageKey)
      const bytes = new Uint8Array(stored.buffer)
      const name = storedDocumentFileName({
        agentName: row.application.agentName ?? "agent",
        agentCode: row.application.agent.agentCode,
        agentId: row.application.agentId,
        documentType: row.type?.code ?? row.documentType,
        extension: row.fileExtension ?? "png",
      })
      files.push({ name, data: bytes })
      included.push(name)
    } catch {
      skipped += 1
    }
  }

  if (files.length) {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Document",
      action: "Bulk downloaded documents",
      detail: `${included.length} file${included.length === 1 ? "" : "s"}: ${included.join(", ")}${
        skipped ? `; ${skipped} not included — no file stored` : ""
      }`,
      entityType: "document",
      ipAddress: await clientIp(),
    })
  }

  return {
    zip: zipStoredFiles(files),
    included,
    skipped,
    requested: ids.length,
  }
}
