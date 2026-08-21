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
import { loadAdminDashboard } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

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

export default async function AdminDashboardPage() {
  const { mode, message, stats: dashboardStats, needsAttention, recentActivity } = await loadAdminDashboard()
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-4 md:px-8 md:pb-10 md:pt-2">
      <SetupBanner mode={mode} message={message} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-semibold text-4xl tracking-tight text-foreground md:text-5xl">
            <span className="h-8 w-1.5 rounded-full bg-accent" aria-hidden />
            Overview
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Operational overview for the Tanzania Hub — Dar es Salaam.
          </p>
        </div>
        <Button size="lg" render={<Link href="/admin/applications" />} nativeButton={false}>
          View Applications
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Apps" value={dashboardStats.totalApps} icon={FileStack} tone="default" />
        <StatCard label="Submitted" value={dashboardStats.submitted} icon={Clock} tone="warning" />
        <StatCard label="In Progress" value={dashboardStats.inProgress} icon={Loader} tone="accent" />
        <StatCard label="Needs Correction" value={dashboardStats.needsCorrection} icon={AlertTriangle} tone="warning" />
        <StatCard label="Verified" value={dashboardStats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected" value={dashboardStats.rejected} icon={XCircle} tone="destructive" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-[1.75rem] bg-card shadow-sm ring-1 ring-border/60 lg:col-span-2">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="font-semibold text-2xl text-foreground">Needs attention</h2>
            <Button variant="ghost" size="sm" render={<Link href="/admin/applications" />} nativeButton={false}>
              View all
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <div className="overflow-x-auto px-2 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  <th className="px-4 py-3">App No.</th>
                  <th className="px-4 py-3">Agent Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Days Pending</th>
                </tr>
              </thead>
              <tbody>
                {needsAttention.map((row) => (
                  <tr key={row.appNumber} className="border-t border-border/70 hover:bg-secondary/60">
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-2xl text-foreground">Activity</h2>
            <Button variant="ghost" size="sm" render={<Link href="/admin/activity" />} nativeButton={false}>
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <ul className="mt-4 flex flex-col">
            {recentActivity.slice(0, 6).map((event) => {
              const Icon = iconFor(event.actor, event.action)
              return (
                <li key={event.id} className="flex items-start gap-3 border-b border-border/60 py-3 last:border-0">
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
        </section>
      </div>
    </div>
  )
}
