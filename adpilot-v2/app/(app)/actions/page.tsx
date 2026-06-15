import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import PageHeader from "@/components/PageHeader";
import ActionsConsole from "@/components/ActionsConsole";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const enabled = can(plan, "ad_write");
  const writeEnabled = process.env.ADS_WRITE_ENABLED === "1";

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Expert · guarded"
        title="Ad Actions"
        subtitle="Apply safe, reversible changes to live campaigns — pause, resume, or adjust budget — with a typed confirmation and one-click revert. This is the only place AdPilot writes to an ad account."
      />
      {enabled ? (
        <ActionsConsole writeEnabled={writeEnabled} />
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-[#eef4ff] to-white p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Guarded ad changes are an Expert feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) is read-only by design. Expert unlocks staging live pause/resume/budget changes — each one typed-confirmed, reversible, and audited.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      )}
    </div>
  );
}
