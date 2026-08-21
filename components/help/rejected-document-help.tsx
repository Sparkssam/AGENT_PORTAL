import Link from "next/link"
import { HelpHint } from "@/components/help/help-hint"
import { WhatsAppSupportButton } from "@/components/help/whatsapp-support-button"
import { helpHref } from "@/lib/help/faq"

export function RejectedDocumentHelp({
  agentName,
  applicationNumber,
  documentType,
  documentName,
  reason,
}: {
  agentName?: string
  applicationNumber?: string
  documentType?: string
  documentName?: string
  reason?: string
}) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <HelpHint articleId="why-rejected" label="Why was this rejected?" />
      <Link href={helpHref("why-rejected")} className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
        Why was this rejected?
      </Link>
      <Link href={helpHref("how-to-reupload")} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
        How to re-upload
      </Link>
      <WhatsAppSupportButton
        size="xs"
        variant="outline"
        agentName={agentName}
        applicationNumber={applicationNumber}
        documentType={documentType}
        documentName={documentName}
        reason={reason}
        label="Chat with Support"
      />
    </div>
  )
}
