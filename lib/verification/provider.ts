import type { AuthenticityResult } from "./types"

/**
 * Plug-in point for a dedicated ID verification API later
 * (Stripe Identity, Persona, Onfido, etc.).
 *
 * Set ID_VERIFICATION_PROVIDER to one of those vendor keys when credentials
 * exist. Until then this step is skipped on purpose — do not attempt homemade
 * tamper / hologram / MRZ authenticity detection here.
 */
export async function runAuthenticityCheck(_input: {
  image: Buffer
  documentType: string
  mimeType: string
}): Promise<AuthenticityResult> {
  const provider = process.env.ID_VERIFICATION_PROVIDER?.trim().toLowerCase() || ""
  if (!provider || provider === "none") {
    return { skipped: true, provider: null, passed: null }
  }

  switch (provider) {
    case "stripe_identity":
    case "persona":
    case "onfido":
      return {
        skipped: true,
        provider,
        passed: null,
        detail: `${provider} credentials are not wired yet. Add the vendor SDK call here.`,
      }
    default:
      return {
        skipped: true,
        provider,
        passed: null,
        detail: "Unknown ID_VERIFICATION_PROVIDER. Use stripe_identity, persona, or onfido.",
      }
  }
}
