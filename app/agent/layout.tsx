import type React from "react"
import { AgentShell } from "@/components/agent/agent-shell"
import { AuthGuard } from "@/components/auth/auth-guard"
import { loadAgentShell } from "@/lib/data/workspace"

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const { agent, notifications, mode } = await loadAgentShell()
  return (
    <AuthGuard role="agent">
      <AgentShell agent={agent} notifications={notifications} live={mode === "live"}>
        {children}
      </AgentShell>
    </AuthGuard>
  )
}
