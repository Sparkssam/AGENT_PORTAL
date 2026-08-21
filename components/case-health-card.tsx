import Link from "next/link"
import { ArrowRight, FileCheck2, FolderCheck, Wallet, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  computeCaseHealth,
  type Application,
  type HealthTone,
} from "@/lib/domain"
import { formatCurrencyTZS } from "@/lib/format"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"

const toneDot: Record<HealthTone, string> = {
  healthy: "bg-success",
  attention: "bg-warning",
  critical: "bg-destructive",
  neutral: "bg-accent",
}

const toneText: Record<HealthTone, string> = {
  healthy: "text-success",
  attention: "text-warning-foreground",
  critical: "text-destructive",
  neutral: "text-accent",
}

const toneRing: Record<HealthTone, string> = {
  healthy: "text-success",
  attention: "text-warning",
  critical: "text-destructive",
  neutral: "text-accent",
}

const toneLabel: Record<HealthTone, string> = {
  healthy: "On track",
  attention: "Needs attention",
  critical: "Rejected",
  neutral: "In progress",
}

function ProgressRing({ percent, className }: { percent: number; className?: string }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  return (
    <span className="relative inline-flex size-12 items-center justify-center">
      <svg viewBox="0 0 48 48" className="size-12 -rotate-90">
        <circle cx="24" cy="24" r={radius} fill="none" strokeWidth="4" className="stroke-border" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-500", className)}
          stroke="currentColor"
        />
      </svg>
      <span className="absolute text-xs font-semibold tabular-nums text-foreground">{percent}%</span>
    </span>
  )
}

function DocumentBar({ app }: { app: Application }) {
  const total = app.documents.length || 1
  const segments = [
    { key: "verified", count: app.documents.filter((d) => d.status === "verified").length, cls: "bg-success" },
    { key: "unverified", count: app.documents.filter((d) => d.status === "unverified").length, cls: "bg-warning" },
    { key: "rejected", count: app.documents.filter((d) => d.status === "rejected").length, cls: "bg-destructive" },
    { key: "missing", count: app.documents.filter((d) => d.status === "missing").length, cls: "bg-border" },
  ].filter((s) => s.count > 0)
  return (
    <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-border">
      {segments.map((s) => (
        <span key={s.key} className={s.cls} style={{ width: `${(s.count / total) * 100}%` }} />
      ))}
    </span>
  )
}

export function CaseHealthCard({
  application,
  showNextAction = true,
  className,
}: {
  application: Application
  showNextAction?: boolean
  className?: string
}) {
  const health = computeCaseHealth(application)

  return (
    <section
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      aria-label={`Case summary for ${application.appNumber}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 shrink-0 rounded-full", toneDot[health.tone])} aria-hidden />
          <div>
            <p className="font-mono text-sm font-semibold text-foreground">{application.appNumber}</p>
            <p className="text-xs text-muted-foreground">{application.businessName ?? application.agentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", toneText[health.tone])}>{toneLabel[health.tone]}</span>
          <AppStatusBadge status={application.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {/* Application completeness */}
        <div className="flex items-center gap-3 px-5 py-4">
          <ProgressRing percent={health.appPercent} className={toneRing[health.tone]} />
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Application</p>
            <p className="text-sm font-semibold text-foreground">{health.appPercent}% complete</p>
            <p className="text-xs text-muted-foreground">
              {health.fieldsComplete} of {health.fieldsTotal} fields
            </p>
          </div>
        </div>

        {/* Documents */}
        <div className="flex flex-col justify-center gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            <FolderCheck className="size-4 text-muted-foreground" />
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Documents</p>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {health.docsVerified}/{health.docsTotal} verified
          </p>
          <DocumentBar app={application} />
        </div>

        {/* Deposit — intentionally separate from application status */}
        <div className="flex flex-col justify-center gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-muted-foreground" />
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Deposit</p>
          </div>
          <DepositStatusBadge status={application.depositStatus} className="w-fit" />
          <p className="font-mono text-xs text-muted-foreground">{formatCurrencyTZS(application.depositAmount)}</p>
        </div>

        {/* Corrections */}
        <div className="flex flex-col justify-center gap-2 px-5 py-4">
          <div className="flex items-center gap-2">
            {health.corrections > 0 ? (
              <AlertTriangle className="size-4 text-warning-foreground" />
            ) : (
              <FileCheck2 className="size-4 text-success" />
            )}
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Corrections</p>
          </div>
          <p className={cn("text-sm font-semibold", health.corrections > 0 ? "text-warning-foreground" : "text-foreground")}>
            {health.corrections > 0 ? `${health.corrections} required` : "None"}
          </p>
          <p className="text-xs text-muted-foreground">
            {health.docsRejected > 0 && `${health.docsRejected} rejected`}
            {health.docsRejected > 0 && health.docsMissing > 0 && " · "}
            {health.docsMissing > 0 && `${health.docsMissing} missing`}
            {health.corrections === 0 && "All documents in order"}
          </p>
        </div>
      </div>

      {showNextAction && (
        <Link
          href={health.nextAction.href}
          className="group flex items-center justify-between gap-3 border-t border-border bg-secondary/50 px-5 py-3.5 transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2 text-sm">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Next action</span>
            <span className="font-medium text-foreground">{health.nextAction.label}</span>
          </span>
          <ArrowRight className="size-4 text-accent transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </section>
  )
}
