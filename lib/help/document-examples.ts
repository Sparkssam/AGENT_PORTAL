import type { DocumentTypeCode } from "@/lib/documents/catalog"

export const DOCUMENT_EXAMPLES: Record<
  DocumentTypeCode,
  { caption: string; hint: string }
> = {
  id_front: {
    caption: "ID front — full card",
    hint: "All four corners, photo, and ID number visible.",
  },
  id_back: {
    caption: "ID back — full card",
    hint: "Barcode or chip side fully in frame, no crop.",
  },
  tin: {
    caption: "TIN certificate",
    hint: "Full page or clear PDF. TIN and name readable.",
  },
  portrait: {
    caption: "Portrait photo",
    hint: "Face and shoulders, plain background, looking at camera.",
  },
  shop_image: {
    caption: "Shop storefront",
    hint: "Full kiosk or shop with signage in daylight.",
  },
  contract: {
    caption: "Signed contract",
    hint: "Agreement pages as a clear PDF or photo set.",
  },
  licence: {
    caption: "Business licence",
    hint: "Valid licence, dates and business name readable.",
  },
  other: {
    caption: "Supporting file",
    hint: "Only extra evidence that review asked for.",
  },
  deposit_proof: {
    caption: "Deposit receipt",
    hint: "Amount, reference, and paying number must show.",
  },
}

export function getDocumentExample(type: string) {
  return DOCUMENT_EXAMPLES[type as DocumentTypeCode]
}
