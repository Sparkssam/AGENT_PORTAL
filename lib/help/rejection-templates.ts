export const REJECTION_TEMPLATES = [
  {
    id: "blurry",
    label: "Photo is blurry",
    reason: "Photo is blurry. Take a new photo in good light so all text and the ID photo are sharp.",
  },
  {
    id: "cropped",
    label: "Cropped or incomplete",
    reason: "The photo is cropped. Show all four corners of the document in one image.",
  },
  {
    id: "wrong-type",
    label: "Wrong document type",
    reason: "Wrong document type. Upload the document named on this slot, not a different paper.",
  },
  {
    id: "expired",
    label: "Expired document",
    reason: "Expired document. Upload a currently valid ID or licence.",
  },
  {
    id: "glare",
    label: "Glare or shadow",
    reason: "Glare or shadow covers the details. Retake without flash bounce so names and numbers are readable.",
  },
  {
    id: "name-mismatch",
    label: "Name does not match",
    reason: "The name on this document does not match the application. Upload a file in the registered name.",
  },
  {
    id: "dark",
    label: "Too dark",
    reason: "The image is too dark. Use daylight or a well-lit room and take the photo again.",
  },
  {
    id: "deposit-receipt",
    label: "Incomplete deposit receipt",
    reason: "Deposit receipt is missing the amount, reference, or paying phone number. Upload a complete proof.",
  },
  {
    id: "unreadable",
    label: "Unreadable scan",
    reason: "Unreadable scan or screenshot. Upload a clear original photo or PDF.",
  },
] as const
