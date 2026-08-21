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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a re-upload</DialogTitle>
          <DialogDescription>
            Reject {documentName ?? "this document"} and tell the agent what to fix. They will be able to replace the file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reject-reason">Rejection reason</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. The ID photo is cropped. Upload a clearer image with all four corners visible."
          />
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
