"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Phone, Mail, Calendar, FileStack } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AppStatusBadge } from "@/components/admin/status-badge"
import { statusLabels, type Agent, type Application, type AppStatus } from "@/lib/domain"
import { setAgentStatus } from "@/lib/actions/agents"

const channelOptions: Agent["channel"][] = ["Retail Partner", "Direct Sales", "Third-Party"]
const progressOptions: AppStatus[] = [
  "COMPLETED",
  "SUBMITTED",
  "NEEDS_CORRECTION",
  "PENDING_REVIEW",
  "IN_PROGRESS",
  "DRAFT",
  "REJECTED",
]

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function applyStatus(agent: Agent, status: Agent["status"]): Agent {
  return { ...agent, status }
}

function AgentAccountActions({
  agent,
  busy,
  onActivate,
  onSuspend,
  size = "sm",
}: {
  agent: Agent
  busy: boolean
  onActivate: () => void
  onSuspend: () => void
  size?: "sm" | "default"
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {agent.status !== "Active" ? (
        <Button type="button" size={size} disabled={busy} onClick={onActivate}>
          Activate
        </Button>
      ) : null}
      {agent.status !== "Suspended" ? (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size={size}
                variant="destructive"
                disabled={busy}
              />
            }
          >
            Suspend
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Suspend {agent.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                They will stay signed in but cannot submit applications or upload documents until you activate the
                account again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onSuspend}>
                Suspend agent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  )
}

const PAGE_SIZE = 6

export function AgentsTable({
  agents,
  applications,
}: {
  agents: Agent[]
  applications: Array<Pick<Application, "id" | "agentId" | "agentName" | "appNumber" | "status">>
}) {
  const router = useRouter()
  const [rows, setRows] = useState(agents)
  const [query, setQuery] = useState("")
  const [channel, setChannel] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setRows(agents)
    setSelectedAgent((current) => {
      if (!current) return current
      return agents.find((row) => row.id === current.id) ?? current
    })
  }, [agents])

  const filtered = useMemo(() => {
    return rows.filter((a) => {
      const matchesQuery =
        query.trim() === "" ||
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.agentId.toLowerCase().includes(query.toLowerCase()) ||
        a.phone.includes(query)
      const matchesChannel = channel === "all" || a.channel === channel
      const matchesStatus = status === "all" || (a.applicationStatus ?? "DRAFT") === status
      return matchesQuery && matchesChannel && matchesStatus
    })
  }, [rows, query, channel, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length)

  const selectedAgentApps = useMemo(
    () =>
      selectedAgent
        ? applications.filter(
            (app) => app.agentId === selectedAgent.id || (!app.agentId && app.agentName === selectedAgent.name),
          )
        : [],
    [selectedAgent, applications],
  )

  async function changeStatus(agent: Agent, next: "active" | "suspended") {
    const label: Agent["status"] = next === "active" ? "Active" : "Suspended"
    setBusyId(agent.id)
    setError(null)
    setRows((current) => current.map((row) => (row.id === agent.id ? applyStatus(row, label) : row)))
    setSelectedAgent((current) => (current?.id === agent.id ? applyStatus(current, label) : current))
    try {
      await setAgentStatus(agent.id, next)
      router.refresh()
    } catch (err) {
      setRows((current) => current.map((row) => (row.id === agent.id ? agent : row)))
      setSelectedAgent((current) => (current?.id === agent.id ? agent : current))
      setError(err instanceof Error ? err.message : "Could not update agent status")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search agent name, agent ID, or phone..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={channel}
            onValueChange={(v) => {
              setChannel(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Channel: All</SelectItem>
                {channelOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? "all")
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Status: All</SelectItem>
                {progressOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s]}
                  </SelectItem>
                ))}
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
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3">Agent ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Applications</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Account</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((agent) => (
                <tr
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
                          {initials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground">{agent.agentId}</td>
                  <td className="px-4 py-3.5 font-mono text-muted-foreground">{agent.phone}</td>
                  <td className="px-4 py-3.5 text-foreground">{agent.channel}</td>
                  <td className="px-4 py-3.5 text-foreground">{agent.apps}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <AppStatusBadge status={agent.applicationStatus ?? "DRAFT"} />
                      {agent.status === "Suspended" ? (
                        <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-destructive uppercase">
                          Suspended
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{agent.joined}</td>
                  <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end">
                      <AgentAccountActions
                        agent={agent}
                        busy={busyId === agent.id}
                        onActivate={() => void changeStatus(agent, "active")}
                        onSuspend={() => void changeStatus(agent, "suspended")}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No agents match your filters.
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
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            {Array.from({ length: totalPages })
              .slice(0, 3)
              .map((_, i) => (
                <Button key={i} variant={page === i + 1 ? "default" : "outline"} size="icon" onClick={() => setPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
            <Button
              variant="outline"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <SheetContent>
          {selectedAgent && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-secondary text-sm font-semibold text-secondary-foreground">
                      {initials(selectedAgent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selectedAgent.name}</SheetTitle>
                    <SheetDescription className="font-mono">{selectedAgent.agentId}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AppStatusBadge status={selectedAgent.applicationStatus ?? "DRAFT"} />
                    {selectedAgent.status === "Suspended" ? (
                      <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-[11px] font-semibold tracking-wide text-destructive uppercase">
                        Suspended
                      </span>
                    ) : null}
                  </div>
                  <AgentAccountActions
                    agent={selectedAgent}
                    busy={busyId === selectedAgent.id}
                    size="default"
                    onActivate={() => void changeStatus(selectedAgent, "active")}
                    onSuspend={() => void changeStatus(selectedAgent, "suspended")}
                  />
                </div>

                <div className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="font-mono text-foreground">{selectedAgent.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedAgent.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileStack className="size-4 text-muted-foreground" />
                    <span className="text-foreground">{selectedAgent.channel}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-foreground">Joined {selectedAgent.joined}</span>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Applications ({selectedAgentApps.length})</p>
                  {selectedAgentApps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No applications on file for this agent.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {selectedAgentApps.map((app) => (
                        <li
                          key={app.id}
                          className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                        >
                          <span className="font-mono text-sm text-foreground">{app.appNumber}</span>
                          <AppStatusBadge status={app.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
