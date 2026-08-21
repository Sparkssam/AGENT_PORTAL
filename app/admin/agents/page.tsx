import type { Metadata } from "next"
import { AgentsTable } from "./agents-table"
import { PageHeader } from "@/components/page-header"
import { loadAdminAgents } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

export const metadata: Metadata = {
  title: "Agents — Kinetic Admin",
}

export default async function AgentsPage() {
  const { mode, message, agents, applications } = await loadAdminAgents()
  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <PageHeader
        title="Agents"
        description="Directory of onboarded agents across all channels in the Tanzania Hub."
      />
      <AgentsTable agents={agents} applications={applications} />
    </div>
  )
}
