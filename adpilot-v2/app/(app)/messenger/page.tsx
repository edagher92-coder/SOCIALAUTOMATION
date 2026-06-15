import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import PageHeader from "@/components/PageHeader";
import MessengerSetup from "@/components/MessengerSetup";
import MessengerBot from "@/components/MessengerBot";

export const dynamic = "force-dynamic";

export default async function MessengerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const enabled = can(plan, "messenger_automation");
  const tokenConfigured = !!process.env.META_PAGE_ACCESS_TOKEN;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  return (
    <div className="max-w-2xl">
      <PageHeader
        eyebrow="Premium"
        title="Messenger Setup"
        subtitle="Configure a Page's chat entry experience — greeting, ice breakers, Get Started, and menu — straight through the Graph API. No browser, no “Allow” prompts, idempotent, multi-client."
      />
      <p className="mb-5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
        🔒 Writes only the Page's <b>Messenger profile</b> you approve here — separate from the read-only ad layer (we never edit, pause, or create ads). Keyword auto-replies aren't in the public API; that's a webhook-bot follow-up (needs app review).
      </p>

      {enabled ? (
        <>
          <h2 className="mb-2 text-lg font-bold">Entry experience <span className="text-xs font-normal text-muted">(greeting · ice breakers · menu — no prompts)</span></h2>
          <MessengerSetup tokenConfigured={tokenConfigured} />

          <h2 className="mb-2 mt-8 text-lg font-bold">Keyword auto-replies <span className="text-xs font-normal text-muted">(webhook bot — multi-client)</span></h2>
          <MessengerBot webhookUrl={appUrl ? `${appUrl}/api/messenger/webhook` : ""} verifyConfigured={!!process.env.MESSENGER_VERIFY_TOKEN} appSecretConfigured={!!process.env.META_APP_SECRET} />
        </>
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-[#eef4ff] to-white p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">Messenger automation is a Premium (Expert) feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) doesn't include it. Upgrade to set up Messenger across client pages with no browser and no prompts.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade</a>
        </div>
      )}
    </div>
  );
}
