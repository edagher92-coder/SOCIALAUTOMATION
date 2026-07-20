import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { cadenceText } from "@/lib/proposals";
import SyncButton from "@/components/SyncButton";
import TokenConnect from "@/components/TokenConnect";
import ReadOnlyBadge from "@/components/ReadOnlyBadge";
import AutoSyncStatus from "@/components/AutoSyncStatus";
import RunFirstAudit from "@/components/RunFirstAudit";
import LeadAdsSync from "@/components/LeadAdsSync";
import RemoveAccountButton from "@/components/RemoveAccountButton";

export const dynamic = "force-dynamic";

export default async function Connect(props: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const apiEnabled = can(plan, "api_connect");

  const [accountsRes, orgRes, scoreRes] = await Promise.all([
    supabase.from("connected_ad_accounts").select("platform,display_name,external_account_id,status,created_at")
      .eq("organisation_id", orgId).order("created_at", { ascending: false }),
    supabase.from("organisations").select("last_synced_at,sync_interval_hours").eq("id", orgId).maybeSingle(),
    supabase.from("health_scores").select("total").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const accounts = accountsRes.data;
  const org = orgRes.data as any;
  const cadence = cadenceText(org?.sync_interval_hours);
  const hasScore = (scoreRes.data as any)?.total != null;
  // Lead-ads sync surfaces only for Pro+ orgs with a live Meta connection.
  const leadLoop = can(plan, "lead_quality_loop");
  const hasMeta = (accounts || []).some((a: any) => a.platform === "meta" && a.status !== "disconnected" && a.status !== "error");

  // First-score onboarding: a connected, healthy account that hasn't produced a score yet.
  const accts = (accounts || []) as any[];
  const firstHealthy = accts.find((a) => a.status !== "disconnected" && a.status !== "error");
  const firstPlatform = firstHealthy ? (firstHealthy.platform === "tiktok" ? "tiktok" : "meta") : "meta";

  const msg = searchParams.connected ? `✅ Connected ${searchParams.connected}.`
    : searchParams.error ? `⚠ Couldn't connect: ${searchParams.error.replace(/_/g, " ")}` : "";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight">Bring in your ad data</h1>
      <p className="mb-4 mt-1 text-muted">Start with one account. AdPilot reads your numbers, explains what needs attention, and leaves every live ad untouched.</p>

      {/* How it works — 3 steps, makes the flow obvious and the safety explicit. */}
      <div className="mb-5 grid gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-4 text-sm shadow-card sm:grid-cols-3">
        <div><span className="font-bold text-brand">1 · Sign in</span><div className="text-muted">Use the normal Meta or TikTok sign-in below.</div></div>
        <div><span className="font-bold text-brand">2 · We check</span><div className="text-muted">Your numbers sync on the schedule you choose.</div></div>
        <div><span className="font-bold text-brand">3 · You decide</span><div className="text-muted">Get plain-English proposals; make platform changes yourself.</div></div>
      </div>
      <div className="mb-3 -mt-2 flex flex-wrap items-center gap-2">
        <ReadOnlyBadge />
        {apiEnabled && <AutoSyncStatus cadence={cadence} lastSyncedAt={org?.last_synced_at} />}
      </div>
      <p className="mb-5 text-xs text-muted">🔒 Connection credentials are encrypted before storage, never shown back to you, and used only to read the account data you authorise.</p>

      {msg && <div className="mb-4 rounded-xl border border-border-subtle bg-white p-3 text-sm shadow-card">{msg}</div>}
      {accounts?.some((a: any) => a.status === "disconnected" || a.status === "error") && (
        <div className="mb-4 rounded-xl border border-band-red/30 bg-band-red/5 p-3 text-sm font-semibold text-band-red">
          ⚠ One or more accounts need reconnecting — AdPilot can&apos;t pull fresh data until you do, so your scores may be stale.{" "}
          <a href="/connect/guide" className="underline">Watch the guide — get a token that won&apos;t expire →</a>
        </div>
      )}

      {/* First-score onboarding — guides a freshly connected account to their score. */}
      {apiEnabled && firstHealthy && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/30 bg-teal/5 p-4 shadow-card">
          {hasScore ? (
            <>
              <div>
                <div className="font-bold text-ink">✅ Connected &amp; scored</div>
                <p className="text-sm text-muted">Your Campaign Health Score is live in the Command Centre.</p>
              </div>
              <a href="/command" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">View your score →</a>
            </>
          ) : (
            <>
              <div>
                <div className="font-bold text-ink">✅ Connected — run your first audit now</div>
                <p className="text-sm text-muted">One click pulls your numbers and produces your first Campaign Health Score. (It also runs automatically every {cadence}.)</p>
              </div>
              <RunFirstAudit />
            </>
          )}
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
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Recommended — sign in normally</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
              <div className="mb-2 text-2xl">🔵</div>
              <h3 className="font-bold">Meta (Facebook / Instagram)</h3>
              <p className="mb-3 mt-1 text-sm text-muted">Sign in with the Meta account that can view your ads. AdPilot asks only for read access.</p>
              <a href="/api/oauth/meta/start" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Sign in to Meta</a>
            </div>
            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
              <div className="mb-2 text-2xl">⚫</div>
              <h3 className="font-bold">TikTok Ads</h3>
              <p className="mb-3 mt-1 text-sm text-muted">Sign in with the TikTok Ads account you want to review. AdPilot asks only for read access.</p>
              <a href="/api/oauth/tiktok/start" className="inline-block rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">Sign in to TikTok</a>
            </div>
          </div>

          <details className="mt-6 rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
            <summary className="cursor-pointer font-bold text-ink">I have a Meta or TikTok System User token <span className="ml-1 text-xs font-normal text-muted">(advanced setup)</span></summary>
            <p className="mt-2 text-sm text-muted">Use this only if your administrator gave you a read-only token or normal sign-in is unavailable.</p>
            <TokenConnect />
          </details>

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
                <div className="flex items-center gap-2">
                  {needsReconnect
                    ? <a href={`/api/oauth/${p}/start`} className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white">Reconnect</a>
                    : <SyncButton platform={p} />}
                  <RemoveAccountButton platform={p} externalAccountId={a.external_account_id} label={a.display_name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {leadLoop && hasMeta && (
        <div className="mt-7">
          <h2 className="mb-2 text-lg font-bold">Lead Ads → lead-quality loop</h2>
          <LeadAdsSync />
        </div>
      )}

      <details id="token-help" className="mt-6 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <summary className="cursor-pointer list-none font-bold">
          🔑 Token expired? Get a Meta token that <span className="text-brand">won&apos;t expire</span>
          <span className="ml-2 text-xs font-normal text-muted">(tap to open)</span>
        </summary>
        <div className="mt-3 space-y-3 text-sm text-muted">
          <p>
            Tokens you copy from the Graph API <b>Explorer</b> are short-lived — they expire after
            ~1–2 hours, which is why sync starts failing. For a connection that keeps running, use a
            Meta <b>System User</b> token: it can be set to <b>never</b> expire.
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Open{" "}
              <a className="font-semibold text-brand underline" href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer">
                Business Settings → Users → System Users
              </a>{" "}
              and click <b>Add</b> to create one (any name; <b>Admin</b> role is simplest).
            </li>
            <li>Select the system user → <b>Assign assets</b> → add your <b>Ad Accounts</b> with full control.</li>
            <li>
              Click <b>Generate new token</b>, pick your Meta app, set <b>Token expiration</b> to{" "}
              <b>Never</b>, and tick the scopes <code className="rounded bg-surface px-1">ads_read</code> and{" "}
              <code className="rounded bg-surface px-1">read_insights</code> (read-only — no write access).
            </li>
            <li>Copy the generated token, paste it into <b>Paste an access token</b> above, and click <b>Connect &amp; sync</b>.</li>
            <li>Leave <b>Account ID</b> blank — AdPilot detects your ad accounts automatically.</li>
          </ol>
          <p className="text-xs">
            Tip: if you have a duplicate account still showing <span className="font-semibold text-band-red">Reconnect needed</span> after this, remove it — the
            non-expiring connection replaces it. Tokens are encrypted at rest (AES-256-GCM) and never sent back to the browser.
          </p>
        </div>
      </details>
      <p className="mt-3 text-xs text-muted">OAuth requires the platform app credentials to be set on the server.</p>
    </div>
  );
}
