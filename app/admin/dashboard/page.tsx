import Link from "next/link"
import {
  FileStack,
  Clock,
  Loader,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { loadAdminDashboard } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

function attentionTone(status: string) {
  if (status === "Docs Missing" || status === "ID Expired" || status === "Photo Rejected") return "text-destructive"
  if (status === "Signature Invalid" || status === "Address Mismatch" || status === "Incomplete Form")
    return "text-warning-foreground"
  return "text-muted-foreground"
}

export default async function AdminDashboardPage() {
  const { mode, message, stats: dashboardStats, needsAttention } = await loadAdminDashboard()
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Overview"
        description="Operational overview for the Tanzania Hub — Dar es Salaam."
        action={
          <Button render={<Link href="/admin/applications" />} nativeButton={false}>
            View Applications
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />

      <div className="portal-stat-grid">
        <StatCard label="Total Apps" value={dashboardStats.totalApps} icon={FileStack} tone="default" />
        <StatCard label="Submitted" value={dashboardStats.submitted} icon={Clock} tone="warning" />
        <StatCard label="In Progress" value={dashboardStats.inProgress} icon={Loader} tone="accent" />
        <StatCard label="Needs Correction" value={dashboardStats.needsCorrection} icon={AlertTriangle} tone="warning" />
        <StatCard label="Verified" value={dashboardStats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={dashboardStats.rejected} icon={XCircle} tone="destructive" />
      </div>

      <section className="portal-table">
        <div className="portal-section-head">
          <h2 className="portal-section-title">Needs attention</h2>
          <Button variant="ghost" size="sm" render={<Link href="/admin/applications" />} nativeButton={false}>
            View all
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="portal-table-head">
                <th className="px-4 py-3">App No.</th>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Days Pending</th>
              </tr>
            </thead>
            <tbody>
              {needsAttention.length === 0 ? (
                <tr>
                  <td colSpan={4} className="portal-empty">
                    <p className="portal-empty-title">Nothing needs attention</p>
                    <p className="portal-empty-copy">New flags will show up here as cases come in.</p>
                  </td>
                </tr>
              ) : (
                needsAttention.map((row) => (
                  <tr key={row.appNumber} className="portal-table-row">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/applications/${row.id}`}
                        className="font-mono text-sm font-medium text-foreground hover:underline"
                      >
                        {row.appNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-foreground">{row.agentName}</td>
                    <td className={`px-4 py-3 font-medium ${attentionTone(row.status)}`}>{row.status}</td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">{row.daysPending} days</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
