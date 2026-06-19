import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { getAudienceInsights } from "@/lib/audience/insights";
import { buildAudienceProposals } from "@/lib/audience/proposals";
import AudienceClient from "@/components/AudienceClient";

export const dynamic = "force-dynamic";

export default async function AudiencePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const entitled = can(plan, "ai_team");
  const insights = entitled ? await getAudienceInsights(orgId) : null;
  const proposals = insights ? buildAudienceProposals(insights) : null;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Audience Intelligence</h1>
      <p className="mb-2 mt-1 text-muted">Who actually follows you — and numbers-first ideas for content, ads and creative drawn from it.</p>
      <p className="mb-5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        🔒 Uses <b>aggregate, anonymised</b> audience data from your connected profile — never individual followers. Everything below is a <b>proposal you approve</b>; nothing is applied for you.
      </p>

      {!entitled || !insights || !proposals ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Audience Intelligence is a Pro &amp; Expert feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) includes analysis. Upgrade to read your follower demographics and get AI suggestions for content, ads and creative.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      ) : (
        <AudienceClient insights={insights} proposals={proposals} canPublish={can(plan, "content_publish")} />
      )}
    </div>
  );
}
