import { documentTypeLabel } from "@/lib/documents/catalog"

const DEFAULT_SUPPORT_NUMBER = "255700000000"

export function whatsappSupportNumber() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? DEFAULT_SUPPORT_NUMBER
  return raw.replace(/\D/g, "")
}

export function buildWhatsAppSupportUrl({
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
} = {}) {
  const number = whatsappSupportNumber()
  if (!number) return null

  const name = agentName?.trim() || "an agent"
  const app = applicationNumber?.trim() || "draft"
  const doc = documentName?.trim() || (documentType ? documentTypeLabel(documentType) : "")
  const lines = [`Hi, I need help with my application #${app}. I am ${name}.`]
  if (doc) {
    lines.push(`${doc} was rejected${reason ? `: ${reason}` : "."}`)
  } else {
    lines.push("Please assist with this case.")
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join(" "))}`
}
