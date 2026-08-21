import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  action,
  back,
  accent = true,
  mono = false,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  back?: ReactNode
  accent?: boolean
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {back}
        <h1
          className={cn(
            "flex items-center gap-2.5 font-semibold tracking-tight text-foreground",
            mono ? "font-mono text-lg md:text-xl" : "text-xl md:text-2xl",
            back && "mt-1.5",
          )}
        >
          {accent ? <span className="portal-heading-mark" aria-hidden /> : null}
          <span className="min-w-0 text-balance">{title}</span>
        </h1>
        {description ? (
          <p
            className={cn(
              "mt-1.5 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground",
              accent && "ml-[0.875rem]",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
