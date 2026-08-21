"use client"

import Link from "next/link"
import { CircleHelp } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { getHelpArticle, helpHref } from "@/lib/help/faq"
import { cn } from "@/lib/utils"

export function HelpHint({
  articleId,
  className,
  label,
}: {
  articleId: string
  className?: string
  label?: string
}) {
  const article = getHelpArticle(articleId)
  const href = helpHref(articleId)
  const title = label ?? article?.title ?? "Open help"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={href}
            className={cn(
              "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground",
              className,
            )}
            aria-label={title}
          />
        }
      >
        <CircleHelp className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-left leading-relaxed">
        {article?.tooltip ?? "Open the Help Center for this topic."}
      </TooltipContent>
    </Tooltip>
  )
}
