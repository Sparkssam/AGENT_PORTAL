"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HELP_ARTICLES, HELP_CATEGORIES, searchHelpArticles, type HelpCategory } from "@/lib/help/faq"
import { cn } from "@/lib/utils"

export function HelpFaqList() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<HelpCategory | "all">("all")
  const [activeId, setActiveId] = useState<string | null>(null)

  const results = useMemo(() => searchHelpArticles(query, category), [query, category])

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace("#", "")
      if (!id) return
      setQuery("")
      setCategory("all")
      setActiveId(id)
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
    fromHash()
    window.addEventListener("hashchange", fromHash)
    return () => window.removeEventListener("hashchange", fromHash)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="portal-card flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search rejected documents, deposits, status…"
            aria-label="Search help articles"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory("all")}
            className={cn(
              "status-badge",
              category === "all" ? "status-badge-primary" : "status-badge-muted",
            )}
          >
            All
          </button>
          {HELP_CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                "status-badge",
                category === item.id ? "status-badge-primary" : "status-badge-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="portal-empty">
          <p className="portal-empty-title">No articles match that search</p>
          <p className="portal-empty-copy">Try “rejected”, “deposit”, or “status”.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((article) => {
            const highlighted = activeId === article.id
            return (
              <li
                key={article.id}
                id={article.id}
                className={cn("portal-card scroll-mt-6", highlighted && "ring-2 ring-accent/50")}
              >
                <p className="portal-kicker">{HELP_CATEGORIES.find((item) => item.id === article.category)?.label}</p>
                <h2 className="portal-card-title mt-1">{article.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {article.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {results.length} of {HELP_ARTICLES.length} articles
      </p>
    </div>
  )
}
