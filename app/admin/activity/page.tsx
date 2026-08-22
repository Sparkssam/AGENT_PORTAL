import { AuditLogTable } from "./audit-log-table"
import { PageHeader } from "@/components/page-header"
import { loadAdminActivity } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

export const metadata = {
  title: "Activity/Audit — Kinetic Admin",
  description: "Full audit trail of administrator, agent, and system actions across the Tanzania Hub.",
}

export default async function ActivityPage() {
  const { mode, message, auditLog } = await loadAdminActivity()
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Activity / Audit"
        description="Who changed what, in plain language — applications, documents, agents, and sign-in events."
      />
      <AuditLogTable entries={auditLog} />
    </div>
  )
}
