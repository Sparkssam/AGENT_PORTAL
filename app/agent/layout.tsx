import type React from "react"
import { AgentSidebar } from "@/components/agent/agent-sidebar"
import { AgentTopbar } from "@/components/agent/agent-topbar"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="agent">
      <div className="flex min-h-screen overflow-hidden bg-secondary/30">
        <AgentSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AgentTopbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
