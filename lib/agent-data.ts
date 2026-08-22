import type { AppStatus, Document } from "@/lib/admin-data"

export interface AgentProfile {
  id: string
  fullName: string
  agentIdNumber: string
  email: string
  phone: string
  role: string
  memberSince: string
  avatarInitials: string
  applicationStatus: AppStatus
  verified: boolean
  lifecycleStatus: "Active" | "Suspended" | "Pending"
}

export type NotificationCategory = "application" | "document" | "deposit" | "system"

export interface AgentNotification {
  id: string
  category: NotificationCategory
  title: string
  detail: string
  timestamp: string
  read: boolean
  entityType?: string | null
  entityId?: string | null
}

export function notificationHref(item: AgentNotification, portal: "agent" | "admin") {
  if (item.entityType === "application" && item.entityId) {
    return portal === "admin" ? `/admin/applications/${item.entityId}` : `/agent/applications/${item.entityId}`
  }
  return portal === "admin" ? "/admin/applications" : "/agent/applications"
}

export function documentChecklistProgress(documents: Document[]) {
  const total = documents.length
  const uploaded = documents.filter((d) => d.status !== "missing").length
  return { uploaded, total, percent: total === 0 ? 0 : Math.round((uploaded / total) * 100) }
}

export type { AppStatus }
