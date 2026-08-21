import { PageBackLink } from "@/components/page-back-link"
import { PageHeader } from "@/components/page-header"
import { HelpFaqList } from "@/components/help/help-faq-list"
import { WhatsAppSupportButton } from "@/components/help/whatsapp-support-button"
import { DocumentExampleArt } from "@/components/help/document-example-art"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/documents/catalog"
import { DOCUMENT_EXAMPLES } from "@/lib/help/document-examples"
import { loadAgentWorkspace } from "@/lib/data/workspace"

export default async function HelpCenterPage() {
  const { agent, application } = await loadAgentWorkspace()

  return (
    <div className="portal-page-narrow">
      <PageHeader
        back={<PageBackLink fallback="/agent/dashboard" />}
        title="Help Center"
        description="Search common issues, see valid document examples, or chat with support on WhatsApp."
        action={
          <WhatsAppSupportButton
            agentName={agent.fullName}
            applicationNumber={application.appNumber}
          />
        }
      />

      <section className="portal-card">
        <p className="portal-card-title">Valid document examples</p>
        <p className="portal-card-copy">Each upload slot uses this layout. Tap an example, then scroll to the photo guide below.</p>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {DOCUMENT_TYPE_OPTIONS.map((item) => (
            <li key={item.code} className="flex flex-col gap-1.5">
              <a href="#valid-photos" className="overflow-hidden rounded-xl ring-1 ring-border">
                <DocumentExampleArt type={item.code} className="h-16 w-full" />
              </a>
              <p className="text-[11px] leading-tight font-medium text-foreground">{item.name}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{DOCUMENT_EXAMPLES[item.code].hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <HelpFaqList />
    </div>
  )
}
