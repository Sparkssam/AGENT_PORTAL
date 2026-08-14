import Link from "next/link"
import { CheckCircle2, Clock, XCircle, CircleDashed, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { Document, DocumentStatus } from "@/lib/admin-data"

const meta: Record<
  DocumentStatus,
  { icon: typeof CheckCircle2; iconCls: string; label: string; labelCls: string }
> = {
  verified: { icon: CheckCircle2, iconCls: "text-success", label: "Accepted", labelCls: "text-success" },
  unverified: { icon: Clock, iconCls: "text-warning-foreground", label: "Pending review", labelCls: "text-warning-foreground" },
  rejected: { icon: XCircle, iconCls: "text-destructive", label: "Rejected", labelCls: "text-destructive" },
  missing: { icon: CircleDashed, iconCls: "text-muted-foreground", label: "Missing", labelCls: "text-muted-foreground" },
}

/**
 * A precise, per-document correction list. Instead of a single "Rejected"
 * badge, it shows exactly which documents are accepted, pending, rejected
 * (with the reviewer's reason) or missing, and gives the agent a direct
 * "Fix now" action for anything that needs work.
 */
export function CorrectionChecklist({
  documents,
  fixHref = "/agent/documents",
  showFix = true,
}: {
  documents: Document[]
  fixHref?: string
  showFix?: boolean
}) {
  const needsWork = documents.filter((d) => d.status === "rejected" || d.status === "missing").length

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Correction checklist</h2>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium",
            needsWork > 0 ? "bg-warning/20 text-warning-foreground" : "bg-success/15 text-success",
          )}
        >
          {needsWork > 0 ? `${needsWork} to fix` : "All clear"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {documents.map((doc) => {
          const m = meta[doc.status]
          const Icon = m.icon
          const actionable = doc.status === "rejected" || doc.status === "missing"
          return (
            <li key={doc.id} className="flex items-start gap-3 px-5 py-3.5">
              <Icon className={cn("mt-0.5 size-4 shrink-0", m.iconCls)} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-medium text-foreground">{doc.name}</span>
                  <span className={cn("text-xs font-medium", m.labelCls)}>· {m.label}</span>
                </div>
                {doc.reason && actionable && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{doc.reason}</p>
                )}
                {doc.status === "missing" && !doc.reason && (
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
