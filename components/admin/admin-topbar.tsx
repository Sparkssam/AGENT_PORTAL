"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Menu, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"
import { NotificationBell } from "@/components/agent/notification-bell"
import { WorkspaceSearch } from "@/components/workspace-search"
import { WorkspaceIdentity } from "@/components/workspace-identity"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { listNotifications } from "@/lib/actions/notifications"
import type { AgentNotification } from "@/lib/agent-data"

export function AdminTopbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [notifications, setNotifications] = useState<AgentNotification[]>([])
  const { user, logout } = useAuth()
  const router = useRouter()

  const name = user?.name ?? "Admin User"
  const email = user?.email ?? "admin@kinetic.co.tz"
  const initials = user?.initials ?? "AU"

  useEffect(() => {
    let cancelled = false
    void listNotifications(20)
      .then((rows) => {
        if (!cancelled) setNotifications(rows)
      })
      .catch(() => {
        if (!cancelled) setNotifications([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogout() {
    void logout().then(() => router.push("/login"))
  }

  return (
    <header className="portal-topbar">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full md:hidden"
        onClick={() => setMobileNavOpen((v) => !v)}
        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
      >
        {mobileNavOpen ? <X /> : <Menu />}
      </Button>

      <WorkspaceSearch
        value={query}
        onChange={setQuery}
        onSubmit={(value) => router.push(value ? `/admin/applications?q=${encodeURIComponent(value)}` : "/admin/applications")}
        placeholder="Search applications or agents..."
        className="hidden sm:flex"
      />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <ThemeToggle />
        <NotificationBell notifications={notifications} persist portal="admin" />

        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" className="rounded-2xl outline-none" />}>
            <WorkspaceIdentity name={name} initials={initials} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/admin/settings" />}>Settings</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut data-icon="inline-start" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AdminMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  )
}
