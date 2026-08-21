import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, CheckCircle2, Download, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { CaseHealthCard } from "@/components/case-health-card"
import { CorrectionChecklist } from "@/components/correction-checklist"
import { formatCurrencyTZS } from "@/lib/format"
import type { AppStatus } from "@/lib/domain"
import { formatDateLong, formatGps, formatPhoneTZ } from "@/lib/format"
import { loadAgentApplication, loadAgentShell } from "@/lib/data/workspace"

const statusFlow: AppStatus[] = ["SUBMITTED", "PENDING_REVIEW", "IN_PROGRESS", "COMPLETED"]

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (id === "new") redirect("/agent/apply")

  const [{ agent }, application] = await Promise.all([loadAgentShell(), loadAgentApplication(id)])

  if (!application) notFound()

  const suspended = agent.lifecycleStatus === "Suspended"
  const isRejectedOrCorrection = application.status === "REJECTED" || application.status === "NEEDS_CORRECTION"
  const currentIndex = statusFlow.indexOf(application.status)

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit"
          render={<Link href="/agent/applications" />}
          nativeButton={false}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to My Applications
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {application.appNumber}
              </h1>
              <AppStatusBadge status={application.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {application.businessName}
              {application.status === "DRAFT"
                ? " · Draft"
                : ` · Submitted ${formatDateLong(application.submittedAt, "local")}`}
            </p>
          </div>
          {suspended ? null : application.status === "NEEDS_CORRECTION" || application.status === "DRAFT" ? (
            <Button render={<Link href="/agent/apply" />} nativeButton={false}>
              Continue application
            </Button>
          ) : (
            <Button variant="outline">
              <Download data-icon="inline-start" />
              Download Summary
            </Button>
          )}
        </div>
      </div>

      <CaseHealthCard application={application} />

      {!isRejectedOrCorrection && (
        <div className="rounded-lg border border-border bg-card p-5">
          <ol className="flex items-center">
            {statusFlow.map((s, index) => {
              const done = index <= currentIndex
              return (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="size-4" /> : index + 1}
                    </span>
                    <span className={`text-xs font-medium ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {s === "SUBMITTED" && "Submitted"}
                      {s === "PENDING_REVIEW" && "Pending Review"}
                      {s === "IN_PROGRESS" && "In Progress"}
                      {s === "COMPLETED" && "Completed"}
                    </span>
                  </div>
                  {index < statusFlow.length - 1 && (
                    <span className={`mx-2 h-px flex-1 ${index < currentIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {isRejectedOrCorrection && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-5">
          <p className="text-sm font-medium text-warning-foreground">
            {application.status === "REJECTED" ? "This application was rejected." : "This application needs correction."}
          </p>
          {isRejectedOrCorrection && (
            <p className="mt-1 text-sm text-warning-foreground/80">
              {application.correctionSummary ||
                "Please review the notes from our team and contact support if you need help resolving this."}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Applicant Details</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <DetailRow label="Full name" value={application.agentName} />
              <DetailRow label="Phone" value={formatPhoneTZ(application.phone)} />
              <DetailRow label="Email" value={application.email} />
              <DetailRow label="Channel name" value={application.businessName ?? "—"} />
              <DetailRow label="Sector" value={application.sector} />
              <DetailRow label="Channel" value={application.channel} />
              <DetailRow label="Channel parent type" value={application.channelParentType || "—"} />
              <DetailRow label="Channel parent name" value={application.channelParentName || "—"} />
              <DetailRow label="Channel manager type" value={application.channelManagerType || "—"} />
              <DetailRow label="Channel manager name" value={application.channelManagerName || "—"} />
              <DetailRow label="Channel tier" value={application.channelType || "—"} />
              <DetailRow label="ID type" value={application.idType} />
              <DetailRow label="ID number" value={application.idNumber} />
              <DetailRow label="Issued place" value={application.issuedPlace || "—"} />
              <DetailRow label="Issued date" value={formatDateLong(application.issuedDate)} />
              <DetailRow label="Expiry date" value={formatDateLong(application.expireDate)} />
              <DetailRow label="Gender" value={application.gender || "—"} />
              <DetailRow label="Ward" value={application.ward || "—"} />
              <DetailRow label="House / plot number" value={application.houseNumber || "—"} />
              <div className="sm:col-span-2">
                <DetailRow
                  label="Location"
                  value={[application.street, application.ward, application.district, application.province, application.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                  icon={MapPin}
                />
              </div>
              <DetailRow label="GPS coordinates" value={formatGps(application.lat, application.lng)} />
            </div>
          </div>

          <CorrectionChecklist
            documents={application.documents}
            items={application.corrections}
            summary={application.correctionSummary}
            fixHref="/agent/apply"
          />
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">Deposit</h2>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <DepositStatusBadge status={application.depositStatus} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-mono text-sm font-medium text-foreground">
                {formatCurrencyTZS(application.depositAmount)}
              </span>
            </div>
            {application.depositReference && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="font-mono text-sm text-foreground">{application.depositReference}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof MapPin }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
        {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
        {value}
      </p>
    </div>
  )
}
