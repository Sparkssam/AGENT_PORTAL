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

export function AdminMobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

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
                  onClick={onClose}
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
    </div>
  )
}
