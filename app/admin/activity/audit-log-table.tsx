"use client"

import { useMemo, useState } from "react"
import {
  FileText,
  FolderOpen,
  Info,
  Search,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AuditCategory, type AuditLogEntry, type AuditSeverity } from "@/lib/admin-data"
import { describeAudit } from "@/lib/audit/describe"
import { TablePagination } from "@/components/table-pagination"
import { cn } from "@/lib/utils"

const categoryOptions: AuditCategory[] = ["Application", "Document", "Agent", "System", "Security"]

const severityConfig: Record<
  AuditSeverity,
  { className: string; icon: typeof Info; bar: string }
> = {
  info: { className: "status-badge-muted", icon: Info, bar: "bg-muted-foreground/40" },
  warning: { className: "status-badge-warning", icon: TriangleAlert, bar: "bg-warning" },
  critical: { className: "status-badge-destructive", icon: ShieldAlert, bar: "bg-destructive" },
}

const categoryIcon: Record<AuditCategory, typeof FileText> = {
  Application: FileText,
  Document: FolderOpen,
  Agent: UserRound,
  System: ShieldCheck,
  Security: ShieldAlert,
}

const PAGE_SIZE = 8

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [severity, setSeverity] = useState<string>("all")
  const [page, setPage] = useState(1)

  const described = useMemo(() => entries.map((entry) => ({ entry, view: describeAudit(entry) })), [entries])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return described.filter(({ entry, view }) => {
      const matchesQuery =
        needle === "" ||
        view.actor.toLowerCase().includes(needle) ||
        view.headline.toLowerCase().includes(needle) ||
        view.summary.toLowerCase().includes(needle) ||
        view.target.toLowerCase().includes(needle) ||
        entry.action.toLowerCase().includes(needle) ||
        entry.detail.toLowerCase().includes(needle)
      const matchesCategory = category === "all" || entry.category === category
      const matchesSeverity = severity === "all" || entry.severity === severity
      return matchesQuery && matchesCategory && matchesSeverity
    })
  }, [query, category, severity, described])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)
  const attention = entries.filter((entry) => entry.severity !== "info").length
  const urgent = entries.filter((entry) => entry.severity === "critical").length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Events</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">
            {entries.length.toLocaleString("en-US")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Latest activity in this hub</p>
        </div>
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Needs attention</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">
            {attention.toLocaleString("en-US")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Warnings and urgent items</p>
        </div>
        <div className="portal-card-muted py-4">
          <p className="portal-kicker">Urgent</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">
            {urgent.toLocaleString("en-US")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Security or system failures</p>
        </div>
      </div>

      <div className="portal-card portal-toolbar">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search who did what, or an application number..."
            aria-label="Search activity"
            className="pl-9"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filter by type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All types</SelectItem>
                {categoryOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "Agent" ? "Agent account" : item}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={severity}
            onValueChange={(v) => {
              setSeverity(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filter by importance">
              <SelectValue placeholder="Importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All importance</SelectItem>
                <SelectItem value="info">Recorded</SelectItem>
                <SelectItem value="warning">Needs attention</SelectItem>
                <SelectItem value="critical">Urgent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="portal-table">
        {paged.length === 0 ? (
          <div className="portal-empty">
            <p className="portal-empty-title">No activity matches</p>
            <p className="portal-empty-copy">Try a different search, or clear a filter.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {paged.map(({ entry, view }) => {
              const tone = severityConfig[entry.severity]
              const Icon = categoryIcon[entry.category]
              const SeverityIcon = tone.icon
              return (
                <li key={entry.id} className="flex gap-3 px-5 py-4">
                  <span className={cn("mt-1 w-1 shrink-0 rounded-full", tone.bar)} aria-hidden />
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-foreground">{view.headline}</p>
                      <p className="font-mono text-xs text-muted-foreground tabular-nums">{view.relative}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{view.summary}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="text-foreground">{view.actor}</span>
                        {view.role ? ` · ${view.role}` : ""}
                      </span>
                      {view.target ? (
                        <span className="font-mono text-foreground">{view.target}</span>
                      ) : null}
                      <span className={cn("status-badge gap-1", tone.className)}>
                        <SeverityIcon className="size-3" />
                        {view.severity.label}
                      </span>
                      <span className="status-badge status-badge-muted">{view.category}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      {view.when}
                      {view.ip ? ` · From ${view.ip}` : ""}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <TablePagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={filtered.length}
          onPage={setPage}
          noun="events"
        />
      </div>
    </div>
  )
}
