"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  LifeBuoy,
  Settings,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAdminShell } from "@/components/admin/admin-shell-context"
import { PortalNavHint, shortDisplayName } from "@/components/portal-nav-hint"
import { WorkspaceBrand } from "@/components/workspace-brand"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

const mainNav = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutGrid },
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
  const router = useRouter()
  const { collapsed, toggle } = useAdminShell()
  const { user, logout } = useAuth()
  const name = user?.name ?? "Admin User"
  const email = user?.email ?? "admin@kinetic.co.tz"
  const initials = user?.initials ?? "AU"

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-(--sidebar-width-collapsed)" : "w-(--sidebar-width) lg:w-(--sidebar-width-lg)",
      )}
    >
      <WorkspaceBrand collapsed={collapsed} onToggle={toggle} subtitle="Admin Portal" />

      <nav className={cn("mt-4 min-h-0 flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}>
        <ul className="flex flex-col gap-1">
          {mainNav.map((item) => {
            const active = pathname?.startsWith(item.href)
            const Icon = item.icon
            const link = (
              <Link
                href={item.href}
                prefetch
                className={cn(
                  "flex items-center rounded-full text-sm transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/70",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
            return (
              <li key={item.href}>
                <PortalNavHint label={item.label} collapsed={collapsed}>
                  {link}
                </PortalNavHint>
              </li>
            )
          })}
        </ul>

        <p
          className={cn(
            "mt-6 px-3 pb-2 text-[10px] font-medium tracking-wider text-sidebar-foreground/40 uppercase",
            collapsed && "sr-only",
          )}
        >
          Coming Soon
        </p>
        <ul className="flex flex-col gap-1">
          {comingSoonNav.map((item) => {
            const Icon = item.icon
            const row = (
              <span
                aria-disabled="true"
                className={cn(
                  "flex items-center rounded-full text-sm text-sidebar-foreground/35",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && item.label}
              </span>
            )
            return (
              <li key={item.href}>
                <PortalNavHint label={`${item.label} · Soon`} collapsed={collapsed}>
                  {row}
                </PortalNavHint>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={cn("mt-auto shrink-0 pb-4", collapsed ? "px-2" : "px-3")}>
        <ul className="mb-3 flex flex-col gap-1">
          <li>
            <PortalNavHint label="Help Center" collapsed={collapsed}>
              <Link
                href="/admin/help"
                className={cn(
                  "flex items-center rounded-full text-sm transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  pathname?.startsWith("/admin/help")
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/70",
                )}
              >
                <LifeBuoy className="size-4 shrink-0" />
                {!collapsed && "Help Center"}
              </Link>
            </PortalNavHint>
          </li>
          <li>
            <PortalNavHint label="Settings" collapsed={collapsed}>
              <Link
                href="/admin/settings"
                className={cn(
                  "flex items-center rounded-full text-sm transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  pathname?.startsWith("/admin/settings")
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                    : "font-medium text-sidebar-foreground hover:bg-sidebar-accent/70",
                )}
              >
                <Settings className="size-4 shrink-0" />
                {!collapsed && "Settings"}
              </Link>
            </PortalNavHint>
          </li>
        </ul>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className={cn(
                  "flex w-full items-center rounded-2xl bg-sidebar-accent ring-1 ring-sidebar-border transition hover:bg-sidebar-accent/80",
                  collapsed ? "justify-center p-1.5" : "gap-2.5 px-2 py-2",
                )}
              />
            }
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[11px] font-semibold text-sidebar-primary-foreground">
              {initials}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-sidebar-foreground">
                    {shortDisplayName(name)}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-sidebar-foreground/45" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href="/admin/settings" />}>
                <Settings data-icon="inline-start" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()} className="text-destructive focus:text-destructive">
              <LogOut data-icon="inline-start" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
