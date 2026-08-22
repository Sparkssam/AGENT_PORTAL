import { BackendError } from "@/lib/backend/errors"
import { ALLOWED_DOCUMENT_MIME } from "@/lib/storage/config"

/** Magic-byte signatures for server-side content validation. */
const SIGNATURES: Array<{ mime: string; check: (buf: Buffer) => boolean }> = [
  {
    mime: "application/pdf",
    check: (buf) => buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF",
  },
  {
    mime: "image/jpeg",
    check: (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
  {
    mime: "image/png",
    check: (buf) =>
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47 &&
      buf[4] === 0x0d &&
      buf[5] === 0x0a &&
      buf[6] === 0x1a &&
      buf[7] === 0x0a,
  },
  {
    mime: "image/webp",
    check: (buf) =>
      buf.length >= 12 &&
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP",
  },
]

export function normalizeMimeType(mime: string) {
  const raw = mime.trim().toLowerCase()
  if (raw === "image/jpg") return "image/jpeg"
  return raw
}

export function mimeFromFileName(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "pdf") return "application/pdf"
  return ""
}

export function resolveDocumentMime(opts: { declared: string; fileName: string }) {
  const normalized = normalizeMimeType(opts.declared || mimeFromFileName(opts.fileName))
  if (ALLOWED_DOCUMENT_MIME.includes(normalized as (typeof ALLOWED_DOCUMENT_MIME)[number])) {
    return normalized
  }
  return normalized
}

export function assertBufferMatchesMime(buffer: Buffer, mime: string) {
  const normalized = normalizeMimeType(mime)
  const signature = SIGNATURES.find((item) => item.mime === normalized)
  if (!signature) {
    throw new BackendError("STORAGE", "Unsupported file type", 400)
  }
  if (!signature.check(buffer)) {
    throw new BackendError("STORAGE", "File content does not match the declared type", 400)
  }
}
