"use client"

import { useEffect, useMemo, useState } from "react"
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
  Search,
  Upload,
  XCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  buildDocumentFileName,
  getDocumentFile,
  type Application,
  type Document,
  type DocumentStatus,
} from "@/lib/domain"
import { downloadFile } from "@/lib/download"
import { documentTypeLabel, formatBytes } from "@/lib/documents/catalog"
import { signedGet, verifyDocument, rejectDocument } from "@/lib/actions/documents"
import type { ClientVerification } from "@/lib/actions/verifications"
import { DocumentUploadDialog } from "@/components/documents/document-upload-dialog"
import { DocumentRejectDialog } from "@/components/documents/document-reject-dialog"
import { FlaggedVerifications } from "./flagged-verifications"
import { cn } from "@/lib/utils"

interface FlatDocument extends Document {
  appId: string
  appNumber: string
  agentName: string
  channel: string
}

function flattenDocuments(applications: Application[]): FlatDocument[] {
  return applications.flatMap((app) =>
    app.documents.map((doc) => ({
      ...doc,
      appId: app.id,
      appNumber: app.appNumber,
      agentName: app.agentName,
      channel: app.channel,
    })),
  )
}

function rowKey(doc: FlatDocument) {
  return `${doc.appId}:${doc.id}`
}

function isDownloadable(doc: FlatDocument, live: boolean) {
  if (doc.status === "missing") return false
  return live || Boolean(getDocumentFile(doc))
}

async function downloadDocument(doc: FlatDocument, live: boolean) {
  if (live) {
    try {
      const signed = await signedGet(doc.id, "attachment")
      await downloadFile(signed.getUrl, signed.filename ?? `${doc.name}.png`)
      return
    } catch {
      // fall through to local file
    }
  }
  const file = getDocumentFile(doc)
  if (!file) return
  const filename = buildDocumentFileName({
    agentName: doc.agentName,
    docName: doc.name,
    network: doc.channel,
    extension: file.extension,
  })
  await downloadFile(file.url, filename)
}

async function downloadMany(docs: FlatDocument[], live: boolean) {
  for (const doc of docs) {
    await downloadDocument(doc, live)
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

function DocStatusBadge({ status }: { status: DocumentStatus }) {
  const styles: Record<DocumentStatus, string> = {
    verified: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
    unverified: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
    rejected: "bg-destructive/10 text-destructive",
    missing: "bg-muted text-muted-foreground",
  }
  const labels: Record<DocumentStatus, string> = {
    verified: "Approved",
    unverified: "Pending",
    rejected: "Rejected",
    missing: "Required",
  }
  return <Badge className={cn("border-0 font-medium", styles[status])}>{labels[status]}</Badge>
}

const PAGE_SIZE = 12
const BULK_DOWNLOAD_LIMIT = 50

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

  const downloadableFiltered = useMemo(
    () => filtered.filter((doc) => isDownloadable(doc, live)),
    [filtered, live],
  )
  const pageDownloadable = paged.filter((doc) => isDownloadable(doc, live))
  const pageKeys = pageDownloadable.map(rowKey)
  const allPageSelected = pageKeys.length > 0 && pageKeys.every((key) => selectedKeys.includes(key))
  const selectedDocs = allDocuments.filter((doc) => selectedKeys.includes(rowKey(doc)) && isDownloadable(doc, live))

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
    if (docs.length === 0) return
    const batch = docs.slice(0, BULK_DOWNLOAD_LIMIT)
    setBulkBusy(true)
    setBulkMessage(`Downloading ${batch.length} file${batch.length === 1 ? "" : "s"}…`)
    try {
      await downloadMany(batch, live)
      setBulkMessage(
        docs.length > BULK_DOWNLOAD_LIMIT
          ? `Downloaded first ${BULK_DOWNLOAD_LIMIT} of ${docs.length} matching files.`
          : `${batch.length} file${batch.length === 1 ? "" : "s"} downloaded.`,
      )
    } finally {
      setBulkBusy(false)
      window.setTimeout(() => setBulkMessage(null), 2500)
    }
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
                "flex flex-col gap-3 rounded-[1.5rem] border bg-card p-5 text-left transition",
                active ? "border-foreground/20 ring-2 ring-accent/40" : "border-border hover:bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{card.label}</span>
                <Icon className="size-4 text-muted-foreground/60" />
              </div>
              <p className="font-mono text-3xl font-semibold tracking-tight text-foreground">
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

        <TabsContent value="library" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search documents, agents, or application numbers…"
                  className="pl-9"
                />
              </div>
              <Select
                value={agent}
                onValueChange={(v) => {
                  setAgent(v ?? "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full lg:w-52">
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
                <SelectTrigger className="w-full lg:w-56">
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {statusFilters.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={status === item.value ? "default" : "outline"}
                    onClick={() => setStatusFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || selectedDocs.length === 0}
                  onClick={() => void runBulkDownload(selectedDocs)}
                >
                  <Download data-icon="inline-start" />
                  Download selected{selectedDocs.length ? ` (${selectedDocs.length})` : ""}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkBusy || downloadableFiltered.length === 0}
                  onClick={() => void runBulkDownload(downloadableFiltered)}
                >
                  <Download data-icon="inline-start" />
                  Download matching ({downloadableFiltered.length})
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
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
                  const canGet = isDownloadable(doc, live)
                  return (
                    <tr
                      key={key}
                      onClick={() => setSelected(doc)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40"
                    >
                      <td className="px-3 py-2" onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedKeys.includes(key)}
                          disabled={!canGet}
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
                              {doc.fileType.toUpperCase()}
                              {doc.fileSize ? ` · ${formatBytes(doc.fileSize)}` : ""}
                              {doc.verifiedBy ? ` · ${doc.verifiedBy}` : ""}
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
                        <DocStatusBadge status={doc.status} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm" onClick={() => setSelected(doc)} aria-label="Preview">
                            <Eye />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={!canGet || bulkBusy}
                            onClick={() => void downloadDocument(doc, live)}
                            aria-label="Download"
                          >
                            <Download />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No documents match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
          <TabsContent value="flagged" className="mt-4">
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
                      <DocStatusBadge status={selected.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verified by</p>
                    <p className="mt-1 text-foreground">{selected.verifiedBy ?? "Not yet verified"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">File type</p>
                    <p className="mt-1 uppercase text-foreground">{selected.fileType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Document type</p>
                    <p className="mt-1 text-foreground">{documentTypeLabel(selected.type)}</p>
                  </div>
                </div>
                {selected.status === "rejected" && selected.reason && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
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
                {(live || getDocumentFile(selected)) && selected.status !== "missing" && (
                  <Button
                    className="w-full justify-center"
                    onClick={() => void downloadDocument(selected, live)}
                  >
                    <Download data-icon="inline-start" />
                    Download file
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-center" onClick={() => setUploadOpen(true)}>
                  <Upload data-icon="inline-start" />
                  Upload / replace
                </Button>
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
                          const next = { ...selected, status: "verified" as const, verifiedBy: "Registry" }
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
          onOpenChange={setUploadOpen}
          applicationId={selected.appId}
          documents={apps.find((app) => app.id === selected.appId)?.documents ?? [selected]}
          initialType={selected.type}
          live={live}
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
