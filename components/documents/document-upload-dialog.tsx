"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { CheckCircle2, CloudUpload, FileText, ImageIcon, Loader2, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Application, Document } from "@/lib/admin-data"
import type { DocumentVerificationResult } from "@/lib/verification/types"
import { saveDraft } from "@/lib/actions/applications"
import { DOCUMENT_ACCEPT, DOCUMENT_TYPE_OPTIONS, documentTypeLabel, formatBytes, mimeFromFile, validateUploadFile } from "@/lib/documents/catalog"
import { DocumentExampleArt } from "@/components/help/document-example-art"
import { getDocumentExample } from "@/lib/help/document-examples"
import { helpHref } from "@/lib/help/faq"

type UploadPhase = "idle" | "uploading" | "success" | "error"

function fileKind(file: File) {
  const mime = mimeFromFile(file)
  if (mime === "application/pdf") return "PDF"
  if (mime === "image/png") return "PNG"
  if (mime === "image/jpeg") return "JPG"
  return "FILE"
}

function FileTypeMark({ kind }: { kind: string }) {
  const tone =
    kind === "PDF"
      ? "bg-red-500 text-white"
      : kind === "PNG"
        ? "bg-sky-500 text-white"
        : kind === "JPG"
          ? "bg-amber-500 text-white"
          : "bg-muted text-muted-foreground"
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
      <FileText className="size-6 text-muted-foreground" />
      <span className={cn("absolute -bottom-1 rounded px-1 text-[9px] font-bold tracking-wide", tone)}>{kind}</span>
    </span>
  )
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  applicationId,
  documents,
  initialType,
  live,
  intent = "default",
  onComplete,
  onApplicationReady,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicationId?: string
  documents: Document[]
  initialType?: string
  live?: boolean
  intent?: "default" | "onBehalf" | "replace"
  onComplete: (documents: Document[], verification?: DocumentVerificationResult) => void
  onApplicationReady?: (application: Application) => void
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [documentType, setDocumentType] = useState(initialType ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [phase, setPhase] = useState<UploadPhase>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const existing = documents.find((doc) => doc.type === documentType)
  const alreadyStored = Boolean(existing && existing.status !== "missing" && existing.status !== "rejected")
  const replacingRejected = existing?.status === "rejected"
  const fileError = file ? validateUploadFile(file) : null
  const busy = phase === "uploading" || phase === "success"
  const canPickFile = Boolean(documentType && !busy)
  const canSubmit = Boolean(documentType && file && !fileError && !busy)
  const isImage = Boolean(file && mimeFromFile(file).startsWith("image/"))
  const previewUrl = useMemo(() => (file && isImage ? URL.createObjectURL(file) : null), [file, isImage])
  const loadedBytes = file ? Math.round((file.size * progress) / 100) : 0

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (!open) return
    setDocumentType(initialType ?? "")
    setFile(null)
    setDragOver(false)
    setPhase("idle")
    setProgress(0)
    setError(null)
  }, [open, initialType, intent])

  function closeModal() {
    if (phase === "uploading") return
    onOpenChange(false)
  }

  function takeFile(next: File | null) {
    if (!next) {
      setFile(null)
      setError(null)
      setPhase("idle")
      setProgress(0)
      return
    }
    const problem = validateUploadFile(next)
    setFile(next)
    setPhase("idle")
    setProgress(0)
    setError(problem)
  }

  function openFilePicker() {
    if (!documentType || busy) {
      if (!documentType) setError("Select a document type first")
      return
    }
    inputRef.current?.click()
  }

  async function submitSelectedFile() {
    if (!file || !documentType) {
      setError(!documentType ? "Select a document type first" : "Choose a file before uploading")
      return
    }
    const problem = validateUploadFile(file)
    if (problem) {
      setError(problem)
      return
    }

    if (!live) {
      setPhase("uploading")
      setProgress(35)
      window.setTimeout(() => {
        setProgress(100)
        setPhase("success")
        const autoAccept = intent === "onBehalf" || (intent === "replace" && existing?.adminUploaded)
        onComplete(
          documents.map((doc) =>
            doc.type === documentType
              ? {
                  ...doc,
                  status: autoAccept ? "verified" : "unverified",
                  originalName: file.name,
                  fileSize: file.size,
                  adminUploaded: autoAccept,
                  verifiedBy: autoAccept ? "Admin upload" : undefined,
                }
              : doc,
          ),
        )
        window.setTimeout(() => onOpenChange(false), 1100)
      }, 400)
      return
    }

    setPhase("uploading")
    setProgress(8)
    setError(null)

    try {
      let targetId = applicationId
      if (!targetId || targetId === "draft") {
        const saved = await saveDraft({})
        targetId = saved.id
        onApplicationReady?.(saved)
      }

      const body = new FormData()
      body.set("applicationId", targetId)
      body.set("documentType", documentType)
      body.set("file", file)
      body.set("originalName", file.name)
      body.set("mimeType", mimeFromFile(file))
      body.set("fileSize", String(file.size))
      body.set("uploadedAt", new Date().toISOString())
      if (alreadyStored || replacingRejected || intent === "replace" || intent === "onBehalf") body.set("replace", "true")
      if (intent === "onBehalf") body.set("onBehalf", "true")

      const result = await uploadWithProgress(body, setProgress)
      setProgress(100)
      setPhase("success")
      onComplete(result.application.documents, result.verification)
      window.setTimeout(() => onOpenChange(false), 1100)
    } catch (err) {
      setPhase("error")
      setError(err instanceof Error ? err.message : "Upload failed")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && phase === "uploading") return
        onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-h-[100dvh] gap-0 overflow-y-auto p-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-[440px]"
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CloudUpload className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[15px] font-semibold">
              {intent === "onBehalf" ? "Upload on behalf of agent" : intent === "replace" ? "Replace document" : "Upload files"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs">
              {intent === "onBehalf"
                ? "This file is stored as accepted (admin-uploaded) and is logged in the audit trail."
                : intent === "replace"
                  ? existing?.adminUploaded
                    ? "Replacing an admin-uploaded file keeps it accepted."
                    : "Replacing an accepted agent file sends it back to pending review."
                  : "Select and upload the files of your choice"}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            disabled={phase === "uploading"}
            onClick={closeModal}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="document-type" className="text-xs text-muted-foreground">
              Document type
            </Label>
            <select
              id="document-type"
              value={documentType}
              disabled={Boolean(initialType) || busy}
              onChange={(event) => {
                setDocumentType(event.target.value)
                setFile(null)
                setError(null)
                setPhase("idle")
              }}
              className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a document</option>
              {DOCUMENT_TYPE_OPTIONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                  {item.required ? " (Required)" : ""}
                </option>
              ))}
            </select>
            {documentType ? (
              <div className="mt-1 flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5">
                <span className="overflow-hidden rounded-lg ring-1 ring-border">
                  <DocumentExampleArt type={documentType} className="h-14 w-20" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    {getDocumentExample(documentType)?.caption ?? "Valid example"}
                  </p>
                  <p className="text-xs text-muted-foreground">{getDocumentExample(documentType)?.hint}</p>
                  <a href={helpHref("valid-photos")} className="text-[11px] font-medium underline-offset-2 hover:underline">
                    Photo guide
                  </a>
                </div>
              </div>
            ) : null}
            {existing?.status === "rejected" && existing.reason ? (
              <p className="text-xs text-destructive">
                {existing.reason}{" "}
                <a href={helpHref("why-rejected")} className="font-medium underline underline-offset-2">
                  Why was this rejected?
                </a>
              </p>
            ) : alreadyStored ? (
              <p className="text-xs text-muted-foreground">
                {documentTypeLabel(documentType)} is already on file. Submitting a new file will replace it.
              </p>
            ) : null}
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              takeFile(event.target.files?.[0] ?? null)
              event.target.value = ""
            }}
          />

          <div
            onDragOver={(event) => {
              event.preventDefault()
              if (documentType && !busy) setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              if (!documentType) {
                setError("Select a document type first")
                return
              }
              takeFile(event.dataTransfer.files?.[0] ?? null)
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/40",
            )}
          >
            <CloudUpload className="size-8 text-muted-foreground" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">Choose a file or drag & drop it here</p>
              <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, and PDF formats, up to 10 MB</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 bg-background"
              disabled={!canPickFile}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openFilePicker()
              }}
            >
              Browse File
            </Button>
          </div>

          {file ? (
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <div className="flex items-start gap-3 px-3 pt-3 pb-2">
                {previewUrl ? (
                  <span className="flex size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={previewUrl}
                      alt=""
                      width={44}
                      height={44}
                      unoptimized
                      className="size-11 object-cover"
                    />
                  </span>
                ) : mimeFromFile(file).startsWith("image/") ? (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <ImageIcon className="size-5 text-muted-foreground" />
                  </span>
                ) : (
                  <FileTypeMark kind={fileKind(file)} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {phase === "idle" || phase === "error"
                      ? formatBytes(file.size)
                      : `${formatBytes(loadedBytes)} of ${formatBytes(file.size)}`}
                  </p>
                  {phase === "uploading" ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Uploading...
                    </p>
                  ) : phase === "success" ? (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="size-3.5" />
                      Completed
                    </p>
                  ) : fileError ? (
                    <p className="mt-1 text-xs text-destructive">{fileError}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Ready to submit</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  disabled={phase === "uploading"}
                  onClick={() => takeFile(null)}
                  aria-label={phase === "success" ? "Remove file" : "Cancel file"}
                >
                  {phase === "success" ? <Trash2 className="size-4" /> : <X className="size-4" />}
                </Button>
              </div>
              {(phase === "uploading" || phase === "success") && (
                <div className="h-1.5 bg-muted">
                  <div
                    className={cn("h-full transition-all", phase === "success" ? "bg-emerald-500" : "bg-blue-500")}
                    style={{ width: `${Math.max(progress, 8)}%` }}
                  />
                </div>
              )}
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <Button type="button" variant="outline" disabled={phase === "uploading"} onClick={closeModal}>
            Cancel
          </Button>
          {file ? (
            <Button
              type="button"
              disabled={!canSubmit}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void submitSelectedFile()
              }}
            >
              {phase === "uploading" ? <Loader2 className="size-4 animate-spin" /> : null}
              {phase === "success" ? "Submitted" : "Submit"}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canPickFile}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openFilePicker()
              }}
            >
              <Upload data-icon="inline-start" />
              Upload
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function uploadWithProgress(
  body: FormData,
  onProgress: (value: number) => void,
): Promise<{ application: Application; verification?: DocumentVerificationResult }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/documents/upload")
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress(Math.max(8, Math.min(90, Math.round((event.loaded / event.total) * 90))))
    }
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}") as {
          application?: Application
          verification?: DocumentVerificationResult
          error?: string
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload.application) {
          onProgress(100)
          resolve({ application: payload.application, verification: payload.verification })
          return
        }
        reject(new Error(payload.error || "Upload failed"))
      } catch {
        reject(new Error("Upload failed"))
      }
    }
    xhr.onerror = () => reject(new Error("Network error while uploading"))
    xhr.send(body)
  })
}
