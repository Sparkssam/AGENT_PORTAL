import { SettingsWorkspace } from "@/components/settings-workspace"
import { SetupBanner } from "@/components/setup-banner"
import { formatDateLong } from "@/lib/format"
import { loadAgentWorkspace } from "@/lib/data/workspace"

export default async function AgentSettingsPage() {
  const { mode, message, agent, application } = await loadAgentWorkspace()

  return (
    <>
      <div className="px-4 pt-4 md:px-8">
        <SetupBanner mode={mode} message={message} />
      </div>
      <SettingsWorkspace
        portal="agent"
        email={agent.email}
        name={agent.fullName}
        live={mode === "live"}
        applicationStatus={application.status}
        memberSince={formatDateLong(agent.memberSince)}
        verified={agent.verified}
      />
    </>
  )
}
