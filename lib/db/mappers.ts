import type { AgentNotification } from "@/lib/agent-data"
import type { Application, AuditLogEntry, Document, TimelineEvent } from "@/lib/admin-data"
import type { Prisma } from "@prisma/client"

function fileTypeFromMime(mime: string | null, extension: string | null): Document["fileType"] {
  if (mime === "application/pdf" || extension === "pdf") return "pdf"
  return "image"
}

function iso(value: Date | string | null | undefined) {
  if (!value) return ""
  return value instanceof Date ? value.toISOString() : value
}

function mapDepositStatus(status?: string | null): Application["depositStatus"] {
  if (status === "VERIFIED" || status === "CLEARED") return "CLEARED"
  if (status === "SUBMITTED" || status === "REJECTED" || status === "AWAITING_PROOF") return status
  return "PENDING"
}

type PrismaDocument = Prisma.DocumentGetPayload<{ include: { type: true } }>

function extractedString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined
}

export function mapPrismaDocument(
  doc: PrismaDocument,
  latest?: {
    passed: boolean
    issues: string[]
    extracted: unknown
    confidence: Prisma.Decimal | number
  } | null,
): Document {
  const extracted = latest?.extracted && typeof latest.extracted === "object" && !Array.isArray(latest.extracted)
    ? (latest.extracted as Record<string, unknown>)
    : {}
  return {
    id: doc.id,
    name: doc.type?.name ?? doc.documentType,
    type: doc.documentType,
    status: doc.status,
    verifiedBy: doc.verifiedById ?? undefined,
    fileType: fileTypeFromMime(doc.mimeType, doc.fileExtension),
    fileExtension: doc.fileExtension ?? undefined,
    reason: doc.rejectionReason ?? undefined,
    required: doc.type?.required,
    originalName: doc.originalName ?? undefined,
    fileSize: doc.fileSize != null ? Number(doc.fileSize) : undefined,
    mimeType: doc.mimeType ?? undefined,
    verificationPassed: latest ? latest.passed : undefined,
    verificationIssues: latest?.issues?.length ? latest.issues : undefined,
    verificationConfidence: latest ? Number(latest.confidence) : undefined,
    extractedName: extractedString(extracted.fullName),
    extractedIdNumber: extractedString(extracted.idNumber),
    extractedDob: extractedString(extracted.dateOfBirth),
    extractedExpiry: extractedString(extracted.expiryDate),
  }
}

type PrismaHistory = Prisma.StatusHistoryGetPayload<{
  include: { changedBy: { select: { fullName: true } } }
}>

export function mapPrismaTimeline(row: PrismaHistory | Prisma.StatusHistoryGetPayload<object>): TimelineEvent {
  const actorName =
    "changedBy" in row && row.changedBy && typeof row.changedBy === "object" && "fullName" in row.changedBy
      ? String(row.changedBy.fullName || "").trim()
      : ""
  return {
    id: row.id,
    actor: actorName || "System",
    action: row.note || `moved application to ${row.newStatus}`,
    timestamp: iso(row.createdAt),
  }
}

export type PrismaApplicationBundle = Prisma.ApplicationGetPayload<{
  include: {
    documents: { include: { type: true } }
    statusHistory: { include: { changedBy: { select: { fullName: true } } } }
    deposit: true
    channel: true
    sector: true
    correctionRequests: { include: { items: true } }
  }
}>

export function mapPrismaApplication(row: PrismaApplicationBundle): Application {
  const submittedAt = iso(row.submittedAt) || iso(row.createdAt)
  const daysPending = row.submittedAt
    ? Math.max(0, Math.floor((Date.now() - row.submittedAt.getTime()) / 86_400_000))
    : 0

  return {
    id: row.id,
    agentId: row.agentId,
    appNumber: row.applicationNumber ?? "DRAFT",
    agentName: row.agentName ?? "",
    tinNumber: row.tinNumber ?? undefined,
    businessName: row.businessName ?? undefined,
    phone: row.phone ?? "",
    email: row.email ?? "",
    channel: row.channel?.name ?? "",
    channelParentType: row.channelParentType ?? "",
    channelParentName: row.channelParentName ?? "",
    channelManagerType: row.channelManagerType ?? "",
    channelManagerName: row.channelManagerName ?? "",
    channelType: row.channelType ?? "",
    sector: row.sector?.name ?? "",
    channelId: row.channelId ?? undefined,
    sectorId: row.sectorId ?? undefined,
    status: row.status,
    depositStatus: mapDepositStatus(row.deposit?.status),
    depositAmount: Number(row.deposit?.amount ?? 100000),
    depositReference: row.deposit?.reference ?? undefined,
    depositVerifiedAt: iso(row.deposit?.verifiedAt) || undefined,
    idType: row.idType ?? "",
    idNumber: row.idNumber ?? "",
    issuedPlace: row.issuedPlace ?? "",
    issuedDate: iso(row.issuedDate),
    expireDate: iso(row.expireDate),
    gender: row.gender ?? "",
    country: row.country ?? "Tanzania",
    province: row.province ?? "",
    district: row.district ?? "",
    ward: row.ward ?? "",
    street: row.street ?? "",
    houseNumber: row.houseNumber ?? "",
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    locationCapturedAt: iso(row.locationCapturedAt) || undefined,
    submittedAt,
    daysPending,
    documents: row.documents.map((doc) => mapPrismaDocument(doc)),
    timeline: [...row.statusHistory]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(mapPrismaTimeline),
    corrections: (row.correctionRequests?.[0]?.items ?? []).map((item) => ({
      id: item.id,
      kind: item.kind,
      target: item.target,
      reason: item.reason,
    })),
    correctionSummary: row.correctionRequests?.[0]?.summary || undefined,
    fieldsComplete: row.fieldsComplete,
    fieldsTotal: row.fieldsTotal,
  }
}

export function mapPrismaNotification(row: {
  id: string
  category: AgentNotification["category"]
  title: string
  message: string
  createdAt: Date
  readAt: Date | null
}): AgentNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    detail: row.message,
    timestamp: iso(row.createdAt),
    read: Boolean(row.readAt),
  }
}

export function mapPrismaAudit(row: {
  id: string
  actorId: string | null
  actorRole: string | null
  category: AuditLogEntry["category"]
  severity: AuditLogEntry["severity"]
  action: string
  detail: string
  target: string | null
  ipAddress: string | null
  createdAt: Date
}): AuditLogEntry {
  return {
    id: row.id,
    actor: row.actorId ?? "System",
    actorRole: row.actorRole ?? "System",
    category: row.category,
    severity: row.severity,
    action: row.action,
    detail: row.detail,
    target: row.target ?? "",
    ipAddress: row.ipAddress ?? "",
    timestamp: iso(row.createdAt),
  }
}
