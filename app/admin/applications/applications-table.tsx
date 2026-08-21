"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { TablePagination } from "@/components/table-pagination"
import { computeCaseHealth, statusLabels, type Application, type AppStatus, type HealthTone } from "@/lib/domain"
import { NETWORK_CHANNELS, channelMatchesFilter } from "@/lib/lookups/catalog"
import { cn } from "@/lib/utils"

const statusOptions: AppStatus[] = [
  "SUBMITTED",
  "PENDING_REVIEW",
  "IN_PROGRESS",
  "NEEDS_CORRECTION",
  "COMPLETED",
  "REJECTED",
]

const PAGE_SIZE = 6

const healthMeta: Record<HealthTone, { label: string; className: string }> = {
  healthy: { label: "On track", className: "bg-success" },
  attention: { label: "Attention", className: "bg-warning" },
  critical: { label: "Critical", className: "bg-destructive" },
  neutral: { label: "In progress", className: "bg-accent" },
}

export function ApplicationsTable({
  applications,
  initialQuery = "",
}: {
  applications: Application[]
  initialQuery?: string
}) {
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState<string>("all")
  const [channel, setChannel] = useState<string>("all")
  const [page, setPage] = useState(1)

  useEffect(() => {
    setQuery(initialQuery)
    setPage(1)
  }, [initialQuery])

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesQuery =
        query.trim() === "" ||
        app.appNumber.toLowerCase().includes(query.toLowerCase()) ||
        app.agentName.toLowerCase().includes(query.toLowerCase()) ||
        app.phone.includes(query) ||
        app.idNumber.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || app.status === status
      const matchesChannel = channelMatchesFilter(app.channel, channel)
      return matchesQuery && matchesStatus && matchesChannel
    })
  }, [query, status, channel, applications])

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
            id="applications-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search application number, agent name, or phone..."
            aria-label="Search applications"
            className="pl-9"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Status: All</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={channel}
            onValueChange={(v) => {
              setChannel(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filter by channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Channel: All</SelectItem>
                {NETWORK_CHANNELS.map((item) => (
                  <SelectItem key={item.code} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
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
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Sector</th>
                <th className="px-4 py-3">Health</th>
                <th className="px-4 py-3">App Status</th>
                <th className="px-4 py-3">Dep. Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((app) => {
                const health = computeCaseHealth(app)
                const meta = healthMeta[health.tone]
                return (
                <tr key={app.id} className="portal-table-row">
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/applications/${app.id}`} className="font-mono text-sm font-medium text-foreground hover:underline">
                      {app.appNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{app.agentName}</td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground">{app.phone}</td>
                  <td className="px-4 py-3.5 text-foreground">{app.channel}</td>
                  <td className="px-4 py-3.5 text-foreground">{app.sector}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-28 items-center gap-2">
                      <span className={cn("size-2 rounded-full", meta.className)} aria-hidden="true" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{meta.label}</p>
                        <p className="text-[11px] text-muted-foreground">{health.docsVerified}/{health.docsTotal} docs</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <AppStatusBadge status={app.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <DepositStatusBadge status={app.depositStatus} />
                  </td>
                </tr>
              )})}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="portal-empty">
                    <p className="portal-empty-title">No applications match</p>
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
          noun="applications"
        />
      </div>
    </div>
  )
}

