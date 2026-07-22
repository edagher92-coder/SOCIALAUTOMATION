import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { cadenceText } from "@/lib/proposals";
import PageHeader from "@/components/PageHeader";
import SyncButton from "@/components/SyncButton";
import TokenConnect from "@/components/TokenConnect";
import AutoSyncStatus from "@/components/AutoSyncStatus";
import RunFirstAudit from "@/components/RunFirstAudit";
import LeadAdsSync from "@/components/LeadAdsSync";
import RemoveAccountButton from "@/components/RemoveAccountButton";
import { Icon, type IconName } from "@/components/icons";

export const dynamic = "force-dynamic";

type ConnectedAccount = {
  platform: string;
  display_name: string;
  external_account_id: string;
  status: string;
  created_at: string;
};

function providerState(accounts: ConnectedAccount[], platform: string) {
  const matches = accounts.filter((account) => account.platform === platform);
  const healthy = matches.filter((account) => account.status !== "error" && account.status !== "disconnected");
  return { matches, healthy, issue: matches.length > healthy.length };
}

function ProviderCard({
  name, platform, description, icon, accounts, enabled,
}: {
  name: string; platform: "meta" | "tiktok"; description: string; icon: IconName; accounts: ConnectedAccount[]; enabled: boolean;
}) {
  const state = providerState(accounts, platform);
  const connected = state.healthy.length > 0;
  return (
    <article className={`flex flex-col rounded-3xl border bg-white p-5 shadow-card ${state.issue ? "border-bad/35" : connected ? "border-good/30" : "border-border-subtle"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface text-brand"><Icon name={icon} size={21} /></span>
        <span className={`rounded-full px-2.5 py-1 text-2xs font-extrabold uppercase ${state.issue ? "bg-bad/10 text-bad" : connected ? "bg-good/10 text-green-700" : "bg-surface text-muted"}`}>
          {state.issue ? "Reconnect" : connected ? `${state.healthy.length} connected` : "Not connected"}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-extrabold text-ink">{name}</h2>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-4 border-t border-border-subtle pt-4">
        {enabled ? (
          <a href={`/api/oauth/${platform}/start`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-navy">
            <Icon name={connected && !state.issue ? "refresh" : "link"} size={16} /> {state.issue ? "Reconnect" : connected ? "Add another account" : `Connect ${name}`}
          </a>
        ) : (
          <Link href="/billing" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand"><Icon name="lock" size={15} /> Available on Pro</Link>
        )}
      </div>
    </article>
  );
}

function maskAccountId(value: string): string {
  if (!value) return "Account ID unavailable";
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export default async function Connect(props: { searchParams: Promise<{ connected?: string; error?: string }> }) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";
  const plan = orgId ? await planForOrg(orgId) : "free";
  const apiEnabled = can(plan, "api_connect");

  const [accountsRes, orgRes, scoreRes] = await Promise.all([
    supabase.from("connected_ad_accounts").select("platform,display_name,external_account_id,status,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }),
    supabase.from("organisations").select("last_synced_at,sync_interval_hours").eq("id", orgId).maybeSingle(),
    supabase.from("health_scores").select("total").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const accounts = (accountsRes.data || []) as ConnectedAccount[];
  const org = orgRes.data;
  const cadence = cadenceText(org?.sync_interval_hours);
  const hasScore = scoreRes.data?.total != null;
  const healthyAccounts = accounts.filter((account) => account.status !== "disconnected" && account.status !== "error");
  const firstPlatform = healthyAccounts[0]?.platform === "tiktok" ? "tiktok" : "meta";
  const hasMeta = providerState(accounts, "meta").healthy.length > 0;
  const leadLoop = can(plan, "lead_quality_loop");
  const readiness = (healthyAccounts.length > 0 ? 1 : 0) + (hasScore ? 1 : 0) + (org?.last_synced_at ? 1 : 0);
  const message = searchParams.connected
    ? `${searchParams.connected} connected. Run an audit to confirm fresh data.`
    : searchParams.error
      ? `Connection was not completed: ${searchParams.error.replace(/_/g, " ")}.`
      : "";

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      <PageHeader
        eyebrow="Data & integrations"
        title="Connections"
        subtitle="See exactly what is connected, what access AdPilot has, when data last arrived, and how to recover a broken connection."
        action={<AutoSyncStatus cadence={cadence} lastSyncedAt={org?.last_synced_at} />}
      />

      {message && <div role="status" className={`mb-5 rounded-2xl border p-4 text-sm font-semibold ${searchParams.error ? "border-bad/30 bg-bad/10 text-bad" : "border-good/30 bg-good/10 text-green-800"}`}>{message}</div>}
      {accountsRes.error && <div className="mb-5 rounded-2xl border border-bad/30 bg-bad/10 p-4 text-sm font-semibold text-bad">Connections could not be loaded. Refresh to try again.</div>}

      <section className="mb-5 grid gap-4 rounded-3xl border border-border-subtle bg-white p-5 shadow-card lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex items-center gap-2"><span className="text-brand"><Icon name="activity" /></span><h2 className="font-extrabold text-ink">Data readiness</h2><span className="rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-muted">{readiness}/3 ready</span></div>
          <div className="mt-3 h-2 max-w-2xl overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(readiness / 3) * 100}%` }} /></div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
            <span className="flex items-center gap-1.5"><span className={healthyAccounts.length ? "text-good" : "text-muted"}><Icon name={healthyAccounts.length ? "check-circle" : "hourglass"} size={14} /></span> Source connected</span>
            <span className="flex items-center gap-1.5"><span className={org?.last_synced_at ? "text-good" : "text-muted"}><Icon name={org?.last_synced_at ? "check-circle" : "hourglass"} size={14} /></span> Fresh data received</span>
            <span className="flex items-center gap-1.5"><span className={hasScore ? "text-good" : "text-muted"}><Icon name={hasScore ? "check-circle" : "hourglass"} size={14} /></span> First audit scored</span>
          </div>
        </div>
        {healthyAccounts.length > 0 && !hasScore && <RunFirstAudit />}
        {hasScore && <Link href="/command" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white"><Icon name="radar" size={16} /> Open today’s brief</Link>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ProviderCard name="Meta" platform="meta" icon="target" accounts={accounts} enabled={apiEnabled} description="Facebook and Instagram advertising insights through Meta’s normal authorisation screen. Requested scope: read advertising data only." />
        <ProviderCard name="TikTok Ads" platform="tiktok" icon="clapper" accounts={accounts} enabled={apiEnabled} description="Campaign, ad-group and creative performance from TikTok Ads. AdPilot requests reporting access, not spending control." />
        <article className="flex flex-col rounded-3xl border border-border-subtle bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface text-brand"><Icon name="upload" size={21} /></span><span className="rounded-full bg-good/10 px-2.5 py-1 text-2xs font-extrabold uppercase text-green-700">All plans</span></div>
          <h2 className="mt-4 text-lg font-extrabold text-ink">CSV import</h2>
          <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">Use an export when OAuth is unavailable, for a one-off audit, or before committing to an automated connection.</p>
          <Link href="/dashboard" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-bold text-ink hover:border-brand-200"><Icon name="upload" size={16} /> Import a CSV</Link>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-border-subtle bg-white shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div><h2 className="text-lg font-extrabold text-ink">Connected accounts</h2><p className="mt-1 text-sm text-muted">Credentials are intentionally never displayed back. You see permission and health state instead.</p></div>
          <span className="inline-flex items-center gap-2 rounded-full bg-good/10 px-3 py-1.5 text-xs font-bold text-green-700"><Icon name="shield" size={14} /> Read-only advertising access</span>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-surface text-muted"><Icon name="link" size={22} /></span><p className="mt-3 font-bold text-ink">No advertising accounts connected</p><p className="mt-1 text-sm text-muted">Choose Meta, TikTok or CSV above. You never enter your social password into AdPilot.</p></div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {accounts.map((account) => {
              const needsReconnect = account.status === "disconnected" || account.status === "error";
              const platform = account.platform === "tiktok" ? "tiktok" : "meta";
              return (
                <article key={`${account.platform}-${account.external_account_id}`} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${needsReconnect ? "bg-bad/10 text-bad" : "bg-good/10 text-green-700"}`}><Icon name={needsReconnect ? "alert-triangle" : "check-circle"} size={17} /></span>
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-ink">{account.display_name || `${account.platform} account`}</h3><span className="rounded-full bg-surface px-2 py-0.5 text-2xs font-extrabold uppercase text-muted">{account.platform}</span></div><p className={`mt-0.5 text-xs font-semibold ${needsReconnect ? "text-bad" : "text-green-700"}`}>{needsReconnect ? "Authorisation expired — reconnect to resume fresh data" : "Connected and available for read-only sync"}</p><p className="mt-1 text-2xs text-muted">{maskAccountId(account.external_account_id)} · added {new Date(account.created_at).toLocaleDateString("en-AU")}</p></div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {needsReconnect ? <a href={`/api/oauth/${platform}/start`} className="rounded-xl bg-brand px-3.5 py-2 text-sm font-bold text-white">Reconnect</a> : <SyncButton platform={platform} />}
                    <RemoveAccountButton platform={platform} externalAccountId={account.external_account_id} label={account.display_name} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card">
          <div className="flex items-center gap-2"><span className="text-brand"><Icon name="lock" /></span><h2 className="font-extrabold text-ink">How credentials are handled</h2></div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <li className="flex gap-2"><span className="mt-0.5 text-good"><Icon name="check-circle" size={15} /></span> OAuth opens the provider’s own sign-in page. AdPilot never receives your Meta or TikTok password.</li>
            <li className="flex gap-2"><span className="mt-0.5 text-good"><Icon name="check-circle" size={15} /></span> Stored tokens are encrypted and never returned to the browser or shown in this interface.</li>
            <li className="flex gap-2"><span className="mt-0.5 text-good"><Icon name="check-circle" size={15} /></span> Removing the last account for a provider clears the stored connection credential while keeping audit history.</li>
          </ul>
          <Link href="/privacy" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">Read the privacy policy <Icon name="chevron-right" size={14} /></Link>
        </div>

        <div className="rounded-3xl border border-border-subtle bg-white p-5 shadow-card">
          <div className="flex items-center gap-2"><span className="text-brand"><Icon name="refresh" /></span><h2 className="font-extrabold text-ink">Recovery & advanced setup</h2></div>
          <p className="mt-2 text-sm leading-relaxed text-muted">If normal sign-in fails, follow the guided recovery steps. Administrators can also use a provider-issued read-only System User token.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link href="/connect/guide" className="rounded-xl border border-border-subtle px-3.5 py-2 text-sm font-bold text-ink hover:border-brand-200">Connection guide</Link>{apiEnabled && <a href="#manual-token" className="rounded-xl border border-border-subtle px-3.5 py-2 text-sm font-bold text-ink hover:border-brand-200">Use a read-only token</a>}</div>
        </div>
      </section>

      {apiEnabled && (
        <details id="manual-token" className="mt-5 scroll-mt-20 rounded-3xl border border-border-subtle bg-white p-5 shadow-card">
          <summary className="cursor-pointer list-none font-extrabold text-ink"><span className="inline-flex items-center gap-2"><Icon name="key" size={18} /> Advanced: connect with a System User token <span className="text-xs font-normal text-muted">(admins only)</span></span></summary>
          <p className="mt-3 text-sm text-muted">Use this only when an administrator issued a token with reporting scopes. Leave the account ID blank to detect authorised accounts automatically.</p>
          <div className="mt-4"><TokenConnect /></div>
        </details>
      )}

      {!apiEnabled && <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-ink"><b>{PLAN_LABEL[plan]} includes CSV audits.</b> Pro and Expert add normal Meta/TikTok sign-in plus scheduled sync. <Link href="/billing" className="font-bold text-brand underline">Compare plans</Link>.</div>}

      {leadLoop && hasMeta && <section className="mt-5 rounded-3xl border border-border-subtle bg-white p-5 shadow-card"><h2 className="font-extrabold text-ink">Lead quality feedback</h2><p className="mb-4 mt-1 text-sm text-muted">Connect lead outcomes so AdPilot can separate cheap leads from useful leads.</p><LeadAdsSync /></section>}

      <p className="mt-5 text-center text-2xs text-muted">Connected source for the first audit: {firstPlatform}. Paid-ad writing permissions are not requested.</p>
    </div>
  );
}
