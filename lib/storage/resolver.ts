import { DOCUMENTS_BUCKET } from "@/lib/storage/paths"
import { isR2StorageKey } from "@/lib/storage/keys"
import { deleteObject, getObjectBuffer, resolveDownloadUrl } from "@/lib/storage/service"
import { isR2Configured } from "@/lib/storage/r2-client"
import { createClient } from "@/lib/supabase/server"

/** Fetch object bytes from R2 or legacy Supabase Storage. */
export async function fetchStoredObject(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  if (isR2Configured() && isR2StorageKey(key)) {
    return getObjectBuffer(key)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).download(key)
  if (error || !data) throw new Error(error?.message ?? "Could not download file")
  return { buffer: Buffer.from(await data.arrayBuffer()), contentType: data.type }
}

/** Remove object from R2 or legacy Supabase Storage. */
export async function removeStoredObject(key: string) {
  if (isR2Configured() && isR2StorageKey(key)) {
    await deleteObject({ key })
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([key])
  if (error) throw new Error(error.message)
}

/** Create a short-lived download URL for R2 or legacy Supabase Storage. */
export async function signedStoredUrl(
  key: string,
  opts?: { filename?: string; disposition?: "inline" | "attachment" },
) {
  if (isR2Configured() && isR2StorageKey(key)) {
    const result = await resolveDownloadUrl({
      key,
      filename: opts?.filename,
      disposition: opts?.disposition ?? "inline",
    })
    return result.downloadUrl
  }

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(key, 60 * 10, {
    download: opts?.disposition === "attachment" ? true : undefined,
  })
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Could not sign download")
  return data.signedUrl
}
