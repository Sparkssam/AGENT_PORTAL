export const ID_EXPIRY_WARNING_DAYS = 90

export type ExpiryTone = "ok" | "soon" | "expired"

export type ExpiryStatus = {
  days: number
  tone: ExpiryTone
  label: string
}

export function daysUntil(value?: string | Date | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000)
}

export function expiryStatus(value?: string | Date | null): ExpiryStatus | null {
  const days = daysUntil(value)
  if (days == null) return null
  if (days < 0) {
    return { days, tone: "expired", label: "This ID has expired. Re-upload a current ID before review can finish." }
  }
  if (days <= ID_EXPIRY_WARNING_DAYS) {
    return {
      days,
      tone: "soon",
      label: `This ID expires in ${days} day${days === 1 ? "" : "s"}. Re-upload a renewed ID before it lapses.`,
    }
  }
  return { days, tone: "ok", label: `Valid for ${days} more days.` }
}

export function needsIdReupload(value?: string | Date | null) {
  const status = expiryStatus(value)
  return status?.tone === "expired" || status?.tone === "soon"
}
