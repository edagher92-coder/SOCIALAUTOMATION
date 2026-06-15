import { createClient } from "@/lib/supabase/server";
import UpgradeButtons from "@/components/UpgradeButtons";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const supabase = createClient();
  const { data: sub } = await supabase
    .from("billing_subscriptions").select("plan,status,current_period_end").order("created_at", { ascending: false }).limit(1).maybeSingle();

  const active = sub && (sub as any).status === "active";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Billing</h1>
      <p className="mb-5 mt-1 text-muted">Manage your plan. Prices in AUD; powered by Stripe.</p>

      <div className="mb-5 rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div className="text-sm text-muted">Current plan</div>
        <div className="text-xl font-extrabold capitalize">
          {active ? (sub as any).plan : "Free"}
          {active && <span className="ml-2 rounded-full bg-[#e6fbf6] px-2 py-0.5 text-xs font-bold text-teal">active</span>}
        </div>
      </div>

      <UpgradeButtons />

      <p className="mt-4 text-xs text-muted">
        After upgrading, Stripe redirects you back here. Subscription state updates via webhook
        (<code>/api/stripe/webhook</code>). No card data ever touches our servers.
      </p>
    </div>
  );
}
