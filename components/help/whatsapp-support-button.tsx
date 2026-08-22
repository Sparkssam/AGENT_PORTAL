import { MessageCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { buildWhatsAppSupportUrl } from "@/lib/help/whatsapp"
import { cn } from "@/lib/utils"

export function WhatsAppSupportButton({
  agentName,
  applicationNumber,
  documentType,
  documentName,
  reason,
  size = "default",
  variant = "outline",
  className,
  label = "Chat with Support",
}: {
  agentName?: string
  applicationNumber?: string
  documentType?: string
  documentName?: string
  reason?: string
  size?: "default" | "sm" | "xs"
  variant?: "default" | "outline" | "ghost"
  className?: string
  label?: string
}) {
  const href = buildWhatsAppSupportUrl({
    agentName,
    applicationNumber,
    documentType,
    documentName,
    reason,
  })
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), className)}
    >
      <MessageCircle data-icon="inline-start" />
      {label}
    </a>
  )
}
