import type { Application, AuditLogEntry, Document, TimelineEvent } from "@/lib/admin-data"
import type { AgentNotification } from "@/lib/agent-data"
import type { Database } from "@/lib/backend/database.types"

type AppRow = Database["public"]["Tables"]["applications"]["Row"]
type DocRow = Database["public"]["Tables"]["documents"]["Row"]
type HistoryRow = Database["public"]["Tables"]["status_history"]["Row"]
type DepositRow = Database["public"]["Tables"]["deposit_records"]["Row"]
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"]
type AuditRow = Database["public"]["Tables"]["audit_logs"]["Row"]
type DocumentTypeRow = Database["public"]["Tables"]["document_types"]["Row"]

function fileTypeFromMime(mime: string | null, extension: string | null): Document["fileType"] {
  if (mime === "application/pdf" || extension === "pdf") return "pdf"
  return "image"
}

function mapDepositStatus(status?: string | null): Application["depositStatus"] {
  if (status === "VERIFIED" || status === "CLEARED") return "CLEARED"
  if (status === "SUBMITTED" || status === "REJECTED" || status === "AWAITING_PROOF") return status
  return "PENDING"
}

export function mapDocument(row: DocRow, types?: DocumentTypeRow[]): Document {
  const label = types?.find((t) => t.code === row.document_type)?.name ?? row.document_type
  return {
    id: row.id,
    name: label,
    type: row.document_type,
    status: row.status,
    verifiedBy: row.verified_by ?? undefined,
    fileType: fileTypeFromMime(row.mime_type, row.file_extension),
    fileExtension: row.file_extension ?? undefined,
    reason: row.rejection_reason ?? undefined,
    required: types?.find((t) => t.code === row.document_type)?.required,
    originalName: row.original_name ?? undefined,
    storedFileName: row.storage_key?.split("/").pop() || undefined,
    adminUploaded: Boolean(row.admin_uploaded),
  }
}

export function mapTimeline(row: HistoryRow): TimelineEvent {
  return {
    id: row.id,
    actor: row.changed_by ?? "System",
    action: row.note || `moved application to ${row.new_status}`,
    timestamp: row.created_at,
  }
}

export function mapApplication(
  row: AppRow,
  extras: {
    documents: DocRow[]
    timeline: HistoryRow[]
    deposit?: DepositRow | null
    channelName?: string
    sectorName?: string
    documentTypes?: DocumentTypeRow[]
  },
): Application {
  const daysPending = row.submitted_at
    ? Math.max(0, Math.floor((Date.now() - new Date(row.submitted_at).getTime()) / 86_400_000))
    : 0

  return {
    id: row.id,
    agentId: row.agent_id,
    appNumber: row.application_number ?? "DRAFT",
    agentName: row.agent_name ?? "",
    tinNumber: row.tin_number ?? undefined,
    businessName: row.business_name ?? undefined,
    phone: row.phone ?? "",
    email: row.email ?? "",
    channel: extras.channelName ?? "",
    channelParentType: row.channel_parent_type ?? "",
    channelParentName: row.channel_parent_name ?? "",
    channelManagerType: row.channel_manager_type ?? "",
    channelManagerName: row.channel_manager_name ?? "",
    channelType: row.channel_type ?? "",
    sector: extras.sectorName ?? "",
    channelId: row.channel_id ?? undefined,
    sectorId: row.sector_id ?? undefined,
    status: row.status,
    depositStatus: mapDepositStatus(extras.deposit?.status),
    depositAmount: Number(extras.deposit?.amount ?? 100000),
    depositReference: extras.deposit?.reference ?? undefined,
    depositVerifiedAt: extras.deposit?.verified_at ?? undefined,
    idType: row.id_type ?? "",
    idNumber: row.id_number ?? "",
    issuedPlace: row.issued_place ?? "",
    issuedDate: row.issued_date ?? "",
    expireDate: row.expire_date ?? "",
    gender: row.gender ?? "",
    country: row.country ?? "Tanzania",
    province: row.province ?? "",
    district: row.district ?? "",
    ward: row.ward ?? "",
    street: row.street ?? "",
    houseNumber: row.house_number ?? "",
    lat: Number(row.lat ?? 0),
    lng: Number(row.lng ?? 0),
    locationCapturedAt: row.location_captured_at ?? undefined,
    submittedAt: row.submitted_at ?? row.created_at,
    daysPending,
    documents: extras.documents.map((doc) => mapDocument(doc, extras.documentTypes)),
    timeline: extras.timeline.map(mapTimeline),
    fieldsComplete: row.fields_complete,
    fieldsTotal: row.fields_total,
  }
}

export function mapNotification(row: NotificationRow): AgentNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    detail: row.message,
    timestamp: row.created_at,
    read: Boolean(row.read_at),
  }
}

export function mapAudit(row: AuditRow): AuditLogEntry {
  return {
    id: row.id,
    actor: row.actor_id ?? "System",
    actorRole: row.actor_role ?? "System",
    category: row.category,
    severity: row.severity,
    action: row.action,
    detail: row.detail,
    target: row.target ?? "",
    ipAddress: row.ip_address ?? "",
    timestamp: row.created_at,
  }
}

export function copyAllDetails(app: Application) {
  return [
    `Agent Name: ${app.agentName}`,
    `Registered Phone: ${app.phone}`,
    `Business Sector: ${app.sector}`,
    `Channel: ${app.channel}`,
    `ID Type: ${app.idType}`,
    `ID Number: ${app.idNumber}`,
    `TIN: ${app.tinNumber ?? ""}`,
    `Country: ${app.country}`,
    `Region: ${app.province}`,
    `District: ${app.district}`,
    `Ward: ${app.ward}`,
    `Location: ${[app.street, app.houseNumber].filter(Boolean).join(", ")}`,
    `Latitude: ${app.lat}`,
    `Longitude: ${app.lng}`,
  ].join("\n")
}
