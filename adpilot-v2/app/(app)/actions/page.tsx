import { createClient } from "@/lib/supabase/server";
import { getActiveOrgMembership, isOrgManagerRole, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { writeEnabled } from "@/lib/actions/execute";
import PageHeader from "@/components/PageHeader";
import ActionsConsole from "@/components/ActionsConsole";
import WriteAccessSetup from "@/components/WriteAccessSetup";

export const dynamic = "force-dynamic";

export default async function ActionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const membership = await getActiveOrgMembership(user.id, user.email ?? undefined);
  const plan = await planForOrg(membership.orgId);
  const allowed = isOrgManagerRole(membership.role) && can(plan, "ad_write");

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Expert · owner-approved" title="Approved ad actions" subtitle="Stage a bounded Meta change, review the exact effect, then type the approval phrase. Nothing runs automatically and every completed change is recorded." />
      {!allowed ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <h2 className="font-bold">Expert owners and admins only</h2>
          <p className="mt-1 text-sm text-muted">Your plan is {PLAN_LABEL[plan]}. Approved live-ad actions require Expert and a workspace owner or admin because they can change a real campaign.</p>
          {!can(plan, "ad_write") && <a href="/billing" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">View Expert plan</a>}
        </div>
      ) : (
        <div className="space-y-5">
          <WriteAccessSetup executionEnabled={writeEnabled()} />
          <ActionsConsole writeEnabled={writeEnabled()} />
        </div>
      )}
    </div>
  );
}
