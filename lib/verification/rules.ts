import type { ExtractedIdFields, RuleCheckResult, VerifiableDocumentType } from "./types"

function parseIsoDate(value?: string) {
  if (!value) return null
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return null
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function ageFromDob(dob: Date) {
  const now = new Date()
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const month = now.getUTCMonth() - dob.getUTCMonth()
  if (month < 0 || (month === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1
  return age
}

export function runRuleChecks(
  extracted: ExtractedIdFields,
  documentType: VerifiableDocumentType,
): RuleCheckResult {
  const issues: string[] = []
  const expiry = parseIsoDate(extracted.expiryDate)
  if (expiry && expiry.getTime() < Date.now() - 86_400_000) {
    issues.push("ID appears to be expired")
  }

  const dob = parseIsoDate(extracted.dateOfBirth)
  if (dob) {
    const age = ageFromDob(dob)
    if (age < 16 || age > 90) issues.push("Date of birth implies an implausible age")
  }

  const idNumber = extracted.idNumber?.trim() ?? ""
  if (documentType === "id_front" || documentType === "id_back") {
    if (idNumber && !/^\d{8}-\d{5}-\d{5}-\d{2}$/.test(idNumber) && !/^[A-Z0-9]{6,20}$/i.test(idNumber)) {
      issues.push("ID number does not match the expected format")
    }
  }
  if (documentType === "tin" && idNumber && !/^\d{9}$/.test(idNumber)) {
    issues.push("TIN number does not match the expected 9-digit format")
  }

  if ((documentType === "id_front" || documentType === "id_back") && !idNumber && !extracted.fullName) {
    issues.push("Could not read a name or ID number from the document")
  }

  return { passed: issues.length === 0, issues }
}
