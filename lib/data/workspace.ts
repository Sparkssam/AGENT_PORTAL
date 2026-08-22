import type { Agent, Application, AppStatus, AuditLogEntry } from "@/lib/admin-data"
import { type AgentProfile, type AgentNotification } from "@/lib/agent-data"
import { isSupabaseConfigured, isPrismaConfigured } from "@/lib/backend/env"
import { listApplications, getApplication, listApplicationSummaries } from "@/lib/actions/applications"
import { getOwnAgent, listAgents } from "@/lib/actions/agents"
import { listNotifications } from "@/lib/actions/notifications"
import { dashboardStats, volumeByMonth, breakdowns, attentionQueue, averageDaysPending } from "@/lib/actions/reports"
import { listAudit } from "@/lib/actions/audit"
import { cache } from "react"
import { primaryApplicationStatus } from "@/lib/domain"
import {
  CHANNEL_MANAGER_NAME,
  CHANNEL_PARENT_NAME,
  CHANNEL_PARENT_TYPE,
  CHANNEL_TIER,
} from "@/lib/lookups/catalog"

const commercialLabel: Record<string, Agent["channel"]> = {
  retail_partner: "Retail Partner",
  direct_sales: "Direct Sales",
  third_party: "Third-Party",
}

const lifecycleLabel: Record<string, Agent["status"]> = {
  active: "Active",
  pending: "Pending",
  suspended: "Suspended",
}

const emptyDocTypes: Array<{ type: string; name: string; fileType: "image" | "pdf" }> = [
  { type: "id_front", name: "National ID Card (Front)", fileType: "image" },
  { type: "id_back", name: "National ID Card (Back)", fileType: "image" },
  { type: "tin", name: "Tax Identification Number (TIN)", fileType: "pdf" },
  { type: "portrait", name: "Portrait / Passport Photo", fileType: "image" },
  { type: "shop_image", name: "Shop Image", fileType: "image" },
  { type: "contract", name: "Agreement Contract", fileType: "pdf" },
  { type: "licence", name: "Business Licence", fileType: "pdf" },
  { type: "other", name: "Other", fileType: "pdf" },
]

const IN_FLIGHT_STATUSES: AppStatus[] = ["SUBMITTED", "PENDING_REVIEW", "IN_PROGRESS"]

export function findEditableApplication(apps: Application[]) {
  return apps.find((app) => app.status === "DRAFT") ?? apps.find((app) => app.status === "NEEDS_CORRECTION")
}

export function findInFlightApplication(apps: Application[]) {
  return apps.find((app) => IN_FLIGHT_STATUSES.includes(app.status))
}

export function isNewApplicant(apps: Application[]) {
  return apps.length === 0 || apps.every((app) => app.status === "DRAFT")
}

export type WorkspaceMode = "live" | "setup"

function setupFrom(error: unknown) {
  const raw = error instanceof Error ? error.message : "Backend is not ready"
  if (/can't reach database server|timed out|P1001/i.test(raw)) {
    return {
      mode: "setup" as const,
      message:
        "Cannot reach Postgres. Prisma needs the Supabase session pooler on port 5432 with sslmode=require (not the transaction pooler on 6543). Confirm DATABASE_URL and DIRECT_URL, and that the project is not paused.",
    }
  }
  if (/does not exist|schema cache|P2021|relation .* does not exist/i.test(raw)) {
    return {
      mode: "setup" as const,
      message:
        "Supabase is configured but the schema is missing. Apply SQL in order from .env.example (init, seed, storage, mutation_guards, document_verifications, business_sectors, document_admin_upload).",
    }
  }
  return { mode: "setup" as const, message: raw }
}

function emptyAgent(): AgentProfile {
  return {
    id: "",
    fullName: "",
    agentIdNumber: "",
    email: "",
    phone: "",
    role: "Registered Agent",
    memberSince: new Date().toISOString().slice(0, 10),
    avatarInitials: "AG",
    applicationStatus: "DRAFT",
    verified: false,
    lifecycleStatus: "Pending",
  }
}

export function emptyApplication(agent: AgentProfile): Application {
  return {
    id: "draft",
    agentId: agent.id,
    agentCode: agent.agentIdNumber,
    appNumber: "DRAFT",
    agentName: agent.fullName,
    phone: agent.phone,
    email: agent.email,
    businessName: agent.fullName,
    channel: "",
    channelParentType: CHANNEL_PARENT_TYPE,
    channelParentName: CHANNEL_PARENT_NAME,
    channelManagerType: "",
    channelManagerName: CHANNEL_MANAGER_NAME,
    channelType: CHANNEL_TIER,
    sector: "",
    status: "DRAFT",
    depositStatus: "PENDING",
    depositAmount: 100000,
    idType: "",
    idNumber: "",
    issuedPlace: "",
    issuedDate: "",
    expireDate: "",
    gender: "",
    country: "Tanzania",
    province: "",
    district: "",
    ward: "",
    street: "",
    houseNumber: "",
    lat: 0,
    lng: 0,
    submittedAt: new Date().toISOString(),
    daysPending: 0,
    documents: emptyDocTypes.map((doc) => ({
      id: `missing-${doc.type}`,
      name: doc.name,
      type: doc.type,
      status: "missing" as const,
      fileType: doc.fileType,
      required: doc.type !== "licence" && doc.type !== "other",
    })),
    timeline: [],
    fieldsComplete: 0,
    fieldsTotal: 19,
  }
}

function emptyAdminWorkspace(message?: string) {
  return {
    mode: "setup" as const,
    message,
    applications: [] as Application[],
    agents: [] as Agent[],
    stats: {
      totalApps: 0,
      pending: 0,
      submitted: 0,
      inProgress: 0,
      needsCorrection: 0,
      completed: 0,
      rejected: 0,
      approvalRate: 0,
    },
    needsAttention: [] as { id: string; appNumber: string; agentName: string; status: string; daysPending: number }[],
    recentActivity: [] as { id: string; actor: string; action: string; detail?: string; timestamp: string }[],
    auditLog: [] as AuditLogEntry[],
    monthlyVolume: [] as { month: string; submitted: number; inReview: number; approved: number; rejected: number }[],
    sectorBreakdown: [] as { sector: string; value: number; count: number }[],
    channelBreakdown: [] as { channel: string; value: number; count: number }[],
    avgDays: 0,
  }
}

function mapAgentProfile(
  rawAgent: Awaited<ReturnType<typeof getOwnAgent>>,
  status: AppStatus = "DRAFT",
  verified = false,
): AgentProfile {
  const profile = rawAgent.profile
  return {
    id: rawAgent.id,
    fullName: profile.fullName || "",
    agentIdNumber: rawAgent.agentCode ?? "Pending",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    role: profile.title ?? "Registered Agent",
    memberSince: rawAgent.memberSince.toISOString().slice(0, 10),
    avatarInitials: profile.initials ?? "AG",
    applicationStatus: status,
    verified: Boolean(rawAgent.verified) || verified || status === "COMPLETED",
    lifecycleStatus: lifecycleLabel[rawAgent.status] ?? "Pending",
  }
}

function mapAdminAgents(
  rawAgents: Awaited<ReturnType<typeof listAgents>>,
  summaries: Array<{ agentId?: string | null; status: AppStatus }>,
): Agent[] {
  const appCounts = new Map<string, number>()
  const appStatuses = new Map<string, AppStatus[]>()
  for (const row of summaries) {
    if (!row.agentId) continue
    appCounts.set(row.agentId, (appCounts.get(row.agentId) ?? 0) + 1)
    const list = appStatuses.get(row.agentId) ?? []
    list.push(row.status)
    appStatuses.set(row.agentId, list)
  }
  return rawAgents.map((row) => ({
    id: row.id,
    name: row.profile.fullName ?? "Agent",
    agentId: row.agentCode ?? "Pending",
    phone: row.profile.phone ?? "",
    email: row.profile.email ?? "",
    channel: commercialLabel[row.commercialChannel ?? ""] ?? "Direct Sales",
    apps: appCounts.get(row.id) ?? 0,
    status: lifecycleLabel[row.status] ?? "Pending",
    applicationStatus: primaryApplicationStatus(appStatuses.get(row.id) ?? []),
    joined: row.memberSince.toISOString().slice(0, 10),
  }))
}

export const loadAgentShell = cache(async function loadAgentShell() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return {
      mode: "setup" as const,
      message: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
      agent: emptyAgent(),
      notifications: [] as AgentNotification[],
    }
  }
  try {
    const rawAgent = await getOwnAgent()
    const notifications = await listNotifications(20).catch(() => [] as AgentNotification[])
    return {
      mode: "live" as const,
      message: undefined as string | undefined,
      agent: mapAgentProfile(rawAgent),
      notifications,
    }
  } catch (error) {
    return {
      ...setupFrom(error),
      agent: emptyAgent(),
      notifications: [] as AgentNotification[],
    }
  }
})

export const loadAgentWorkspace = cache(async function loadAgentWorkspace() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return {
      mode: "setup" as const,
      message: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
      agent: emptyAgent(),
      application: emptyApplication(emptyAgent()),
      applications: [] as Application[],
      notifications: [] as AgentNotification[],
    }
  }
  try {
    const [rawAgent, apps] = await Promise.all([getOwnAgent(), listApplications()])
    const agent = mapAgentProfile(
      rawAgent,
      apps[0]?.status ?? "DRAFT",
      apps.some((app) => app.status === "COMPLETED"),
    )
    return {
      mode: "live" as const,
      message: undefined as string | undefined,
      agent,
      application: apps[0] ?? emptyApplication(agent),
      applications: apps,
      notifications: [] as AgentNotification[],
    }
  } catch (error) {
    return {
      ...setupFrom(error),
      agent: emptyAgent(),
      application: emptyApplication(emptyAgent()),
      applications: [] as Application[],
      notifications: [] as AgentNotification[],
    }
  }
})

export async function loadAgentApplication(id: string) {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) return null
  try {
    // getApplication returns NotFound for another agent's case (no signed file URL either).
    return await getApplication(id)
  } catch {
    return null
  }
}

export const loadAdminDashboard = cache(async function loadAdminDashboard() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return emptyAdminWorkspace(
      "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
    )
  }
  try {
    const [stats, needsAttention, logs] = await Promise.all([
      dashboardStats(),
      attentionQueue(),
      listAudit({ take: 8 }),
    ])
    return {
      ...emptyAdminWorkspace(),
      mode: "live" as const,
      message: undefined as string | undefined,
      stats,
      needsAttention,
      recentActivity: logs.map((log) => ({
        id: log.id,
        actor: log.actor,
        action: log.action,
        detail: log.detail,
        timestamp: log.timestamp,
      })),
    }
  } catch (error) {
    return emptyAdminWorkspace(error instanceof Error ? error.message : "Backend is not ready")
  }
})

export const loadAdminApplications = cache(async function loadAdminApplications() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return {
      mode: "setup" as const,
      message: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
      applications: [] as Application[],
    }
  }
  try {
    return { mode: "live" as const, message: undefined as string | undefined, applications: await listApplications() }
  } catch (error) {
    return {
      mode: "setup" as const,
      message: error instanceof Error ? error.message : "Backend is not ready",
      applications: [] as Application[],
    }
  }
})

export const loadAdminAgents = cache(async function loadAdminAgents() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return {
      mode: "setup" as const,
      message: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
      agents: [] as Agent[],
      applications: [] as Array<Pick<Application, "id" | "agentId" | "agentName" | "appNumber" | "status">>,
    }
  }
  try {
    const [rawAgents, summaries] = await Promise.all([listAgents(), listApplicationSummaries()])
    return {
      mode: "live" as const,
      message: undefined as string | undefined,
      agents: mapAdminAgents(rawAgents, summaries),
      applications: summaries,
    }
  } catch (error) {
    return {
      mode: "setup" as const,
      message: error instanceof Error ? error.message : "Backend is not ready",
      agents: [] as Agent[],
      applications: [] as Array<Pick<Application, "id" | "agentId" | "agentName" | "appNumber" | "status">>,
    }
  }
})

export const loadAdminReports = cache(async function loadAdminReports() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return emptyAdminWorkspace(
      "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
    )
  }
  try {
    const [stats, volume, parts, avgDays] = await Promise.all([
      dashboardStats(),
      volumeByMonth(),
      breakdowns(),
      averageDaysPending(),
    ])
    return {
      ...emptyAdminWorkspace(),
      mode: "live" as const,
      message: undefined as string | undefined,
      stats,
      monthlyVolume: volume,
      sectorBreakdown: parts.sectors.map((s) => ({ sector: s.name, value: s.value, count: s.count })),
      channelBreakdown: parts.channels.map((s) => ({ channel: s.name, value: s.value, count: s.count })),
      avgDays,
    }
  } catch (error) {
    return emptyAdminWorkspace(error instanceof Error ? error.message : "Backend is not ready")
  }
})

export const loadAdminActivity = cache(async function loadAdminActivity() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return {
      mode: "setup" as const,
      message: "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
      auditLog: [] as AuditLogEntry[],
    }
  }
  try {
    return {
      mode: "live" as const,
      message: undefined as string | undefined,
      auditLog: (await listAudit()) as AuditLogEntry[],
    }
  } catch (error) {
    return {
      mode: "setup" as const,
      message: error instanceof Error ? error.message : "Backend is not ready",
      auditLog: [] as AuditLogEntry[],
    }
  }
})

export const loadAdminWorkspace = cache(async function loadAdminWorkspace() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    return emptyAdminWorkspace(
      "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL, and DIRECT_URL in .env.local.",
    )
  }
  try {
    const [apps, rawAgents, stats, volume, parts, logs] = await Promise.all([
      listApplications(),
      listAgents(),
      dashboardStats(),
      volumeByMonth(),
      breakdowns(),
      listAudit(),
    ])
    const agents = mapAdminAgents(rawAgents, apps)
    const needsAttention = apps
      .filter((a) => a.status === "PENDING_REVIEW" || a.status === "NEEDS_CORRECTION")
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        appNumber: a.appNumber,
        agentName: a.agentName,
        status: a.status === "NEEDS_CORRECTION" ? "Docs Missing" : "Awaiting Review",
        daysPending: a.daysPending,
      }))
    const recentActivity = logs.slice(0, 8).map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      detail: log.detail,
      timestamp: log.timestamp,
    }))
    return {
      mode: "live" as const,
      message: undefined as string | undefined,
      applications: apps,
      agents,
      stats,
      needsAttention,
      recentActivity,
      auditLog: logs as AuditLogEntry[],
      monthlyVolume: volume,
      sectorBreakdown: parts.sectors.map((s) => ({ sector: s.name, value: s.value, count: s.count })),
      channelBreakdown: parts.channels.map((s) => ({ channel: s.name, value: s.value, count: s.count })),
    }
  } catch (error) {
    return emptyAdminWorkspace(error instanceof Error ? error.message : "Backend is not ready")
  }
})
