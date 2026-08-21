import type { ExtractedIdFields, RuleCheckResult, VerifiableDocumentType } from "./types"

export interface RegisteredIdentity {
  fullName: string
  phone: string
  email?: string
  idType?: string
  idNumber?: string
  tinNumber?: string
  issuedPlace?: string
  issuedDate?: string
  expireDate?: string
  gender?: string
}

const LOCATION_SKIP_TYPES: VerifiableDocumentType[] = ["contract", "shop_image", "portrait"]

export function skipsIdentityMatch(documentType: VerifiableDocumentType) {
  return LOCATION_SKIP_TYPES.includes(documentType)
}

function compactAlnum(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
}

function digits(value: string) {
  return value.replace(/\D/g, "")
}

function localPhone(value: string) {
  let raw = digits(value)
  if (raw.startsWith("255")) raw = raw.slice(3)
  if (raw.startsWith("0")) raw = raw.slice(1)
  return raw.slice(-9)
}

function nameTokens(value: string) {
  const stop = new Set(["mr", "mrs", "ms", "miss", "dr", "eng", "hon"])
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stop.has(token))
}

function tokenClose(left: string, right: string) {
  if (left === right) return true
  if (left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left))) return true
  if (Math.abs(left.length - right.length) > 2) return false
  const longer = left.length >= right.length ? left : right
  const shorter = left.length >= right.length ? right : left
  let misses = 0
  let i = 0
  let j = 0
  while (i < longer.length && j < shorter.length) {
    if (longer[i] === shorter[j]) {
      i += 1
      j += 1
      continue
    }
    misses += 1
    if (misses > 1) return false
    i += 1
  }
  return misses + (longer.length - i) + (shorter.length - j) <= 1
}

export function namesMatch(registered: string, extracted: string) {
  const expected = nameTokens(registered)
  const found = nameTokens(extracted)
  if (!expected.length || !found.length) return false
  if (expected.join(" ") === found.join(" ")) return true
  const overlap = expected.filter((token) => found.some((item) => tokenClose(token, item)))
  const needed = Math.min(2, expected.length)
  return overlap.length >= needed && overlap.length / expected.length >= 0.5
}

export function idsMatch(registered: string, extracted: string) {
  const expected = compactAlnum(registered)
  const found = compactAlnum(extracted)
  if (!expected || !found) return false
  if (expected === found) return true
  const min = Math.min(expected.length, found.length)
  return min >= 8 && (expected.includes(found) || found.includes(expected))
}

function isoDate(value?: string) {
  if (!value) return ""
  const match = value.match(/(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}-${match[3]}` : ""
}

function datesMatch(registered?: string, extracted?: string) {
  const expected = isoDate(registered)
  const found = isoDate(extracted)
  if (!expected || !found) return true
  return expected === found
}

function genderMatch(registered?: string, extracted?: string) {
  if (!registered || !extracted) return true
  const expected = registered.trim().toLowerCase()
  const found = extracted.trim().toLowerCase()
  if (expected === found) return true
  const male = ["male", "m", "mwanaume"]
  const female = ["female", "f", "mwanamke"]
  if (male.includes(expected) && male.includes(found)) return true
  if (female.includes(expected) && female.includes(found)) return true
  return false
}

function phonesMatch(registered: string, extracted: string) {
  const expected = localPhone(registered)
  const found = localPhone(extracted)
  return expected.length === 9 && found.length === 9 && expected === found
}

function placeMatch(registered?: string, extracted?: string) {
  if (!registered || !extracted) return true
  const expected = nameTokens(registered)
  if (!expected.length) return true
  const haystack = extracted.toLowerCase()
  const hits = expected.filter((token) => haystack.includes(token))
  return hits.length >= Math.min(1, expected.length)
}

export function matchRegisteredDetails(
  extracted: ExtractedIdFields,
  documentType: VerifiableDocumentType,
  identity?: RegisteredIdentity | null,
): RuleCheckResult {
  if (!identity || skipsIdentityMatch(documentType)) {
    return { passed: true, issues: [] }
  }

  const issues: string[] = []
  const registeredName = identity.fullName.trim()
  const extractedName = extracted.fullName?.trim() ?? ""
  const extractedId = extracted.idNumber?.trim() ?? ""
  const readableName = nameTokens(extractedName).length >= 2

  if (documentType === "id_front" || documentType === "id_back") {
    if (readableName && registeredName && !namesMatch(registeredName, extractedName)) {
      issues.push(`Name on the ID does not match the registered name (${registeredName}).`)
    }
    if (identity.idNumber && extractedId && !idsMatch(identity.idNumber, extractedId)) {
      issues.push("ID number on the document does not match the ID number on this application.")
    }
    if (identity.expireDate && extracted.expiryDate && !datesMatch(identity.expireDate, extracted.expiryDate)) {
      issues.push("ID expiry date does not match the expiry date entered on this application.")
    }
    if (identity.gender && extracted.gender && !genderMatch(identity.gender, extracted.gender)) {
      issues.push("Gender on the ID does not match the gender on this application.")
    }
    if (identity.issuedPlace && extracted.issuingState && !placeMatch(identity.issuedPlace, extracted.issuingState)) {
      issues.push("Issued place on the ID does not match the issued place on this application.")
    }
  }

  if (documentType === "tin") {
    if (identity.tinNumber && extractedId && !idsMatch(identity.tinNumber, extractedId)) {
      issues.push("TIN on the certificate does not match the TIN entered on this application.")
    }
    if (readableName && registeredName && !namesMatch(registeredName, extractedName)) {
      issues.push(`Name on the TIN document does not match the registered name (${registeredName}).`)
    }
  }

  if (documentType === "licence") {
    if (readableName && registeredName && !namesMatch(registeredName, extractedName)) {
      issues.push(`Name on the business licence does not match the registered name (${registeredName}).`)
    }
  }

  if (documentType === "other") {
    if (readableName && registeredName && !namesMatch(registeredName, extractedName)) {
      issues.push(`Name on the document does not match the registered name (${registeredName}).`)
    }
    if (identity.idNumber && extractedId && !idsMatch(identity.idNumber, extractedId)) {
      issues.push("ID number on the document does not match the registered ID number.")
    }
  }

  if (documentType === "deposit_proof") {
    const extractedPhone = extracted.phone || extracted.rawText?.match(/(?:\+?255|0)?[67]\d{8}/)?.[0] || ""
    if (identity.phone && extractedPhone && !phonesMatch(identity.phone, extractedPhone)) {
      issues.push("Phone number on the deposit proof does not match the registered phone number.")
    }
  }

  return { passed: issues.length === 0, issues }
}
