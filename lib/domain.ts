export type AppStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_REVIEW"
  | "IN_PROGRESS"
  | "NEEDS_CORRECTION"
  | "COMPLETED"
  | "REJECTED"

export type DepositStatus = "PENDING" | "SUBMITTED" | "CLEARED" | "REJECTED" | "AWAITING_PROOF"

export type DocumentStatus = "verified" | "unverified" | "missing" | "rejected"

export const statusLabels: Record<AppStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING_REVIEW: "Pending Review",
  IN_PROGRESS: "In Progress",
  NEEDS_CORRECTION: "Needs Correction",
  COMPLETED: "Verified",
  REJECTED: "Rejected",
}

export const depositLabels: Record<DepositStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  CLEARED: "Cleared",
  REJECTED: "Rejected",
  AWAITING_PROOF: "Awaiting Proof",
}

const PROGRESS_PRIORITY: AppStatus[] = [
  "COMPLETED",
  "NEEDS_CORRECTION",
  "IN_PROGRESS",
  "PENDING_REVIEW",
  "SUBMITTED",
  "REJECTED",
  "DRAFT",
]

/** Pick the standing application status for an agent directory row. */
export function primaryApplicationStatus(statuses: Array<AppStatus | undefined | null>): AppStatus {
  const present = new Set(statuses.filter(Boolean) as AppStatus[])
  return PROGRESS_PRIORITY.find((status) => present.has(status)) ?? "DRAFT"
}

export interface Document {
  id: string
  name: string
  type: string
  status: DocumentStatus
  verifiedBy?: string
  fileType: "image" | "pdf"
  previewUrl?: string
  fileUrl?: string
  fileExtension?: string
  reason?: string
  required?: boolean
  originalName?: string
  storedFileName?: string
  adminUploaded?: boolean
  fileSize?: number
  mimeType?: string
  verificationPassed?: boolean
  verificationIssues?: string[]
  verificationConfidence?: number
  extractedName?: string
  extractedIdNumber?: string
  extractedDob?: string
  extractedExpiry?: string
}

export interface TimelineEvent {
  id: string
  actor: string
  action: string
  detail?: string
  timestamp: string
}

export interface CorrectionItem {
  id: string
  kind: "field" | "document"
  target: string
  reason: string
}

export interface DuplicateMatch {
  id: string
  appNumber: string
  status: AppStatus
  matches: Array<"phone" | "id" | "tin">
}

export interface Application {
  id: string
  agentId?: string
  agentCode?: string
  appNumber: string
  agentName: string
  tinNumber?: string
  businessName?: string
  phone: string
  email: string
  channel: string
  channelParentType: string
  channelParentName: string
  channelManagerType: string
  channelManagerName: string
  channelType: string
  sector: string
  channelId?: string
  sectorId?: string
  status: AppStatus
  depositStatus: DepositStatus
  depositAmount: number
  depositReference?: string
  depositVerifiedAt?: string
  idType: string
  idNumber: string
  issuedPlace: string
  issuedDate: string
  expireDate: string
  gender: string
  country: string
  province: string
  district: string
  ward: string
  street: string
  houseNumber: string
  lat: number
  lng: number
  locationCapturedAt?: string
  submittedAt: string
  daysPending: number
  documents: Document[]
  timeline: TimelineEvent[]
  corrections?: CorrectionItem[]
  correctionSummary?: string
  fieldsComplete: number
  fieldsTotal: number
}

export interface Agent {
  id: string
  name: string
  agentId: string
  phone: string
  email: string
  channel: "Retail Partner" | "Direct Sales" | "Third-Party"
  apps: number
  status: "Active" | "Suspended" | "Pending"
  applicationStatus?: AppStatus
  joined: string
}

export type HealthTone = "healthy" | "attention" | "critical" | "neutral"

export interface CaseHealth {
  appPercent: number
  fieldsComplete: number
  fieldsTotal: number
  docsVerified: number
  docsTotal: number
  docsPending: number
  docsRejected: number
  docsMissing: number
  corrections: number
  depositCleared: boolean
  tone: HealthTone
  nextAction: { label: string; href: string }
}

export type AuditCategory = "Application" | "Document" | "Agent" | "System" | "Security"
export type AuditSeverity = "info" | "warning" | "critical"

export interface AuditLogEntry {
  id: string
  actor: string
  actorRole: string
  category: AuditCategory
  severity: AuditSeverity
  action: string
  detail: string
  target: string
  ipAddress: string
  timestamp: string
}

export function sanitizeFileToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")
}

/** Short collision-resistant id from AG-2026-00842 or a UUID. */
export function shortAgentId(agentCode?: string | null, agentId?: string | null) {
  const digits = (agentCode ?? "").replace(/\D/g, "")
  if (digits.length >= 4) return digits.slice(-6)
  const code = sanitizeFileToken(agentCode ?? "")
  if (code.length >= 6) return code.slice(-8)
  return sanitizeFileToken(agentId ?? "agent").slice(0, 8) || "agent"
}

export function storedDocumentFileName(opts: {
  agentName: string
  agentCode?: string | null
  agentId?: string | null
  documentType: string
  extension?: string
}) {
  const first = sanitizeFileToken(opts.agentName.split(/\s+/)[0] || "agent") || "agent"
  const id = shortAgentId(opts.agentCode, opts.agentId)
  const type = sanitizeFileToken(opts.documentType) || "document"
  const ext = (opts.extension ?? "png").replace(/^\.+/, "").toLowerCase()
  return `${first}_${id}_${type}.${ext}`
}

export function buildDocumentFileName(opts: {
  agentName: string
  docName: string
  network: string
  extension?: string
  agentCode?: string | null
  agentId?: string | null
  documentType?: string
}) {
  if (opts.documentType) {
    return storedDocumentFileName({
      agentName: opts.agentName,
      agentCode: opts.agentCode,
      agentId: opts.agentId,
      documentType: opts.documentType,
      extension: opts.extension,
    })
  }
  const name = sanitizeFileToken(opts.agentName) || "agent"
  const doc = sanitizeFileToken(opts.docName) || "document"
  const network = sanitizeFileToken(opts.network) || "network"
  const ext = (opts.extension ?? "png").replace(/^\.+/, "").toLowerCase()
  return `${name}_${doc}_${network}.${ext}`
}

export function getDocumentFile(doc: Document) {
  const url = doc.fileUrl ?? doc.previewUrl
  if (!url || doc.status === "missing") return null
  const extension = doc.fileExtension ?? url.split(".").pop()?.split("?")[0] ?? "png"
  return { url, extension }
}

export function computeCaseHealth(app: Application): CaseHealth {
  const docsTotal = app.documents.length
  const docsVerified = app.documents.filter((d) => d.status === "verified").length
  const docsPending = app.documents.filter((d) => d.status === "unverified").length
  const docsRejected = app.documents.filter((d) => d.status === "rejected").length
  const docsMissing = app.documents.filter((d) => d.status === "missing").length
  const corrections = docsRejected + docsMissing
  const fieldsComplete = app.status === "REJECTED" ? 0 : app.fieldsComplete
  const appPercent =
    app.status === "REJECTED" || app.fieldsTotal === 0 ? 0 : Math.round((fieldsComplete / app.fieldsTotal) * 100)
  const depositCleared = app.depositStatus === "CLEARED"

  let tone: HealthTone = "neutral"
  if (app.status === "REJECTED") tone = "critical"
  else if (app.status === "COMPLETED") tone = "healthy"
  else if (app.status === "NEEDS_CORRECTION" || corrections > 0 || app.depositStatus === "REJECTED") tone = "attention"
  else if (docsVerified === docsTotal && appPercent === 100 && depositCleared) tone = "healthy"
  else tone = "neutral"

  const problemDoc = app.documents.find((d) => d.status === "rejected") ?? app.documents.find((d) => d.status === "missing")

  let nextAction: { label: string; href: string }
  if (app.status === "REJECTED") {
    nextAction = { label: "Contact support", href: "/agent/dashboard" }
  } else if (app.status === "COMPLETED") {
    nextAction = { label: "View approval summary", href: `/agent/applications/${app.id}` }
  } else if (problemDoc) {
    nextAction = { label: `Fix ${problemDoc.name}`, href: "/agent/apply" }
  } else if (!depositCleared) {
    nextAction = { label: "Complete your deposit", href: `/agent/applications/${app.id}` }
  } else if (appPercent < 100) {
    nextAction = { label: "Complete your application", href: `/agent/applications/${app.id}` }
  } else {
    nextAction = { label: "Track review status", href: `/agent/applications/${app.id}` }
  }

  return {
    appPercent,
    fieldsComplete,
    fieldsTotal: app.fieldsTotal,
    docsVerified,
    docsTotal,
    docsPending,
    docsRejected,
    docsMissing,
    corrections,
    depositCleared,
    tone,
    nextAction,
  }
}
