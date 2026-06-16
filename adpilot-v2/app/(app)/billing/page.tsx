import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId } from "@/lib/org";
import UpgradeButtons from "@/components/UpgradeButtons";
import PlanMatrix from "@/components/PlanMatrix";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const { data: sub } = await supabase
    .from("billing_subscriptions").select("plan,status,current_period_end").eq("organisation_id", orgId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  const active = sub && (sub as any).status === "active";

  return (
    <div className="max-w-3xl animate-fade-in">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        subtitle="Manage your plan. Prices in AUD; powered by Stripe."
      />

      <div className="mb-5 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div className="text-sm text-muted">Current plan</div>
        <div className="text-xl font-extrabold capitalize text-ink">
          {active ? (sub as any).plan : "Free"}
          {active && <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal">active</span>}
        </div>
      </div>

      <UpgradeButtons />

      <h2 className="mb-2 mt-8 text-lg font-bold">Compare plans</h2>
      <PlanMatrix />

      <p className="mt-4 text-xs text-muted">
        After upgrading, Stripe redirects you back here. Subscription state updates via webhook
        (<code>/api/stripe/webhook</code>). No card data ever touches our servers.
      </p>
    </div>
  );
}
