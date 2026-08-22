"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, BellRing } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/format"
import { notificationHref, type AgentNotification } from "@/lib/agent-data"
import { cn } from "@/lib/utils"

export function NotificationBell({
  notifications,
  persist = false,
  portal = "agent",
}: {
  notifications: AgentNotification[]
  persist?: boolean
  portal?: "agent" | "admin"
}) {
  const [items, setItems] = useState(notifications)

  useEffect(() => {
    setItems(notifications)
  }, [notifications])

  const unread = items.filter((item) => !item.read).length

  async function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    if (persist) {
      const { markAllRead: persistAll } = await import("@/lib/actions/notifications")
      await persistAll()
    }
  }

  async function markRead(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)))
    if (persist) {
      const { markRead: persistOne } = await import("@/lib/actions/notifications")
      await persistOne(id)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm outline-none transition hover:bg-muted hover:text-foreground"
            aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
          />
        }
      >
        {unread > 0 ? <BellRing className="size-4 text-foreground" /> : <Bell className="size-4" />}
        {unread > 0 ? (
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-background" />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={notificationHref(item, portal)}
                  onClick={() => void markRead(item.id)}
                  className={cn(
                    "block px-3 py-2.5 transition hover:bg-muted/60",
                    !item.read && "bg-accent/5",
                  )}
                >
                  <span className="flex items-start gap-2">
                    {!item.read ? (
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                    ) : (
                      <span className="mt-1.5 size-1.5 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/70">
                        {formatDateTime(item.timestamp)}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
