"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import { AdminShellContext } from "@/components/admin/admin-shell-context"

const STORAGE_KEY = "kinetic-admin-nav"

export function AdminShell({ children }: { children: ReactNode }) {
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
    <AdminShellContext.Provider value={{ collapsed, toggle }}>
      <div className="app-shell bg-background">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <AdminTopbar />
          <main className="relative min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AdminShellContext.Provider>
  )
}
