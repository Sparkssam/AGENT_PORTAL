"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  FileText,
  User,
  ArrowLeftRight,
  Wallet,
  Zap,
  Settings,
  LifeBuoy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type AgentProfile } from "@/lib/agent-data"

const mainNav = [
  { href: "/agent/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/agent/applications", label: "My Applications", icon: FileText },
  { href: "/agent/profile", label: "Profile", icon: User },
]

const utilityNav = [
  { href: "/agent/help", label: "Help Center", icon: LifeBuoy },
  { href: "/agent/settings", label: "Settings", icon: Settings },
]

const comingSoonNav = [
  { href: "/agent/float-transfer", label: "Float Transfer", icon: ArrowLeftRight },
  { href: "/agent/wallet", label: "Wallet", icon: Wallet },
]

export function AgentMobileNav({
  open,
  onClose,
  agent,
}: {
  open: boolean
  onClose: () => void
  agent?: AgentProfile
}) {
  const pathname = usePathname()
  const displayAgent = agent

  if (!open) return null

  return (
    <div className="fixed inset-0 top-16 z-40 flex md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <nav className="relative flex h-full w-64 flex-col overflow-y-auto bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-3 flex items-center gap-2.5 rounded-2xl bg-sidebar-accent/70 px-2 py-2 ring-1 ring-sidebar-border">
          <span className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Zap className="size-4" fill="currentColor" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold">Kinetic</p>
            <p className="text-[11px] text-sidebar-foreground/50">Agent Portal</p>
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const active = pathname?.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <ul className="mt-6 flex flex-col gap-1">
          {utilityNav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 px-3 pb-2 text-[10px] font-medium tracking-wider text-sidebar-foreground/40 uppercase">
          Coming Soon
        </p>
        <ul className="flex flex-col gap-1">
          {comingSoonNav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <span className="flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-sidebar-foreground/35">
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </span>
              </li>
            )
          })}
        </ul>
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-sidebar-accent px-2 py-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {displayAgent?.avatarInitials || "AG"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayAgent?.fullName || "Agent"}</p>
          </div>
        </div>
      </nav>
    </div>
  )
}
