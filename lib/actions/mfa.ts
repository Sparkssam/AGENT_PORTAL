"use server"

import { BackendError, ForbiddenError } from "@/lib/backend/errors"
import { getAuthContext, requireConfiguredClient } from "@/lib/backend/session"
import { isStaffRole } from "@/lib/db/ownership"
import { clientIp } from "@/lib/backend/request"
import { writeAudit } from "@/lib/db/events"

export type MfaStatus = {
  required: boolean
  enrolled: boolean
  verified: boolean
  factorId?: string
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const { supabase, profile } = await getAuthContext()
  const required = isStaffRole(profile.role)
  if (!required) return { required: false, enrolled: false, verified: true }

  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
  if (aalError || factorError) {
    return { required: false, enrolled: false, verified: true }
  }
  const totp = factors?.totp?.find((factor) => factor.status === "verified")
  return {
    required: true,
    enrolled: Boolean(totp),
    verified: aal?.currentLevel === "aal2",
    factorId: totp?.id,
  }
}

export async function enrollStaffTotp() {
  const { supabase, profile } = await getAuthContext()
  if (!isStaffRole(profile.role)) throw new ForbiddenError("Two-factor is required for staff accounts only")

  const { data: factors } = await supabase.auth.mfa.listFactors()
  for (const factor of factors?.all ?? []) {
    if (factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Kinetic Admin",
  })
  if (error || !data?.totp) throw new BackendError("AUTH", error?.message ?? "Could not start authenticator setup", 400)

  return {
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  }
}

export async function verifyStaffTotp(factorId: string, code: string) {
  const supabase = await requireConfiguredClient()
  const trimmed = code.replace(/\s+/g, "")
  if (!/^\d{6}$/.test(trimmed)) throw new BackendError("AUTH", "Enter the 6-digit code from your authenticator app", 400)

  const challenge = await supabase.auth.mfa.challenge({ factorId })
  if (challenge.error || !challenge.data) {
    throw new BackendError("AUTH", challenge.error?.message ?? "Could not start verification", 400)
  }

  const verified = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: trimmed,
  })
  if (verified.error) throw new BackendError("AUTH", "That code is not valid. Try the next one from the app.", 401)

  try {
    const { profile } = await getAuthContext()
    await writeAudit({
      actorId: profile.id,
      actorRole: profile.role,
      category: "Security",
      action: "Verified authenticator",
      detail: "TOTP",
      entityType: "profile",
      entityId: profile.id,
      ipAddress: await clientIp(),
    })
  } catch {
    // Session is valid even if audit fails.
  }
}

export async function unenrollStaffTotp() {
  const { supabase, profile } = await getAuthContext()
  if (!isStaffRole(profile.role)) throw new ForbiddenError("Staff only")
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const totp = factors?.totp?.find((factor) => factor.status === "verified")
  if (!totp) return
  const { error } = await supabase.auth.mfa.unenroll({ factorId: totp.id })
  if (error) throw new BackendError("AUTH", error.message, 400)
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Security",
    action: "Removed authenticator",
    detail: "TOTP",
    entityType: "profile",
    entityId: profile.id,
    ipAddress: await clientIp(),
  })
}
