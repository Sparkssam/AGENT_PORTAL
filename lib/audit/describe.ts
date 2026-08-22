import { DOCUMENT_TYPE_OPTIONS, documentTypeLabel } from "@/lib/documents/catalog"
import { depositLabels, statusLabels, type AuditLogEntry, type AuditSeverity } from "@/lib/domain"
import { formatDateTime } from "@/lib/format"

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

const roleLabels: Record<string, string> = {
  agent: "Agent",
  admin: "Administrator",
  super_admin: "Super administrator",
  System: "System",
  Automation: "System",
  "Fraud Engine": "Fraud check",
}

const severityCopy: Record<AuditSeverity, { label: string; meaning: string }> = {
  info: { label: "Recorded", meaning: "Normal activity" },
  warning: { label: "Needs attention", meaning: "Review this event" },
  critical: { label: "Urgent", meaning: "Act on this now" },
}

const categoryCopy: Record<AuditLogEntry["category"], string> = {
  Application: "Application",
  Document: "Document",
  Agent: "Agent account",
  System: "System",
  Security: "Security",
}

function replaceCodes(text: string) {
  let next = text
  for (const item of DOCUMENT_TYPE_OPTIONS) {
    next = next.replaceAll(item.code, item.name)
  }
  next = next.replace(
    /\b(DRAFT|SUBMITTED|PENDING_REVIEW|IN_PROGRESS|NEEDS_CORRECTION|COMPLETED|REJECTED)\b/g,
    (token) => statusLabels[token as keyof typeof statusLabels] ?? token,
  )
  next = next.replace(
    /\b(PENDING|SUBMITTED|CLEARED|REJECTED|AWAITING_PROOF)\b/g,
    (token) => depositLabels[token as keyof typeof depositLabels] ?? token.toLowerCase(),
  )
  next = next.replace(UUID, "this record")
  next = next.replace(/\s{2,}/g, " ").trim()
  return next
}

function headlineFor(entry: AuditLogEntry) {
  const action = entry.action.trim()
  const detail = entry.detail
  if (/submitted application/i.test(action)) return "Submitted an application for review"
  if (/approved application/i.test(action) || /status changed to completed/i.test(detail)) {
    return "Marked the application as verified"
  }
  if (/rejected application/i.test(action) && !/document/i.test(action)) {
    return "Rejected the application"
  }
  if (/needs_correction|correction requested|asked .+ correction/i.test(`${action} ${detail}`)) {
    return "Asked the agent to fix the application"
  }
  if (/updated status/i.test(action)) return `Updated the application status`
  if (/verified document/i.test(action)) {
    const code = detail.trim().split(/\s+/)[0] ?? ""
    const label = documentTypeLabel(code)
    return label !== code ? `Accepted the ${label}` : "Accepted a document"
  }
  if (/rejected document/i.test(action)) return "Sent a document back for a new upload"
  if (/removed document/i.test(action)) return "Removed a document file"
  if (/on behalf/i.test(action)) return "Uploaded a document on behalf of the agent"
  if (/replaced/i.test(action)) return "Replaced a document file"
  if (/uploaded document/i.test(action)) return "Uploaded a document"
  if (/bulk downloaded/i.test(action)) return "Downloaded documents"
  if (/verified deposit|cleared/i.test(action)) return "Cleared the TZS 100,000 deposit"
  if (/rejected deposit/i.test(action)) return "Rejected the deposit proof"
  if (/suspended/i.test(action)) return "Suspended the agent account"
  if (/activated/i.test(action)) return "Reactivated the agent account"
  if (/registered/i.test(action)) return "Created an agent account"
  if (/failed login/i.test(action)) return "Sign-in failed"
  if (/flagged duplicate/i.test(action)) return "Flagged a duplicate ID"
  if (/expiring/i.test(action)) return "A document is expiring soon"
  if (/sync failure/i.test(action)) return "A system sync failed"
  if (/batch upload/i.test(action)) return "Processed a batch of records"
  if (/review note/i.test(action)) return "Added a review note"
  if (/created application/i.test(action)) return "Started a new application"
  if (/onboarded/i.test(action)) return "Onboarded a new agent"
  return action.charAt(0).toUpperCase() + action.slice(1)
}

function summaryFor(entry: AuditLogEntry, headline: string) {
  const cleaned = replaceCodes(entry.detail || "")
  if (!cleaned || cleaned === "this record") return `${headline}.`
  const isDocCode = DOCUMENT_TYPE_OPTIONS.some(
    (item) => item.code === entry.detail.trim() || item.name === cleaned,
  )
  if (isDocCode) {
    if (headline.toLowerCase().includes(cleaned.toLowerCase())) return `${headline}.`
    return `${headline}. File: ${cleaned}.`
  }
  if (cleaned.length < 90 && !cleaned.endsWith(".")) return `${headline}. ${cleaned}.`
  if (headline && cleaned.toLowerCase().startsWith(headline.toLowerCase())) return cleaned
  return `${headline}. ${cleaned}`
}

export function describeAudit(entry: AuditLogEntry) {
  const headline = headlineFor(entry)
  const actorLooksLikeId = UUID.test(entry.actor)
  UUID.lastIndex = 0
  return {
    headline,
    summary: summaryFor(entry, headline),
    actor: actorLooksLikeId ? "Unknown user" : entry.actor || "System",
    role: roleLabels[entry.actorRole] ?? entry.actorRole.replaceAll("_", " "),
    when: formatDateTime(entry.timestamp),
    relative: relativeTime(entry.timestamp),
    target: replaceCodes(entry.target || "").replace(/^this record$/i, ""),
    category: categoryCopy[entry.category],
    severity: severityCopy[entry.severity],
    ip: entry.ipAddress,
  }
}

export function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(ms)) return formatDateTime(iso)
  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`
  return formatDateTime(iso)
}

export { severityCopy, categoryCopy }
