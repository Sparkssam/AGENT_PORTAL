import { BackendError } from "@/lib/backend/errors"
import { getPrisma } from "@/lib/prisma"

const WINDOWS = {
  login: { limit: 8, windowMs: 15 * 60 * 1000 },
  upload: { limit: 20, windowMs: 10 * 60 * 1000 },
} as const

export async function assertLoginRateLimit(email: string, _ip: string | null) {
  const since = new Date(Date.now() - WINDOWS.login.windowMs)
  const count = await getPrisma().auditLog.count({
    where: {
      category: "Security",
      action: "Failed login attempt",
      createdAt: { gte: since },
      OR: [{ target: email }],
    },
  })
  if (count >= WINDOWS.login.limit) {
    throw new BackendError(
      "RATE_LIMIT",
      "Too many sign-in attempts. Wait 15 minutes, then try again.",
      429,
    )
  }
}

export async function assertUploadRateLimit(userId: string) {
  const since = new Date(Date.now() - WINDOWS.upload.windowMs)
  const count = await getPrisma().document.count({
    where: {
      uploadedAt: { gte: since },
      application: { agent: { userId } },
    },
  })
  if (count >= WINDOWS.upload.limit) {
    throw new BackendError(
      "RATE_LIMIT",
      "Too many uploads in a short time. Wait a few minutes, then try again.",
      429,
    )
  }
}
