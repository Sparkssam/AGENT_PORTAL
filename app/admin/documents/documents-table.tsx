"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FolderOpen,
  ImageOff,
  MoreHorizontal,
  Search,
  Upload,
  XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import {
  storedDocumentFileName,
  getDocumentFile,
  type Application,
  type Document,
} from "@/lib/domain"
import { downloadBlob, downloadFile } from "@/lib/download"
import { documentTypeLabel, formatBytes } from "@/lib/documents/catalog"
import { signedGet, verifyDocument, rejectDocument } from "@/lib/actions/documents"
import type { ClientVerification } from "@/lib/actions/verifications"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { DocumentRejectDialog } from "@/components/documents/document-reject-dialog"
import { FlaggedVerifications } from "./flagged-verifications"
import { DocumentStatusLabel } from "@/components/admin/status-badge"
import { cn } from "@/lib/utils"

interface FlatDocument extends Document {
  appId: string
  appNumber: string
  agentName: string
  agentCode?: string
  agentId?: string
  channel: string
}

function flattenDocuments(applications: Application[]): FlatDocument[] {
  return applications.flatMap((app) =>
    app.documents.map((doc) => ({
      ...doc,
      appId: app.id,
      appNumber: app.appNumber,
      agentName: app.agentName,
      agentCode: app.agentCode,
      agentId: app.agentId,
      channel: app.channel,
    })),
  )
}

function rowKey(doc: FlatDocument) {
  return `${doc.appId}:${doc.id}`
}

function hasFile(doc: FlatDocument, live: boolean) {
  if (doc.status === "missing") return false
  return live || Boolean(getDocumentFile(doc))
}

function downloadName(doc: FlatDocument) {
  return storedDocumentFileName({
    agentName: doc.agentName,
    agentCode: doc.agentCode,
    agentId: doc.agentId,
    documentType: doc.type,
    extension: doc.fileExtension ?? getDocumentFile(doc)?.extension ?? "png",
  })
}

async function downloadDocument(doc: FlatDocument, live: boolean) {
  if (live) {
    const signed = await signedGet(doc.id, "attachment")
    await downloadFile(signed.getUrl, signed.filename ?? downloadName(doc))
    return
  }
  const file = getDocumentFile(doc)
  if (!file) return
  await downloadFile(file.url, downloadName(doc))
}

const summaryTone: Record<string, string> = {
  default: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
}

function BulkDownloadButton({
  disabled,
  reason,
  children,
  onClick,
}: {
  disabled: boolean
  reason: string
  children: ReactNode
  onClick: () => void
}) {
  const button = (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full portal-download-btn disabled:opacity-100"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
  if (!disabled) return button
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent side="bottom">{reason}</TooltipContent>
    </Tooltip>
  )
}

const PAGE_SIZE = 12

const statusFilters: Array<{ value: string; label: string }> = [
  { value: "all", label: "All" },
  { value: "verified", label: "Approved" },
  { value: "unverified", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "missing", label: "Required" },
]

export function DocumentsTable({
  applications,
  live,
  flagged = [],
}: {
  applications: Application[]
  live: boolean
  flagged?: ClientVerification[]
}) {
  const [apps, setApps] = useState(applications)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [type, setType] = useState("all")
  const [agent, setAgent] = useState("all")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<FlatDocument | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadIntent, setUploadIntent] = useState<"default" | "onBehalf" | "replace">("default")
  const [skipBanner, setSkipBanner] = useState<{ skipped: number; requested: number } | null>(null)
  const [tab, setTab] = useState("library")

  useEffect(() => {
    setApps(applications)
  }, [applications])

  const allDocuments = useMemo(() => flattenDocuments(apps), [apps])

  const types = useMemo(() => Array.from(new Set(allDocuments.map((d) => d.type))).sort(), [allDocuments])
  const agents = useMemo(() => Array.from(new Set(allDocuments.map((d) => d.agentName))).sort(), [allDocuments])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return allDocuments.filter((doc) => {
      const matchesSearch =
        needle === "" ||
        doc.name.toLowerCase().includes(needle) ||
        doc.appNumber.toLowerCase().includes(needle) ||
        doc.agentName.toLowerCase().includes(needle) ||
        documentTypeLabel(doc.type).toLowerCase().includes(needle)
      const matchesStatus = status === "all" || doc.status === status
      const matchesType = type === "all" || doc.type === type
      const matchesAgent = agent === "all" || doc.agentName === agent
      return matchesSearch && matchesStatus && matchesType && matchesAgent
    })
  }, [search, status, type, agent, allDocuments])

  useEffect(() => {
    const allowed = new Set(filtered.map(rowKey))
    setSelectedKeys((keys) => {
      const next = keys.filter((key) => allowed.has(key))
      return next.length === keys.length ? keys : next
    })
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const summary = useMemo(() => {
    return {
      total: allDocuments.length,
      verified: allDocuments.filter((d) => d.status === "verified").length,
      pending: allDocuments.filter((d) => d.status === "unverified").length,
      rejected: allDocuments.filter((d) => d.status === "rejected").length,
      missing: allDocuments.filter((d) => d.status === "missing").length,
    }
  }, [allDocuments])

  const selectableFiltered = useMemo(
    () => filtered.filter((doc) => hasFile(doc, live)),
    [filtered, live],
  )
  const pageSelectable = paged.filter((doc) => hasFile(doc, live))
  const pageKeys = pageSelectable.map(rowKey)
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.includes(key))
  const selectedDocs = allDocuments.filter((doc) => selectedKeys.includes(rowKey(doc)) && hasFile(doc, live))
  const downloadDisabled = bulkBusy || selectedDocs.length === 0
  const matchingDisabled = bulkBusy || selectableFiltered.length === 0
  const downloadReason = "Select documents to download."
  const matchingReason = "No downloadable files match the current filters."

  function setStatusFilter(next: string) {
    setStatus(next)
    setPage(1)
  }

  function toggleKey(key: string, checked: boolean) {
    setSelectedKeys((current) => (checked ? [...current, key] : current.filter((item) => item !== key)))
  }

  function togglePage(checked: boolean) {
    setSelectedKeys((current) => {
      if (checked) return Array.from(new Set([...current, ...pageKeys]))
      return current.filter((key) => !pageKeys.includes(key))
    })
  }

  async function runBulkDownload(docs: FlatDocument[]) {
    const requested = docs.filter((doc) => hasFile(doc, live))
    if (requested.length === 0) return
    setBulkBusy(true)
    setSkipBanner(null)
    setBulkMessage(
      `Preparing ${requested.length} file${requested.length === 1 ? "" : "s"}…`,
    )
    try {
      if (live) {
        const response = await fetch("/api/documents/zip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentIds: requested.map((doc) => doc.id) }),
        })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error ?? "Could not download documents")
        }
        downloadBlob(await response.blob(), "documents.zip")
        const headerSkipped = Number(response.headers.get("X-Documents-Skipped") ?? 0)
        if (headerSkipped > 0) {
          setSkipBanner({ skipped: headerSkipped, requested: requested.length })
        }
      } else {
        for (const doc of requested) {
          await downloadDocument(doc, false)
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }
      setBulkMessage(`${requested.length} file${requested.length === 1 ? "" : "s"} downloaded.`)
    } catch (error) {
      setBulkMessage(error instanceof Error ? error.message : "Download failed")
    } finally {
      setBulkBusy(false)
      window.setTimeout(() => setBulkMessage(null), 2500)
    }
  }

  function openUpload(doc: FlatDocument, intent: "onBehalf" | "replace") {
    setSelected(doc)
    setUploadIntent(intent)
    setUploadOpen(true)
  }

  function openByDocumentId(documentId: string) {
    const match = allDocuments.find((doc) => doc.id === documentId)
    if (match) {
      setTab("library")
      setSelected(match)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { value: "all", label: "Total files", count: summary.total, icon: FolderOpen, tone: "default" as const },
          { value: "verified", label: "Approved", count: summary.verified, icon: CheckCircle2, tone: "success" as const },
          { value: "unverified", label: "Pending", count: summary.pending, icon: Clock, tone: "warning" as const },
          { value: "rejected", label: "Rejected", count: summary.rejected, icon: XCircle, tone: "destructive" as const },
          { value: "missing", label: "Required", count: summary.missing, icon: AlertTriangle, tone: "default" as const },
        ].map((card) => {
          const Icon = card.icon
          const active = status === card.value
          return (
            <button
              key={card.value}
              type="button"
              onClick={() => setStatusFilter(card.value)}
              className={cn(
                "portal-stat-card text-left transition",
                active ? "ring-2 ring-accent/50" : "hover:bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("size-1.5 rounded-full", summaryTone[card.tone])} />
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                </div>
                <Icon className="size-4 text-muted-foreground/60" />
              </div>
              <p className="font-mono text-2xl font-medium tabular-nums tracking-tight text-foreground">
                {card.count.toLocaleString("en-US")}
              </p>
            </button>
          )
        })}
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value ?? "library")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            {live ? (
              <TabsTrigger value="flagged">
                Flagged{flagged.length > 0 ? ` (${flagged.length})` : ""}
              </TabsTrigger>
            ) : null}
          </TabsList>
          {bulkMessage ? <p className="text-xs text-muted-foreground">{bulkMessage}</p> : null}
        </div>

        <TabsContent value="library" className="flex flex-col gap-4">
          <div className="portal-card flex flex-col gap-4">
            <div className="portal-toolbar">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search documents, agents, or application numbers…"
                  aria-label="Search documents"
                  className="pl-9"
                />
              </div>
              <div className="flex w-full flex-wrap gap-2 lg:w-auto">
              <Select
                value={agent}
                onValueChange={(v) => {
                  setAgent(v ?? "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All agents</SelectItem>
                    {agents.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v ?? "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    {types.map((code) => (
                      <SelectItem key={code} value={code}>
                        {documentTypeLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {statusFilters.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={status === item.value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setStatusFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <BulkDownloadButton
                    disabled={downloadDisabled}
                    reason={downloadReason}
                    onClick={() => void runBulkDownload(selectedDocs)}
                  >
                    <Download data-icon="inline-start" />
                    Download{selectedDocs.length ? ` (${selectedDocs.length})` : ""}
                  </BulkDownloadButton>
                  <BulkDownloadButton
                    disabled={matchingDisabled}
                    reason={matchingReason}
                    onClick={() => void runBulkDownload(selectableFiltered)}
                  >
                    <Download data-icon="inline-start" />
                    Download matching
                  </BulkDownloadButton>
                </div>
              </div>
            </div>
            {skipBanner ? (
              <div className="rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
                {skipBanner.skipped} of {skipBanner.requested} not included — no file stored
              </div>
            ) : null}
          </div>

          <div className="portal-table">
            <table className="w-full text-sm">
              <thead>
                <tr className="portal-table-head">
                  <th className="w-10 px-3 py-2">
                    <Checkbox
                      checked={allPageSelected}
                      disabled={pageKeys.length === 0}
                      onCheckedChange={(value) => togglePage(value === true)}
                      aria-label="Select downloadable files on this page"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Document</th>
                  <th className="px-3 py-2 font-medium">Agent</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Application</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((doc) => {
                  const key = rowKey(doc)
                  const canSelect = hasFile(doc, live)
                  return (
                    <tr
                      key={key}
                      onClick={() => setSelected(doc)}
                      className="portal-table-row cursor-pointer"
                    >
                      <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedKeys.includes(key)}
                          disabled={!canSelect}
                          onCheckedChange={(value) => toggleKey(key, value === true)}
                          aria-label={`Select ${doc.name}`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/50">
                            {doc.fileType === "image" && doc.previewUrl ? (
                              <Image
                                src={doc.previewUrl}
                                alt=""
                                width={32}
                                height={32}
                                unoptimized
                                className="size-8 object-cover"
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <FileText className="size-3.5 text-muted-foreground" />
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{doc.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc.originalName ?? doc.storedFileName ?? doc.fileType.toUpperCase()}
                              {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{doc.agentName}</td>
                      <td className="px-3 py-2 text-muted-foreground">{documentTypeLabel(doc.type)}</td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/applications/${doc.appId}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {doc.appNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <DocumentStatusLabel status={doc.status} adminUploaded={doc.adminUploaded} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full"
                            onClick={() => setSelected(doc)}
                            aria-label="Preview"
                          >
                            <Eye />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-full"
                                  aria-label="Document actions"
                                />
                              }
                            >
                              <MoreHorizontal />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-56">
                              <DropdownMenuItem
                                disabled={!canSelect || bulkBusy}
                                onClick={() => {
                                  void downloadDocument(doc, live).catch((error) => {
                                    setBulkMessage(error instanceof Error ? error.message : "Download failed")
                                  })
                                }}
                              >
                                <Download />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openUpload(doc, "onBehalf")}>
                                <Upload />
                                Upload on behalf of agent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={doc.status === "missing"}
                                onClick={() => openUpload(doc, "replace")}
                              >
                                Replace document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="portal-empty">
                      <p className="portal-empty-title">No documents match</p>
                      <p className="portal-empty-copy">Try a different search, or clear a filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
            <p>
              Showing {paged.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}{" "}
              of {filtered.length}
              {selectedDocs.length ? ` · ${selectedDocs.length} selected` : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        {live ? (
          <TabsContent value="flagged">
            <FlaggedVerifications items={flagged} onPreview={openByDocumentId} />
          </TabsContent>
        ) : null}
      </Tabs>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  File from {selected.agentName}. Open the application to review the case.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4">
                <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40">
                  {selected.fileType === "image" && selected.previewUrl ? (
                    <Image
                      src={selected.previewUrl || "/placeholder.svg"}
                      alt={selected.name}
                      width={400}
                      height={300}
                      unoptimized={Boolean(selected.previewUrl)}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : selected.fileType === "pdf" && selected.status !== "missing" ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <FileText className="size-10" />
                      <span className="text-xs">PDF document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageOff className="size-10" />
                      <span className="text-xs">No preview available</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <DocumentStatusLabel status={selected.status} adminUploaded={selected.adminUploaded} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified by</p>
                    <p className="mt-1 text-foreground">{selected.verifiedBy ?? "Not yet verified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Original file</p>
                    <p className="mt-1 truncate text-foreground">{selected.originalName ?? selected.storedFileName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stored as</p>
                    <p className="mt-1 truncate font-mono text-xs text-foreground">{selected.storedFileName ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Document type</p>
                    <p className="mt-1 text-foreground">{documentTypeLabel(selected.type)}</p>
                  </div>
                </div>
                {selected.status === "rejected" && selected.reason && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-3 py-2">
                    <p className="text-xs font-medium text-destructive">Rejection reason</p>
                    <p className="mt-0.5 text-sm text-destructive/90">{selected.reason}</p>
                  </div>
                )}
                {selected.verificationIssues?.length ? (
                  <div className="rounded-md border border-border bg-secondary/40 px-3 py-2">
                    <p className="text-xs font-medium text-foreground">Automated check</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{selected.verificationIssues.join(". ")}</p>
                    {selected.extractedName || selected.extractedIdNumber ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        OCR: {[selected.extractedName, selected.extractedIdNumber, selected.extractedExpiry]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                    {typeof selected.verificationConfidence === "number" ? (
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        Confidence {Math.round(selected.verificationConfidence * 100)}%
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <SheetFooter className="gap-2">
                {hasFile(selected, live) && (
                  <Button
                    className="w-full justify-center"
                    onClick={() => void downloadDocument(selected, live)}
                  >
                    <Download data-icon="inline-start" />
                    Download file
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  onClick={() => {
                    setUploadIntent("onBehalf")
                    setUploadOpen(true)
                  }}
                >
                  <Upload data-icon="inline-start" />
                  Upload on behalf of agent
                </Button>
                {selected.status !== "missing" ? (
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    onClick={() => {
                      setUploadIntent("replace")
                      setUploadOpen(true)
                    }}
                  >
                    Replace document
                  </Button>
                ) : null}
                {selected.status !== "missing" && (
                  <div className="grid w-full grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => setRejectOpen(true)}
                    >
                      Request re-upload
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        try {
                          if (live) await verifyDocument(selected.id)
                          const next = {
                            ...selected,
                            status: "verified" as const,
                            verifiedBy: "Registry",
                            adminUploaded: false,
                          }
                          setSelected(next)
                          setApps((current) =>
                            current.map((app) =>
                              app.id === selected.appId
                                ? {
                                    ...app,
                                    documents: app.documents.map((doc) => (doc.id === selected.id ? { ...doc, ...next } : doc)),
                                  }
                                : app,
                            ),
                          )
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      Mark approved
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  render={<Link href={`/admin/applications/${selected.appId}`} />}
                  className="w-full justify-center"
                >
                  Open application
                </Button>
                <SheetClose render={<Button variant="ghost" className="w-full justify-center" />}>
                  Close
                </SheetClose>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
      <DocumentRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        documentName={selected?.name}
        busy={busy}
        onConfirm={async (reason) => {
          if (!selected) return
          setBusy(true)
          try {
            if (live) await rejectDocument(selected.id, reason)
            const next = { ...selected, status: "rejected" as const, reason }
            setSelected(next)
            setApps((current) =>
              current.map((app) =>
                app.id === selected.appId
                  ? {
                      ...app,
                      documents: app.documents.map((doc) => (doc.id === selected.id ? { ...doc, ...next } : doc)),
                    }
                  : app,
              ),
            )
          } finally {
            setBusy(false)
          }
        }}
      />
      {selected ? (
        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={(open) => {
            setUploadOpen(open)
            if (!open) setUploadIntent("default")
          }}
          applicationId={selected.appId}
          documents={apps.find((app) => app.id === selected.appId)?.documents ?? [selected]}
          initialType={selected.type}
          live={live}
          intent={uploadIntent}
          onComplete={(nextDocs) => {
            setApps((current) => current.map((app) => (app.id === selected.appId ? { ...app, documents: nextDocs } : app)))
            const updated = nextDocs.find((doc) => doc.type === selected.type)
            if (updated) setSelected({ ...selected, ...updated })
          }}
        />
      ) : null}
    </div>
  )
}
