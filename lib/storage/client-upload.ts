"use client"

import type { Application } from "@/lib/admin-data"
import type { DocumentVerificationResult } from "@/lib/verification/types"
import { mimeFromFile } from "@/lib/documents/catalog"

export interface DirectUploadOptions {
  applicationId: string
  documentType: string
  file: File
  replace?: boolean
  onBehalf?: boolean
  onProgress?: (percent: number) => void
}

export interface DirectUploadResult {
  application: Application
  verification?: DocumentVerificationResult
}

function multipartBody(opts: DirectUploadOptions) {
  const body = new FormData()
  body.set("applicationId", opts.applicationId)
  body.set("documentType", opts.documentType)
  body.set("file", opts.file)
  body.set("originalName", opts.file.name)
  body.set("mimeType", mimeFromFile(opts.file))
  body.set("fileSize", String(opts.file.size))
  body.set("uploadedAt", new Date().toISOString())
  if (opts.replace) body.set("replace", "true")
  if (opts.onBehalf) body.set("onBehalf", "true")
  return body
}

function readUploadError(payload: { error?: string; issues?: string[] }, status: number) {
  return payload.issues?.[0] || payload.error || `Upload failed (${status})`
}

/** Server-side upload: file → Next.js → R2. Works without bucket CORS. */
export function uploadDocumentMultipart(
  body: FormData,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/documents/upload")
    xhr.withCredentials = true
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.max(8, Math.min(92, Math.round((event.loaded / event.total) * 92))))
    }
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}") as DirectUploadResult & {
          error?: string
          issues?: string[]
        }
        if (xhr.status >= 200 && xhr.status < 300 && payload.application) {
          onProgress?.(100)
          resolve(payload)
          return
        }
        reject(new Error(readUploadError(payload, xhr.status)))
      } catch {
        reject(new Error(`Upload failed (${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error("Network error while uploading to the server"))
    xhr.send(body)
  })
}

async function requestUploadUrl(opts: DirectUploadOptions) {
  const mime = mimeFromFile(opts.file)
  const res = await fetch("/api/documents/upload/request", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: opts.applicationId,
      documentType: opts.documentType,
      fileName: opts.file.name,
      contentType: mime,
      fileSize: opts.file.size,
      replace: opts.replace,
      onBehalf: opts.onBehalf,
    }),
  })
  const payload = (await res.json()) as {
    uploadUrl?: string
    key?: string
    contentType?: string
    error?: string
  }
  if (!res.ok || !payload.uploadUrl || !payload.key) {
    throw new Error(payload.error || "Could not start upload")
  }
  return payload as { uploadUrl: string; key: string; contentType: string }
}

async function putToR2(
  uploadUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
  })
  if (!response.ok) {
    throw new Error(
      `Direct storage upload failed (${response.status}). Add R2 bucket CORS for PUT from ${window.location.origin}.`,
    )
  }
  onProgress?.(90)
}

async function confirmUpload(opts: DirectUploadOptions, key: string, contentType: string) {
  const res = await fetch("/api/documents/upload/confirm", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      applicationId: opts.applicationId,
      documentType: opts.documentType,
      key,
      originalName: opts.file.name,
      contentType,
      fileSize: opts.file.size,
      replace: opts.replace,
      onBehalf: opts.onBehalf,
    }),
  })
  const payload = (await res.json()) as DirectUploadResult & { error?: string; issues?: string[] }
  if (!res.ok || !payload.application) {
    throw new Error(readUploadError(payload, res.status))
  }
  return payload
}

/** Direct browser → R2 upload. Requires bucket CORS. */
export async function uploadDocumentDirect(opts: DirectUploadOptions): Promise<DirectUploadResult> {
  opts.onProgress?.(5)
  const signed = await requestUploadUrl(opts)
  await putToR2(signed.uploadUrl, opts.file, opts.onProgress)
  opts.onProgress?.(92)
  const result = await confirmUpload(opts, signed.key, signed.contentType)
  opts.onProgress?.(100)
  return result
}

/**
 * Upload with server-side handling first (reliable). Falls back to direct R2 only
 * when explicitly enabled via NEXT_PUBLIC_DIRECT_R2_UPLOAD=true and CORS is configured.
 */
export async function uploadDocumentWithFallback(opts: DirectUploadOptions): Promise<DirectUploadResult> {
  const preferDirect = process.env.NEXT_PUBLIC_DIRECT_R2_UPLOAD === "true"

  if (preferDirect) {
    try {
      return await uploadDocumentDirect(opts)
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      if (!message.includes("Direct storage upload failed") && !message.includes("Could not start upload")) {
        throw error
      }
    }
  }

  opts.onProgress?.(8)
  return uploadDocumentMultipart(multipartBody(opts), opts.onProgress)
}
