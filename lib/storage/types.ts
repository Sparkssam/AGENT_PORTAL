export type StorageCategory = "image" | "document"

export type StorageEntityType = "application-document"

export interface UploadUrlRequest {
  fileName: string
  contentType: string
  fileSize: number
  category: StorageCategory
  entityType: StorageEntityType
  entityId: string
  subPath?: string
}

export interface UploadUrlResponse {
  uploadUrl: string
  key: string
  expiresIn: number
}

export interface DownloadUrlRequest {
  key: string
  filename?: string
  disposition?: "inline" | "attachment"
}

export interface DownloadUrlResponse {
  downloadUrl: string
  key: string
  expiresIn: number
}

export interface DeleteObjectRequest {
  key: string
}

export interface StoredObjectMeta {
  key: string
  contentType?: string
  contentLength?: number
}
