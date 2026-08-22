import { AlertTriangle, Clock } from "lucide-react"
import { expiryStatus } from "@/lib/documents/expiry"
import { cn } from "@/lib/utils"

export function DocumentExpiryBanner({
  expireDate,
  href = "/agent/apply",
}: {
  expireDate?: string | null
  href?: string
}) {
  const status = expiryStatus(expireDate)
  if (!status || status.tone === "ok") return null

  return (
    <div
      className={cn(
        "portal-callout",
        status.tone === "expired" ? "portal-callout-destructive" : "portal-callout-warning",
      )}
      role="status"
    >
      <p className="flex items-start gap-2 text-sm">
        {status.tone === "expired" ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Clock className="mt-0.5 size-4 shrink-0" />
        )}
        <span>
          {status.label}{" "}
          <a href={href} className="font-medium underline underline-offset-4">
            Re-upload ID photos
          </a>
        </span>
      </p>
    </div>
  )
}
