"use client"

import { useEffect, useState } from "react"
import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { previewRetention, runRetentionPurge, type RetentionPreview } from "@/lib/actions/retention"

export function RetentionPanel() {
  const [preview, setPreview] = useState<RetentionPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setError(null)
    try {
      setPreview(await previewRetention())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load retention preview")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const result = await runRetentionPurge()
      setMessage(
        `Removed ${result.draftsDeleted} abandoned drafts and anonymised ${result.casesAnonymised} closed cases. ${result.remaining} still eligible — run again if needed.`,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purge failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="portal-card">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Archive className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Document retention</p>
          <p className="text-sm text-muted-foreground">
            Completed cases 7 years, rejected 24 months, abandoned drafts 12 months. Audit log is kept. Files are
            removed and personal details are anonymised — this does not run on a schedule.
          </p>
        </div>
      </div>
      {preview ? (
        <p className="text-sm text-muted-foreground">
          Eligible now: {preview.drafts} drafts, {preview.rejected} rejected, {preview.completed} completed,{" "}
          {preview.documents} files.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Counting eligible records…</p>
      )}
      {message ? <p className="mt-2 text-sm text-foreground">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={busy}>
          Refresh preview
        </Button>
        <Button
          size="sm"
          disabled={busy || !preview || preview.drafts + preview.rejected + preview.completed === 0}
          onClick={() => void run()}
        >
          {busy ? "Purging…" : "Purge eligible records"}
        </Button>
      </div>
    </div>
  )
}
