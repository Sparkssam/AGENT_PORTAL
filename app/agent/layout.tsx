import type React from "react"
import { AgentSidebar } from "@/components/agent/agent-sidebar"
import { AgentTopbar } from "@/components/agent/agent-topbar"

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AgentSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AgentTopbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
