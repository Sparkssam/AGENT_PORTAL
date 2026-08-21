import { SettingsWorkspace } from "@/components/settings-workspace"
import { SetupBanner } from "@/components/setup-banner"
import { formatDateLong } from "@/lib/format"
import { loadAgentWorkspace } from "@/lib/data/workspace"

export default async function AgentSettingsPage() {
  const { mode, message, agent, application } = await loadAgentWorkspace()

  return (
    <div className="portal-page">
      <SetupBanner mode={mode} message={message} />
      <SettingsWorkspace
        portal="agent"
        email={agent.email}
        name={agent.fullName}
        live={mode === "live"}
        applicationStatus={application.status}
        memberSince={formatDateLong(agent.memberSince)}
        verified={agent.verified}
      />
    </div>
  )
}
