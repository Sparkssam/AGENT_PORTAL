import { redirect } from "next/navigation"
import { isNewApplicant, loadAgentWorkspace } from "@/lib/data/workspace"

export const dynamic = "force-dynamic"

export default async function AgentHomePage() {
  const { applications } = await loadAgentWorkspace()
  redirect(isNewApplicant(applications) ? "/agent/apply" : "/agent/dashboard")
}
