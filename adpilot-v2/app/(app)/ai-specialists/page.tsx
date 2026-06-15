import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { PUBLIC_AGENTS } from "@/lib/agents/registry";
import AgentConsole from "@/components/AgentConsole";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AiSpecialists() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const enabled = orgId ? can(await planForOrg(orgId), "ai_team") : false;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="AI team"
        title="AI Specialists"
        subtitle="Your team — each grounded in your live numbers. They propose; you approve. None ever edits a live ad."
      />
      <AgentConsole agents={PUBLIC_AGENTS} enabled={enabled} />
    </div>
  );
}
