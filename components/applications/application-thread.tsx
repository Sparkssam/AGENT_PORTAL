"use client"

import { useEffect, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { listApplicationMessages, postApplicationMessage, type ApplicationMessageView } from "@/lib/actions/messages"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ApplicationThread({
  applicationId,
  live,
  audience = "shared",
}: {
  applicationId: string
  live?: boolean
  audience?: "agent" | "admin" | "shared"
}) {
  const [messages, setMessages] = useState<ApplicationMessageView[]>([])
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!live || !applicationId || applicationId === "draft") {
      setLoading(false)
      return
    }
    let cancelled = false
    void listApplicationMessages(applicationId)
      .then((rows) => {
        if (!cancelled) setMessages(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load messages")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [applicationId, live])

  async function send() {
    const text = body.trim()
    if (!text || !live) return
    setSending(true)
    setError(null)
    try {
      const next = await postApplicationMessage(applicationId, text)
      setMessages((current) => [...current, next])
      setBody("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the message")
    } finally {
      setSending(false)
    }
  }

  const forAdmin = audience === "agent"
  const title = forAdmin ? "Message admin" : audience === "admin" ? "Messages from agent" : "Messages"
  const hint = forAdmin
    ? "Send a note to the review team about this application. They will see it on the case."
    : audience === "admin"
      ? "Reply here. The agent sees this on their application."
      : "Notes between the agent and the review team."
  const placeholder = forAdmin ? "Ask the review team…" : "Write a reply…"
  const sendLabel = forAdmin ? "Send to admin" : "Send"

  return (
    <section className="portal-card">
      <p className="portal-section-title">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>

      <div className="mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                message.mine ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-foreground",
              )}
            >
              <p className="text-[11px] opacity-80">
                {message.authorName} · {formatDateTime(message.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
            </article>
          ))
        )}
      </div>

      {error ? <p className="portal-callout portal-callout-destructive mt-3">{error}</p> : null}

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={placeholder}
          className="min-h-20 flex-1"
          disabled={!live || sending}
        />
        <Button type="submit" disabled={!live || sending || !body.trim()} className="min-h-11">
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send data-icon="inline-start" />}
          {sendLabel}
        </Button>
      </form>
    </section>
  )
}
