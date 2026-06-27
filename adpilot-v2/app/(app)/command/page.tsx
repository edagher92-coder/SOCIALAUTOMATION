import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { verdictMeta, bandMeta, cadenceText, VERDICT_GLOSSARY_KEY } from "@/lib/proposals";
import { metricDef } from "@/lib/metric-glossary";
import { summariseSeries } from "@/lib/engine/timeseries";
import { fmt } from "@/lib/engine/metrics";
import ModeAware from "@/components/ModeAware";
import ReadOnlyBadge from "@/components/ReadOnlyBadge";
import WastedSpendWidget from "@/components/WastedSpendWidget";
import Tip from "@/components/Tip";
import Sparkline from "@/components/Sparkline";
import { analyseAccount } from "@/lib/organic/account";
import { getAccountCpmByPlatform } from "@/lib/organic/cpm";

export const dynamic = "force-dynamic";

const fmtAgo = (iso?: string | null) => {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

// Honest per-status display for an ingestion run (mirrors the ingestion_runs.status enum).
// `empty` is NOT a failure — it means the account had no delivery in the window, so there is
// nothing to score; we say so plainly rather than implying a problem.
const RUN_STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  ok:           { label: "Synced",                    cls: "text-teal",        dot: "bg-teal" },
  empty:        { label: "No delivery in the window", cls: "text-muted",       dot: "bg-muted" },
  partial:      { label: "Partial — more to pull",    cls: "text-band-yellow", dot: "bg-band-yellow" },
  rate_limited: { label: "Rate-limited — will retry", cls: "text-band-yellow", dot: "bg-band-yellow" },
  auth_failed:  { label: "Reconnect needed",          cls: "text-band-red",    dot: "bg-band-red" },
  error:        { label: "Sync error",                cls: "text-band-red",    dot: "bg-band-red" },
};

export default async function CommandCenter() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";

  // Signed-out / no-org: show a calm prompt rather than querying with an empty id.
  if (!orgId) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border-subtle bg-surface-raised p-10 text-center">
          <div className="text-3xl">🛰️</div>
          <p className="mt-2 text-lg font-bold text-ink">Sign in to open your Command Centre</p>
          <p className="mt-1 text-sm text-muted">
            Your Campaign Health Score and safe proposals live here once you’re signed in.
          </p>
          <a href="/login" className="mt-4 inline-block rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:opacity-95">Sign in</a>
        </div>
      </div>
    );
  }

  const plan = await planForOrg(orgId);
  const aiEnabled = can(plan, "ai_team");
  const apiEnabled = can(plan, "api_connect");

  const [orgRes, scoreRes, openRecsRes, accountsRes, reportsRes, trendRes, latestReportRes, organicRes, organicCpm, ingestionRes] = await Promise.all([
    supabase.from("organisations").select("name,last_synced_at,sync_interval_hours").eq("id", orgId).maybeSingle(),
    supabase.from("health_scores").select("total,band,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("recommendations").select("id,verdict,entity_name,platform,proposal").eq("organisation_id", orgId).eq("status", "open").order("created_at", { ascending: false }).limit(100),
    supabase.from("connected_ad_accounts").select("platform,display_name,status").eq("organisation_id", orgId),
    supabase.from("reports").select("id,title,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(5),
    supabase.from("health_scores").select("total,created_at").eq("organisation_id", orgId).order("created_at", { ascending: true }).limit(60),
    supabase.from("reports").select("payload").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    // Organic boost tile (Starter+): the org's saved organic posts + its real CPM (RLS-scoped reads).
    supabase.from("organic_posts").select("id,platform,name,posted_at,reach,impressions,engagements").eq("organisation_id", orgId),
    getAccountCpmByPlatform(supabase, orgId).catch(() => ({ meta: null, tiktok: null })),
    // Ingestion audit log (Pro/Expert API path) — RLS-scoped. Read-only; surfaced as the trust panel.
    apiEnabled
      ? supabase.from("ingestion_runs").select("platform,status,rows_written,window_days,started_at,graph_version").eq("organisation_id", orgId).order("started_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: [], error: null }),
  ]);

  // Surface a clear banner if the data layer is unreachable, but still render the shell.
  const loadError = orgRes.error || scoreRes.error || openRecsRes.error || accountsRes.error || reportsRes.error;
  const org = orgRes.data;
  const score = scoreRes.data;
  const openRecs = openRecsRes.data;
  const accounts = accountsRes.data;
  const reports = reportsRes.data;

  const total = (score as any)?.total != null ? Math.round((score as any).total) : null;
  const band = bandMeta((score as any)?.band);
  const recs = (openRecs || []) as any[];
  const byVerdict = recs.reduce((m: Record<string, number>, r) => ((m[r.verdict] = (m[r.verdict] || 0) + 1), m), {});
  const attention = recs.slice().sort((a, b) => verdictMeta(a.verdict).rank - verdictMeta(b.verdict).rank).slice(0, 4);
  // Health-score trend over the saved history (P3 diagnostics surfaced).
  const trendHist = ((trendRes.data || []) as any[]).map((r) => Number(r.total)).filter((v) => Number.isFinite(v));
  const trend = summariseSeries(trendHist);
  const trendArrow = trend.trend === "rising" ? "↑" : trend.trend === "falling" ? "↓" : "→";
  const trendWow = trend.wowPct == null ? null : Math.round(trend.wowPct * 100);
  // Money at stake — straight from the latest saved report's summary (numbers are never invented).
  const summ = (latestReportRes.data as any)?.payload?.summary as Record<string, number | null | undefined> | undefined;
  const ccy = (latestReportRes.data as any)?.payload?.config?.currency || "AUD";
  const mny = (v: number | null | undefined) => (v == null ? null : `${ccy === "AUD" ? "$" : ccy + " "}${fmt(v)}`);
  const moneySpend = summ?.spend ?? null;
  const moneyCpa = summ?.cpa ?? null;
  const moneyBe = summ?.break_even_cpa ?? null;
  const cpaOverBe = moneyCpa != null && moneyBe != null && moneyBe > 0 ? moneyCpa > moneyBe : null;
  // ROAS reconciliation: our derived revenue/spend vs Meta's own reported ROAS (different
  // attribution window). Shown side-by-side for the human to judge — no pass/fail threshold.
  const roasDerived = (summ?.roas ?? null) as number | null;
  const roasMeta = ((summ as any)?.roas_meta ?? null) as number | null;
  const accts = (accounts || []) as any[];
  // Ingestion audit (intentionally NOT folded into loadError: a not-yet-migrated table during
  // rollout should degrade to "no sync yet", never the red data-layer banner).
  const runs = (((ingestionRes as any)?.data) || []) as any[];
  const lastRun = runs[0] || null;
  const cadence = cadenceText((org as any)?.sync_interval_hours);
  const name = (org as any)?.name || "your workspace";

  // Organic boost roll-up (Starter+). Degrades gracefully if the table/posts aren't there yet.
  const organicEntitled = can(plan, "content_publish");
  const organicPosts = ((organicRes.data || []) as any[])
    .map((r) => ({
      id: r.id, platform: r.platform, name: r.name ?? undefined, date: r.posted_at ?? undefined,
      reach: Number(r.reach) || 0, impressions: Number(r.impressions) || 0, engagements: Number(r.engagements) || 0,
    }))
    .filter((p) => p.platform === "meta" || p.platform === "tiktok");
  const organic = organicEntitled && organicPosts.length ? analyseAccount(organicPosts, organicCpm as any) : null;

  return (
    <div className="animate-fade-in">
      {loadError && (
        <div className="mb-4 rounded-2xl border border-band-red/30 bg-band-red/5 p-3 text-sm font-semibold text-band-red">
          Some live data couldn’t load right now. Showing what we have — refresh to retry.
        </div>
      )}
      {/* Control-room hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-command via-navy to-command p-6 text-white shadow-card md:p-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand/40 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-teal/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/60">Command Centre</div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{name}</h1>
            <p className="mt-1 text-sm text-white/70">
              {apiEnabled
                ? <>Auto-syncing <b className="text-white">{cadence}</b> · last pull {fmtAgo((org as any)?.last_synced_at)} · then scored & queued for you.</>
                : <>CSV mode on {PLAN_LABEL[plan]}. Upgrade to auto-sync Meta & TikTok live.</>}
            </p>
            <div className="mt-2"><ReadOnlyBadge /></div>
          </div>

          {/* Health gauge */}
          <div className="flex w-full items-center justify-end gap-4 rounded-2xl bg-white/10 px-5 py-4 backdrop-blur sm:w-auto">
            <div className="text-right">
              <div className="text-4xl font-extrabold leading-none">{total ?? "—"}<span className="text-lg text-white/50">/100</span></div>
              <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold uppercase tracking-wide text-white/70">
                <span>{(score as any)?.band || "no score"} · {band.label}</span>
                <Tip tone="dark" align="right" label="Campaign Health Score" term={metricDef("Campaign Health Score")!.term}>{metricDef("Campaign Health Score")!.what}</Tip>
              </div>
              {trend.n >= 3 && (
                <div className="mt-1 text-xs text-white/80">
                  <span title="Trend over your saved health-score history">
                    {trendArrow} {trend.trend}{trendWow != null ? ` · ${trendWow >= 0 ? "+" : ""}${trendWow}% WoW` : ""}
                  </span>
                  <Sparkline values={trendHist} className="ml-auto mt-1 block text-white/60" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Money at stake — honest figures from the last audit (no fabricated "wasted spend"). */}
        {moneySpend != null && (
          <div className="relative mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="text-white/60">Last audit:</span>
            <span className="font-bold">{mny(moneySpend)}<span className="ml-1 font-normal text-white/60">spend</span></span>
            {moneyCpa != null && (
              <span className="font-bold">
                CPA {mny(moneyCpa)}
                {moneyBe != null && <span className="ml-1 font-normal text-white/60">vs break-even {mny(moneyBe)}</span>}
              </span>
            )}
            {cpaOverBe != null && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cpaOverBe ? "bg-band-red/25 text-white" : "bg-teal/25 text-white"}`}>
                {cpaOverBe ? "CPA above break-even" : "CPA at / below break-even"}
              </span>
            )}
            {roasDerived != null && roasMeta != null && (
              <span className="font-bold">
                ROAS {fmt(roasDerived)}x
                <span className="ml-1 font-normal text-white/60">vs Meta-reported {fmt(roasMeta)}x · attribution-window difference</span>
              </span>
            )}
          </div>
        )}

        {/* Verdict pills */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {(["fix-tracking", "kill", "reduce", "refresh", "scale"] as const).map((v) => {
            const m = verdictMeta(v);
            const n = byVerdict[v] || 0;
            const def = metricDef(VERDICT_GLOSSARY_KEY[v]);
            return (
              <span key={v} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${n ? "bg-white/15 text-white" : "bg-white/5 text-white/55"}`}>
                {m.emoji} {m.label} {n > 0 && <b>{n}</b>}
                {def && <Tip tone="dark" label={m.label} term={def.term}>{def.what}</Tip>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Needs your attention */}
        <section className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Needs your attention</h2>
            <a href="/proposals" className="text-sm font-semibold text-brand">All proposals →</a>
          </div>
          {attention.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-muted">
              Nothing flagged. {apiEnabled ? "Connect an account and let a sync run." : "Paste a CSV on Ads Health to get scored."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {attention.map((r) => {
                const m = verdictMeta(r.verdict);
                return (
                  <a key={r.id} href="/proposals" className="block rounded-2xl border border-border-subtle bg-white p-4 shadow-card transition hover:shadow-card-hover">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-extrabold ${m.cls}`}>{m.emoji} {m.label}</span>
                      <span className="truncate text-sm font-semibold text-ink">· {r.entity_name}</span>
                    </div>
                    {r.proposal && <p className="mt-1 line-clamp-2 text-sm text-muted">{r.proposal}</p>}
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* Right rail — Advanced view only; Simple keeps just the score + top fixes (10-second answer). */}
        <ModeAware only="advanced">
        <aside className="space-y-5">
          {/* Connections */}
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">Connections</h3>
              <a href="/connect" className="text-xs font-semibold text-brand">Manage →</a>
            </div>
            {accts.length === 0 ? (
              <p className="text-sm text-muted">No accounts connected. <a className="font-semibold text-brand" href="/connect">Connect Meta / TikTok</a> or use CSV.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {accts.map((a, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="truncate">{a.display_name} <span className="text-2xs uppercase text-muted">{a.platform}</span></span>
                    <span className="inline-flex items-center gap-1 text-2xs font-bold text-teal"><span className="h-1.5 w-1.5 rounded-full bg-teal animate-live-pulse" />{a.status}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-2xs text-muted">Auto-sync: <b>{cadence}</b> · <a className="text-brand" href="/settings">change</a></p>
          </div>

          {/* Wasted spend counter — live account data (Pro+). Best-effort client fetch. */}
          {apiEnabled && <WastedSpendWidget />}

          {/* Data sync — honest ingestion audit (read-only). Proves the numbers are live, when they
              last refreshed, and surfaces an empty/rate-limited/reconnect state plainly. */}
          {apiEnabled && (
            <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-bold">Data sync</h3>
                <a href="/connect" className="text-xs font-semibold text-brand">Manage →</a>
              </div>
              {!lastRun ? (
                <p className="text-sm text-muted">No sync has run yet. Connect an account and run your first audit to pull live data.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${(RUN_STATUS[lastRun.status] || RUN_STATUS.error).cls}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${(RUN_STATUS[lastRun.status] || RUN_STATUS.error).dot}`} />
                      {(RUN_STATUS[lastRun.status] || RUN_STATUS.error).label}
                    </span>
                    <span className="text-2xs text-muted">{fmtAgo(lastRun.started_at)}</span>
                  </div>
                  <p className="mt-1 text-2xs text-muted">
                    {lastRun.platform} · {Number(lastRun.rows_written) || 0} row{Number(lastRun.rows_written) === 1 ? "" : "s"} · {lastRun.window_days ?? 30}-day window{lastRun.graph_version ? ` · ${lastRun.graph_version}` : ""}
                  </p>
                  {runs.length > 1 && (
                    <ul className="mt-2 space-y-1 border-t border-border-subtle pt-2">
                      {runs.slice(1, 5).map((r, i) => {
                        const s = RUN_STATUS[r.status] || RUN_STATUS.error;
                        return (
                          <li key={i} className="flex items-center justify-between text-2xs">
                            <span className={`inline-flex items-center gap-1 ${s.cls}`}><span className={`h-1 w-1 rounded-full ${s.dot}`} />{s.label}</span>
                            <span className="text-muted">{fmtAgo(r.started_at)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="mt-2 text-2xs text-muted">Read-only audit log — nothing in your ad account was changed.</p>
                </>
              )}
            </div>
          )}

          {/* AI team */}
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">AI team</h3>
              <a href="/ai-specialists" className="text-xs font-semibold text-brand">Open →</a>
            </div>
            {aiEnabled ? (
              <p className="text-sm text-muted">Mira, Travis, Dana, Atlas, Paige & more — grounded in your live numbers, proposals only.</p>
            ) : (
              <p className="text-sm text-muted">🔒 The AI specialist team is a Pro & Expert feature. <a className="font-semibold text-brand" href="/billing">Upgrade</a>.</p>
            )}
          </div>

          {/* Organic boost */}
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">Organic boost</h3>
              <a href="/boost" className="text-xs font-semibold text-brand">Open →</a>
            </div>
            {!organicEntitled ? (
              <p className="text-sm text-muted">🔒 Analyse organic posts & project boost reach on Starter+. <a className="font-semibold text-brand" href="/billing">Upgrade</a>.</p>
            ) : !organic ? (
              <p className="text-sm text-muted">No saved organic posts yet. <a className="font-semibold text-brand" href="/boost">Add posts</a> to see which are worth boosting.</p>
            ) : (
              <div className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-ink">{organic.recommendations.length}</span>
                  <span className="text-muted">boost-ready {organic.recommendations.length === 1 ? "post" : "posts"} of {organic.summary.posts}</span>
                </div>
                {organic.recommendations.length > 0 ? (
                  <p className="mt-1 text-muted">
                    Projected <b className="text-ink">+{Math.round(organic.projectedAddedReach).toLocaleString("en-AU")}</b> reach for ${Math.round(organic.totalRecommendedBudget).toLocaleString("en-AU")}
                    <span className="ml-1 text-2xs">· estimate, your call in Ads Manager</span>
                  </p>
                ) : (
                  <p className="mt-1 text-muted">Nothing clears the benchmark yet — keep testing organically.</p>
                )}
              </div>
            )}
          </div>

          {/* Recent reports */}
          <div className="rounded-2xl border border-border-subtle bg-white p-4 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">Recent reports</h3>
              <Link href="/reports" className="text-xs font-semibold text-brand">All →</Link>
            </div>
            {(reports || []).length === 0 ? (
              <p className="text-sm text-muted">No reports yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {(reports as any[]).map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <a href={`/reports/${r.id}`} className="truncate text-ink hover:text-brand">{r.title}</a>
                    <span className="flex-shrink-0 text-2xs text-muted">{fmtAgo(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
        </ModeAware>
      </div>
    </div>
  );
}
