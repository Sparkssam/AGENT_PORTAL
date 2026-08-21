import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createR2Client } from "@/lib/r2/client"

const PUT_TTL_SECONDS = 5 * 60
const GET_TTL_SECONDS = 10 * 60

export async function presignPut(key: string, contentType: string) {
  const { client, bucket } = createR2Client()
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: PUT_TTL_SECONDS },
  )
}

export async function presignGet(key: string, filename?: string) {
  const { client, bucket } = createR2Client()
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: filename ? `attachment; filename="${filename.replace(/"/g, "")}"` : undefined,
    }),
    { expiresIn: GET_TTL_SECONDS },
  )
}

export async function headObject(key: string) {
  const { client, bucket } = createR2Client()
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
}
