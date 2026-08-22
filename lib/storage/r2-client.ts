import { S3Client } from "@aws-sdk/client-s3"
import { BackendNotConfiguredError } from "@/lib/backend/errors"

export interface R2Env {
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  endpoint: string
  region: string
  accountId?: string
  publicUrl?: string
}

let cachedClient: S3Client | null = null
let cachedEnv: R2Env | null = null

function resolveEndpoint(accountId?: string, explicitEndpoint?: string) {
  if (explicitEndpoint) return explicitEndpoint
  if (accountId) return `https://${accountId}.r2.cloudflarestorage.com`
  return undefined
}

export function getR2Env(): R2Env | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID
  const endpoint = resolveEndpoint(accountId, process.env.R2_ENDPOINT)
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "")

  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) return null

  return {
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint,
    region: process.env.R2_REGION || "auto",
    accountId,
    publicUrl,
  }
}

export function requireR2Env(): R2Env {
  const env = getR2Env()
  if (!env) {
    throw new BackendNotConfiguredError(
      "Cloudflare R2 is not configured. Set CLOUDFLARE_ACCOUNT_ID (or R2_ENDPOINT), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
    )
  }
  return env
}

export function isR2Configured() {
  return getR2Env() !== null
}

export function getR2Client() {
  const env = requireR2Env()
  if (!cachedClient || cachedEnv !== env) {
    cachedClient = new S3Client({
      region: env.region,
      endpoint: env.endpoint,
      credentials: {
        accessKeyId: env.accessKeyId,
        secretAccessKey: env.secretAccessKey,
      },
    })
    cachedEnv = env
  }
  return { client: cachedClient, bucket: env.bucket, env }
}

/** @deprecated Use getR2Client() — kept for existing imports. */
export function createR2Client() {
  return getR2Client()
}

/** @deprecated Use applicationDocumentKey from lib/storage/keys */
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
