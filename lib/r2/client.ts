import { S3Client } from "@aws-sdk/client-s3"
import { requireR2Env } from "@/lib/backend/env"

export function createR2Client() {
  const env = requireR2Env()
  return {
    bucket: env.bucket,
    client: new S3Client({
      region: env.region,
      endpoint: env.endpoint,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    }),
  }
}

export function r2ObjectKey(opts: {
  agentId: string
  applicationId: string
  documentType: string
  objectId: string
  extension: string
}) {
  const ext = opts.extension.replace(/^\.+/, "").toLowerCase()
  return `agents/${opts.agentId}/applications/${opts.applicationId}/${opts.documentType}/${opts.objectId}.${ext}`
}
