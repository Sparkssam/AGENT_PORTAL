import { cn } from "@/lib/utils"
import type { AppStatus, DepositStatus, DocumentStatus } from "@/lib/domain"
import { statusLabels, depositLabels } from "@/lib/domain"

const appStatusStyles: Record<AppStatus, string> = {
  DRAFT: "status-badge-muted",
  SUBMITTED: "status-badge-muted",
  PENDING_REVIEW: "status-badge-muted",
  IN_PROGRESS: "status-badge-accent",
  NEEDS_CORRECTION: "status-badge-warning",
  COMPLETED: "status-badge-primary",
  REJECTED: "status-badge-destructive",
}

export function AppStatusBadge({ status, className }: { status: AppStatus; className?: string }) {
  return (
    <span className={cn("status-badge", appStatusStyles[status], className)}>
      {statusLabels[status]}
    </span>
  )
}

const depositStatusStyles: Record<DepositStatus, string> = {
  PENDING: "status-badge-muted",
  SUBMITTED: "status-badge-accent",
  CLEARED: "status-badge-success",
  REJECTED: "status-badge-destructive",
  AWAITING_PROOF: "status-badge-warning",
}

export function DepositStatusBadge({ status, className }: { status: DepositStatus; className?: string }) {
  return (
    <span className={cn("status-badge", depositStatusStyles[status], className)}>
      {depositLabels[status]}
    </span>
  )
}

const documentStatusStyles: Record<DocumentStatus, string> = {
  verified: "status-badge-success",
  unverified: "status-badge-warning",
  rejected: "status-badge-destructive",
  missing: "status-badge-muted",
}

const documentStatusLabels: Record<DocumentStatus, string> = {
  verified: "Approved",
  unverified: "Pending",
  rejected: "Rejected",
  missing: "Required",
}

export function DocumentStatusLabel({
  status,
  required,
  adminUploaded,
  className,
}: {
  status: DocumentStatus
  required?: boolean
  adminUploaded?: boolean
  className?: string
}) {
  if (status === "verified" && adminUploaded) {
    return (
      <span className={cn("status-badge status-badge-accent", className)}>Admin uploaded</span>
    )
  }
  const label = status === "missing" && required === false ? "Not uploaded" : documentStatusLabels[status]
  return <span className={cn("status-badge", documentStatusStyles[status], className)}>{label}</span>
}
