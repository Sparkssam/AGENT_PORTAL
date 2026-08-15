"use client"

import { useState } from "react"
import { Bell, CheckCheck, FileText, FolderOpen, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AgentNotification, NotificationCategory } from "@/lib/agent-data"

const categoryIcon: Record<NotificationCategory, typeof Bell> = {
  application: FileText,
  document: FolderOpen,
  deposit: Wallet,
  system: Bell,
}

const categoryTone: Record<NotificationCategory, string> = {
  application: "bg-accent/15 text-accent",
  document: "bg-warning/20 text-warning-foreground",
  deposit: "bg-success/15 text-success",
  system: "bg-secondary text-muted-foreground",
}

export function NotificationsList({ notifications }: { notifications: AgentNotification[] }) {
  const [items, setItems] = useState(notifications)
  const unreadCount = items.filter((n) => !n.read).length

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const unread = items.filter((n) => !n.read)

  return (
    <Tabs defaultValue="all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck data-icon="inline-start" />
          Mark all as read
        </Button>
      </div>

      <TabsContent value="all" className="mt-4">
        <NotificationRows items={items} onRead={markRead} />
      </TabsContent>
      <TabsContent value="unread" className="mt-4">
        <NotificationRows items={unread} onRead={markRead} emptyLabel="You're all caught up." />
      </TabsContent>
    </Tabs>
  )
}

function NotificationRows({
  items,
  onRead,
  emptyLabel = "No notifications yet.",
}: {
  items: AgentNotification[]
  onRead: (id: string) => void
  emptyLabel?: string
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
      {items.map((n) => {
        const Icon = categoryIcon[n.category]
        return (
          <li
            key={n.id}
            className={`flex items-start gap-3 px-5 py-4 ${!n.read ? "bg-accent/5" : ""}`}
          >
            <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${categoryTone[n.category]}`}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground/70">{n.timestamp}</p>
            </div>
            {!n.read && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onRead(n.id)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Mark read
                </button>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
