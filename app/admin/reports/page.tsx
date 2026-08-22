import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { CheckCircle2, Clock, FileStack, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/admin/stat-card"
import { PageHeader } from "@/components/page-header"
import { loadAdminReports } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { VolumeTable } from "./volume-table"

const VolumeChart = dynamic(() => import("./volume-chart").then((mod) => mod.VolumeChart), {
  loading: () => <div className="h-[320px] animate-pulse rounded-3xl bg-muted" />,
})
const RankingChart = dynamic(() => import("./ranking-chart").then((mod) => mod.RankingChart), {
  loading: () => <div className="h-[260px] animate-pulse rounded-3xl bg-muted" />,
})
const PipelineChart = dynamic(() => import("./pipeline-chart").then((mod) => mod.PipelineChart), {
  loading: () => <div className="mx-auto aspect-square h-[220px] animate-pulse rounded-full bg-muted" />,
})

export const revalidate = 60

export const metadata: Metadata = {
  title: "Reports — Kinetic Admin",
}

export default async function ReportsPage() {
  const {
    mode,
    message,
    stats: dashboardStats,
    monthlyVolume,
    sectorBreakdown,
    channelBreakdown,
    avgDays,
  } = await loadAdminReports()

  const decided = dashboardStats.completed + dashboardStats.rejected
  const approvalRate =
    "approvalRate" in dashboardStats && typeof dashboardStats.approvalRate === "number"
      ? dashboardStats.approvalRate
      : decided === 0
        ? 0
        : Math.round((dashboardStats.completed / decided) * 100)

  const lastTwo = monthlyVolume.slice(-2)
  const mom =
    lastTwo.length === 2 && lastTwo[0].submitted > 0
      ? Math.round(((lastTwo[1].submitted - lastTwo[0].submitted) / lastTwo[0].submitted) * 100)
      : lastTwo.length === 2 && lastTwo[1].submitted > 0
        ? 100
        : 0

  const peak = monthlyVolume.reduce(
    (best, row) => (row.submitted > best.submitted ? row : best),
    monthlyVolume[0] ?? { month: "—", submitted: 0, inReview: 0, approved: 0, rejected: 0 },
  )
  const topChannel = [...channelBreakdown].sort((a, b) => b.count - a.count)[0]
  const openCases =
    dashboardStats.submitted + dashboardStats.pending + dashboardStats.inProgress + dashboardStats.needsCorrection

  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Reports"
        description="Twelve-month volume, pipeline mix, and channel share for the Tanzania Hub."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total applications"
          value={dashboardStats.totalApps}
          icon={FileStack}
          tone="default"
          hint={`${openCases.toLocaleString("en-US")} still open`}
        />
        <StatCard
          label="Avg. days pending"
          value={String(avgDays)}
          icon={Clock}
          tone="warning"
          hint="From submit to today"
        />
        <StatCard
          label="Approval rate"
          value={`${approvalRate}%`}
          icon={CheckCircle2}
          tone="success"
          hint={`${decided.toLocaleString("en-US")} decided cases`}
        />
        <StatCard
          label="Month-over-month"
          value={`${mom >= 0 ? "+" : ""}${mom}%`}
          icon={TrendingUp}
          tone="accent"
          hint={peak.submitted ? `Peak ${peak.month} · ${peak.submitted.toLocaleString("en-US")}` : "No submissions yet"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Peak month</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {peak.submitted ? `${peak.month} · ${peak.submitted.toLocaleString("en-US")} submitted` : "Waiting for volume"}
          </p>
        </div>
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Top channel</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {topChannel && topChannel.count > 0
              ? `${topChannel.channel} · ${topChannel.value}% of volume`
              : "No channel mix yet"}
          </p>
        </div>
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Outcomes</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {dashboardStats.completed.toLocaleString("en-US")} verified · {dashboardStats.rejected.toLocaleString("en-US")} rejected
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="portal-card lg:col-span-2">
          <div>
            <h2 className="portal-card-title">Monthly volume and approval</h2>
            <p className="portal-card-copy">
              Intake as an area, verified and rejected as lines, approval rate on the right axis. Last 12 months.
            </p>
          </div>
          <div className="mt-5">
            <VolumeChart data={monthlyVolume} />
          </div>
        </div>

        <div className="portal-card">
          <div>
            <h2 className="portal-card-title">Pipeline mix</h2>
            <p className="portal-card-copy">Current status of every live application.</p>
          </div>
          <div className="mt-5">
            <PipelineChart
              submitted={dashboardStats.submitted}
              pending={dashboardStats.pending}
              inProgress={dashboardStats.inProgress}
              needsCorrection={dashboardStats.needsCorrection}
              completed={dashboardStats.completed}
              rejected={dashboardStats.rejected}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="portal-card">
          <div>
            <h2 className="portal-card-title">Applications by channel</h2>
            <p className="portal-card-copy">Ranked by count. Mixx by Yas, Vodacom, Airtel, Halotel, and TTCL.</p>
          </div>
          <div className="mt-5">
            <RankingChart
              data={channelBreakdown.map((item) => ({ name: item.channel, value: item.value, count: item.count }))}
              emptyTitle="No channel data"
              emptyCopy="Channels appear once applications are linked to an operator."
            />
          </div>
        </div>

        <div className="portal-card">
          <div>
            <h2 className="portal-card-title">Applications by sector</h2>
            <p className="portal-card-copy">Business sectors ranked by share of the book.</p>
          </div>
          <div className="mt-5">
            <RankingChart
              data={sectorBreakdown.map((item) => ({ name: item.sector, value: item.value, count: item.count }))}
              emptyTitle="No sector data"
              emptyCopy="Sectors appear once applications include a business sector."
            />
          </div>
        </div>
      </div>

      <div className="portal-table">
        <div className="border-b border-border px-5 py-4">
          <h2 className="portal-section-title">Monthly detail</h2>
          <p className="mt-1 text-sm text-muted-foreground">Exact figures for the charts above.</p>
        </div>
        <VolumeTable data={monthlyVolume} />
      </div>
    </div>
  )
}
