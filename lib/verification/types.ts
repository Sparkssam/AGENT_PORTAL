export const QUALITY_ISSUES = {
  blurry: "too blurry",
  glare: "glare detected",
  cropped: "document not fully in frame",
} as const

export type QualityIssue = (typeof QUALITY_ISSUES)[keyof typeof QUALITY_ISSUES]

export interface ExtractedIdFields {
  fullName?: string
  dateOfBirth?: string
  idNumber?: string
  expiryDate?: string
  issuingState?: string
  issuingCountry?: string
  gender?: string
  phone?: string
  rawText?: string
}

export interface QualityMetrics {
  laplacianVariance: number
  glareRatio: number
  coverage: number
  marginLeft: number
  marginRight: number
  marginTop: number
  marginBottom: number
  width: number
  height: number
}

export interface QualityCheckResult {
  passed: boolean
  issues: QualityIssue[]
  metrics: QualityMetrics
}

export interface RuleCheckResult {
  passed: boolean
  issues: string[]
}

export interface AuthenticityResult {
  skipped: boolean
  provider: string | null
  passed: boolean | null
  reference?: string
  detail?: string
}

export interface DocumentVerificationResult {
  passed: boolean
  issues: string[]
  extracted: ExtractedIdFields
  confidence: number
  quality: QualityCheckResult
  rules: RuleCheckResult
  authenticity: AuthenticityResult
  identity?: RuleCheckResult
}

export type VerifiableDocumentType =
  | "id_front"
  | "id_back"
  | "tin"
  | "licence"
  | "portrait"
  | "shop_image"
  | "contract"
  | "other"
  | "deposit_proof"
