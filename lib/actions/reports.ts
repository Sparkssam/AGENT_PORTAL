"use server"

import { requireAdmin } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"
import type { AppStatus } from "@/lib/admin-data"

export async function dashboardStats() {
  await requireAdmin()
  const groups = await getPrisma().application.groupBy({
    by: ["status"],
    where: { deletedAt: null },
    _count: { id: true },
  })
  const counts: Record<AppStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    PENDING_REVIEW: 0,
    IN_PROGRESS: 0,
    NEEDS_CORRECTION: 0,
    COMPLETED: 0,
    REJECTED: 0,
  }
  for (const row of groups) {
    if (row.status in counts) counts[row.status] += row._count.id
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  const decided = counts.COMPLETED + counts.REJECTED
  return {
    totalApps: total,
    submitted: counts.SUBMITTED,
    pending: counts.PENDING_REVIEW,
    inProgress: counts.IN_PROGRESS,
    needsCorrection: counts.NEEDS_CORRECTION,
    completed: counts.COMPLETED,
    rejected: counts.REJECTED,
    approvalRate: decided === 0 ? 0 : Math.round((counts.COMPLETED / decided) * 100),
  }
}

export async function attentionQueue() {
  await requireAdmin()
  const rows = await getPrisma().application.findMany({
    where: { deletedAt: null, status: { in: ["PENDING_REVIEW", "NEEDS_CORRECTION"] } },
    orderBy: { submittedAt: "asc" },
    take: 8,
    select: {
      id: true,
      applicationNumber: true,
      agentName: true,
      status: true,
      submittedAt: true,
    },
  })
  return rows.map((row) => ({
    id: row.id,
    appNumber: row.applicationNumber ?? "DRAFT",
    agentName: row.agentName ?? "",
    status: row.status === "NEEDS_CORRECTION" ? "Docs Missing" : "Awaiting Review",
    daysPending: row.submittedAt
      ? Math.max(0, Math.floor((Date.now() - row.submittedAt.getTime()) / 86_400_000))
      : 0,
  }))
}

export async function averageDaysPending() {
  await requireAdmin()
  const rows = await getPrisma().application.findMany({
    where: { deletedAt: null, submittedAt: { not: null } },
    select: { submittedAt: true },
  })
  if (!rows.length) return 0
  const now = Date.now()
  const avg =
    rows.reduce((sum, row) => {
      const submitted = row.submittedAt
      if (!submitted) return sum
      return sum + Math.max(0, Math.floor((now - submitted.getTime()) / 86_400_000))
    }, 0) / rows.length
  return Math.round(avg * 10) / 10
}

export async function volumeByMonth() {
  await requireAdmin()
  const data = await getPrisma().application.findMany({
    where: { deletedAt: null },
    select: { status: true, submittedAt: true, createdAt: true },
  })
  const buckets = new Map<string, { submitted: number; inReview: number; approved: number; rejected: number }>()
  for (const row of data) {
    const stamp = row.submittedAt ?? row.createdAt
    const key = stamp.toISOString().slice(0, 7)
    const current = buckets.get(key) ?? { submitted: 0, inReview: 0, approved: 0, rejected: 0 }
    if (row.submittedAt) current.submitted += 1
    if (row.status === "PENDING_REVIEW" || row.status === "IN_PROGRESS") current.inReview += 1
    if (row.status === "COMPLETED") current.approved += 1
    if (row.status === "REJECTED") current.rejected += 1
    buckets.set(key, current)
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({ month, ...values }))
}

export async function breakdowns() {
  await requireAdmin()
  const prisma = getPrisma()
  const [apps, channels, sectors] = await Promise.all([
    prisma.application.findMany({ where: { deletedAt: null }, select: { channelId: true, sectorId: true } }),
    prisma.channel.findMany({ select: { id: true, name: true } }),
    prisma.businessSector.findMany({ select: { id: true, name: true } }),
  ])

  function tally(key: "channelId" | "sectorId", lookup: { id: string; name: string }[]) {
    const map = new Map<string, number>()
    for (const row of apps) {
      const id = row[key]
      if (!id) continue
      map.set(id, (map.get(id) ?? 0) + 1)
    }
    const total = [...map.values()].reduce((sum, n) => sum + n, 0) || 1
    return [...map.entries()].map(([id, count]) => ({
      name: lookup.find((item) => item.id === id)?.name ?? id,
      count,
      value: Math.round((count / total) * 100),
    }))
  }

  return {
    channels: tally("channelId", channels),
    sectors: tally("sectorId", sectors),
  }
}
