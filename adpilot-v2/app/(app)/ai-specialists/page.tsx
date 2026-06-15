import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { PUBLIC_AGENTS } from "@/lib/agents/registry";
import AgentConsole from "@/components/AgentConsole";

export const dynamic = "force-dynamic";

export default async function AiSpecialists() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const enabled = orgId ? can(await planForOrg(orgId), "ai_team") : false;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">AI Specialists</h1>
      <p className="mb-5 mt-1 text-muted">
        Your team — each grounded in your live numbers. They <b>propose</b>; you approve. None ever edits a live ad.
      </p>
      <AgentConsole agents={PUBLIC_AGENTS} enabled={enabled} />
    </div>
  );
}
