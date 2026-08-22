import { DOCUMENTS_BUCKET } from "@/lib/storage/paths"

export async function attachSignedDocumentUrls<T extends { previewUrl?: string; fileUrl?: string }>(
  supabase: unknown,
  documents: T[],
  storageKeys: Array<string | null | undefined>,
  expiresIn = 60 * 10,
): Promise<T[]> {
  const keys = [...new Set(storageKeys.filter((key): key is string => Boolean(key)))]
  if (!keys.length) return documents

  const client = supabase as {
    storage: {
      from: (bucket: string) => {
        createSignedUrls: (
          paths: string[],
          expiresIn: number,
        ) => Promise<{ data: Array<{ path?: string | null; signedUrl?: string | null }> | null }>
      }
    }
  }
  const { data } = await client.storage.from(DOCUMENTS_BUCKET).createSignedUrls(keys, expiresIn)
  const urls = new Map<string, string>()
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
  }

  return documents.map((doc, index) => {
    const key = storageKeys[index]
    const url = key ? urls.get(key) : undefined
    if (!url) return doc
    return { ...doc, previewUrl: url, fileUrl: url }
  })
}
