"use server"

import { unstable_cache } from "next/cache"
import { Prisma } from "@prisma/client"
import { requireAdmin } from "@/lib/backend/session"
import { getPrisma } from "@/lib/prisma"
import type { AppStatus } from "@/lib/admin-data"
import { NETWORK_CHANNELS, channelMatchesFilter } from "@/lib/lookups/catalog"

const REPORT_REVALIDATE_SECONDS = 60

const emptyCounts = (): Record<AppStatus, number> => ({
  DRAFT: 0,
  SUBMITTED: 0,
  PENDING_REVIEW: 0,
  IN_PROGRESS: 0,
  NEEDS_CORRECTION: 0,
  COMPLETED: 0,
  REJECTED: 0,
})

const loadDashboardStatsCached = unstable_cache(
  async () => {
    const groups = await getPrisma().application.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    })
    const counts = emptyCounts()
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
  },
  ["admin-dashboard-stats-v1"],
  { revalidate: REPORT_REVALIDATE_SECONDS },
)

const loadAverageDaysPendingCached = unstable_cache(
  async () => {
    const rows = await getPrisma().$queryRaw<Array<{ avg: number | string | null }>>(Prisma.sql`
      SELECT coalesce(
        round(avg(extract(epoch from (timezone('utc', now()) - submitted_at)) / 86400)::numeric, 1),
        0
      ) AS avg
      FROM public.applications
      WHERE deleted_at IS NULL AND submitted_at IS NOT NULL
    `)
    return Number(rows[0]?.avg ?? 0)
  },
  ["admin-avg-days-pending-v1"],
  { revalidate: REPORT_REVALIDATE_SECONDS },
)

const loadVolumeByMonthCached = unstable_cache(
  async () => {
    const data = await getPrisma().$queryRaw<
      Array<{
        month: string
        submitted: number
        in_review: number
        approved: number
        rejected: number
      }>
    >(Prisma.sql`
      SELECT
        to_char(date_trunc('month', coalesce(submitted_at, created_at)), 'YYYY-MM') AS month,
        count(*) FILTER (WHERE submitted_at IS NOT NULL)::int AS submitted,
        count(*) FILTER (WHERE status::text IN ('SUBMITTED', 'PENDING_REVIEW', 'IN_PROGRESS'))::int AS in_review,
        count(*) FILTER (WHERE status::text = 'COMPLETED')::int AS approved,
        count(*) FILTER (WHERE status::text = 'REJECTED')::int AS rejected
      FROM public.applications
      WHERE deleted_at IS NULL
        AND coalesce(submitted_at, created_at) >= date_trunc('month', timezone('utc', now())) - interval '11 months'
      GROUP BY 1
    `)

    const buckets = new Map(
      data.map((row) => [
        row.month,
        {
          submitted: Number(row.submitted),
          inReview: Number(row.in_review),
          approved: Number(row.approved),
          rejected: Number(row.rejected),
        },
      ]),
    )

    const now = new Date()
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const values = buckets.get(key) ?? { submitted: 0, inReview: 0, approved: 0, rejected: 0 }
      const decided = values.approved + values.rejected
      return {
        month: date.toLocaleString("en-GB", { month: "short" }),
        monthKey: key,
        ...values,
        total: values.submitted,
        approvalRate: decided === 0 ? 0 : Math.round((values.approved / decided) * 100),
      }
    })
  },
  ["admin-volume-by-month-v1"],
  { revalidate: REPORT_REVALIDATE_SECONDS },
)

const loadBreakdownsCached = unstable_cache(
  async () => {
    const prisma = getPrisma()
    const [channelRows, sectorRows, channels, sectors] = await Promise.all([
      prisma.$queryRaw<Array<{ channel_id: string; count: number }>>(Prisma.sql`
        SELECT channel_id, count(*)::int AS count
        FROM public.applications
        WHERE deleted_at IS NULL AND channel_id IS NOT NULL
        GROUP BY channel_id
      `),
      prisma.$queryRaw<Array<{ sector_id: string; count: number }>>(Prisma.sql`
        SELECT sector_id, count(*)::int AS count
        FROM public.applications
        WHERE deleted_at IS NULL AND sector_id IS NOT NULL
        GROUP BY sector_id
      `),
      prisma.channel.findMany({ select: { id: true, name: true } }),
      prisma.businessSector.findMany({ select: { id: true, name: true } }),
    ])

    const channelById = new Map(channels.map((item) => [item.id, item.name]))
    const sectorById = new Map(sectors.map((item) => [item.id, item.name]))

    const channelCounts = new Map<string, number>()
    for (const row of channelRows) {
      const name = channelById.get(row.channel_id)
      if (!name) continue
      const match = NETWORK_CHANNELS.find((item) => channelMatchesFilter(name, item.name))
      const label = match?.name ?? name
      channelCounts.set(label, (channelCounts.get(label) ?? 0) + Number(row.count))
    }
    for (const item of NETWORK_CHANNELS) {
      if (!channelCounts.has(item.name)) channelCounts.set(item.name, 0)
    }
    const channelTotal = [...channelCounts.values()].reduce((sum, n) => sum + n, 0) || 1
    const channelResult = [...channelCounts.entries()]
      .map(([name, count]) => ({
        name,
        count,
        value: Math.round((count / channelTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    const sectorTotal = sectorRows.reduce((sum, row) => sum + Number(row.count), 0) || 1
    const sectorResult = sectorRows
      .map((row) => ({
        name: sectorById.get(row.sector_id) ?? row.sector_id,
        count: Number(row.count),
        value: Math.round((Number(row.count) / sectorTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    return { channels: channelResult, sectors: sectorResult }
  },
  ["admin-breakdowns-v1"],
  { revalidate: REPORT_REVALIDATE_SECONDS },
)

export async function dashboardStats() {
  await requireAdmin()
  return loadDashboardStatsCached()
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
  return loadAverageDaysPendingCached()
}

export async function volumeByMonth() {
  await requireAdmin()
  return loadVolumeByMonthCached()
}

export async function breakdowns() {
  await requireAdmin()
  return loadBreakdownsCached()
}
