import Link from "next/link"
import { HelpHint } from "@/components/help/help-hint"
import { helpHref } from "@/lib/help/faq"

export function RejectedDocumentHelp() {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <HelpHint articleId="why-rejected" label="Why was this rejected?" />
      <Link href={helpHref("why-rejected")} className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
        Why was this rejected?
      </Link>
      <Link href={helpHref("how-to-reupload")} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
        How to re-upload
      </Link>
    </div>
  )
}
