"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Menu, X, LogOut, UserRound, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { currentAgent, unreadNotificationCount } from "@/lib/agent-data"

const sectionLabels: Record<string, string> = {
  "/agent/dashboard": "Dashboard",
  "/agent/applications": "My Applications",
  "/agent/documents": "Documents",
  "/agent/notifications": "Notifications",
  "/agent/profile": "Profile",
}

function currentSectionLabel(pathname: string | null) {
  if (!pathname) return "Agent Workspace"
  const match = Object.keys(sectionLabels).find((key) => pathname.startsWith(key))
  return match ? sectionLabels[match] : "Agent Workspace"
}

export function AgentTopbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const unread = unreadNotificationCount()

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileNavOpen((v) => !v)}
        aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
      >
        {mobileNavOpen ? <X /> : <Menu />}
      </Button>

      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wider text-muted-foreground/70 uppercase">Agent Workspace</p>
        <p className="truncate text-sm font-semibold text-foreground">{currentSectionLabel(pathname)}</p>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          render={<Link href="/agent/notifications" />}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-3 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-secondary"
              />
            }
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">{currentAgent.fullName}</p>
              <p className="text-xs leading-tight text-muted-foreground">{currentAgent.role}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentAgent.avatarInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{currentAgent.fullName}</p>
                <p className="text-xs text-muted-foreground">{currentAgent.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/agent/profile" />}>
                <UserRound data-icon="inline-start" />
                Profile settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/agent/settings" />}>
                <Settings data-icon="inline-start" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/login")}
              className="text-destructive focus:text-destructive"
            >
              <LogOut data-icon="inline-start" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AgentMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  )
}
