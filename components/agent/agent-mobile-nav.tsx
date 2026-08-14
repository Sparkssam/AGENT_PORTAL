"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, FileText, FolderOpen, Bell, User, ArrowLeftRight, Wallet, Zap, Settings } from "lucide-react"
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

export function AgentMobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const unread = unreadNotificationCount()

  if (!open) return null

  return (
    <div className="fixed inset-0 top-16 z-40 flex md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <nav className="relative flex h-full w-64 flex-col overflow-y-auto bg-sidebar text-sidebar-foreground p-4">
        <div className="mb-2 flex items-center gap-2 px-2 py-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-3.5" fill="currentColor" />
          </span>
          <span className="font-mono text-base font-semibold tracking-wide">KINETIC</span>
        </div>
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
                  onClick={onClose}
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
                <span className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/35">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {currentAgent.avatarInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{currentAgent.fullName}</p>
          </div>
          <Link href="/agent/settings" onClick={onClose} className="ml-auto text-sidebar-foreground/50">
            <Settings className="size-4" />
          </Link>
        </div>
      </nav>
    </div>
  )
}
