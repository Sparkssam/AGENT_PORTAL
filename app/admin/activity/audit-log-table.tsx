"use client"

import { useMemo, useState } from "react"
import { Search, Info, TriangleAlert, ShieldAlert } from "lucide-react"
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
import { TablePagination } from "@/components/table-pagination"
import { cn } from "@/lib/utils"

const categoryOptions: AuditCategory[] = ["Application", "Document", "Agent", "System", "Security"]

const severityConfig: Record<AuditSeverity, { label: string; className: string; icon: typeof Info }> = {
  info: { label: "Info", className: "status-badge-muted", icon: Info },
  warning: { label: "Warning", className: "status-badge-warning", icon: TriangleAlert },
  critical: { label: "Critical", className: "status-badge-destructive", icon: ShieldAlert },
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const PAGE_SIZE = 8

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [severity, setSeverity] = useState<string>("all")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery =
        query.trim() === "" ||
        entry.actor.toLowerCase().includes(query.toLowerCase()) ||
        entry.action.toLowerCase().includes(query.toLowerCase()) ||
        entry.target.toLowerCase().includes(query.toLowerCase()) ||
        entry.detail.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === "all" || entry.category === category
      const matchesSeverity = severity === "all" || entry.severity === severity
      return matchesQuery && matchesCategory && matchesSeverity
    })
  }, [query, category, severity, entries])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  return (
    <div className="flex flex-col gap-4">
      <div className="portal-card portal-toolbar">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search actor, action, target, or detail..."
            aria-label="Search audit log"
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
            <SelectTrigger className="w-full sm:w-[160px]" aria-label="Filter by category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Category: All</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
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
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter by severity">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Severity: All</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="portal-table">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="portal-table-head">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((entry) => {
                const config = severityConfig[entry.severity]
                const SeverityIcon = config.icon
                return (
                  <tr key={entry.id} className="portal-table-row">
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{entry.actor}</div>
                      <div className="text-xs text-muted-foreground">{entry.actorRole}</div>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{entry.category}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{entry.action}</div>
                      <div className="text-xs text-muted-foreground">{entry.detail}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-foreground">{entry.target}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("status-badge gap-1.5", config.className)}>
                        <SeverityIcon className="size-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{entry.ipAddress}</td>
                  </tr>
                )
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="portal-empty">
                    <p className="portal-empty-title">No audit entries match</p>
                    <p className="portal-empty-copy">Try a different search, or clear a filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          total={filtered.length}
          onPage={setPage}
          noun="entries"
        />
      </div>
    </div>
  )
}
