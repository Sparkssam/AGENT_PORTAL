import type { Worker } from "tesseract.js"
import type { ExtractedIdFields, VerifiableDocumentType } from "./types"

const globalForOcr = globalThis as unknown as { kineticOcr?: Worker }

async function getWorker() {
  if (!globalForOcr.kineticOcr) {
    const { createWorker } = await import("tesseract.js")
    globalForOcr.kineticOcr = await createWorker("eng")
  }
  return globalForOcr.kineticOcr
}

function cleanLine(line: string) {
  return line.replace(/\s+/g, " ").trim()
}

function parseDates(text: string) {
  const matches = text.match(/\b(\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}|\d{8})\b/g) ?? []
  const iso: string[] = []
  for (const raw of matches) {
    const digits = raw.replace(/\D/g, "")
    let year: string | undefined
    let month: string | undefined
    let day: string | undefined
    if (digits.length === 8 && raw.length === 8) {
      if (Number(digits.slice(0, 4)) > 1900) {
        year = digits.slice(0, 4)
        month = digits.slice(4, 6)
        day = digits.slice(6, 8)
      } else {
        day = digits.slice(0, 2)
        month = digits.slice(2, 4)
        year = digits.slice(4, 8)
      }
    } else {
      const parts = raw.split(/[/\-.]/)
      if (parts.length !== 3) continue
      if (parts[0].length === 4) {
        year = parts[0]
        month = parts[1].padStart(2, "0")
        day = parts[2].padStart(2, "0")
      } else {
        day = parts[0].padStart(2, "0")
        month = parts[1].padStart(2, "0")
        year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
      }
    }
    if (!year || !month || !day) continue
    const candidate = `${year}-${month}-${day}`
    const date = new Date(`${candidate}T00:00:00Z`)
    if (Number.isNaN(date.getTime())) continue
    iso.push(candidate)
  }
  return iso
}

function labeledValue(text: string, labels: string[]) {
  const lines = text.split(/\n+/).map(cleanLine).filter(Boolean)
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (!labels.some((label) => line.toLowerCase().includes(label))) continue
    const after = line.split(/[:\-]/).slice(1).join(" ").trim()
    if (after.length >= 3) return after
    if (lines[i + 1] && lines[i + 1].length >= 3) return lines[i + 1]
  }
  return undefined
}

function extractIdNumber(text: string, documentType: VerifiableDocumentType) {
  const nida = text.match(/\b\d{8}-\d{5}-\d{5}-\d{2}\b/)
  if (nida) return nida[0]
  if (documentType === "tin") {
    const tin = text.match(/\b\d{9}\b/)
    if (tin) return tin[0]
  }
  const generic = text.match(/\b[A-Z0-9]{6,20}\b/)
  return generic?.[0]
}

export async function extractDocumentText(
  input: Buffer,
  documentType: VerifiableDocumentType,
): Promise<{ extracted: ExtractedIdFields; ocrConfidence: number }> {
  const worker = await getWorker()
  const result = await worker.recognize(input)
  const rawText = result.data.text ?? ""
  const dates = parseDates(rawText)
  const dateOfBirth = dates.find((value) => {
    const year = Number(value.slice(0, 4))
    return year >= 1940 && year <= new Date().getUTCFullYear() - 16
  })
  const expiryDate = dates.find((value) => value !== dateOfBirth)

  const genderLabel = labeledValue(rawText, ["sex", "gender", "jinsia"])
  const gender = genderLabel
    ? /female|mwanamke|\bf\b/i.test(genderLabel)
      ? "Female"
      : /male|mwanaume|\bm\b/i.test(genderLabel)
        ? "Male"
        : undefined
    : undefined
  const phoneMatch = rawText.match(/(?:\+?255|0)?[67]\d{8}/)

  const extracted: ExtractedIdFields = {
    fullName: labeledValue(rawText, ["full name", "jina kamili", "jina", "name", "surname"]),
    dateOfBirth: dateOfBirth ?? labeledValue(rawText, ["date of birth", "dob", "tarehe ya kuzaliwa"]),
    idNumber: extractIdNumber(rawText, documentType),
    expiryDate: expiryDate ?? labeledValue(rawText, ["expiry", "exp", "valid until", "tarehe ya kuisha"]),
    issuingState: labeledValue(rawText, ["place of issue", "issued at", "issued place", "maeneo ya kutolewa"]),
    issuingCountry: labeledValue(rawText, ["nationality", "nchi"]) ?? (/\btanzania\b/i.test(rawText) ? "Tanzania" : undefined),
    gender,
    phone: phoneMatch?.[0],
    rawText: rawText.slice(0, 4000),
  }

  return {
    extracted,
    ocrConfidence: Number(((result.data.confidence ?? 0) / 100).toFixed(3)),
  }
}

export function shouldRunOcr(documentType: VerifiableDocumentType) {
  return (
    documentType === "id_front" ||
    documentType === "id_back" ||
    documentType === "tin" ||
    documentType === "licence" ||
    documentType === "deposit_proof" ||
    documentType === "other"
  )
}
