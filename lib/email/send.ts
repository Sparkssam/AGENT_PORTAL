function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")
}

export async function sendOperationalEmail(input: {
  to: string
  subject: string
  text: string
  href?: string
}) {
  const to = input.to.trim().toLowerCase()
  if (!to.includes("@")) return

  const link = input.href ?? `${siteUrl()}/agent/applications`
  const text = `${input.text}\n\nOpen your portal: ${link}\n`
  const html = `<p>${input.text.replaceAll("\n", "<br/>")}</p><p><a href="${link}">Open your Kinetic portal</a></p>`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === "development") {
      console.info("[email skipped]", { to, subject: input.subject })
    }
    return
  }

  const from = process.env.EMAIL_FROM || "Kinetic <beth.t@example.com>"
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: input.subject,
      text,
      html,
    }),
  })

  if (!response.ok && process.env.NODE_ENV === "development") {
    const detail = await response.text().catch(() => "")
    console.warn("[email failed]", response.status, detail)
  }
}
