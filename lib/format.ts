const DATE_LONG: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
}

export function formatCurrencyTZS(amount: number) {
  return `TZS ${amount.toLocaleString("en-US")}`
}

export function formatDateLong(value?: string | Date | null, timeZone: "UTC" | "local" = "UTC") {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-GB", {
    ...DATE_LONG,
    timeZone: timeZone === "UTC" ? "UTC" : undefined,
  })
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "—"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("en-GB", {
    ...DATE_LONG,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatPhoneTZ(value?: string | null) {
  if (!value?.trim()) return "—"
  const digits = value.replace(/\D/g, "")
  let local = digits
  if (local.startsWith("255")) local = local.slice(3)
  else if (local.startsWith("0")) local = local.slice(1)
  if (local.length === 9) {
    return `+255 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return value.trim()
}

export function formatGps(lat?: number | null, lng?: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") return "Not captured"
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "Not captured"
  if (lat === 0 && lng === 0) return "Not captured"
  return `GPS Lat ${lat.toFixed(4)} Lng ${lng.toFixed(4)}`
}

export function formatApplicationNumber(value?: string | null) {
  if (!value || value === "DRAFT") return "DRAFT"
  return value
}

export function formatAgentId(value?: string | null) {
  if (!value || value === "Pending") return "Pending"
  return value
}
