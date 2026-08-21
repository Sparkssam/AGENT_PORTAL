// Client-side helper for downloading a single document as its own file.
// Fetches the asset into a Blob so the browser saves it under the exact
// Name_Doc_Network filename instead of the asset's original path name.

export async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to fetch document (${res.status})`)
    const blob = await res.blob()
    downloadBlob(blob, filename)
  } catch {
    triggerAnchorDownload(url, filename, true)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  triggerAnchorDownload(objectUrl, filename)
  URL.revokeObjectURL(objectUrl)
}

function triggerAnchorDownload(href: string, filename: string, newTab = false) {
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = filename
  if (newTab) anchor.target = "_blank"
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}
