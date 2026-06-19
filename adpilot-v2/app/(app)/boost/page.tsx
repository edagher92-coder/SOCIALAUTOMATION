import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { getAccountCpmByPlatform } from "@/lib/organic/cpm";
import BoostClient from "@/components/BoostClient";

export const dynamic = "force-dynamic";

export default async function BoostPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  // Same organic-content tier as the rest of the Social surfaces.
  const entitled = can(plan, "content_publish");
  // Ground projections in the account's real CPM (from the ad data we already pull); null -> benchmark.
  const accountCpm = entitled && orgId
    ? await getAccountCpmByPlatform(createAdminClient(), orgId).catch(() => ({ meta: null, tiktok: null }))
    : { meta: null, tiktok: null };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Boost &amp; Reach</h1>
      <p className="mb-2 mt-1 text-muted">
        See the reach an organic post already has — and a numbers-first estimate of what boosting it would add, costed at your real CPM.
      </p>
      <p className="mb-5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        🔒 <b>Read-only.</b> Every figure below is an <b>estimate you approve</b> — projections, not guarantees. Nothing is boosted or charged for you.
      </p>

      {!entitled ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Boost &amp; Reach is a Starter feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">
            Your plan ({PLAN_LABEL[plan]}) includes the Health Score. Upgrade to Starter to analyse organic posts and project boost reach against your real CPM.
          </p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      ) : (
        <BoostClient accountCpm={accountCpm} />
      )}
    </div>
  );
}
