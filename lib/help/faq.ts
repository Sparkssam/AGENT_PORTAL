export type HelpCategory = "documents" | "deposit" | "status" | "account"

export type HelpArticle = {
  id: string
  category: HelpCategory
  title: string
  summary: string
  tooltip: string
  body: string[]
  keywords: string[]
}

export const HELP_CATEGORIES: { id: HelpCategory; label: string }[] = [
  { id: "documents", label: "Documents" },
  { id: "deposit", label: "Deposit" },
  { id: "status", label: "Application status" },
  { id: "account", label: "Account" },
]

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "why-rejected",
    category: "documents",
    title: "Why was this document rejected?",
    summary: "Review sends a file back when it cannot read the details or the file does not match the slot.",
    tooltip: "Rejected files need a new upload. Open this article for the usual causes.",
    body: [
      "A rejected document is not a closed application. Replace the file, then wait for review again.",
      "The most common causes are a blurry photo, cropped edges, glare, an expired ID, or uploading the wrong document type into that slot.",
      "The reviewer reason under the file tells you exactly what to fix. Re-upload from the same slot — do not start a new application.",
    ],
    keywords: ["rejected", "reject", "failed", "sent back", "correction", "re-upload"],
  },
  {
    id: "how-to-reupload",
    category: "documents",
    title: "How to re-upload a rejected document",
    summary: "Open the same document slot, choose a clearer file, and submit. The old reject reason stays on the case until review accepts the new file.",
    tooltip: "Use the same slot. Upload replaces the rejected file.",
    body: [
      "Go to Apply, or open the document on Overview / My Applications.",
      "Find the red rejected row. Use Upload or Re-upload on that row only.",
      "JPG, JPEG, PNG, or PDF under 10MB. After upload the status becomes pending until a reviewer checks it.",
    ],
    keywords: ["re-upload", "replace", "upload again", "fix document"],
  },
  {
    id: "valid-photos",
    category: "documents",
    title: "What a valid document photo looks like",
    summary: "The whole document is in frame, text is sharp, and lighting is even. Each slot has an example thumbnail.",
    tooltip: "Show all four corners. Avoid flash glare and cropped edges.",
    body: [
      "Place the document on a flat, contrasting surface. Capture all four corners.",
      "Use daylight or a lamp from the side. Do not cover names, numbers, or the photo with a finger or glare.",
      "Portrait: face the camera, shoulders visible, plain background. Shop image: the full storefront and signage.",
      "Certificates and contracts can be a clear PDF scan. Deposit proof must show amount, reference, and the paying number.",
    ],
    keywords: ["photo", "example", "blurry", "lighting", "corners", "sample"],
  },
  {
    id: "deposit-steps",
    category: "deposit",
    title: "Deposit verification steps",
    summary: "Pay TZS 100,000 from the registered mobile number, enter the transaction reference, and upload the receipt.",
    tooltip: "Reference plus receipt. Review cannot complete a case without both.",
    body: [
      "Pay the TZS 100,000 refundable deposit from the same phone number on the application.",
      "Copy the mobile-money reference (for example an M-Pesa or Tigo Pesa ID) into the payment field.",
      "Upload the SMS or receipt on the Deposit proof slot. Review matches amount, reference, and phone before clearing the deposit.",
    ],
    keywords: ["deposit", "mpesa", "receipt", "100,000", "proof", "reference"],
  },
  {
    id: "status-meanings",
    category: "status",
    title: "What each application status means",
    summary: "Draft through Verified — and what you can do in each state.",
    tooltip: "Status tells you whether you can still edit, or whether review has the case.",
    body: [
      "Draft: you can still edit fields and documents. Nothing has been sent for review.",
      "Submitted / Pending review: the case is in the queue. You cannot change required documents until review asks.",
      "In progress: a reviewer is working the file.",
      "Needs correction: fix the checklist items and re-submit. Rejected documents must be replaced first.",
      "Verified: review accepted the case for the next registrar step.",
      "Rejected: the application itself was declined. Open the notes and chat with support if you need the reason explained.",
    ],
    keywords: ["status", "draft", "pending", "verified", "needs correction", "in progress"],
  },
  {
    id: "blurry-id",
    category: "documents",
    title: "ID photo is blurry or cropped",
    summary: "National ID front and back must show the full card, including the photo and all numbers.",
    tooltip: "Retake the ID so every corner and the photo are visible.",
    body: [
      "Hold the phone steady and tap to focus on the text before you shoot.",
      "Do not crop into the card. A few centimetres of background around the ID is better than a tight crop.",
      "If the plastic shines, tilt slightly or move away from overhead lights.",
    ],
    keywords: ["blurry", "crop", "id card", "nida", "focus"],
  },
  {
    id: "wrong-type",
    category: "documents",
    title: "Wrong document type",
    summary: "Each slot is a specific file. A TIN certificate in the ID slot will be rejected.",
    tooltip: "Upload the document named on that row.",
    body: [
      "Match the file to the slot label: ID front, ID back, TIN, portrait, shop, contract, licence, other, or deposit proof.",
      "If you uploaded the right paper to the wrong row, remove it and put it on the correct slot, then fill the empty one.",
    ],
    keywords: ["wrong type", "mismatch", "tin", "licence", "slot"],
  },
  {
    id: "expired-document",
    category: "documents",
    title: "Expired document",
    summary: "IDs and licences must be valid on the day of review.",
    tooltip: "Upload a currently valid ID or licence. Expired cards are rejected.",
    body: [
      "Check the expiry date on the card before you photograph it.",
      "If the ID is expired, renew it and upload the new card. Do not submit an expired scan hoping review will skip it.",
    ],
    keywords: ["expired", "expiry", "valid", "renew"],
  },
  {
    id: "file-limits",
    category: "documents",
    title: "File type and size limits",
    summary: "PDF, JPG, JPEG, or PNG, maximum 10MB per file.",
    tooltip: "Use JPG or PDF under 10MB. Empty or huge files will not upload.",
    body: [
      "Compress a large photo in the phone gallery, or export a PDF scan at a normal quality setting.",
      "Do not upload Word, HEIC, or screenshot formats that the portal does not list.",
    ],
    keywords: ["10mb", "pdf", "jpg", "size", "format", "heic"],
  },
]

export function getHelpArticle(id: string) {
  return HELP_ARTICLES.find((article) => article.id === id)
}

export function searchHelpArticles(query: string, category?: HelpCategory | "all") {
  const needle = query.trim().toLowerCase()
  return HELP_ARTICLES.filter((article) => {
    if (category && category !== "all" && article.category !== category) return false
    if (!needle) return true
    const hay = `${article.title} ${article.summary} ${article.body.join(" ")} ${article.keywords.join(" ")}`.toLowerCase()
    return hay.includes(needle)
  })
}

export function helpHref(articleId: string) {
  return `/agent/help#${articleId}`
}
