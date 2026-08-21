import Link from "next/link"
import { CheckCircle2, Clock, XCircle, CircleDashed, ArrowRight, FileWarning } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { HelpHint } from "@/components/help/help-hint"
import { RejectedDocumentHelp } from "@/components/help/rejected-document-help"
import type { CorrectionItem, Document, DocumentStatus } from "@/lib/domain"

const meta: Record<
  DocumentStatus,
  { icon: typeof CheckCircle2; iconCls: string; label: string; labelCls: string }
> = {
  verified: { icon: CheckCircle2, iconCls: "text-success", label: "Accepted", labelCls: "text-success" },
  unverified: { icon: Clock, iconCls: "text-warning-foreground", label: "Pending review", labelCls: "text-warning-foreground" },
  rejected: { icon: XCircle, iconCls: "text-destructive", label: "Rejected", labelCls: "text-destructive" },
  missing: { icon: CircleDashed, iconCls: "text-muted-foreground", label: "Missing", labelCls: "text-muted-foreground" },
}

const fieldLabels: Record<string, string> = {
  application: "Application details",
  phone: "Phone number",
  idNumber: "ID number",
  tinNumber: "TIN number",
  agentName: "Full name",
  businessName: "Channel name",
  idType: "ID type",
  issuedPlace: "Issued place",
  issuedDate: "Issued date",
  expireDate: "Expiry date",
  gender: "Gender",
  province: "Region",
  district: "District",
  ward: "Ward",
  street: "Street",
  houseNumber: "House / plot number",
}

function itemLabel(item: CorrectionItem, documents: Document[]) {
  if (item.kind === "document") {
    const doc = documents.find((d) => d.type === item.target || d.name === item.target)
    return doc?.name ?? item.target.replaceAll("_", " ")
  }
  return fieldLabels[item.target] ?? item.target.replaceAll("_", " ")
}

/**
 * Checklist of reviewer notes plus document status. Field items come from the
 * stored correction request; documents still show reject/missing status.
 */
export function CorrectionChecklist({
  documents,
  items = [],
  summary,
  fixHref = "/agent/apply",
  showFix = true,
  agentName,
  applicationNumber,
}: {
  documents: Document[]
  items?: CorrectionItem[]
  summary?: string
  fixHref?: string
  showFix?: boolean
  agentName?: string
  applicationNumber?: string
}) {
  const needsWork = documents.filter((d) => d.status === "rejected" || d.status === "missing").length
  const fieldItems = items.filter((item) => item.kind === "field")
  const openCount = needsWork + fieldItems.length

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
          Correction checklist
          <HelpHint articleId="how-to-reupload" />
        </h2>
          <span
            className={cn(
              "status-badge",
              openCount > 0 ? "status-badge-warning" : "status-badge-success",
            )}
          >
          {openCount > 0 ? `${openCount} to fix` : "All clear"}
        </span>
      </div>
      {summary ? (
        <p className="border-b border-border px-5 py-3 text-sm text-muted-foreground">{summary}</p>
      ) : null}
      {fieldItems.length > 0 ? (
        <ul className="divide-y divide-border border-b border-border">
          {fieldItems.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3.5">
              <FileWarning className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-foreground">{itemLabel(item, documents)}</span>
                  <span className="text-xs font-medium text-warning-foreground">· Field to update</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
              </div>
              {showFix && (
                <Button
                  size="sm"
                  variant="outline"
                  render={<Link href="/agent/apply" />}
                  nativeButton={false}
                  className="shrink-0"
                >
                  Fix now
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="divide-y divide-border">
        {documents.map((doc) => {
          const m = meta[doc.status]
          const Icon = m.icon
          const requested = items.find((item) => item.kind === "document" && (item.target === doc.type || item.target === doc.name))
          const actionable = doc.status === "rejected" || doc.status === "missing"
          return (
            <li key={doc.id} className="flex items-start gap-3 px-5 py-3.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", m.iconCls)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-foreground">{doc.name}</span>
                  <span className={cn("text-xs font-medium", m.labelCls)}>· {m.label}</span>
                </div>
                {(requested?.reason || (doc.reason && actionable)) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{requested?.reason || doc.reason}</p>
                )}
                {doc.status === "rejected" ? (
                  <RejectedDocumentHelp
                    agentName={agentName}
                    applicationNumber={applicationNumber}
                    documentType={doc.type}
                    documentName={doc.name}
                    reason={requested?.reason || doc.reason}
                  />
                ) : null}
                {doc.status === "missing" && !doc.reason && !requested && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Not uploaded yet.</p>
                )}
              </div>
              {showFix && actionable && (
                <Button
                  size="sm"
                  variant={doc.status === "rejected" ? "default" : "outline"}
                  render={<Link href={fixHref} />}
                  nativeButton={false}
                  className="shrink-0"
                >
                  Fix now
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
