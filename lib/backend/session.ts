import type { Profile } from "@prisma/client"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { BackendNotConfiguredError, ForbiddenError } from "@/lib/backend/errors"
import { isPrismaConfigured, isSupabaseConfigured } from "@/lib/backend/env"
import { ensureUserRecords, removeUnusedStaffAgent, roleFromAppMetadata } from "@/lib/db/users"
import { isStaffRole } from "@/lib/db/ownership"
import { getPrisma } from "@/lib/prisma"
import type { SessionUser, UserRole } from "@/lib/auth"

export type ProfileRole = "agent" | "admin" | "super_admin"

export function toSessionRole(role: ProfileRole): UserRole {
  return role === "agent" ? "agent" : "admin"
}

export async function requireConfiguredClient() {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) {
    throw new BackendNotConfiguredError()
  }
  return createClient()
}

function toSession(profile: Profile): SessionUser {
  return {
    id: profile.id,
    role: toSessionRole(profile.role),
    name: profile.fullName,
    email: profile.email,
    title: profile.title,
    initials: profile.initials,
  }
}

export const getAuthContext = cache(async function getAuthContext() {
  const supabase = await requireConfiguredClient()
  const prisma = getPrisma()

  const claimsResult = await supabase.auth.getClaims().catch(() => null)
  const claims = claimsResult?.data?.claims as {
    sub?: unknown
    email?: unknown
    app_metadata?: unknown
  } | undefined
  const claimedId = typeof claims?.sub === "string" ? claims.sub : undefined
  const claimedEmail = typeof claims?.email === "string" ? claims.email : undefined
  const claimedRole = roleFromAppMetadata(claims?.app_metadata)

  if (claimedId) {
    let profile = await prisma.profile.findUnique({ where: { id: claimedId } })
    if (profile) {
      if (claimedRole && isStaffRole(claimedRole) && !isStaffRole(profile.role)) {
        profile = await ensureUserRecords({
          id: claimedId,
          email: claimedEmail ?? profile.email,
          role: claimedRole,
        })
      } else if (isStaffRole(profile.role)) {
        await removeUnusedStaffAgent(profile.id)
      }
      return {
        supabase,
        user: { id: claimedId, email: claimedEmail ?? profile.email },
        profile,
        session: toSession(profile),
      }
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new ForbiddenError("Not signed in")

  let profile = await prisma.profile.findUnique({ where: { id: user.id } })
  if (!profile) {
    profile = await ensureUserRecords({
      id: user.id,
      email: user.email ?? claimedEmail ?? "",
      fullName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
      phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : undefined,
      role: roleFromAppMetadata(user.app_metadata) ?? claimedRole,
    })
  } else if (isStaffRole(profile.role)) {
    await removeUnusedStaffAgent(profile.id)
  }

  return { supabase, user, profile, session: toSession(profile) }
})

export async function requireAdmin() {
  const ctx = await getAuthContext()
  if (ctx.session.role !== "admin") throw new ForbiddenError("Admin only")
  return ctx
}

export async function requireAgent() {
  const ctx = await getAuthContext()
  if (ctx.session.role !== "agent") throw new ForbiddenError("Agent only")
  return ctx
}
