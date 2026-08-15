"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
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
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { applications, computeCaseHealth, statusLabels, type AppStatus, type HealthTone } from "@/lib/admin-data"
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

export function ApplicationsTable() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<string>("all")
  const [channel, setChannel] = useState<string>("all")
  const [sector, setSector] = useState<string>("all")
  const [page, setPage] = useState(1)

  const channels = useMemo(() => Array.from(new Set(applications.map((a) => a.channel))), [])
  const sectors = useMemo(() => Array.from(new Set(applications.map((a) => a.sector))), [])

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesQuery =
        query.trim() === "" ||
        app.appNumber.toLowerCase().includes(query.toLowerCase()) ||
        app.agentName.toLowerCase().includes(query.toLowerCase()) ||
        app.phone.includes(query)
      const matchesStatus = status === "all" || app.status === status
      const matchesChannel = channel === "all" || app.channel === channel
      const matchesSector = sector === "all" || app.sector === sector
      return matchesQuery && matchesStatus && matchesChannel && matchesSector
    })
  }, [query, status, channel, sector])

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
            placeholder="Search application number, agent name, or phone..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Channel: All</SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={sector}
            onValueChange={(v) => {
              setSector(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Sector: All</SelectItem>
                {sectors.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <SlidersHorizontal data-icon="inline-start" />
            More
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
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
                <tr key={app.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
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
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No applications match your filters.
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
              <Button
                key={i}
                variant={page === i + 1 ? "default" : "outline"}
                size="icon"
                onClick={() => setPage(i + 1)}
              >
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

