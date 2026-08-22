# Cloudflare R2 Storage

Application documents (JPEG, PNG, PDF) are stored in a **private** Cloudflare R2 bucket. The Next.js server is the only component with R2 credentials. Browsers receive short-lived presigned URLs for direct upload and download.

## Environment variables

| Variable | Scope | Description |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Server | Cloudflare account ID (used to build the R2 endpoint if `R2_ENDPOINT` is unset) |
| `R2_ACCESS_KEY_ID` | Server | R2 S3 API access key |
| `R2_SECRET_ACCESS_KEY` | Server | R2 S3 API secret |
| `R2_BUCKET_NAME` | Server | Bucket name |
| `R2_PUBLIC_URL` | Server (optional) | Public/custom domain base URL — only if you serve public objects |

Legacy aliases: `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCOUNT_ID`, `R2_REGION=auto`.

**Never** set `NEXT_PUBLIC_R2_*` for credentials.

## Cloudflare setup

1. Create a Cloudflare account and open **R2**.
2. Create a private bucket (e.g. `kinetic-agent-docs`).
3. Under **Manage R2 API tokens**, create a token with **Object Read & Write** scoped to that bucket.
4. Copy the access key ID and secret into `.env.local`.
5. Set `CLOUDFLARE_ACCOUNT_ID` and `R2_BUCKET_NAME`.
6. Configure **CORS** on the bucket to allow `PUT` and `GET` from your app origin (`http://localhost:3000` and production URL).

Example CORS rule:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Architecture

```text
Browser → POST /api/documents/upload/request → presigned PUT URL + object key
Browser → PUT (direct to R2)
Browser → POST /api/documents/upload/confirm → verify + save metadata
Browser → signedGet(documentId) → presigned GET URL
```

Generic storage API (for future entities):

- `POST /api/storage/upload` — presigned PUT
- `GET /api/storage/download?documentId=` — presigned GET (authorized)
- `POST /api/storage/delete` — delete object (authorized)

## Object key layout

```text
documents/applications/{agentId}/{applicationId}/{documentType}/{uuid}.{ext}
```

Keys are generated server-side. Client-provided filenames are never used as object keys.

## File limits

| Type | Max size |
|---|---|
| Images | 5 MB |
| PDFs | 10 MB |

Application documents use the 10 MB limit. MIME type, extension, and magic bytes are validated on confirm.

## Private vs public

All application documents are **private**. Access requires authentication and ownership (agent owns application) or admin role. Presigned GET URLs expire after 10 minutes.

## Legacy Supabase Storage

Existing files stored under Supabase Storage paths (`{userId}/{applicationId}/...`) remain readable via the storage resolver until migrated. New uploads use R2 when credentials are configured.

## Orphan handling

If R2 upload succeeds but confirm fails (validation/verification), the server deletes the R2 object. If DB update succeeds but old object deletion fails, the old key may remain until manual cleanup — logged but non-blocking.

## Module map

| Path | Role |
|---|---|
| `lib/storage/r2-client.ts` | Singleton S3 client |
| `lib/storage/service.ts` | Presign, head, get, delete |
| `lib/storage/resolver.ts` | R2 + legacy Supabase reads |
| `lib/storage/client-upload.ts` | Browser upload helper |
| `lib/documents/upload-request.ts` | Authorize + presign for documents |
| `lib/documents/confirm-upload.ts` | Verify + persist after R2 upload |
