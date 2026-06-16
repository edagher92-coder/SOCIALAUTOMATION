import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import SyncButton from "@/components/SyncButton";
import TokenConnect from "@/components/TokenConnect";

export const dynamic = "force-dynamic";

export default async function Connect({ searchParams }: { searchParams: { connected?: string; error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const apiEnabled = can(plan, "api_connect");
  const { data: accounts } = await supabase
    .from("connected_ad_accounts").select("platform,display_name,external_account_id,status,created_at")
    .eq("organisation_id", orgId).order("created_at", { ascending: false });

  const msg = searchParams.connected ? `✅ Connected ${searchParams.connected}.`
    : searchParams.error ? `⚠ Couldn't connect: ${searchParams.error.replace(/_/g, " ")}` : "";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Connect ad accounts</h1>
      <p className="mb-5 mt-1 text-muted">Connect read-only so AdPilot can pull your numbers automatically. We never edit, pause, or create ads.</p>

      {msg && <div className="mb-4 rounded-xl border border-border-subtle bg-white p-3 text-sm shadow-card">{msg}</div>}
      {accounts?.some((a: any) => a.status === "disconnected" || a.status === "error") && (
        <div className="mb-4 rounded-xl border border-band-red/30 bg-band-red/5 p-3 text-sm font-semibold text-band-red">
          ⚠ One or more accounts need reconnecting — AdPilot can&apos;t pull fresh data until you do, so your scores may be stale.
        </div>
      )}

      {!apiEnabled ? (
        <div className="rounded-2xl border border-border-subtle bg-gradient-to-br from-brand-50 to-surface-raised p-6 shadow-card">
          <div className="mb-1 text-2xl">🔒</div>
          <h3 className="font-bold">API &amp; automated connection is a Pro &amp; Expert feature</h3>
          <p className="mb-3 mt-1 text-sm text-muted">Your plan ({PLAN_LABEL[plan]}) includes CSV import. The two top tiers add live Meta/TikTok connect, automated sync on your chosen cadence, and the AI specialist team.</p>
          <a href="/billing" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Upgrade to enable</a>
          <a href="/manual" className="ml-2 inline-block rounded-lg border border-border-subtle px-4 py-2 text-sm font-semibold">Use CSV instead</a>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
              <div className="mb-2 text-2xl">🔵</div>
              <h3 className="font-bold">Meta (Facebook / Instagram)</h3>
              <p className="mb-3 mt-1 text-sm text-muted">Scope: ads_read, read_insights (read-only).</p>
              <a href="/api/oauth/meta/start" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Connect Meta</a>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
              <div className="mb-2 text-2xl">⚫</div>
              <h3 className="font-bold">TikTok Ads</h3>
              <p className="mb-3 mt-1 text-sm text-muted">Scope: ads.read (read-only).</p>
              <a href="/api/oauth/tiktok/start" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Connect TikTok</a>
            </div>
          </div>

          <TokenConnect />

          <p className="mt-4 rounded-xl bg-surface p-3 text-sm text-muted">
            ⚙️ <b>Automated:</b> once connected, AdPilot pulls fresh data on your schedule (set it in <a className="font-semibold text-brand" href="/settings">Settings → Auto-sync</a>: hourly, daily, weekly, or custom), then scores and alerts you — no manual steps.
          </p>
        </>
      )}

      <h2 className="mb-2 mt-7 text-lg font-bold">Connected accounts</h2>
      {(!accounts || accounts.length === 0) ? (
        <div className="rounded-xl border border-dashed border-border-subtle p-6 text-center text-muted">
          None yet. Connect above, or just paste a CSV on the Ads Health page.
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((a: any, i: number) => {
            const needsReconnect = a.status === "disconnected" || a.status === "error";
            const p = a.platform === "tiktok" ? "tiktok" : "meta";
            return (
              <div key={i} className={`flex items-center justify-between rounded-xl border bg-white p-4 shadow-card ${needsReconnect ? "border-band-red/40" : "border-border-subtle"}`}>
                <div>
                  <div className="font-semibold">{a.display_name} <span className="text-xs uppercase text-muted">{a.platform}</span></div>
                  {needsReconnect
                    ? <div className="mt-0.5 text-xs font-semibold text-band-red">● Reconnect needed — token expired</div>
                    : <div className="text-xs text-muted">{a.external_account_id} · {a.status}</div>}
                </div>
                {needsReconnect
                  ? <a href={`/api/oauth/${p}/start`} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white">Reconnect</a>
                  : <SyncButton platform={p} />}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Tokens are encrypted at rest (AES-256-GCM) and never sent to the browser. OAuth requires the platform app credentials to be set on the server.</p>
    </div>
  );
}
