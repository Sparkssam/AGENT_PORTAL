import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  FolderOpen,
  Headset,
  Loader,
  UserRound,
  Wallet,
  CheckCircle2,
  Circle,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { formatCurrencyTZS } from "@/lib/admin-data"
import { currentAgent, currentApplication, documentChecklistProgress, recentAgentActivity } from "@/lib/agent-data"

const quickLinks = [
  { href: "/agent/applications", label: "My Applications", icon: FileText, available: true },
  { href: "/agent/documents", label: "Documents", icon: FolderOpen, available: true },
  { href: "/agent/profile", label: "Profile", icon: UserRound, available: true },
  { href: "/agent/wallet", label: "Wallet", icon: Wallet, available: false },
]

export default function AgentDashboardPage() {
  const checklist = documentChecklistProgress(currentApplication.documents)
  const memberSince = new Date(currentAgent.memberSince).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance text-foreground md:text-3xl">
          Welcome back, {currentAgent.fullName.split(" ")[0]}.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your agency operations and track your application from one place.
        </p>
      </div>

      {/* Agent ID card */}
      <div className="relative overflow-hidden rounded-xl bg-sidebar p-6 text-sidebar-foreground md:p-7">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-medium tracking-wider text-sidebar-foreground/50 uppercase">
              Agent ID Number
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold tracking-tight md:text-3xl">
              {currentAgent.agentIdNumber}
            </p>
            <p className="mt-2 text-sm text-sidebar-foreground/60">Agent since {memberSince}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppStatusBadge status={currentApplication.status} className="bg-accent/20 text-accent" />
            {currentAgent.verified && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-success/20 px-2 py-1 text-[11px] font-semibold tracking-wide text-success uppercase">
                <BadgeCheck className="size-3.5" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Application Status</span>
                <Loader className="size-4 text-muted-foreground/60" />
              </div>
              <AppStatusBadge status={currentApplication.status} className="w-fit" />
              <p className="text-sm text-muted-foreground">
                Your application {currentApplication.appNumber} is currently under review by our agents.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deposit Status</span>
                <Wallet className="size-4 text-muted-foreground/60" />
              </div>
              <DepositStatusBadge status={currentApplication.depositStatus} className="w-fit" />
              <p className="text-sm text-muted-foreground">
                Deposit of {formatCurrencyTZS(currentApplication.depositAmount)} received and cleared.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Document Checklist</h2>
              <span className="text-sm text-muted-foreground">
                {checklist.uploaded} of {checklist.total} uploaded
              </span>
            </div>
            <div className="px-5 pt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${checklist.percent}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-border px-5">
              {currentApplication.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-3.5">
                  {doc.status === "missing" ? (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  )}
                  <span className="text-sm text-foreground">{doc.name}</span>
                  {doc.status === "missing" ? (
                    <Button size="sm" variant="outline" className="ml-auto">
                      <Upload data-icon="inline-start" />
                      Upload
                    </Button>
                  ) : (
                    <span className="ml-auto text-xs font-medium text-muted-foreground">Uploaded</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="border-t border-border p-4">
              <Button variant="outline" size="sm" render={<Link href="/agent/documents" />} nativeButton={false}>
                Manage documents
                <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              {recentAgentActivity.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3 px-5 py-4">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{event.actor}</span> {event.action}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{event.timestamp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              {quickLinks.map((link) => {
                const Icon = link.icon
                if (!link.available) {
                  return (
                    <div
                      key={link.href}
                      className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4 opacity-50"
                    >
                      <Icon className="size-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{link.label}</span>
                      <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        Coming soon
                      </span>
                    </div>
                  )
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-accent/40 hover:bg-secondary/60"
                  >
                    <Icon className="size-5 text-accent" />
                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-5">
            <h2 className="text-base font-semibold text-foreground">Support</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Need help with your application or the agent portal? Our support team is on standby.
            </p>
            <Button className="mt-4 w-full">
              <Headset data-icon="inline-start" />
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
