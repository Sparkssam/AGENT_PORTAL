import Link from "next/link"
import { ArrowRight, BadgeCheck, FileText, Headset, UserRound, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { HelpHint } from "@/components/help/help-hint"
import { loadAgentWorkspace, isNewApplicant } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"
import { formatCurrencyTZS, formatDateLong, formatPhoneTZ } from "@/lib/format"
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
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Overview"
        description={
          inReview
            ? `${firstName}, your application is with the review team. Track status, documents, and deposit below.`
            : completed
              ? `Welcome back, ${firstName}. Your case is ready for the next step.`
              : `Welcome, ${firstName}. Finish your application and keep documents in one place.`
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="portal-card lg:col-span-2 md:p-8">
          <p className="portal-section-title">Application</p>
          <p className="mt-3 font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground md:text-3xl">
            {currentAgent.agentIdNumber}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Agent since {memberSince}</span>
            {currentAgent.verified && (
              <span className="status-badge status-badge-success gap-1">
                <BadgeCheck className="size-3.5" />
                Verified
              </span>
            )}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AppStatusBadge status={currentApplication.status} />
            <HelpHint articleId="status-meanings" />
            <DepositStatusBadge status={currentApplication.depositStatus} />
            <HelpHint articleId="deposit-steps" />
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

        <section className="portal-card">
          <div className="flex items-center justify-between">
            <p className="portal-section-title">Status</p>
            <Link href="/agent/applications" className="text-muted-foreground hover:text-foreground" aria-label="View applications">
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-6 space-y-5">
            <div>
              <p className="inline-flex items-center gap-1 portal-kicker">
                Application
                <HelpHint articleId="status-meanings" className="size-5" />
              </p>
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
              <p className="inline-flex items-center gap-1 portal-kicker">
                Deposit
                <HelpHint articleId="deposit-steps" className="size-5" />
              </p>
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
        </div>

        <div className="flex flex-col gap-5">
          <section className="portal-card">
            <p className="portal-section-title">Recommended</p>
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
                        <span className="status-badge status-badge-muted">Soon</span>
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

          <section className="portal-card-muted">
            <p className="portal-section-title">Applicant</p>
            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="portal-kicker">Phone</dt>
                <dd className="mt-0.5 font-mono text-sm text-foreground">{formatPhoneTZ(currentAgent.phone)}</dd>
              </div>
              <div>
                <dt className="portal-kicker">Application</dt>
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
