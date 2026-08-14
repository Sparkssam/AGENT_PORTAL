"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  FileText,
  Users,
  FolderOpen,
  BarChart3,
  ShieldCheck,
  ArrowLeftRight,
  Receipt,
  Wallet,
  Network,
  LineChart,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/applications", label: "Applications", icon: FileText },
  { href: "/admin/agents", label: "Agents", icon: Users },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/activity", label: "Activity/Audit", icon: ShieldCheck },
]

const comingSoonNav = [
  { href: "/admin/float-transfer", label: "Float Transfer", icon: ArrowLeftRight },
  { href: "/admin/transactions", label: "Transactions", icon: Receipt },
  { href: "/admin/wallet", label: "Wallet", icon: Wallet },
  { href: "/admin/agent-network", label: "Agent Network", icon: Network },
  { href: "/admin/financial-reports", label: "Financial Reports", icon: LineChart },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex lg:w-72">
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Zap className="size-4" fill="currentColor" />
        </span>
        <span className="font-mono text-lg font-semibold tracking-wide text-sidebar-foreground">KINETIC</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="px-2 pb-2 text-xs font-medium tracking-wider text-sidebar-foreground/40 uppercase">
          Main Operations
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
                  {active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
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
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/60"
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            TZ
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Tanzania Hub</p>
            <p className="truncate text-xs text-sidebar-foreground/45">Dar es Salaam</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
