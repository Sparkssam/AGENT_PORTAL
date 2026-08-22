"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { AppStatusBadge, DepositStatusBadge } from "@/components/admin/status-badge"
import { TablePagination } from "@/components/table-pagination"
import { computeCaseHealth, statusLabels, type Application, type AppStatus, type HealthTone } from "@/lib/domain"
import { NETWORK_CHANNELS } from "@/lib/lookups/catalog"
import { filterApplications } from "@/lib/applications/filters"
import { applicationsCsv } from "@/lib/actions/export"
import { bulkUpdateStatus } from "@/lib/actions/applications"
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

const bulkable = new Set<AppStatus>(["PENDING_REVIEW", "IN_PROGRESS"])

export function ApplicationsTable({
  applications,
  initialQuery = "",
  live = false,
  canFinalize = false,
}: {
  applications: Application[]
  initialQuery?: string
  live?: boolean
  canFinalize?: boolean
}) {
  const [query, setQuery] = useState(initialQuery)
  const [status, setStatus] = useState<string>("all")
  const [channel, setChannel] = useState<string>("all")
  const [province, setProvince] = useState("")
  const [submittedFrom, setSubmittedFrom] = useState("")
  const [submittedTo, setSubmittedTo] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectNote, setRejectNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    setQuery(initialQuery)
    setPage(1)
  }, [initialQuery])

  const filtered = useMemo(
    () =>
      filterApplications(applications, {
        query,
        status,
        channel,
        province,
        submittedFrom,
        submittedTo,
      }),
    [applications, query, status, channel, province, submittedFrom, submittedTo],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)
  const pagedIds = paged.map((app) => app.id)
  const allPagedSelected = pagedIds.length > 0 && pagedIds.every((id) => selected.includes(id))
  const selectedApps = applications.filter((app) => selected.includes(app.id))
  const canBulk = selectedApps.filter((app) => bulkable.has(app.status))

  async function handleExport() {
    if (!live) return
    const csv = await applicationsCsv({
      query,
      status,
      channel,
      province,
      submittedFrom,
      submittedTo,
      ids: filtered.map((app) => app.id),
    })
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "applications.csv"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  async function runBulk(next: "COMPLETED" | "REJECTED", note?: string) {
    if (!live || !canBulk.length) return
    setBusy(true)
    setMessage(null)
    try {
      const result = await bulkUpdateStatus(
        canBulk.map((app) => app.id),
        next,
        note,
      )
      setSelected([])
      setRejectOpen(false)
      setRejectNote("")
      setMessage(
        result.failed.length
          ? `Updated ${result.updated}. ${result.failed.length} could not be changed.`
          : `Updated ${result.updated} application${result.updated === 1 ? "" : "s"}.`,
      )
      window.location.reload()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update applications")
    } finally {
      setBusy(false)
    }
  }

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
            placeholder="Search name, application number, phone, ID, or TIN..."
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

          <Input
            value={province}
            onChange={(e) => {
              setProvince(e.target.value)
              setPage(1)
            }}
            placeholder="Region"
            aria-label="Filter by region"
            className="w-full sm:w-[140px]"
          />
          <Input
            type="date"
            value={submittedFrom}
            onChange={(e) => {
              setSubmittedFrom(e.target.value)
              setPage(1)
            }}
            aria-label="Submitted from"
            className="w-full sm:w-[150px]"
          />
          <Input
            type="date"
            value={submittedTo}
            onChange={(e) => {
              setSubmittedTo(e.target.value)
              setPage(1)
            }}
            aria-label="Submitted to"
            className="w-full sm:w-[150px]"
          />
          <Button variant="outline" onClick={() => void handleExport()} disabled={!live}>
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      {canBulk.length > 0 && canFinalize ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm shadow-sm ring-1 ring-border/60">
          <span className="text-muted-foreground">{canBulk.length} selected for review actions</span>
          <Button size="sm" disabled={busy || !live} onClick={() => void runBulk("COMPLETED")}>
            Approve selected
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !live} onClick={() => setRejectOpen(true)}>
            Reject selected
          </Button>
        </div>
      ) : null}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="portal-table">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="portal-table-head">
                <th className="px-4 py-3">
                  <Checkbox
                    checked={allPagedSelected}
                    onCheckedChange={(value) => {
                      setSelected((current) => {
                        if (value === true) return [...new Set([...current, ...pagedIds])]
                        return current.filter((id) => !pagedIds.includes(id))
                      })
                    }}
                    aria-label="Select page"
                    className="size-5"
                  />
                </th>
                <th className="px-4 py-3">App Number</th>
                <th className="px-4 py-3">Agent Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3 hidden md:table-cell">Region</th>
                <th className="px-4 py-3 hidden lg:table-cell">Health</th>
                <th className="px-4 py-3">App Status</th>
                <th className="px-4 py-3 hidden sm:table-cell">Dep. Status</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((app) => {
                const health = computeCaseHealth(app)
                const meta = healthMeta[health.tone]
                return (
                <tr key={app.id} className="portal-table-row">
                  <td className="px-4 py-3.5">
                    <Checkbox
                      checked={selected.includes(app.id)}
                      onCheckedChange={(value) => {
                        setSelected((current) =>
                          value === true ? [...current, app.id] : current.filter((id) => id !== app.id),
                        )
                      }}
                      aria-label={`Select ${app.appNumber}`}
                      className="size-5"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/applications/${app.id}`} className="font-mono text-sm font-medium text-foreground hover:underline">
                      {app.appNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{app.agentName}</td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground">{app.phone}</td>
                  <td className="px-4 py-3.5 text-foreground">{app.channel}</td>
                  <td className="px-4 py-3.5 hidden text-foreground md:table-cell">{app.province || "—"}</td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
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
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <DepositStatusBadge status={app.depositStatus} />
                  </td>
                </tr>
              )})}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={9} className="portal-empty">
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

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject selected applications</AlertDialogTitle>
            <AlertDialogDescription>
              This moves {canBulk.length} case{canBulk.length === 1 ? "" : "s"} to Rejected. Agents will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            placeholder="Rejection reason"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || rejectNote.trim().length < 3}
              onClick={() => void runBulk("REJECTED", rejectNote.trim())}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
