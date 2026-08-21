"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, LogOut, UserRound, Settings } from "lucide-react"
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
import { AgentMobileNav } from "@/components/agent/agent-mobile-nav"
import { NotificationBell } from "@/components/agent/notification-bell"
import { WorkspaceSearch } from "@/components/workspace-search"
import { WorkspaceIdentity } from "@/components/workspace-identity"
import { type AgentNotification, type AgentProfile } from "@/lib/agent-data"
import { useAuth } from "@/lib/auth-context"

const sectionLabels: Record<string, string> = {
  "/agent/apply": "New Application",
  "/agent/dashboard": "Overview",
  "/agent/help": "Help Center",
  "/agent/applications": "My Applications",
  "/agent/profile": "Profile",
  "/agent/settings": "Settings",
}

function currentSectionLabel(pathname: string | null) {
  if (!pathname) return "Agent Workspace"
  const match = Object.keys(sectionLabels).find((key) => pathname.startsWith(key))
  return match ? sectionLabels[match] : "Agent Workspace"
}

export function AgentTopbar({
  agent,
  notifications = [],
  live = false,
}: {
  agent?: AgentProfile
  notifications?: AgentNotification[]
  live?: boolean
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [query, setQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const name = user?.name ?? agent?.fullName ?? "Agent"
  const email = user?.email ?? agent?.email ?? ""
  const initials = user?.initials ?? agent?.avatarInitials ?? "AG"

  async function handleLogout() {
    await logout()
    router.push("/login")
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

      <div className="min-w-0 md:hidden">
        <p className="truncate text-sm font-semibold text-foreground">{currentSectionLabel(pathname)}</p>
      </div>

      <WorkspaceSearch
        value={query}
        onChange={setQuery}
        onSubmit={(value) => router.push(value ? `/agent/applications?q=${encodeURIComponent(value)}` : "/agent/applications")}
        placeholder="Search applications..."
        className="hidden md:flex"
      />

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <NotificationBell notifications={notifications} persist={live} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" className="rounded-2xl outline-none" />
            }
          >
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
              <DropdownMenuItem render={<Link href="/agent/profile" />}>
                <UserRound data-icon="inline-start" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/agent/settings" />}>
                <Settings data-icon="inline-start" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void handleLogout()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut data-icon="inline-start" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AgentMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} agent={agent} />
    </header>
  )
}
