"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  FileText,
  FolderOpen,
  Bell,
  User,
  Settings,
  ArrowLeftRight,
  Wallet,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { currentAgent, unreadNotificationCount } from "@/lib/agent-data"

const mainNav = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/agent/applications", label: "My Applications", icon: FileText },
  { href: "/agent/documents", label: "Documents", icon: FolderOpen },
  { href: "/agent/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/agent/profile", label: "Profile", icon: User },
]

const comingSoonNav = [
  { href: "/agent/float-transfer", label: "Float Transfer", icon: ArrowLeftRight },
  { href: "/agent/wallet", label: "Wallet", icon: Wallet },
]

export function AgentSidebar() {
  const pathname = usePathname()
  const unread = unreadNotificationCount()

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Zap className="size-4" fill="currentColor" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-mono text-base font-semibold tracking-wide text-sidebar-foreground">KINETIC</p>
          <p className="text-[10px] font-medium tracking-wider text-sidebar-foreground/45 uppercase">
            Agent Portal
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="px-2 pb-2 text-xs font-medium tracking-wider text-sidebar-foreground/40 uppercase">
          Agency
        </p>
        <ul className="flex flex-col gap-0.5">
          {mainNav.map((item) => {
            const active = pathname?.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  {item.badge && unread > 0 && (
                    <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                  {active && !item.badge && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
                </Link>
              </li>
            )
          })}
        </ul>

        <p className="mt-6 px-2 pb-2 text-xs font-medium tracking-wider text-sidebar-foreground/40 uppercase">
          Coming Soon
        </p>
        <ul className="flex flex-col gap-0.5">
          {comingSoonNav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/35"
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                  <span className="ml-auto rounded-sm bg-sidebar-accent/60 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-sidebar-foreground/45 uppercase">
                    Soon
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/agent/profile"
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent/60"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {currentAgent.avatarInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{currentAgent.fullName}</p>
            <p className="truncate text-xs text-sidebar-foreground/45">{currentAgent.agentIdNumber}</p>
          </div>
        </Link>
        <Link
          href="/agent/settings"
          className="mt-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
        >
          <Settings className="size-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
