"use server"

import type { SessionUser } from "@/lib/auth"
import { BackendError } from "@/lib/backend/errors"
import { isPrismaConfigured, isSupabaseConfigured } from "@/lib/backend/env"
import { getAuthContext, requireConfiguredClient } from "@/lib/backend/session"
import { profileUpdateSchema, registerSchema } from "@/lib/backend/zod"
import { clientIp } from "@/lib/backend/request"
import { ensureUserRecords, roleFromAppMetadata, updateProfileRecord } from "@/lib/db/users"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { getPrisma } from "@/lib/prisma"
import { createAdminClient } from "@/lib/supabase/admin"
import { assertLoginRateLimit } from "@/lib/rate-limit"

export async function getSession(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured() || !isPrismaConfigured()) return null
  try {
    const { session } = await getAuthContext()
    return session
  } catch {
    return null
  }
}

async function resolveLoginEmail(identifier: string) {
  const value = identifier.trim()
  if (!value) throw new BackendError("AUTH", "Enter your email or phone number.", 400)
  if (value.includes("@")) return value.toLowerCase()

  const compact = value.replace(/\s+/g, "")
  const profile = await getPrisma().profile.findFirst({
    where: { OR: [{ phone: value }, { phone: compact }] },
    select: { email: true },
  })
  if (!profile?.email) throw new BackendError("AUTH", "Invalid email or password", 401)
  return profile.email
}

export async function signIn(identifier: string, password: string) {
  const supabase = await requireConfiguredClient()
  const email = await resolveLoginEmail(identifier)
  const ip = await clientIp()
  try {
    await assertLoginRateLimit(email, ip)
  } catch (error) {
    if (error instanceof BackendError && error.code === "RATE_LIMIT") throw error
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error || !data.user) {
    try {
      await writeAudit({
        category: "Security",
        action: "Failed login attempt",
        detail: error?.message ?? "Invalid credentials",
        severity: "warning",
        target: email,
        ipAddress: await clientIp(),
      })
    } catch {
      // Ignore audit failures on anonymous login.
    }
    throw new BackendError("AUTH", "Invalid email or password", 401)
  }

  const profile = await ensureUserRecords({
    id: data.user.id,
    email: data.user.email ?? email,
    fullName: typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : undefined,
    phone: typeof data.user.user_metadata?.phone === "string" ? data.user.user_metadata.phone : undefined,
    role: roleFromAppMetadata(data.user.app_metadata),
  })
  await supabase.auth.refreshSession()

  try {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Security",
      action: "Signed in",
      detail: profile.email,
      entityType: "profile",
      entityId: profile.id,
      ipAddress: await clientIp(),
    })
  } catch {
    // Login should succeed even if audit write fails.
  }

  return (await getAuthContext()).session
}

export async function signUp(input: { fullName: string; email: string; phone: string; password: string }) {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    throw new BackendError("AUTH", "Check your name, email, phone, and password (8+ characters).", 400)
  }
  const values = parsed.data
  await requireConfiguredClient()
  const admin = createAdminClient()

  const created = await admin.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.fullName,
      phone: values.phone,
    },
  })

  if (created.error || !created.data.user) {
    const message = created.error?.message ?? ""
    if (/already|registered|exists/i.test(message)) {
      throw new BackendError("AUTH", "An account with this email already exists. Sign in instead.", 409)
    }
    throw new BackendError("AUTH", message || "Could not create the account.", 400)
  }

  const profile = await ensureUserRecords({
    id: created.data.user.id,
    email: values.email,
    fullName: values.fullName,
    phone: values.phone,
    overwrite: true,
  }).catch((error) => {
    const message = error instanceof Error ? error.message : ""
    if (/unique/i.test(message)) {
      throw new BackendError("AUTH", "That email or phone is already registered.", 409)
    }
    throw error
  })

  try {
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Agent",
      action: "Registered",
      detail: profile.email,
      entityType: "profile",
      entityId: profile.id,
      ipAddress: await clientIp(),
    })
    await emitNotification({
      userId: profile.id,
      category: "system",
      title: "Welcome to Kinetic",
      message: "Your agent account is ready. Sign in to complete your application.",
    })
  } catch {
    // Account creation should succeed even if audit/notification write fails.
  }
}

export async function signOut() {
  if (!isSupabaseConfigured()) return
  const supabase = await requireConfiguredClient()
  await supabase.auth.signOut()
}

export async function requestPasswordReset(email: string) {
  const supabase = await requireConfiguredClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/login`,
  })
  if (error) throw new BackendError("AUTH", error.message, 400)
}

export async function updateOwnProfile(input: { fullName?: string; phone?: string }) {
  const parsed = profileUpdateSchema.parse(input)
  const { supabase, profile } = await getAuthContext()
  const fullName = parsed.fullName ?? profile.fullName
  const phone = parsed.phone ?? profile.phone

  await updateProfileRecord(profile.id, { fullName, phone })

  await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      phone,
    },
  })
}
