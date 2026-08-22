import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})
const bucket = process.env.R2_BUCKET_NAME
const key = `documents/test/${Date.now()}.txt`

try {
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: "hello", ContentType: "text/plain" }),
  )
  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
  console.log("R2 OK", { bucket, key, size: head.ContentLength })
} catch (error) {
  console.error("R2 FAIL", error?.name, error?.message, error?.$metadata)
  process.exit(1)
}
