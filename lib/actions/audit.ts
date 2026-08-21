"use server"

import { mapPrismaAudit } from "@/lib/db/mappers"
import { requireAdmin } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"
import type { AuditCategory, AuditSeverity } from "@/lib/admin-data"

export async function listAudit(filters?: {
  category?: AuditCategory
  severity?: AuditSeverity
  take?: number
}) {
  await requireAdmin()
  const data = await getPrisma().auditLog.findMany({
    where: {
      category: filters?.category,
      severity: filters?.severity,
    },
    orderBy: { createdAt: "desc" },
    take: filters?.take ?? 200,
  })
  return data.map(mapPrismaAudit)
}
