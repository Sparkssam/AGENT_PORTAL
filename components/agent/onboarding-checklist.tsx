"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "kinetic.onboarding.dismissed"

export type OnboardingItem = {
  id: string
  label: string
  done: boolean
  href?: string
}

export function AgentOnboardingChecklist({ items }: { items: OnboardingItem[] }) {
  const remaining = items.filter((item) => !item.done).length
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1")
    } catch {
      // ignore
    }
  }, [])

  const progress = useMemo(() => {
    const done = items.filter((item) => item.done).length
    return items.length === 0 ? 0 : Math.round((done / items.length) * 100)
  }, [items])

  if (dismissed || remaining === 0) return null

  return (
    <section className="portal-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="portal-section-title">Get started</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Finish these steps once. Your draft saves as you go.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            try {
              window.localStorage.setItem(STORAGE_KEY, "1")
            } catch {
              // ignore
            }
            setDismissed(true)
          }}
        >
          Dismiss
        </Button>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ol className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href ?? "#"}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-2xl px-2 py-2 text-sm",
                item.done ? "text-muted-foreground" : "text-foreground hover:bg-secondary/70",
              )}
            >
              {item.done ? (
                <Check className="size-4 shrink-0 text-success" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className={item.done ? "line-through" : ""}>{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
