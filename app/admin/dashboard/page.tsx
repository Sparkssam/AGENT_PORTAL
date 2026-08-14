import Link from "next/link"
import {
  FileStack,
  Clock,
  Loader,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pencil,
  FileUp,
  ShieldAlert,
  UserPlus,
  CheckCircle,
  MessageSquare,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/admin/stat-card"
import { dashboardStats, needsAttention, recentActivity } from "@/lib/admin-data"

const activityIcons: Record<string, typeof Pencil> = {
  "Sarah Admin_updated": Pencil,
  System_processed: FileUp,
  "Automated Check_flagged": ShieldAlert,
  "John Doe_created": UserPlus,
  "Sarah Admin_approved": CheckCircle,
  "Michael Manager_added": MessageSquare,
}

function iconFor(actor: string, action: string) {
  const key = `${actor}_${action.split(" ")[0]}`
  return activityIcons[key] ?? Pencil
}

function attentionTone(status: string) {
  if (status === "Docs Missing" || status === "ID Expired" || status === "Photo Rejected") return "text-destructive"
  if (status === "Signature Invalid" || status === "Address Mismatch" || status === "Incomplete Form")
    return "text-warning-foreground"
  return "text-muted-foreground"
}

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Operational overview for the Tanzania Hub — Dar es Salaam.
          </p>
        </div>
        <Button render={<Link href="/admin/applications" />} nativeButton={false}>
          View Applications
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Apps" value={dashboardStats.totalApps} icon={FileStack} tone="default" />
        <StatCard label="Pending" value={dashboardStats.pending} icon={Clock} tone="warning" />
        <StatCard label="In Progress" value={dashboardStats.inProgress} icon={Loader} tone="accent" />
        <StatCard label="Needs Correction" value={dashboardStats.needsCorrection} icon={AlertTriangle} tone="warning" />
        <StatCard label="Completed" value={dashboardStats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={dashboardStats.rejected} icon={XCircle} tone="destructive" />
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Needs Attention</h2>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/admin/applications" />}
            nativeButton={false}
          >
            View all
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                <th className="px-5 py-3">App No.</th>
                <th className="px-5 py-3">Agent Name</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Days Pending</th>
              </tr>
            </thead>
            <tbody>
              {needsAttention.map((row) => (
                <tr key={row.appNumber} className="border-b border-border last:border-0 hover:bg-secondary/60">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/applications/${row.id}`}
                      className="font-mono text-sm font-medium text-foreground hover:underline"
                    >
                      {row.appNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-foreground">{row.agentName}</td>
                  <td className={`px-5 py-3 font-medium ${attentionTone(row.status)}`}>{row.status}</td>
                  <td className="px-5 py-3 text-right font-mono text-muted-foreground">{row.daysPending} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        </div>
        <ul className="flex flex-col divide-y divide-border">
          {recentActivity.map((event) => {
            const Icon = iconFor(event.actor, event.action)
            return (
              <li key={event.id} className="flex items-start gap-3 px-5 py-4">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{event.actor}</span> {event.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.timestamp}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex justify-center border-t border-border p-3">
          <Button variant="outline" size="sm">
            View All Activity
          </Button>
        </div>
      </div>
    </div>
  )
}
