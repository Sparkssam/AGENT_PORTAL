export const RETENTION = {
  completedYears: 7,
  rejectedMonths: 24,
  draftMonths: 12,
  softDeletedDocumentDays: 90,
  auditYears: 7,
} as const

export function retentionCutoff(kind: keyof typeof RETENTION) {
  const now = Date.now()
  if (kind === "completedYears" || kind === "auditYears") {
    return new Date(now - RETENTION[kind] * 365.25 * 24 * 60 * 60 * 1000)
  }
  if (kind === "rejectedMonths" || kind === "draftMonths") {
    return new Date(now - RETENTION[kind] * 30.44 * 24 * 60 * 60 * 1000)
  }
  return new Date(now - RETENTION.softDeletedDocumentDays * 24 * 60 * 60 * 1000)
}
