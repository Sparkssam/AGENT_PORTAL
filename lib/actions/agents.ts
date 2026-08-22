"use server"

import { cache } from "react"
import { revalidatePath } from "next/cache"
import { ForbiddenError, NotFoundError } from "@/lib/backend/errors"
import { getAuthContext, requireAdmin, requireAgent } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import { profileUpdateSchema } from "@/lib/backend/zod"
import { getPrisma } from "@/lib/prisma"
import { withDbGuards } from "@/lib/db/guards"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { isStaffRole } from "@/lib/db/ownership"
import { updateProfileRecord } from "@/lib/db/users"
import type { AgentLifecycle, CommercialChannel } from "@prisma/client"

export async function listAgents(filters?: {
  query?: string
  status?: AgentLifecycle
  commercialChannel?: CommercialChannel
}) {
  await requireAdmin()
  const prisma = getPrisma()
  const needle = filters?.query?.trim()
  const rows = await prisma.agent.findMany({
    where: {
      status: filters?.status,
      commercialChannel: filters?.commercialChannel,
      profile: { role: "agent" },
      ...(needle
        ? {
            OR: [
              { agentCode: { contains: needle, mode: "insensitive" } },
              { profile: { fullName: { contains: needle, mode: "insensitive" } } },
              { profile: { email: { contains: needle, mode: "insensitive" } } },
              { profile: { phone: { contains: needle, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      userId: true,
      agentCode: true,
      status: true,
      commercialChannel: true,
      verified: true,
      memberSince: true,
      createdAt: true,
      profile: {
        select: { fullName: true, email: true, phone: true, role: true, title: true, initials: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
  return rows
}

export async function getAgent(agentId: string) {
  const { profile } = await getAuthContext()
  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  const data = await getPrisma().agent.findUnique({
    where: { id: agentId },
    include: { profile: true },
  })
  if (!data) throw new NotFoundError("Agent not found")
  if (!isAdmin && data.userId !== profile.id) throw new NotFoundError("Agent not found")
  return data
}

export const getOwnAgent = cache(async function getOwnAgent() {
  const { profile } = await requireAgent()
  const data = await getPrisma().agent.findUnique({
    where: { userId: profile.id },
    include: { profile: true },
  })
  if (!data) throw new NotFoundError("Agent not found")
  return data
})

export async function updateProfile(input: { fullName?: string; phone?: string }) {
  const parsed = profileUpdateSchema.parse(input)
  const { supabase, profile } = await requireAgent()
  const fullName = parsed.fullName ?? profile.fullName
  const phone = parsed.phone ?? profile.phone
  await updateProfileRecord(profile.id, { fullName, phone })
  await supabase.auth.updateUser({
    data: { full_name: fullName, phone },
  })
}

export async function setAgentStatus(agentId: string, status: Extract<AgentLifecycle, "active" | "suspended">) {
  const { profile } = await requireAdmin()
  if (status !== "active" && status !== "suspended") {
    throw new ForbiddenError("Status must be active or suspended")
  }

  const agent = await getPrisma().agent.findUnique({
    where: { id: agentId },
    include: { profile: true },
  })
  if (!agent) throw new NotFoundError("Agent not found")
  if (isStaffRole(agent.profile.role)) {
    throw new ForbiddenError("Staff accounts cannot be managed as agents")
  }

  await withDbGuards(async (tx) => {
    await tx.agent.update({
      where: { id: agentId },
      data: { status },
    })
  })
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Agent",
    action: status === "suspended" ? "Suspended agent" : "Activated agent",
    detail: status,
    entityType: "agent",
    entityId: agentId,
    target: agentId,
    ipAddress: await clientIp(),
  })
  try {
    await emitNotification({
      userId: agent.userId,
      category: "system",
      title: status === "suspended" ? "Your account is suspended" : "Your account is active",
      message:
        status === "suspended"
          ? "You cannot submit applications or upload documents until an administrator reactivates your account."
          : "Your agent account has been activated. You can continue your application.",
      entityType: "agent",
      entityId: agentId,
      email: true,
    })
  } catch {
    // Status change should succeed even if the agent notification fails.
  }
  revalidatePath("/admin/agents")
  revalidatePath("/agent")
}
