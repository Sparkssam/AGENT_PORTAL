"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutGrid,
  FileText,
  User,
  Settings,
  ArrowLeftRight,
  Wallet,
  LifeBuoy,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type AgentProfile } from "@/lib/agent-data"
import { useAgentShell } from "@/components/agent/agent-shell-context"
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
  { href: "/agent/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/agent/applications", label: "My Applications", icon: FileText },
  { href: "/agent/profile", label: "Profile", icon: User },
]

const comingSoonNav = [
  { href: "/agent/float-transfer", label: "Float Transfer", icon: ArrowLeftRight },
  { href: "/agent/wallet", label: "Wallet", icon: Wallet },
]

export function AgentSidebar({ agent }: { agent?: AgentProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const { collapsed, toggle } = useAgentShell()
  const { user, logout } = useAuth()
  const name = user?.name ?? agent?.fullName ?? "Agent"
  const email = user?.email ?? agent?.email ?? ""
  const initials = user?.initials ?? agent?.avatarInitials ?? "AG"

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-full shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out md:flex",
        collapsed ? "w-[4.75rem]" : "w-64 lg:w-72",
      )}
    >
      <WorkspaceBrand collapsed={collapsed} onToggle={toggle} subtitle="Agent Portal" />

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
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
                href="/agent/help"
                className={cn(
                  "flex items-center rounded-full text-sm transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  pathname?.startsWith("/agent/help")
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
                href="/agent/settings"
                className={cn(
                  "flex items-center rounded-full text-sm transition-all",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  pathname?.startsWith("/agent/settings")
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
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
