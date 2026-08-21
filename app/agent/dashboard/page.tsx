import Link from "next/link"
import { ArrowRight, BadgeCheck, FileText, Headset, UserRound, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { loadAgentWorkspace, isNewApplicant } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { formatCurrencyTZS, formatDateLong, formatDateTime, formatPhoneTZ } from "@/lib/format"
import { computeCaseHealth } from "@/lib/domain"
import { isClosedStatus, isInReviewStatus } from "@/lib/backend/status"
import { AgentDocumentChecklist } from "./document-checklist"
import { redirect } from "next/navigation"

const quickLinks = [
  { href: "/agent/applications", label: "Applications", icon: FileText, available: true },
  { href: "/agent/profile", label: "Profile", icon: UserRound, available: true },
  { href: "/agent/help", label: "Support", icon: Headset, available: true },
  { href: "/agent/wallet", label: "Wallet", icon: Wallet, available: false },
]

export default async function AgentDashboardPage() {
  const { mode, message, agent: currentAgent, application: currentApplication, applications } =
    await loadAgentWorkspace()
  if (mode === "live" && isNewApplicant(applications) && currentAgent.lifecycleStatus !== "Suspended") {
    redirect("/agent/apply")
  }
  const memberSince = formatDateLong(currentAgent.memberSince)
  const completed = currentApplication.status === "COMPLETED"
  const inReview = isInReviewStatus(currentApplication.status)
  const closed = isClosedStatus(currentApplication.status)
  const suspended = currentAgent.lifecycleStatus === "Suspended"
  const depositDate = formatDateLong(currentApplication.depositVerifiedAt || currentApplication.submittedAt, "local")
  const health = computeCaseHealth(currentApplication)
  const firstName = currentAgent.fullName.split(" ")[0] || "there"

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-4 md:px-8 md:pb-10 md:pt-2">
      <SetupBanner mode={mode} message={message} />
      <div>
        <h1 className="flex items-center gap-3 font-semibold text-4xl tracking-tight text-foreground md:text-5xl">
          <span className="h-8 w-1.5 rounded-full bg-accent" aria-hidden />
          Overview
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          {inReview
            ? `${firstName}, your application is with the review team. Track status, documents, and deposit below.`
            : completed
              ? `Welcome back, ${firstName}. Your case is ready for the next step.`
              : `Welcome, ${firstName}. Finish your application and keep documents in one place.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60 lg:col-span-2 md:p-8">
          <p className="font-semibold text-2xl text-foreground">Application</p>
          <p className="mt-4 font-mono text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {currentAgent.agentIdNumber}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Agent since {memberSince}</span>
            {currentAgent.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-success uppercase">
                <BadgeCheck className="size-3.5" />
                Verified
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AppStatusBadge status={currentApplication.status} />
            <DepositStatusBadge status={currentApplication.depositStatus} />
          </div>
          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Fields complete</span>
              <span className="text-muted-foreground">
                {health.fieldsComplete} of {health.fieldsTotal}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${health.appPercent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                Documents {health.docsVerified}/{health.docsTotal} verified
              </span>
              <span>Deposit {formatCurrencyTZS(currentApplication.depositAmount)}</span>
            </div>
          </div>
          <div className="mt-6">
            {suspended ? (
              <p className="text-sm text-muted-foreground">Account actions are paused while this agent is suspended.</p>
            ) : (
              <Button size="lg" nativeButton={false} render={<Link href={health.nextAction.href} />}>
                {health.nextAction.label}
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-2xl text-foreground">Status</p>
            <Link href="/agent/applications" className="text-muted-foreground hover:text-foreground">
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Application</p>
              <div className="mt-2">
                <AppStatusBadge status={currentApplication.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {currentApplication.appNumber === "DRAFT"
                  ? "Draft in progress."
                  : `${currentApplication.appNumber} is ${inReview ? "under review" : currentApplication.status.replaceAll("_", " ").toLowerCase()}.`}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Deposit</p>
              <div className="mt-2">
                <DepositStatusBadge status={currentApplication.depositStatus} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {formatCurrencyTZS(currentApplication.depositAmount)}
                {currentApplication.depositStatus === "CLEARED"
                  ? ` received on ${depositDate}.`
                  : currentApplication.depositReference
                    ? ` · ${currentApplication.depositReference}`
                    : " awaiting proof."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AgentDocumentChecklist application={currentApplication} live={mode === "live"} locked={closed || suspended} />

          <section className="mt-5 rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60">
            <p className="font-semibold text-2xl text-foreground">Recent activity</p>
            <ul className="mt-4 flex flex-col">
              {currentApplication.timeline.length === 0 ? (
                <li className="py-3 text-sm text-muted-foreground">No activity yet.</li>
              ) : (
                currentApplication.timeline.slice(0, 5).map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3 border-b border-border/60 py-3 last:border-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{event.actor}</span> {event.action}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(event.timestamp)}</span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-[1.75rem] bg-card p-6 shadow-sm ring-1 ring-border/60">
            <p className="font-semibold text-2xl text-foreground">Recommended</p>
            <ul className="mt-5 flex flex-col gap-3">
              {quickLinks.map((link) => {
                const Icon = link.icon
                const inner = (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{link.label}</span>
                      {!link.available && (
                        <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                          Soon
                        </span>
                      )}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </>
                )
                if (!link.available) {
                  return (
                    <li
                      key={link.href}
                      className="flex items-center gap-3 rounded-2xl px-1 py-1 opacity-50"
                    >
                      {inner}
                    </li>
                  )
                }
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-3 rounded-2xl px-1 py-1 transition hover:bg-secondary/70"
                    >
                      {inner}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-[1.75rem] bg-secondary/70 p-6">
            <p className="font-semibold text-2xl text-foreground">Applicant</p>
            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Phone</dt>
                <dd className="mt-0.5 font-mono text-sm text-foreground">{formatPhoneTZ(currentAgent.phone)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Application</dt>
                <dd className="mt-0.5 font-mono text-sm text-foreground">{currentApplication.appNumber}</dd>
              </div>
            </dl>
            <Button className="mt-5 w-full" nativeButton={false} render={<Link href="/agent/help" />}>
              <Headset data-icon="inline-start" />
              Help Center
            </Button>
          </section>
        </div>
      </div>
    </div>
  )
}
