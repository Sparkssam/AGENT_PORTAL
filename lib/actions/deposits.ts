"use server"

import { BackendError, NotFoundError } from "@/lib/backend/errors"
import { getAuthContext, requireAdmin, requireAgent } from "@/lib/backend/session"
import { clientIp } from "@/lib/backend/request"
import type { DepositStatus } from "@/lib/admin-data"
import { getPrisma } from "@/lib/prisma"
import { withDbGuards } from "@/lib/db/guards"
import { emitNotification, writeAudit } from "@/lib/db/events"
import { assertAgentOwnsApplication, assertAgentWritable, isStaffRole } from "@/lib/db/ownership"
import type { DepositStatus as PrismaDepositStatus } from "@prisma/client"

async function depositForApplication(applicationId: string) {
  const { profile } = await getAuthContext()
  const prisma = getPrisma()
  const isAdmin = isStaffRole(profile.role)
  const app = await prisma.application.findUnique({ where: { id: applicationId } })
  if (!app) throw new NotFoundError("Application not found")
  if (!isAdmin) {
    const agent = await prisma.agent.findUnique({ where: { userId: profile.id } })
    assertAgentOwnsApplication(agent?.id, app.agentId)
    assertAgentWritable(agent?.status)
  }
  const deposit = await prisma.depositRecord.findUnique({ where: { applicationId } })
  if (!deposit) throw new NotFoundError("Deposit record not found")
  return { prisma, profile, isAdmin, app, deposit }
}

export async function upsertDeposit(input: {
  applicationId: string
  reference?: string
  proofDocumentId?: string
  status?: Extract<DepositStatus, "PENDING" | "SUBMITTED" | "AWAITING_PROOF">
}) {
  const { prisma, app, deposit } = await depositForApplication(input.applicationId)
  await requireAgent()
  if (!["DRAFT", "NEEDS_CORRECTION"].includes(app.status)) {
    throw new BackendError("DEPOSIT", "Deposit cannot be edited in the current application status")
  }
  const nextStatus = input.status ?? (input.reference || input.proofDocumentId ? "SUBMITTED" : deposit.status)
  await prisma.depositRecord.update({
    where: { id: deposit.id },
    data: {
      reference: input.reference ?? deposit.reference,
      proofDocumentId: input.proofDocumentId ?? deposit.proofDocumentId,
      status: nextStatus as PrismaDepositStatus,
    },
  })
}

export async function verifyDeposit(
  applicationId: string,
  status: Extract<DepositStatus, "CLEARED" | "REJECTED">,
  note?: string,
) {
  const { prisma, profile, app, deposit } = await depositForApplication(applicationId)
  await requireAdmin()
  const storedStatus: PrismaDepositStatus = status === "CLEARED" ? "VERIFIED" : "REJECTED"
  try {
    await withDbGuards(async (tx) => {
      await tx.depositRecord.update({
        where: { id: deposit.id },
        data: {
          status: storedStatus,
          verificationNote: note ?? null,
          verifiedById: profile.id,
          verifiedAt: new Date(),
        },
      })
    })
  } catch {
    if (storedStatus === "VERIFIED") {
      await withDbGuards(async (tx) => {
        await tx.depositRecord.update({
          where: { id: deposit.id },
          data: {
            status: "CLEARED",
            verificationNote: note ?? null,
            verifiedById: profile.id,
            verifiedAt: new Date(),
          },
        })
      })
    } else {
      throw new BackendError("DEPOSIT", "Could not update deposit")
    }
  }

  const agent = await prisma.agent.findUnique({ where: { id: app.agentId } })
  if (agent) {
    await emitNotification({
      userId: agent.userId,
      category: "deposit",
      title: status === "CLEARED" ? "Deposit cleared" : "Deposit rejected",
      message: note || (status === "CLEARED" ? "Your TZS 100,000 deposit is cleared." : "Your deposit needs attention."),
      entityType: "application",
      entityId: applicationId,
      email: status === "REJECTED",
    })
  }
  await writeAudit({
    actorId: profile.id,
    actorRole: profile.role,
    category: "Application",
    action: status === "CLEARED" ? "Verified deposit" : "Rejected deposit",
    detail: note || status,
    entityType: "deposit",
    entityId: deposit.id,
    target: app.applicationNumber ?? applicationId,
    ipAddress: await clientIp(),
  })
}
