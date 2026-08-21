"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { REJECTION_TEMPLATES } from "@/lib/help/rejection-templates"
import { cn } from "@/lib/utils"

export function DocumentRejectDialog({
  open,
  onOpenChange,
  documentName,
  busy,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName?: string
  busy?: boolean
  onConfirm: (reason: string) => Promise<void> | void
}) {
  const [reason, setReason] = useState("")
  const [templateId, setTemplateId] = useState<string | null>(null)

  function applyTemplate(id: string, text: string) {
    setTemplateId(id)
    setReason(text)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setReason("")
          setTemplateId(null)
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a re-upload</DialogTitle>
          <DialogDescription>
            Reject {documentName ?? "this document"} with a clear reason so the agent knows what to fix.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Templates</p>
            <div className="flex flex-wrap gap-1.5">
              {REJECTION_TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyTemplate(item.id, item.reason)}
                  className={cn(
                    "status-badge",
                    templateId === item.id ? "status-badge-primary" : "status-badge-muted",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Rejection reason</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setTemplateId(null)
              }}
              placeholder="Pick a template or write a specific instruction."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length < 3}
            onClick={async () => {
              await onConfirm(reason.trim())
              setReason("")
              setTemplateId(null)
              onOpenChange(false)
            }}
          >
            Reject and request re-upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
