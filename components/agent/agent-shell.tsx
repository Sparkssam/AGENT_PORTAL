"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AgentSidebar } from "@/components/agent/agent-sidebar"
import { AgentTopbar } from "@/components/agent/agent-topbar"
import { AgentShellContext } from "@/components/agent/agent-shell-context"
import { type AgentNotification, type AgentProfile } from "@/lib/agent-data"

const STORAGE_KEY = "kinetic-agent-nav"

export function AgentShell({
  agent,
  notifications = [],
  live = false,
  children,
}: {
  agent?: AgentProfile
  notifications?: AgentNotification[]
  live?: boolean
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "collapsed")
    } catch {
      // ignore
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "expanded")
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <AgentShellContext.Provider value={{ collapsed, toggle }}>
      <div className="app-shell bg-background">
        <AgentSidebar agent={agent} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <AgentTopbar agent={agent} notifications={notifications} live={live} />
          {agent?.lifecycleStatus === "Suspended" ? (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive md:px-6">
              Your agent account is suspended. You can view existing records, but you cannot submit applications or
              upload documents until an administrator reactivates it.
            </div>
          ) : null}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AgentShellContext.Provider>
  )
}
