import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { FileStack, Clock, CheckCircle2, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/admin/stat-card"
import { loadAdminReports } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

const VolumeChart = dynamic(() => import("./volume-chart").then((mod) => mod.VolumeChart), {
  loading: () => <div className="h-[280px] animate-pulse rounded-md bg-muted" />,
})
const BreakdownChart = dynamic(() => import("./breakdown-chart").then((mod) => mod.BreakdownChart), {
  loading: () => <div className="mx-auto aspect-square h-[200px] animate-pulse rounded-full bg-muted" />,
})

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
      : 0

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <SetupBanner mode={mode} message={message} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Application volume, approval performance, and channel mix for the Tanzania Hub.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Applications" value={dashboardStats.totalApps} icon={FileStack} tone="default" />
        <StatCard label="Avg. Days Pending" value={String(avgDays)} icon={Clock} tone="warning" />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={CheckCircle2} tone="success" />
        <StatCard label="Month-over-Month" value={`${mom >= 0 ? "+" : ""}${mom}%`} icon={TrendingUp} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Monthly Application Volume</h2>
            <p className="text-sm text-muted-foreground">Submitted, in review, approved, and rejected applications by month.</p>
          </div>
          <VolumeChart data={monthlyVolume} />
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Applications by Sector</h2>
            <p className="text-sm text-muted-foreground">Share of total volume.</p>
          </div>
          <BreakdownChart type="sector" data={sectorBreakdown.map((d) => ({ name: d.sector, value: d.value, count: d.count }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Applications by Channel</h2>
            <p className="text-sm text-muted-foreground">Share of total volume.</p>
          </div>
          <BreakdownChart type="channel" data={channelBreakdown.map((d) => ({ name: d.channel, value: d.value, count: d.count }))} />
        </div>

        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Status Breakdown</h2>
            <p className="text-sm text-muted-foreground">Current pipeline snapshot across all applications.</p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Submitted", value: dashboardStats.submitted, tone: "bg-muted-foreground/40" },
              { label: "In Progress", value: dashboardStats.inProgress, tone: "bg-accent" },
              { label: "Needs Correction", value: dashboardStats.needsCorrection, tone: "bg-warning" },
              { label: "Verified", value: dashboardStats.completed, tone: "bg-primary" },
              { label: "Rejected", value: dashboardStats.rejected, tone: "bg-destructive" },
            ].map((row) => {
              const pct = dashboardStats.totalApps === 0 ? 0 : Math.round((row.value / dashboardStats.totalApps) * 100)
              return (
                <div key={row.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{row.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {row.value.toLocaleString("en-US")} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
