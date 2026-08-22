import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { BackendError } from "@/lib/backend/errors"
import { GET_URL_TTL_SECONDS, PUT_URL_TTL_SECONDS } from "@/lib/storage/config"
import { assertSafeObjectKey } from "@/lib/storage/keys"
import { getR2Client } from "@/lib/storage/r2-client"
import type { DeleteObjectRequest, DownloadUrlRequest, StoredObjectMeta, UploadUrlResponse } from "@/lib/storage/types"

export async function putObjectBuffer(key: string, buffer: Buffer, contentType: string) {
  const safeKey = assertSafeObjectKey(key)
  const { client, bucket } = getR2Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: safeKey,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return { key: safeKey }
}

export async function presignPut(
  key: string,
  contentType?: string,
  expiresIn = PUT_URL_TTL_SECONDS,
): Promise<UploadUrlResponse> {
  const safeKey = assertSafeObjectKey(key)
  const { client, bucket } = getR2Client()
  const command = contentType
    ? new PutObjectCommand({ Bucket: bucket, Key: safeKey, ContentType: contentType })
    : new PutObjectCommand({ Bucket: bucket, Key: safeKey })
  const uploadUrl = await getSignedUrl(client, command, { expiresIn })
  return { uploadUrl, key: safeKey, expiresIn }
}

export async function presignGet(
  key: string,
  opts?: { filename?: string; disposition?: "inline" | "attachment"; expiresIn?: number },
) {
  const safeKey = assertSafeObjectKey(key)
  const { client, bucket } = getR2Client()
  const disposition = opts?.disposition ?? "inline"
  const filename = opts?.filename?.replace(/"/g, "") ?? undefined
  const expiresIn = opts?.expiresIn ?? GET_URL_TTL_SECONDS

  const downloadUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: safeKey,
      ResponseContentDisposition:
        disposition === "attachment" && filename
          ? `attachment; filename="${filename}"`
          : disposition === "inline" && filename
            ? `inline; filename="${filename}"`
            : undefined,
    }),
    { expiresIn },
  )

  return { downloadUrl, key: safeKey, expiresIn }
}

export async function headObject(key: string): Promise<StoredObjectMeta> {
  const safeKey = assertSafeObjectKey(key)
  const { client, bucket } = getR2Client()
  try {
    const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: safeKey }))
    return {
      key: safeKey,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
    }
  } catch {
    throw new BackendError("STORAGE", "File not found", 404)
  }
}

export async function getObjectBuffer(key: string): Promise<{ buffer: Buffer; contentType?: string }> {
  const safeKey = assertSafeObjectKey(key)
  const { client, bucket } = getR2Client()
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: safeKey }))
    if (!result.Body) throw new BackendError("STORAGE", "File not found", 404)
    const bytes = await result.Body.transformToByteArray()
    return { buffer: Buffer.from(bytes), contentType: result.ContentType }
  } catch (error) {
    if (error instanceof BackendError) throw error
    throw new BackendError("STORAGE", "File not found", 404)
  }
}

export async function deleteObject(input: DeleteObjectRequest) {
  const safeKey = assertSafeObjectKey(input.key)
  const { client, bucket } = getR2Client()
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: safeKey }))
  } catch {
    throw new BackendError("STORAGE", "File deletion failed", 500)
  }
}

export function publicObjectUrl(key: string) {
  const { env } = getR2Client()
  if (!env.publicUrl) return null
  const safeKey = assertSafeObjectKey(key)
  return `${env.publicUrl}/${safeKey}`
}

/** Resolve a download URL — presigned for private objects, direct for public URL config. */
export async function resolveDownloadUrl(input: DownloadUrlRequest) {
  const publicUrl = publicObjectUrl(input.key)
  if (publicUrl) {
    return { downloadUrl: publicUrl, key: input.key, expiresIn: 0 }
  }
  return presignGet(input.key, {
    filename: input.filename,
    disposition: input.disposition,
  })
}
