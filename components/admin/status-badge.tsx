import { cn } from "@/lib/utils"
import type { AppStatus, DepositStatus, DocumentStatus } from "@/lib/admin-data"
import { statusLabels, depositLabels } from "@/lib/admin-data"

const appStatusStyles: Record<AppStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-secondary text-secondary-foreground",
  PENDING_REVIEW: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-accent/15 text-accent",
  NEEDS_CORRECTION: "bg-warning/20 text-warning-foreground",
  COMPLETED: "bg-primary text-primary-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
}

export function AppStatusBadge({ status, className }: { status: AppStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase",
        appStatusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

const depositStatusStyles: Record<DepositStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-accent/15 text-accent",
  CLEARED: "bg-accent/15 text-accent",
  REJECTED: "bg-destructive/10 text-destructive",
  AWAITING_PROOF: "bg-warning/20 text-warning-foreground",
}

export function DepositStatusBadge({ status, className }: { status: DepositStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide uppercase",
        depositStatusStyles[status],
        className,
      )}
    >
      {depositLabels[status]}
    </span>
  )
}

const documentStatusStyles: Record<DocumentStatus, string> = {
  verified: "text-success",
  unverified: "text-warning-foreground",
  missing: "text-destructive",
}

const documentStatusLabels: Record<DocumentStatus, string> = {
  verified: "Verified",
  unverified: "Unverified",
  missing: "Missing",
}

export function DocumentStatusLabel({ status, className }: { status: DocumentStatus; className?: string }) {
  return <span className={cn("text-xs font-medium", documentStatusStyles[status], className)}>{documentStatusLabels[status]}</span>
}
