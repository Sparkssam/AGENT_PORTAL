"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Search, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"
import { useAuth } from "@/lib/auth-context"

export function AdminTopbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const name = user?.name ?? "Admin User"
  const title = user?.title ?? "Super Administrator"
  const email = user?.email ?? "admin@kinetic.co.tz"
  const initials = user?.initials ?? "AU"

  function handleLogout() {
    logout()
    router.push("/login")
  }

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

      <div className="relative w-full max-w-md">
        <Search
          data-icon="inline-start"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search records, agents, or TXNs..."
          className="pl-9"
          aria-label="Search records, agents, or transactions"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
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
              <p className="text-sm font-semibold leading-tight text-foreground">{name}</p>
              <p className="text-xs leading-tight text-muted-foreground">{title}</p>
            </div>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
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
              <DropdownMenuItem>Profile settings</DropdownMenuItem>
              <DropdownMenuItem>Switch region</DropdownMenuItem>
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
