import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 160 112" className={cn("size-full", className)} aria-hidden>
      <rect width="160" height="112" rx="10" fill="#F7F7F6" />
      <rect x="6" y="6" width="148" height="100" rx="8" fill="#DBDAD6" />
      {children}
    </svg>
  )
}

export function DocumentExampleArt({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case "id_front":
      return (
        <Frame className={className}>
          <rect x="18" y="22" width="124" height="72" rx="6" fill="#F7F7F6" stroke="#6E6E6C" strokeWidth="1.5" />
          <rect x="26" y="32" width="32" height="40" rx="3" fill="#A4A3A0" />
          <rect x="66" y="34" width="64" height="6" rx="2" fill="#6E6E6C" />
          <rect x="66" y="46" width="52" height="5" rx="2" fill="#A4A3A0" />
          <rect x="66" y="56" width="44" height="5" rx="2" fill="#A4A3A0" />
          <rect x="66" y="68" width="28" height="5" rx="2" fill="#373736" />
        </Frame>
      )
    case "id_back":
      return (
        <Frame className={className}>
          <rect x="18" y="22" width="124" height="72" rx="6" fill="#F7F7F6" stroke="#6E6E6C" strokeWidth="1.5" />
          <rect x="28" y="34" width="104" height="18" rx="2" fill="#373736" />
          <rect x="28" y="60" width="72" height="6" rx="2" fill="#A4A3A0" />
          <rect x="28" y="72" width="56" height="6" rx="2" fill="#A4A3A0" />
        </Frame>
      )
    case "tin":
      return (
        <Frame className={className}>
          <rect x="36" y="16" width="88" height="80" rx="4" fill="#F7F7F6" stroke="#6E6E6C" strokeWidth="1.5" />
          <rect x="48" y="28" width="64" height="6" rx="2" fill="#373736" />
          <rect x="48" y="42" width="64" height="4" rx="2" fill="#A4A3A0" />
          <rect x="48" y="52" width="48" height="4" rx="2" fill="#A4A3A0" />
          <rect x="48" y="70" width="40" height="10" rx="2" fill="#DBDAD6" stroke="#6E6E6C" />
        </Frame>
      )
    case "portrait":
      return (
        <Frame className={className}>
          <circle cx="80" cy="44" r="18" fill="#A4A3A0" />
          <path d="M48 92c4-22 20-30 32-30s28 8 32 30" fill="#6E6E6C" />
        </Frame>
      )
    case "shop_image":
      return (
        <Frame className={className}>
          <rect x="28" y="40" width="104" height="52" fill="#6E6E6C" />
          <polygon points="24,40 80,18 136,40" fill="#373736" />
          <rect x="70" y="62" width="20" height="30" fill="#F7F7F6" />
          <rect x="40" y="56" width="18" height="16" fill="#DBDAD6" />
          <rect x="102" y="56" width="18" height="16" fill="#DBDAD6" />
        </Frame>
      )
    case "contract":
      return (
        <Frame className={className}>
          <rect x="44" y="18" width="72" height="78" rx="3" fill="#F7F7F6" stroke="#6E6E6C" />
          <rect x="54" y="30" width="52" height="4" rx="2" fill="#A4A3A0" />
          <rect x="54" y="40" width="52" height="4" rx="2" fill="#A4A3A0" />
          <rect x="54" y="50" width="40" height="4" rx="2" fill="#A4A3A0" />
          <path d="M54 78c8-8 20 8 28-4" fill="none" stroke="#373736" strokeWidth="2" />
        </Frame>
      )
    case "licence":
      return (
        <Frame className={className}>
          <rect x="24" y="28" width="112" height="60" rx="6" fill="#F7F7F6" stroke="#6E6E6C" strokeWidth="1.5" />
          <circle cx="48" cy="58" r="12" fill="#DBDAD6" stroke="#6E6E6C" />
          <rect x="68" y="42" width="54" height="6" rx="2" fill="#373736" />
          <rect x="68" y="54" width="44" height="5" rx="2" fill="#A4A3A0" />
          <rect x="68" y="66" width="36" height="5" rx="2" fill="#A4A3A0" />
        </Frame>
      )
    case "deposit_proof":
      return (
        <Frame className={className}>
          <rect x="40" y="18" width="80" height="76" rx="4" fill="#F7F7F6" stroke="#6E6E6C" />
          <rect x="52" y="30" width="56" height="5" rx="2" fill="#373736" />
          <rect x="52" y="44" width="40" height="4" rx="2" fill="#A4A3A0" />
          <rect x="52" y="54" width="48" height="4" rx="2" fill="#A4A3A0" />
          <rect x="52" y="70" width="36" height="8" rx="2" fill="#6E6E6C" />
        </Frame>
      )
    default:
      return (
        <Frame className={className}>
          <rect x="50" y="24" width="60" height="64" rx="4" fill="#F7F7F6" stroke="#6E6E6C" />
          <path d="M86 24v20h20" fill="none" stroke="#6E6E6C" strokeWidth="1.5" />
          <rect x="62" y="56" width="36" height="4" rx="2" fill="#A4A3A0" />
          <rect x="62" y="66" width="28" height="4" rx="2" fill="#A4A3A0" />
        </Frame>
      )
  }
}
