import type { UserRole } from "@prisma/client"
import { getPrisma } from "@/lib/prisma"
import { initialsFromName } from "@/lib/backend/request"
import { isStaffRole } from "@/lib/db/ownership"

export function roleFromAppMetadata(appMetadata: unknown): UserRole | undefined {
  if (!appMetadata || typeof appMetadata !== "object") return undefined
  const role = (appMetadata as { role?: unknown }).role
  if (role === "admin" || role === "super_admin" || role === "agent") return role
  return undefined
}

function titleForRole(role: UserRole) {
  if (role === "super_admin") return "Super Administrator"
  if (role === "admin") return "Administrator"
  return "Registered Agent"
}

function resolveProfileRole(existing: UserRole | undefined, requested?: UserRole): UserRole {
  if (existing && isStaffRole(existing)) return existing
  if (requested && isStaffRole(requested)) return requested
  return existing ?? requested ?? "agent"
}

/** Staff must not appear in the agent directory. Keep the row only if it already owns applications. */
export async function removeUnusedStaffAgent(userId: string) {
  const prisma = getPrisma()
  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { id: true, _count: { select: { applications: true } } },
  })
  if (!agent || agent._count.applications > 0) return
  await prisma.agent.delete({ where: { id: agent.id } })
}

export async function ensureUserRecords(input: {
  id: string
  email: string
  fullName?: string
  phone?: string | null
  overwrite?: boolean
  role?: UserRole
}) {
  const prisma = getPrisma()
  const email = input.email.trim().toLowerCase()
  const fullName = (input.fullName ?? "").trim() || email.split("@")[0] || "Agent"
  const phone = input.phone?.trim() || null
  const overwrite = Boolean(input.overwrite)
  const existing = await prisma.profile.findUnique({ where: { id: input.id } })
  const role = resolveProfileRole(existing?.role, input.role)
  const promotingToStaff = !existing || (!isStaffRole(existing.role) && isStaffRole(role))

  await prisma.profile.upsert({
    where: { id: input.id },
    create: {
      id: input.id,
      role,
      fullName,
      email,
      phone,
      title: titleForRole(role),
      initials: initialsFromName(fullName),
    },
    update: overwrite
      ? {
          fullName,
          email,
          phone,
          initials: initialsFromName(fullName),
          ...(promotingToStaff ? { role, title: titleForRole(role) } : {}),
        }
      : {
          email,
          ...(promotingToStaff ? { role, title: titleForRole(role) } : {}),
        },
  })

  if (role === "agent") {
    await prisma.agent.upsert({
      where: { userId: input.id },
      create: {
        userId: input.id,
        status: "pending",
      },
      update: {},
    })
  } else {
    await removeUnusedStaffAgent(input.id)
  }

  return prisma.profile.findUniqueOrThrow({ where: { id: input.id } })
}

export async function updateProfileRecord(profileId: string, input: { fullName: string; phone?: string | null }) {
  const prisma = getPrisma()
  return prisma.profile.update({
    where: { id: profileId },
    data: {
      fullName: input.fullName,
      phone: input.phone ?? null,
      initials: initialsFromName(input.fullName),
    },
  })
}
