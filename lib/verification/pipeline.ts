import { checkImageQuality } from "./quality"
import { extractDocumentText, shouldRunOcr } from "./ocr"
import { runRuleChecks } from "./rules"
import { runAuthenticityCheck } from "./provider"
import { matchRegisteredDetails, skipsIdentityMatch, type RegisteredIdentity } from "./identity"
import type { DocumentVerificationResult, ExtractedIdFields, QualityCheckResult, VerifiableDocumentType } from "./types"

export function isRasterImage(mimeType: string) {
  return mimeType === "image/jpeg" || mimeType === "image/jpg" || mimeType === "image/png"
}

export function shouldCheckQuality(documentType: VerifiableDocumentType) {
  return documentType === "id_front" || documentType === "id_back" || documentType === "tin" || documentType === "licence"
}

function skippedQuality(): QualityCheckResult {
  return {
    passed: true,
    issues: [],
    metrics: {
      laplacianVariance: 0,
      glareRatio: 0,
      coverage: 1,
      marginLeft: 1,
      marginRight: 1,
      marginTop: 1,
      marginBottom: 1,
      width: 0,
      height: 0,
    },
  }
}

export async function runDocumentPipeline(input: {
  buffer: Buffer
  mimeType: string
  documentType: VerifiableDocumentType
  identity?: RegisteredIdentity | null
}): Promise<DocumentVerificationResult> {
  const emptyExtracted: ExtractedIdFields = {}
  const raster = isRasterImage(input.mimeType)

  let quality = skippedQuality()
  if (raster && shouldCheckQuality(input.documentType)) {
    quality = await checkImageQuality(input.buffer)
    if (!quality.passed) {
      return {
        passed: false,
        issues: quality.issues,
        extracted: emptyExtracted,
        confidence: 0,
        quality,
        rules: { passed: false, issues: [] },
        authenticity: { skipped: true, provider: null, passed: null },
        identity: { passed: true, issues: [] },
      }
    }
  }

  let extracted = emptyExtracted
  let ocrConfidence = raster && shouldRunOcr(input.documentType) ? 0.5 : 0.4
  if (raster && shouldRunOcr(input.documentType) && !skipsIdentityMatch(input.documentType)) {
    try {
      const ocr = await extractDocumentText(input.buffer, input.documentType)
      extracted = ocr.extracted
      ocrConfidence = ocr.ocrConfidence
    } catch {
      extracted = { rawText: "" }
      ocrConfidence = 0.2
    }
  }

  const rules = runRuleChecks(extracted, input.documentType)
  const identity = matchRegisteredDetails(extracted, input.documentType, input.identity)
  const authenticity = await runAuthenticityCheck({
    image: input.buffer,
    documentType: input.documentType,
    mimeType: input.mimeType,
  })

  const issues = [...quality.issues, ...rules.issues, ...identity.issues]
  if (authenticity.passed === false && authenticity.detail) issues.push(authenticity.detail)

  const qualityScore = quality.passed ? 1 : 0
  const ruleScore = rules.passed ? 1 : Math.max(0, 1 - rules.issues.length * 0.25)
  const identityScore = identity.passed ? 1 : 0
  const authenticityScore = authenticity.skipped || authenticity.passed == null ? 0.7 : authenticity.passed ? 1 : 0
  const confidence = Number(
    (qualityScore * 0.3 + ocrConfidence * 0.25 + ruleScore * 0.15 + identityScore * 0.2 + authenticityScore * 0.1).toFixed(3),
  )

  return {
    passed: quality.passed && identity.passed && authenticity.passed !== false,
    issues,
    extracted,
    confidence,
    quality,
    rules,
    authenticity,
    identity,
  }
}

export { checkImageQuality } from "./quality"
export { extractDocumentText } from "./ocr"
export { runRuleChecks } from "./rules"
export { runAuthenticityCheck } from "./provider"
export { matchRegisteredDetails, skipsIdentityMatch } from "./identity"
export type { RegisteredIdentity } from "./identity"
