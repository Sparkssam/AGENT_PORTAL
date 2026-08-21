"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function pageWindow(page: number, total: number) {
  if (total <= 1) return [1]
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const start = Math.max(1, Math.min(page - 1, total - 2))
  return [start, start + 1, start + 2]
}

export function TablePagination({
  page,
  totalPages,
  rangeStart,
  rangeEnd,
  total,
  onPage,
  noun = "results",
}: {
  page: number
  totalPages: number
  rangeStart: number
  rangeEnd: number
  total: number
  onPage: (page: number) => void
  noun?: string
}) {
  const pages = pageWindow(page, totalPages)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-3.5 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {total === 0 ? (
          `No ${noun}`
        ) : (
          <>
            Showing <span className="font-medium text-foreground">{rangeStart}</span>–
            <span className="font-medium text-foreground">{rangeEnd}</span> of{" "}
            <span className="font-medium text-foreground">{total.toLocaleString("en-US")}</span> {noun}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        {pages.map((item) => (
          <Button
            key={item}
            variant={page === item ? "default" : "outline"}
            size="icon-sm"
            onClick={() => onPage(item)}
            aria-label={`Page ${item}`}
            aria-current={page === item ? "page" : undefined}
          >
            {item}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
