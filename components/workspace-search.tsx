"use client"

import { useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkspaceSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  className,
}: {
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uncontrolled, setUncontrolled] = useState("")
  const [shortcut, setShortcut] = useState("Ctrl K")
  const current = value ?? uncontrolled

  useEffect(() => {
    if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) {
      setShortcut("⌘K")
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return
      const target = event.target
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    onSubmit?.(current.trim())
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full min-w-0 max-w-md", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={current}
        onChange={(event) => {
          const next = event.target.value
          onChange?.(next)
          if (value === undefined) setUncontrolled(next)
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-full border border-transparent bg-muted/80 pr-16 pl-10 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/40"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium tracking-wide text-muted-foreground sm:inline-block">
        {shortcut}
      </kbd>
    </form>
  )
}
