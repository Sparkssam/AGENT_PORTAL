import type { Metadata } from "next"
import { AgentsTable } from "./agents-table"
import { loadAdminAgents } from "@/lib/data/workspace"
import { SetupBanner } from "@/components/setup-banner"

export const metadata: Metadata = {
  title: "Agents — Kinetic Admin",
}

export default async function AgentsPage() {
  const { mode, message, agents, applications } = await loadAdminAgents()
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 p-4 md:p-6">
      <SetupBanner mode={mode} message={message} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Agents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Directory of onboarded agents across all channels in the Tanzania Hub.
        </p>
      </div>
      <AgentsTable agents={agents} applications={applications} />
    </div>
  )
}
