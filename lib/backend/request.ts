import { headers } from "next/headers"

export async function clientIp() {
  const h = await headers()
  const forwarded = h.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || null
  return h.get("x-real-ip")
}

export function extensionFromMime(mime: string, fallback = "bin") {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "application/pdf": "pdf",
  }
  return map[mime] ?? fallback
}

export function initialsFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "")
  return initials.join("") || "AG"
}
