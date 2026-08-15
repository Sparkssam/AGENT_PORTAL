// Mock data layer for the Kinetic Agent Portal.
// Represents the self-service view for a single logged-in agent — their
// profile, application, document checklist, and notifications. Reuses the
// same Application/status types as the admin portal so both sides of the
// product agree on one data model.

import type { Application, AppStatus, DepositStatus, Document, TimelineEvent } from "@/lib/admin-data"

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
}

export const currentAgent: AgentProfile = {
  id: "agent-amina",
  fullName: "Amina Joseph Mwakalinga",
  agentIdNumber: "AG-2026-00842",
  email: "amina.mwakalinga@kinetic.co.tz",
  phone: "+255 712 345 678",
  role: "Registered Agent",
  memberSince: "2026-06-12",
  avatarInitials: "AM",
  applicationStatus: "IN_PROGRESS",
  verified: true,
}

const requiredDocuments: Document[] = [
  {
    id: "doc-1",
    name: "National ID Card (Front)",
    type: "id_front",
    status: "verified",
    verifiedBy: "System OCR",
    fileType: "image",
    previewUrl: "/documents/id-front-sample.png",
  },
  {
    id: "doc-2",
    name: "National ID Card (Back)",
    type: "id_back",
    status: "verified",
    verifiedBy: "System OCR",
    fileType: "image",
    previewUrl: "/documents/id-front-sample.png",
  },
  {
    id: "doc-3",
    name: "Tax Identification Number (TIN)",
    type: "tin",
    status: "verified",
    verifiedBy: "Sarah Admin",
    fileType: "pdf",
  },
  {
    id: "doc-4",
    name: "Business License",
    type: "licence",
    status: "missing",
    fileType: "pdf",
  },
]

export const currentApplication: Application = {
  id: "app-2023-8942",
  appNumber: "APP-2023-8942",
  agentName: currentAgent.fullName,
  businessName: "Mwakalinga Mobile Money Kiosk",
  phone: currentAgent.phone,
  email: currentAgent.email,
  channel: "M-Pesa",
  channelParentType: "Master Agent",
  channelParentName: "Vodacom M-Pesa",
  channelManagerType: "Regional Supervisor",
  channelManagerName: "Grace Mwenda",
  channelType: "Retail Kiosk",
  sector: "Retail Kiosk",
  status: "IN_PROGRESS",
  depositStatus: "CLEARED",
  depositAmount: 100000,
  depositReference: "MPESA-4A2E19",
  idType: "National ID (NIDA)",
  idNumber: "19900318-11101-00042-26",
  issuedPlace: "Dar es Salaam",
  issuedDate: "2020-01-15",
  expireDate: "2028-01-15",
  gender: "Female",
  country: "Tanzania",
  province: "Dar es Salaam",
  district: "Kinondoni",
  ward: "Oyster Bay",
  street: "Toure Drive",
  houseNumber: "Plot 45",
  lat: -6.7785,
  lng: 39.2743,
  submittedAt: "2026-08-12T09:12:00",
  daysPending: 2,
  documents: requiredDocuments,
  fieldsComplete: 11,
  fieldsTotal: 12,
  timeline: [
    { id: "t1", actor: "Admin User", action: "moved application to In Progress", timestamp: "2 hours ago" },
    { id: "t2", actor: "System", action: "Verified deposit reference MPESA-4A2E19", timestamp: "1 day ago" },
    { id: "t3", actor: "System", action: "OCR verification passed for National ID", timestamp: "2 days ago" },
    { id: "t4", actor: "Amina Joseph Mwakalinga", action: "submitted application", timestamp: "2 days ago" },
  ],
}

export type NotificationCategory = "application" | "document" | "deposit" | "system"

export interface AgentNotification {
  id: string
  category: NotificationCategory
  title: string
  detail: string
  timestamp: string
  read: boolean
}

export const notifications: AgentNotification[] = [
  {
    id: "n1",
    category: "application",
    title: "Application moved to In Progress",
    detail: "Your application APP-2023-8942 is now being reviewed by the central team.",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    category: "document",
    title: "Business License still required",
    detail: "Upload your Business License to complete your document checklist.",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "n3",
    category: "deposit",
    title: "Deposit verified",
    detail: "Your refundable deposit of TZS 100,000 (MPESA-4A2E19) has been cleared.",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "n4",
    category: "document",
    title: "National ID verified",
    detail: "Both sides of your National ID Card passed automatic verification.",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "n5",
    category: "system",
    title: "Welcome to the Agent Portal",
    detail: "Your account was created successfully. Complete your application to get started.",
    timestamp: "2 days ago",
    read: true,
  },
]

export const recentAgentActivity: TimelineEvent[] = [
  { id: "a1", actor: "System", action: "verified your deposit reference", detail: "MPESA-4A2E19", timestamp: "1 day ago" },
  { id: "a2", actor: "You", action: "uploaded Tax Identification Number", timestamp: "2 days ago" },
  { id: "a3", actor: "You", action: "submitted application APP-2023-8942", timestamp: "2 days ago" },
  { id: "a4", actor: "You", action: "updated profile details", timestamp: "3 days ago" },
]

export function documentChecklistProgress(documents: Document[]) {
  const total = documents.length
  const uploaded = documents.filter((d) => d.status !== "missing").length
  return { uploaded, total, percent: total === 0 ? 0 : Math.round((uploaded / total) * 100) }
}

export function unreadNotificationCount() {
  return notifications.filter((n) => !n.read).length
}

export type { AppStatus, DepositStatus }
