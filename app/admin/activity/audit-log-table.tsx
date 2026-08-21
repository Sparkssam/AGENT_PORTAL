"use client"

import { useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, Info, TriangleAlert, ShieldAlert } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type AuditCategory, type AuditLogEntry, type AuditSeverity } from "@/lib/admin-data"
import { cn } from "@/lib/utils"

const categoryOptions: AuditCategory[] = ["Application", "Document", "Agent", "System", "Security"]

const severityConfig: Record<AuditSeverity, { label: string; className: string; icon: typeof Info }> = {
  info: { label: "Info", className: "bg-secondary text-foreground", icon: Info },
  warning: { label: "Warning", className: "bg-chart-3/15 text-chart-3", icon: TriangleAlert },
  critical: { label: "Critical", className: "bg-destructive/10 text-destructive", icon: ShieldAlert },
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search actor, action, target, or detail..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
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
            <SelectTrigger className="w-[150px]">
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

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
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
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
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
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          config.className,
                        )}
                      >
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
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No audit entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-secondary/30 px-4 py-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{rangeStart}</span> to{" "}
            <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span> results
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages }).slice(0, 3).map((_, i) => (
              <Button key={i} variant={page === i + 1 ? "default" : "outline"} size="icon" onClick={() => setPage(i + 1)}>
                {i + 1}
              </Button>
            ))}
            <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
