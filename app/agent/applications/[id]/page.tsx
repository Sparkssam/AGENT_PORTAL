import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2, Circle, Download, Eye, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { formatCurrencyTZS, type AppStatus } from "@/lib/admin-data"
import { currentApplication } from "@/lib/agent-data"

const statusFlow: AppStatus[] = ["SUBMITTED", "PENDING_REVIEW", "IN_PROGRESS", "COMPLETED"]

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = currentApplication.id === id ? currentApplication : null

  if (!application) notFound()

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
              {application.businessName} · Submitted{" "}
              {new Date(application.submittedAt).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <Button variant="outline">
            <Download data-icon="inline-start" />
            Download Summary
          </Button>
        </div>
      </div>

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
          <p className="mt-1 text-sm text-warning-foreground/80">
            Please review the notes from our team and contact support if you need help resolving this.
          </p>
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
              <DetailRow label="Phone" value={application.phone} />
              <DetailRow label="Email" value={application.email} />
              <DetailRow label="Business name" value={application.businessName ?? "—"} />
              <DetailRow label="Sector" value={application.sector} />
              <DetailRow label="Channel" value={application.channel} />
              <DetailRow label="ID type" value={application.idType} />
              <DetailRow label="ID number" value={application.idNumber} />
              <div className="sm:col-span-2">
                <DetailRow
                  label="Location"
                  value={`${application.street}, ${application.ward}, ${application.district}, ${application.province}`}
                  icon={MapPin}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Documents</h2>
            </div>
            <ul className="divide-y divide-border px-5">
              {application.documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-3 py-3.5">
                  {doc.status === "missing" ? (
                    <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                  ) : (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  )}
                  <span className="text-sm text-foreground">{doc.name}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <span
                      className={`text-xs font-medium ${
                        doc.status === "verified"
                          ? "text-success"
                          : doc.status === "unverified"
                            ? "text-warning-foreground"
                            : "text-destructive"
                      }`}
                    >
                      {doc.status === "verified" ? "Verified" : doc.status === "unverified" ? "Unverified" : "Missing"}
                    </span>
                    {doc.previewUrl && (
                      <Button variant="ghost" size="icon-sm" aria-label={`Preview ${doc.name}`}>
                        <Eye className="size-3.5" />
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="p-4" />
          </div>
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

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">Timeline</h2>
            </div>
            <ul className="flex flex-col divide-y divide-border">
              {application.timeline.map((event) => (
                <li key={event.id} className="px-5 py-3.5">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{event.actor}</span> {event.action}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.timestamp}
                    {event.detail ? ` · ${event.detail}` : ""}
                  </p>
                </li>
              ))}
            </ul>
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
