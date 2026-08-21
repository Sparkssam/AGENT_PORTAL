import Link from "next/link"
import { DocumentExampleArt } from "@/components/help/document-example-art"
import { getDocumentExample } from "@/lib/help/document-examples"
import { helpHref } from "@/lib/help/faq"
import { cn } from "@/lib/utils"

export function DocumentExampleThumb({
  type,
  className,
}: {
  type: string
  className?: string
}) {
  const example = getDocumentExample(type)
  if (!example) return null

  return (
    <Link
      href={helpHref("valid-photos")}
      className={cn(
        "group flex w-16 shrink-0 flex-col gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      title={`${example.caption}. ${example.hint}`}
    >
      <span className="overflow-hidden rounded-lg ring-1 ring-border/80 transition group-hover:ring-foreground/30">
        <DocumentExampleArt type={type} className="h-11 w-16" />
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground">Example</span>
    </Link>
  )
}
