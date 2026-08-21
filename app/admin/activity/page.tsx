import { AuditLogTable } from "./audit-log-table"
import { loadAdminActivity } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

export const metadata = {
  title: "Activity/Audit — Kinetic Admin",
  description: "Full audit trail of administrator, agent, and system actions across the Tanzania Hub.",
}

export default async function ActivityPage() {
  const { mode, message, auditLog } = await loadAdminActivity()
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <SetupBanner mode={mode} message={message} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity / Audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A tamper-evident trail of every action taken across applications, documents, agents, and system jobs.
        </p>
      </div>
      <AuditLogTable entries={auditLog} />
    </div>
  )
}
