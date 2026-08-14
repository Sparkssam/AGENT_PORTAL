// Mock data layer for the Kinetic Admin Portal.
// Mirrors the data model from the Agent Application & Document Management
// Portal implementation plan (applications, agents, documents, status history).

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
  COMPLETED: "Completed",
  REJECTED: "Rejected",
}

export const depositLabels: Record<DepositStatus, string> = {
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  CLEARED: "Cleared",
  REJECTED: "Rejected",
  AWAITING_PROOF: "Awaiting Proof",
}

export interface Document {
  id: string
  name: string
  type: string
  status: DocumentStatus
  verifiedBy?: string
  fileType: "image" | "pdf"
  previewUrl?: string
  /** Reviewer note explaining why a document was rejected / needs re-upload. */
  reason?: string
}

export interface TimelineEvent {
  id: string
  actor: string
  action: string
  detail?: string
  timestamp: string
}

export interface Application {
  id: string
  appNumber: string
  agentName: string
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
  status: AppStatus
  depositStatus: DepositStatus
  depositAmount: number
  depositReference?: string
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
  submittedAt: string
  daysPending: number
  documents: Document[]
  timeline: TimelineEvent[]
  fieldsComplete: number
  fieldsTotal: number
}

type DocOverride = DocumentStatus | { status: DocumentStatus; reason?: string }

const documentSet = (overrides?: Partial<Record<string, DocOverride>>): Document[] => {
  const base: Document[] = [
    {
      id: "doc-1",
      name: "ID Card Front",
      type: "id_front",
      status: "verified",
      verifiedBy: "System OCR",
      fileType: "image",
      previewUrl: "/documents/id-front-sample.png",
    },
    {
      id: "doc-2",
      name: "ID Card Back",
      type: "id_back",
      status: "verified",
      verifiedBy: "System OCR",
      fileType: "image",
      previewUrl: "/documents/id-front-sample.png",
    },
    { id: "doc-3", name: "TIN Document", type: "tin", status: "unverified", fileType: "pdf" },
    { id: "doc-4", name: "Agreement Contract", type: "contract", status: "verified", verifiedBy: "Sarah Admin", fileType: "pdf" },
    { id: "doc-5", name: "Business Licence", type: "licence", status: "verified", verifiedBy: "Sarah Admin", fileType: "pdf" },
    {
      id: "doc-6",
      name: "Shop Image",
      type: "shop_image",
      status: "missing",
      fileType: "image",
      previewUrl: "/documents/shop-sample.png",
    },
    {
      id: "doc-7",
      name: "Portrait",
      type: "portrait",
      status: "verified",
      verifiedBy: "System OCR",
      fileType: "image",
      previewUrl: "/documents/portrait-sample.png",
    },
    { id: "doc-8", name: "Other", type: "other", status: "verified", verifiedBy: "Sarah Admin", fileType: "pdf" },
  ]
  if (!overrides) return base
  return base.map((d) => {
    const o = overrides[d.type]
    if (!o) return d
    if (typeof o === "string") return { ...d, status: o }
    return { ...d, status: o.status, reason: o.reason ?? d.reason }
  })
}

export const applications: Application[] = [
  {
    id: "app-89021",
    appNumber: "APP-89021",
    agentName: "John Doe Enterprise",
    businessName: "Doe Enterprise Mobile",
    phone: "+255 712 345 678",
    email: "john.doe@example.com",
    channel: "Sub-Agent",
    channelParentType: "Master Agent",
    channelParentName: "KiliNet Communications",
    channelManagerType: "Regional Supervisor",
    channelManagerName: "Sarah Connor",
    channelType: "Sub-Agent",
    sector: "Retail Kiosk",
    status: "IN_PROGRESS",
    depositStatus: "CLEARED",
    depositAmount: 100000,
    depositReference: "MPESA-4A2E19",
    idType: "National ID (NIDA)",
    idNumber: "19850512-11101-00001-26",
    issuedPlace: "Dar es Salaam",
    issuedDate: "2020-01-15",
    expireDate: "2024-01-15",
    gender: "Male",
    country: "Tanzania",
    province: "Dar es Salaam",
    district: "Kinondoni",
    ward: "Oyster Bay",
    street: "Toure Drive",
    houseNumber: "Plot 45",
    lat: -6.7785,
    lng: 39.2743,
    submittedAt: "2023-10-24T14:30:00",
    daysPending: 3,
    documents: documentSet(),
    fieldsComplete: 11,
    fieldsTotal: 12,
    timeline: [
      { id: "t1", actor: "Admin User", action: "Status changed to In Review", timestamp: "2 hours ago" },
      { id: "t2", actor: "System", action: "OCR Verification Passed", timestamp: "3 hours ago" },
      { id: "t3", actor: "Agent Portal", action: "Application Submitted", timestamp: "Oct 24, 14:30" },
    ],
  },
  {
    id: "app-0891",
    appNumber: "APP-24-0891",
    agentName: "Juma Ali Wakala",
    phone: "+255 754 123 456",
    email: "j.wakala@kinetic.co.tz",
    channel: "M-Pesa",
    channelParentType: "Master Agent",
    channelParentName: "Vodacom M-Pesa",
    channelManagerType: "Zonal Supervisor",
    channelManagerName: "Grace Mwenda",
    channelType: "Retail Kiosk",
    sector: "Retail Kiosk",
    status: "PENDING_REVIEW",
    depositStatus: "CLEARED",
    depositAmount: 100000,
    depositReference: "TXN-88213-MP",
    idType: "National ID (NIDA)",
    idNumber: "19900112-22201-00013-11",
    issuedPlace: "Dodoma",
    issuedDate: "2019-05-02",
    expireDate: "2027-05-02",
    gender: "Male",
    country: "Tanzania",
    province: "Dodoma",
    district: "Dodoma Mjini",
    ward: "Makole",
    street: "Uhuru Street",
    houseNumber: "12",
    lat: -6.1731,
    lng: 35.7419,
    submittedAt: "2024-05-02T09:12:00",
    daysPending: 2,
    documents: documentSet({ tin: "verified", shop_image: "verified" }),
    fieldsComplete: 12,
    fieldsTotal: 12,
    timeline: [
      { id: "t1", actor: "Agent Portal", action: "Application Submitted", timestamp: "2 days ago" },
      { id: "t2", actor: "System", action: "Duplicate check passed", timestamp: "2 days ago" },
    ],
  },
  {
    id: "app-0890",
    appNumber: "APP-24-0890",
    agentName: "Aisha Mushi Shop",
    phone: "+255 712 987 654",
    email: "aisha.mushi@kinetic.co.tz",
    channel: "Tigo Pesa",
    channelParentType: "Master Agent",
    channelParentName: "Tigo Pesa HQ",
    channelManagerType: "Regional Supervisor",
    channelManagerName: "Elias Mbwana",
    channelType: "Supermarket",
    sector: "Supermarket",
    status: "COMPLETED",
    depositStatus: "CLEARED",
    depositAmount: 100000,
    depositReference: "TIGO-99213",
    idType: "National ID (NIDA)",
    idNumber: "19870820-33301-00027-05",
    issuedPlace: "Mwanza",
    issuedDate: "2018-03-10",
    expireDate: "2026-03-10",
    gender: "Female",
    country: "Tanzania",
    province: "Mwanza",
    district: "Nyamagana",
    ward: "Mirongo",
    street: "Kenyatta Road",
    houseNumber: "8B",
    lat: -2.5164,
    lng: 32.9175,
    submittedAt: "2024-04-18T11:02:00",
    daysPending: 0,
    documents: documentSet({ tin: "verified", shop_image: "verified" }),
    fieldsComplete: 12,
    fieldsTotal: 12,
    timeline: [
      { id: "t1", actor: "Sarah Admin", action: "Application approved", timestamp: "5 days ago" },
      { id: "t2", actor: "Agent Portal", action: "Application Submitted", timestamp: "9 days ago" },
    ],
  },
  {
    id: "app-0889",
    appNumber: "APP-24-0889",
    agentName: "Kigoma Traders Ltd",
    phone: "+255 788 555 222",
    email: "info@kigomatraders.tz",
    channel: "Airtel Money",
    channelParentType: "Master Agent",
    channelParentName: "Airtel Money HQ",
    channelManagerType: "Zonal Supervisor",
    channelManagerName: "Peter Massawe",
    channelType: "Wholesale",
    sector: "Wholesale",
    status: "REJECTED",
    depositStatus: "REJECTED",
    depositAmount: 100000,
    idType: "National ID (NIDA)",
    idNumber: "19750630-11101-00099-19",
    issuedPlace: "Kigoma",
    issuedDate: "2017-07-01",
    expireDate: "2025-07-01",
    gender: "Male",
    country: "Tanzania",
    province: "Kigoma",
    district: "Kigoma Mjini",
    ward: "Mwanga",
    street: "Lake Road",
    houseNumber: "3",
    lat: -4.8766,
    lng: 29.6266,
    submittedAt: "2024-03-30T16:45:00",
    daysPending: 0,
    documents: documentSet({ tin: "missing", shop_image: "missing" }),
    fieldsComplete: 9,
    fieldsTotal: 12,
    timeline: [
      { id: "t1", actor: "Michael Manager", action: "Application rejected", detail: "Duplicate ID detected", timestamp: "10 days ago" },
    ],
  },
  {
    id: "app-0888",
    appNumber: "APP-24-0888",
    agentName: "Mwanza City Agents",
    phone: "+255 765 444 333",
    email: "mwanza.city@kinetic.co.tz",
    channel: "M-Pesa",
    channelParentType: "Master Agent",
    channelParentName: "Vodacom M-Pesa",
    channelManagerType: "Zonal Supervisor",
    channelManagerName: "Grace Mwenda",
    channelType: "Pharmacy",
    sector: "Pharmacy",
    status: "PENDING_REVIEW",
    depositStatus: "AWAITING_PROOF",
    depositAmount: 100000,
    idType: "National ID (NIDA)",
    idNumber: "19921203-44401-00055-08",
    issuedPlace: "Mwanza",
    issuedDate: "2021-02-20",
    expireDate: "2029-02-20",
    gender: "Female",
    country: "Tanzania",
    province: "Mwanza",
    district: "Ilemela",
    ward: "Buzuruga",
    street: "Airport Road",
    houseNumber: "21",
    lat: -2.4711,
    lng: 32.9089,
    submittedAt: "2024-05-04T08:15:00",
    daysPending: 1,
    documents: documentSet({ tin: "unverified", shop_image: "missing" }),
    fieldsComplete: 10,
    fieldsTotal: 12,
    timeline: [{ id: "t1", actor: "Agent Portal", action: "Application Submitted", timestamp: "1 day ago" }],
  },
  {
    id: "app-8829",
    appNumber: "APP-8829-TZ",
    agentName: "Juma Kapuya",
    phone: "+255 621 445 002",
    email: "j.kapuya@kinetic.co.tz",
    channel: "M-Pesa",
    channelParentType: "Master Agent",
    channelParentName: "Vodacom M-Pesa",
    channelManagerType: "Regional Supervisor",
    channelManagerName: "Grace Mwenda",
    channelType: "Retail Kiosk",
    sector: "Retail Kiosk",
    status: "NEEDS_CORRECTION",
    depositStatus: "SUBMITTED",
    depositAmount: 100000,
    idType: "National ID (NIDA)",
    idNumber: "19881204-55501-00081-14",
    issuedPlace: "Tanga",
    issuedDate: "2016-09-11",
    expireDate: "2024-09-11",
    gender: "Male",
    country: "Tanzania",
    province: "Tanga",
    district: "Tanga City",
    ward: "Chumbageni",
    street: "Independence Ave",
    houseNumber: "17",
    lat: -5.0693,
    lng: 39.098,
    submittedAt: "2024-04-24T10:00:00",
    daysPending: 14,
    documents: documentSet({
      tin: { status: "missing" },
      id_back: { status: "rejected", reason: "Image is unclear — re-upload a sharp, well-lit photo of the ID back." },
    }),
    fieldsComplete: 10,
    fieldsTotal: 12,
    timeline: [
      { id: "t2", actor: "Sarah Admin", action: "Requested correction", detail: "ID Card Back unclear; TIN document missing", timestamp: "13 days ago" },
      { id: "t1", actor: "System", action: "Flagged: Docs Missing", timestamp: "14 days ago" },
    ],
  },
  {
    id: "app-8841",
    appNumber: "APP-8841-TZ",
    agentName: "Fatma Shein",
    phone: "+255 655 221 998",
    email: "f.shein@kinetic.co.tz",
    channel: "Tigo Pesa",
    channelParentType: "Master Agent",
    channelParentName: "Tigo Pesa HQ",
    channelManagerType: "Zonal Supervisor",
    channelManagerName: "Elias Mbwana",
    channelType: "Supermarket",
    sector: "Supermarket",
    status: "NEEDS_CORRECTION",
    depositStatus: "SUBMITTED",
    depositAmount: 100000,
    idType: "National ID (NIDA)",
    idNumber: "19940622-66601-00042-27",
    issuedPlace: "Zanzibar",
    issuedDate: "2019-11-03",
    expireDate: "2027-11-03",
    gender: "Female",
    country: "Tanzania",
    province: "Zanzibar Urban",
    district: "Mjini",
    ward: "Shangani",
    street: "Malindi Road",
    houseNumber: "5",
    lat: -6.1659,
    lng: 39.1988,
    submittedAt: "2024-04-26T13:20:00",
    daysPending: 12,
    documents: documentSet({ tin: { status: "rejected", reason: "TIN number does not match NIDA records — verify and re-submit." } }),
    fieldsComplete: 11,
    fieldsTotal: 12,
    timeline: [
      { id: "t2", actor: "Michael Manager", action: "Requested correction", detail: "TIN number mismatch", timestamp: "12 days ago" },
      { id: "t1", actor: "System", action: "Flagged: Signature Invalid", timestamp: "12 days ago" },
    ],
  },
  {
    id: "app-8862",
    appNumber: "APP-8862-TZ",
    agentName: "Amina Chande",
    phone: "+255 713 990 221",
    email: "a.chande@kinetic.co.tz",
    channel: "Airtel Money",
    channelParentType: "Master Agent",
    channelParentName: "Airtel Money HQ",
    channelManagerType: "Regional Supervisor",
    channelManagerName: "Peter Massawe",
    channelType: "Pharmacy",
    sector: "Pharmacy",
    status: "NEEDS_CORRECTION",
    depositStatus: "PENDING",
    depositAmount: 100000,
    idType: "National ID (NIDA)",
    idNumber: "19760815-77701-00063-33",
    issuedPlace: "Arusha",
    issuedDate: "2014-06-01",
    expireDate: "2024-06-01",
    gender: "Female",
    country: "Tanzania",
    province: "Arusha",
    district: "Arusha City",
    ward: "Kaloleni",
    street: "Sokoine Road",
    houseNumber: "9",
    lat: -3.3696,
    lng: 36.6822,
    submittedAt: "2024-04-28T09:40:00",
    daysPending: 9,
    documents: documentSet({ id_front: { status: "rejected", reason: "ID has expired. Upload a valid, unexpired National ID." } }),
    fieldsComplete: 9,
    fieldsTotal: 12,
    timeline: [
      { id: "t2", actor: "Sarah Admin", action: "Requested correction", detail: "National ID expired", timestamp: "9 days ago" },
      { id: "t1", actor: "System", action: "Flagged: ID Expired", timestamp: "9 days ago" },
    ],
  },
]

export const dashboardStats = {
  totalApps: 1482,
  pending: 345,
  inProgress: 892,
  needsCorrection: 56,
  completed: 180,
  rejected: 9,
}

export const needsAttention = applications
  .filter((a) => a.status === "NEEDS_CORRECTION" || a.status === "PENDING_REVIEW")
  .map((a) => ({
    id: a.id,
    appNumber: a.appNumber,
    agentName: a.agentName,
    status:
      a.status === "NEEDS_CORRECTION"
        ? a.documents.some((d) => d.status === "missing")
          ? "Docs Missing"
          : a.documents.some((d) => d.type === "id_front" && d.status === "unverified")
            ? "ID Expired"
            : "Signature Invalid"
        : "Awaiting Review",
    daysPending: a.daysPending,
  }))
  .sort((a, b) => b.daysPending - a.daysPending)

export const recentActivity: TimelineEvent[] = [
  { id: "a1", actor: "Sarah Admin", action: "updated status of APP-9012-TZ", detail: "Status: In Progress", timestamp: "2 mins ago" },
  { id: "a2", actor: "System", action: "processed batch upload BATCH-449", detail: "50 records processed", timestamp: "15 mins ago" },
  { id: "a3", actor: "Automated Check", action: "flagged APP-8999-TZ", detail: "Reason: Duplicate ID detected", timestamp: "1 hr ago" },
  { id: "a4", actor: "John Doe", action: "created new application APP-9015-TZ", detail: "Source: Field App", timestamp: "2 hrs ago" },
  { id: "a5", actor: "Sarah Admin", action: "approved APP-8950-TZ", detail: "Status: Completed", timestamp: "3 hrs ago" },
  { id: "a6", actor: "Michael Manager", action: "added a note to APP-8888-TZ", detail: "Note: Requires escalated review", timestamp: "4 hrs ago" },
]

export interface Agent {
  id: string
  name: string
  agentId: string
  phone: string
  email: string
  channel: "Retail Partner" | "Direct Sales" | "Third-Party"
  apps: number
  status: "Active" | "Suspended" | "Pending"
  joined: string
}

export const agents: Agent[] = [
  { id: "1", name: "Juma Mushi", agentId: "AGT-492", phone: "+255 754 123 456", email: "j.mushi@kinetic.co.tz", channel: "Retail Partner", apps: 3, status: "Active", joined: "Oct 12, 2023" },
  { id: "2", name: "Amina Said", agentId: "AGT-381", phone: "+255 713 987 654", email: "a.said@kinetic.co.tz", channel: "Direct Sales", apps: 2, status: "Active", joined: "Nov 05, 2023" },
  { id: "3", name: "Daniel Kimaro", agentId: "AGT-512", phone: "+255 784 555 111", email: "d.kimaro@vendor.tz", channel: "Third-Party", apps: 0, status: "Suspended", joined: "Jan 22, 2024" },
  { id: "4", name: "Fatma Ali", agentId: "AGT-102", phone: "+255 655 222 333", email: "f.ali@kinetic.co.tz", channel: "Retail Partner", apps: 1, status: "Active", joined: "Mar 10, 2022" },
  { id: "5", name: "Hassan Nuhu", agentId: "AGT-677", phone: "+255 766 444 888", email: "h.nuhu@kinetic.co.tz", channel: "Direct Sales", apps: 1, status: "Active", joined: "Feb 14, 2024" },
  { id: "6", name: "Mariam Juma", agentId: "AGT-890", phone: "+255 715 000 999", email: "m.juma@vendor.tz", channel: "Third-Party", apps: 0, status: "Pending", joined: "May 01, 2024" },
  { id: "7", name: "Kigoma Traders Ltd", agentId: "AGT-233", phone: "+255 788 555 222", email: "info@kigomatraders.tz", channel: "Third-Party", apps: 1, status: "Suspended", joined: "Sep 02, 2023" },
  { id: "8", name: "Mwanza City Agents", agentId: "AGT-771", phone: "+255 765 444 333", email: "mwanza.city@kinetic.co.tz", channel: "Retail Partner", apps: 1, status: "Active", joined: "Jul 19, 2023" },
]

export const sectorBreakdown = [
  { sector: "Agriculture", value: 45, count: 6393 },
  { sector: "Retail", value: 30, count: 4262 },
  { sector: "Services", value: 15, count: 2131 },
  { sector: "Manufacturing", value: 10, count: 1422 },
]

export const channelBreakdown = [
  { channel: "Agent Network", value: 60, count: 8524 },
  { channel: "Web Portal", value: 25, count: 3552 },
  { channel: "USSD / Mobile", value: 10, count: 1420 },
  { channel: "Branch Walk-in", value: 5, count: 712 },
]

export const monthlyVolume = [
  { month: "Jan", submitted: 1800, inReview: 900, approved: 1200, rejected: 90 },
  { month: "Feb", submitted: 2100, inReview: 1100, approved: 1400, rejected: 110 },
  { month: "Mar", submitted: 2400, inReview: 1300, approved: 1650, rejected: 95 },
  { month: "Apr", submitted: 2000, inReview: 1050, approved: 1500, rejected: 80 },
  { month: "May", submitted: 2600, inReview: 1400, approved: 1800, rejected: 120 },
]

export function formatCurrencyTZS(amount: number) {
  return `TZS ${amount.toLocaleString("en-US")}`
}

export function getApplicationById(id: string) {
  return applications.find((a) => a.id === id)
}

export type HealthTone = "healthy" | "attention" | "critical" | "neutral"

export interface CaseHealth {
  /** Percentage of required application fields completed. */
  appPercent: number
  fieldsComplete: number
  fieldsTotal: number
  docsVerified: number
  docsTotal: number
  docsPending: number
  docsRejected: number
  docsMissing: number
  /** Documents the agent must act on (rejected + missing). */
  corrections: number
  depositCleared: boolean
  /** Overall traffic-light state for the case. */
  tone: HealthTone
  /** The single most important thing to do next, agent-facing. */
  nextAction: { label: string; href: string }
}

/**
 * Derives a single "case file" health summary from an application so both the
 * agent and admin views can answer: Where am I? What's missing? What's next?
 */
export function computeCaseHealth(app: Application): CaseHealth {
  const docsTotal = app.documents.length
  const docsVerified = app.documents.filter((d) => d.status === "verified").length
  const docsPending = app.documents.filter((d) => d.status === "unverified").length
  const docsRejected = app.documents.filter((d) => d.status === "rejected").length
  const docsMissing = app.documents.filter((d) => d.status === "missing").length
  const corrections = docsRejected + docsMissing
  const appPercent = app.fieldsTotal === 0 ? 0 : Math.round((app.fieldsComplete / app.fieldsTotal) * 100)
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
    nextAction = { label: `Fix ${problemDoc.name}`, href: "/agent/documents" }
  } else if (!depositCleared) {
    nextAction = { label: "Complete your deposit", href: `/agent/applications/${app.id}` }
  } else if (appPercent < 100) {
    nextAction = { label: "Complete your application", href: `/agent/applications/${app.id}` }
  } else {
    nextAction = { label: "Track review status", href: `/agent/applications/${app.id}` }
  }

  return {
    appPercent,
    fieldsComplete: app.fieldsComplete,
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

export const auditLog: AuditLogEntry[] = [
  { id: "log-001", actor: "Sarah Admin", actorRole: "Super Administrator", category: "Application", severity: "info", action: "Updated status", detail: "Status changed to In Progress", target: "APP-9012-TZ", ipAddress: "196.41.12.88", timestamp: "2026-08-14T09:42:00Z" },
  { id: "log-002", actor: "System", actorRole: "Automation", category: "System", severity: "info", action: "Processed batch upload", detail: "BATCH-449 — 50 records processed", target: "BATCH-449", ipAddress: "10.0.4.12", timestamp: "2026-08-14T09:27:00Z" },
  { id: "log-003", actor: "Automated Check", actorRole: "Fraud Engine", category: "Security", severity: "critical", action: "Flagged duplicate ID", detail: "National ID matches an existing active application", target: "APP-8999-TZ", ipAddress: "10.0.4.19", timestamp: "2026-08-14T08:44:00Z" },
  { id: "log-004", actor: "John Doe", actorRole: "Field Agent", category: "Application", severity: "info", action: "Created application", detail: "Submitted via Field App", target: "APP-9015-TZ", ipAddress: "196.41.55.201", timestamp: "2026-08-14T07:58:00Z" },
  { id: "log-005", actor: "Sarah Admin", actorRole: "Super Administrator", category: "Application", severity: "info", action: "Approved application", detail: "Status changed to Completed", target: "APP-8950-TZ", ipAddress: "196.41.12.88", timestamp: "2026-08-14T06:15:00Z" },
  { id: "log-006", actor: "Michael Manager", actorRole: "Regional Manager", category: "Application", severity: "info", action: "Added review note", detail: "Requires escalated review before approval", target: "APP-8888-TZ", ipAddress: "196.41.30.14", timestamp: "2026-08-14T05:03:00Z" },
  { id: "log-007", actor: "Daniel Kimaro", actorRole: "Third-Party Agent", category: "Agent", severity: "warning", action: "Account suspended", detail: "Suspended after 3 rejected submissions", target: "AGT-512", ipAddress: "196.41.88.77", timestamp: "2026-08-13T22:31:00Z" },
  { id: "log-008", actor: "System", actorRole: "Automation", category: "Document", severity: "warning", action: "Document expiring soon", detail: "National ID expires within 30 days", target: "APP-8765-TZ", ipAddress: "10.0.4.12", timestamp: "2026-08-13T20:12:00Z" },
  { id: "log-009", actor: "Sarah Admin", actorRole: "Super Administrator", category: "Security", severity: "warning", action: "Failed login attempt", detail: "3rd consecutive failed attempt, account temporarily locked", target: "admin@kinetic.co.tz", ipAddress: "41.90.12.4", timestamp: "2026-08-13T18:47:00Z" },
  { id: "log-010", actor: "Amina Said", actorRole: "Direct Sales Agent", category: "Document", severity: "info", action: "Uploaded document", detail: "Proof of address re-submitted", target: "APP-8712-TZ", ipAddress: "196.41.60.9", timestamp: "2026-08-13T16:20:00Z" },
  { id: "log-011", actor: "Michael Manager", actorRole: "Regional Manager", category: "Agent", severity: "info", action: "Onboarded new agent", detail: "Retail Partner agreement signed", target: "AGT-902", ipAddress: "196.41.30.14", timestamp: "2026-08-13T14:05:00Z" },
  { id: "log-012", actor: "System", actorRole: "Automation", category: "System", severity: "critical", action: "Sync failure", detail: "Core banking sync failed after 3 retries", target: "SYNC-CORE-01", ipAddress: "10.0.4.12", timestamp: "2026-08-13T11:52:00Z" },
  { id: "log-013", actor: "Sarah Admin", actorRole: "Super Administrator", category: "Application", severity: "info", action: "Rejected application", detail: "Reason: Ineligible sector code", target: "APP-8601-TZ", ipAddress: "196.41.12.88", timestamp: "2026-08-13T10:18:00Z" },
  { id: "log-014", actor: "Automated Check", actorRole: "Fraud Engine", category: "Security", severity: "critical", action: "Flagged velocity anomaly", detail: "5 applications submitted from one device in 10 minutes", target: "AGT-771", ipAddress: "196.41.99.3", timestamp: "2026-08-12T23:40:00Z" },
  { id: "log-015", actor: "John Doe", actorRole: "Field Agent", category: "Document", severity: "info", action: "Verified document", detail: "Signature card manually verified", target: "APP-8544-TZ", ipAddress: "196.41.55.201", timestamp: "2026-08-12T21:09:00Z" },
]
