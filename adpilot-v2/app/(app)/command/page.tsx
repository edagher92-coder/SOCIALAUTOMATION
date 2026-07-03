import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, PLAN_LABEL } from "@/lib/entitlements";
import { verdictMeta, cadenceText } from "@/lib/proposals";
import { metricDef } from "@/lib/metric-glossary";
import { summariseSeries } from "@/lib/engine/timeseries";
import { fmt } from "@/lib/engine/metrics";
import { evaluateGuardrails, DEFAULT_GUARDRAILS } from "@/lib/engine/guardrails";
import ModeAware from "@/components/ModeAware";
import ReadOnlyBadge from "@/components/ReadOnlyBadge";
import Tip from "@/components/Tip";
import RecActions from "@/components/RecActions";
import WastedSpendWidget from "@/components/WastedSpendWidget";
import GuardrailRangeToggle from "@/components/GuardrailRangeToggle";
import { Icon, VERDICT_ICON } from "@/components/icons";
import { RingGauge, TrendChart, PacingBar, DistributionStrip, TONE, toneForBand, type Tone } from "@/components/charts";

export const dynamic = "force-dynamic";

// V7 Mission Control — the "Warm Cockpit". Dark money surface; semantic good/warn/bad are the
// only status carriers; brand coral is reserved for actions. Read-only throughout: guardrails
// and pacing PROPOSE — the human acts in Ads Manager.

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);

const fmtAgo = (iso?: string | null) => {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

// Honest per-status display for an ingestion run (mirrors ingestion_runs.status).
const RUN_STATUS: Record<string, { label: string; tone: Tone }> = {
  ok:           { label: "Synced",                    tone: "good" },
  empty:        { label: "No delivery in the window", tone: "muted" },
  partial:      { label: "Partial — more to pull",    tone: "warn" },
  rate_limited: { label: "Rate-limited — will retry", tone: "warn" },
  auth_failed:  { label: "Reconnect needed",          tone: "bad" },
  error:        { label: "Sync error",                tone: "bad" },
};

const DIST_TONE: Record<string, Tone> = {
  keep: "good", scale: "good", duplicate: "good",
  reduce: "warn", refresh: "warn", "fix-tracking": "warn",
  kill: "bad", "insufficient-data": "muted",
};

function Panel({ children, className = "", hot = false }: { children: React.ReactNode; className?: string; hot?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${hot ? "border-bad/40 bg-bad/10" : "border-cockpit-edge bg-cockpit-raised"} ${className}`}>
      {children}
    </div>
  );
}

function StatusChip({ status }: { status: "ok" | "warn" | "breach" | "no-ceiling" | "no-cap" }) {
  const map: Record<string, { label: string; tone: Tone }> = {
    ok: { label: "OK", tone: "good" }, warn: { label: "Watch", tone: "warn" },
    breach: { label: "Over", tone: "bad" }, "no-ceiling": { label: "No budget on record", tone: "muted" },
    "no-cap": { label: "No cap set", tone: "muted" },
  };
  const m = map[status];
  return (
    <span className="rounded-full px-2 py-0.5 text-2xs font-bold" style={{ color: TONE[m.tone], background: `${TONE[m.tone]}1f` }}>
      {m.label}
    </span>
  );
}

const ALLOWED_GUARDRAIL_DAYS = new Set([1, 7, 30]);

export default async function MissionControl({
  searchParams,
}: {
  searchParams?: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const requestedDays = Number(sp?.days);
  const guardrailDays = ALLOWED_GUARDRAIL_DAYS.has(requestedDays) ? requestedDays : 7;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user ? await getActiveOrgId(user.id, user.email ?? undefined) : "";

  if (!orgId) {
    return (
      <div className="animate-fade-in">
        <div className="rounded-3xl border border-dashed border-border-subtle bg-surface-raised p-10 text-center">
          <div className="mx-auto mb-2 w-fit text-brand"><Icon name="radar" size={34} /></div>
          <p className="text-lg font-bold text-ink">Sign in to open Mission Control</p>
          <p className="mt-1 text-sm text-muted">Your Campaign Health Score and safe proposals live here once you’re signed in.</p>
          <a href="/login" className="mt-4 inline-block rounded-xl bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-glow transition hover:opacity-95">Sign in</a>
        </div>
      </div>
    );
  }

  const plan = await planForOrg(orgId);
  const aiEnabled = can(plan, "ai_team");
  const apiEnabled = can(plan, "api_connect");
  const since = daysAgoIso(guardrailDays);

  const [orgRes, scoreRes, openRecsRes, accountsRes, reportsRes, trendRes, latestReportRes, snapshotsRes, ingestionRes] = await Promise.all([
    supabase.from("organisations").select("name,last_synced_at,sync_interval_hours,monthly_budget").eq("id", orgId).maybeSingle(),
    supabase.from("health_scores").select("total,band,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("recommendations").select("id,verdict,entity_name,platform,proposal,reason").eq("organisation_id", orgId).eq("status", "open").order("created_at", { ascending: false }).limit(100),
    supabase.from("connected_ad_accounts").select("platform,display_name,status").eq("organisation_id", orgId),
    supabase.from("reports").select("id,title,created_at").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(4),
    supabase.from("health_scores").select("total,created_at").eq("organisation_id", orgId).order("created_at", { ascending: true }).limit(60),
    supabase.from("reports").select("payload").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    // Budget guardrails input — last N days (1/7/30, user-selectable) of per-campaign daily rows (spend + budget on record).
    supabase.from("campaign_snapshots").select("campaign_name,platform,date,spend,daily_budget").eq("organisation_id", orgId).gte("date", since).limit(4000),
    apiEnabled
      ? supabase.from("ingestion_runs").select("platform,status,rows_written,window_days,started_at").eq("organisation_id", orgId).order("started_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const loadError = orgRes.error || scoreRes.error || openRecsRes.error || accountsRes.error || reportsRes.error;
  const org = orgRes.data as any;
  const score = scoreRes.data as any;
  const recs = ((openRecsRes.data || []) as any[]);
  const accts = ((accountsRes.data || []) as any[]);
  const reports = ((reportsRes.data || []) as any[]);
  const runs = (((ingestionRes as any)?.data) || []) as any[];

  const total = score?.total != null ? Math.round(score.total) : null;
  const band = (score?.band as string) || null;
  const bandTone = toneForBand(band);

  // Health trend — real chart over the saved history.
  const trendRows = ((trendRes.data || []) as any[]).filter((r) => Number.isFinite(Number(r.total)));
  const trendPts = trendRows.map((r) => ({ label: String(r.created_at).slice(0, 10), value: Number(r.total) }));
  const trend = summariseSeries(trendPts.map((p) => p.value));

  // The FULL picture — every decision from the latest audit, not just the exceptions.
  const payload = (latestReportRes.data as any)?.payload;
  const decisions = (payload?.decisions ?? []) as { verdict: string }[];
  const distCounts = decisions.reduce((m: Record<string, number>, d) => ((m[d.verdict] = (m[d.verdict] || 0) + 1), m), {});
  const distOrder = ["kill", "reduce", "refresh", "fix-tracking", "insufficient-data", "keep", "duplicate", "scale"];
  const distSegments = distOrder.filter((v) => distCounts[v]).map((v) => ({ label: v, count: distCounts[v], tone: DIST_TONE[v] ?? ("muted" as Tone) }));
  const nFine = (distCounts["keep"] || 0) + (distCounts["duplicate"] || 0) + (distCounts["scale"] || 0);
  const nData = distCounts["insufficient-data"] || 0;
  const nAction = decisions.length - nFine - nData;

  // Money numbers — straight from the last audit summary (never invented).
  const summ = payload?.summary as Record<string, number | null | undefined> | undefined;
  const ccy = payload?.config?.currency || "AUD";
  const mny = (v: number | null | undefined) => (v == null ? null : `${ccy === "AUD" ? "$" : ccy + " "}${fmt(v)}`);
  const cpa = (summ?.cpa ?? null) as number | null;
  const beCpa = (summ?.break_even_cpa ?? null) as number | null;
  const cpaDelta = cpa != null && beCpa != null && beCpa > 0 ? cpa / beCpa - 1 : null;
  const roasDerived = (summ?.roas ?? null) as number | null;
  const roasMeta = ((summ as any)?.roas_meta ?? null) as number | null;

  // Guardrails + pacing (pure engine; read-only).
  const guard = evaluateGuardrails(((snapshotsRes.data || []) as any[]), { monthlyBudget: org?.monthly_budget ?? null });
  const withCeiling = guard.campaigns.filter((c) => c.status !== "no-ceiling");
  const noCeiling = guard.campaigns.filter((c) => c.status === "no-ceiling");

  const attention = recs.slice().sort((a, b) => verdictMeta(a.verdict).rank - verdictMeta(b.verdict).rank).slice(0, 4);
  const cadence = cadenceText(org?.sync_interval_hours);
  const name = org?.name || "your workspace";
  const healthDef = metricDef("Campaign Health Score");

  return (
    <div className="animate-fade-in -m-5 min-h-screen bg-cockpit p-5 text-cockpit-ink md:-m-8 md:p-8">
      {loadError && (
        <div className="mb-4 rounded-2xl border border-bad/40 bg-bad/10 p-3 text-sm font-semibold" style={{ color: TONE.bad }}>
          Some live data couldn’t load right now. Showing what we have — refresh to retry.
        </div>
      )}

      {/* ── Status strip ─────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex items-center gap-2 text-brand"><Icon name="radar" size={20} /><span className="text-xs font-bold uppercase tracking-widest text-cockpit-muted">Mission Control</span></span>
        <h1 className="text-xl font-extrabold tracking-tight md:text-2xl">{name}</h1>
        <span className="text-xs text-cockpit-muted">
          {apiEnabled
            ? <>auto-sync <b className="text-cockpit-ink">{cadence}</b> · last pull {fmtAgo(org?.last_synced_at)}</>
            : <>CSV mode on {PLAN_LABEL[plan]}</>}
        </span>
        <span className="ml-auto"><ReadOnlyBadge /></span>
      </div>

      {/* ── Hero row: health + trend + the full picture ─────── */}
      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Panel className="flex items-center gap-5">
          <div style={{ color: TONE[bandTone] }}><RingGauge value={total} tone={bandTone} label="Campaign Health Score" sub={band ?? "no score"} /></div>
          <div className="min-w-[130px]">
            <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-widest text-cockpit-muted">
              Health score
              {healthDef && <Tip tone="dark" align="left" label="Campaign Health Score" term={healthDef.term}>{healthDef.what}</Tip>}
            </div>
            {trend.n >= 3 && (
              <p className="mt-1 text-xs text-cockpit-muted">
                <span style={{ color: trend.trend === "rising" ? TONE.good : trend.trend === "falling" ? TONE.bad : TONE.muted }}>
                  {trend.trend === "rising" ? "▲" : trend.trend === "falling" ? "▼" : "→"} {trend.trend}
                </span>
                {trend.wowPct != null && <> · {trend.wowPct >= 0 ? "+" : ""}{Math.round(trend.wowPct * 100)}% WoW</>}
              </p>
            )}
            {total == null && <p className="mt-1 text-xs text-cockpit-muted">Run your first audit to get scored.</p>}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xs font-bold uppercase tracking-widest text-cockpit-muted">Health over time</span>
            {decisions.length > 0 && (
              <span className="text-xs text-cockpit-muted">
                <b className="text-cockpit-ink tabular-nums">{decisions.length}</b> ads evaluated ·{" "}
                <b className="tabular-nums" style={{ color: TONE.good }}>{nFine} fine</b> ·{" "}
                <b className="tabular-nums" style={{ color: TONE.muted }}>{nData} need data</b> ·{" "}
                <b className="tabular-nums" style={{ color: TONE.warn }}>{nAction} need action</b>
              </span>
            )}
          </div>
          {trendPts.length >= 2
            ? <div className="mt-2"><TrendChart points={trendPts} title="Health score trend, 0–100" /></div>
            : <p className="mt-3 text-sm text-cockpit-muted">Trend appears after a few audits — each sync adds a point.</p>}
          {distSegments.length > 0 && (
            <div className="mt-3">
              <DistributionStrip segments={distSegments} />
              <p className="mt-1.5 text-2xs text-cockpit-muted">Full verdict distribution from the latest audit — the whole account, not just the exceptions.</p>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Money row ────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Panel>
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-widest text-cockpit-muted">Today’s pacing</span>
            <StatusChip status={guard.combined.status} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tabular-nums">{mny(guard.combined.spendToday) ?? "$0.00"}</span>
            {guard.combined.cap != null && <span className="text-xs text-cockpit-muted tabular-nums">of {mny(guard.combined.cap)} daily share</span>}
          </div>
          <div className="mt-2.5">
            <PacingBar value={guard.combined.spendToday} cap={guard.combined.cap} projected={guard.combined.projectedEod} format={(v) => fmt(v)} />
          </div>
          <p className="mt-2 text-2xs text-cockpit-muted">
            {guard.combined.cap == null
              ? <>Set a monthly budget in <Link href="/settings" className="underline" style={{ color: TONE.ice }}>Settings</Link> to unlock the daily cap line.</>
              : guard.combined.projectedEod != null
                ? <>Naive projection: ~{mny(guard.combined.projectedEod)} by end of day{guard.date ? ` · data date ${guard.date}` : ""}.</>
                : <>Cap = monthly budget ÷ days in month{guard.date ? ` · data date ${guard.date}` : ""}.</>}
          </p>
        </Panel>

        <WastedSpendWidget />

        <Panel>
          <span className="text-2xs font-bold uppercase tracking-widest text-cockpit-muted">CPA vs break-even</span>
          {cpa != null && beCpa != null ? (
            <>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold tabular-nums">{mny(cpa)}</span>
                <span className="rounded-full px-2 py-0.5 text-2xs font-bold tabular-nums"
                  style={{ color: TONE[cpaDelta != null && cpaDelta > 0 ? "bad" : "good"], background: `${TONE[cpaDelta != null && cpaDelta > 0 ? "bad" : "good"]}1f` }}>
                  {cpaDelta != null ? `${cpaDelta > 0 ? "+" : ""}${Math.round(cpaDelta * 100)}% vs break-even` : ""}
                </span>
              </div>
              <p className="mt-2 text-2xs text-cockpit-muted tabular-nums">Break-even {mny(beCpa)} · from your sale value × margin.</p>
              {roasDerived != null && roasMeta != null && (
                <p className="mt-1 text-2xs text-cockpit-muted tabular-nums">ROAS {fmt(roasDerived)}× vs platform-reported {fmt(roasMeta)}× — attribution-window difference, shown side-by-side on purpose.</p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-cockpit-muted">Appears after your first audit with purchase data.</p>
          )}
        </Panel>
      </div>

      {/* ── Guardrails panel (Advanced) ──────────────────────── */}
      <ModeAware only="advanced">
        <Panel className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-2xs font-bold uppercase tracking-widest text-cockpit-muted">
              <Icon name="shield" size={14} /> Budget guardrails
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xs text-cockpit-muted">warn at {Math.round(DEFAULT_GUARDRAILS.warnAt * 100)}% · read-only — breaches become proposals, never actions</span>
              <GuardrailRangeToggle days={guardrailDays} />
            </div>
          </div>
          {withCeiling.length === 0 && noCeiling.length === 0 ? (
            <p className="mt-3 text-sm text-cockpit-muted">No campaign data in the last {guardrailDays} day{guardrailDays !== 1 ? "s" : ""}. Connect an account or paste a CSV on Ads Health.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {withCeiling.map((c) => (
                <div key={c.key} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="w-56 min-w-0 flex-shrink truncate text-sm font-semibold" title={c.name}>{c.name}</span>
                  <span className="text-2xs uppercase text-cockpit-muted">{c.platform}</span>
                  {c.learning && (
                    <span className="rounded-full px-2 py-0.5 text-2xs font-bold" style={{ color: TONE.warn, background: `${TONE.warn}1f` }}
                      title={c.learning.advice}>
                      Learning · day {c.learning.dayNumber}
                    </span>
                  )}
                  <div className="min-w-[140px] flex-1"><PacingBar value={c.spendToday} cap={c.ceiling} height={8} format={(v) => fmt(v)} /></div>
                  <span className="w-32 text-right text-xs tabular-nums text-cockpit-muted">{mny(c.spendToday)}{c.ceiling != null && <> / {mny(c.ceiling)}</>}</span>
                  <StatusChip status={c.status} />
                </div>
              ))}
              {noCeiling.length > 0 && (
                <p className="pt-1 text-2xs text-cockpit-muted">
                  {noCeiling.length} campaign{noCeiling.length !== 1 ? "s" : ""} with no daily budget on record — pacing isn’t judged without a real ceiling (nothing is invented).
                </p>
              )}
              {guard.campaigns.some((c) => c.learning) && (
                <p className="flex items-start gap-1.5 pt-1 text-2xs text-cockpit-muted">
                  <span className="mt-px flex-shrink-0" style={{ color: TONE.warn }}><Icon name="info" size={12} /></span>
                  Learning phase: judge on absolute cost per result, not day-to-day % swings — small audiences produce noisy percentages.
                </p>
              )}
            </div>
          )}
        </Panel>
      </ModeAware>

      {/* ── Attention queue + right rail ─────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Needs your attention</h2>
            <Link href="/proposals" className="text-sm font-semibold" style={{ color: TONE.ice }}>All proposals →</Link>
          </div>
          {attention.length === 0 ? (
            <Panel className="border-dashed p-8 text-center text-cockpit-muted">
              Nothing flagged. {apiEnabled ? "Connect an account and let a sync run." : "Paste a CSV on Ads Health to get scored."}
            </Panel>
          ) : (
            <div className="space-y-2.5">
              {attention.map((r) => {
                const vi = VERDICT_ICON[r.verdict] ?? VERDICT_ICON["keep"];
                const m = verdictMeta(r.verdict);
                return (
                  <Panel key={r.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex-shrink-0" style={{ color: TONE[vi.tone === "muted" ? "muted" : vi.tone] }}><Icon name={vi.icon} size={16} /></span>
                          <span className="text-sm font-extrabold" style={{ color: TONE[vi.tone === "muted" ? "muted" : vi.tone] }}>{m.label}</span>
                          <span className="truncate text-sm font-semibold">· {r.entity_name}</span>
                          <span className="text-2xs uppercase text-cockpit-muted">{r.platform}</span>
                        </div>
                        {r.reason && <p className="mt-1 text-xs text-cockpit-muted">{r.reason}</p>}
                        <p className="mt-1 text-sm text-cockpit-ink/90">{r.proposal}</p>
                      </div>
                      <RecActions id={r.id} verdict={r.verdict} />
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </section>

        <ModeAware only="advanced">
          <aside className="space-y-4">
            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Connections</h3>
                <Link href="/connect" className="text-xs font-semibold" style={{ color: TONE.ice }}>Manage →</Link>
              </div>
              {accts.length === 0 ? (
                <p className="text-sm text-cockpit-muted">No accounts connected. <Link href="/connect" className="font-semibold underline" style={{ color: TONE.ice }}>Connect Meta / TikTok</Link> or use CSV.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {accts.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{a.display_name} <span className="text-2xs uppercase text-cockpit-muted">{a.platform}</span></span>
                      <span className="flex items-center gap-1 text-2xs font-bold" style={{ color: TONE.good }}>
                        <span className="h-1.5 w-1.5 animate-live-pulse rounded-full" style={{ background: TONE.good }} />{a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-2xs text-cockpit-muted">Auto-sync: <b>{cadence}</b> · <Link href="/settings" style={{ color: TONE.ice }}>change</Link></p>
            </Panel>

            {apiEnabled && (
              <Panel>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Data sync</h3>
                  <Link href="/connect" className="text-xs font-semibold" style={{ color: TONE.ice }}>Manage →</Link>
                </div>
                {runs.length === 0 ? (
                  <p className="text-sm text-cockpit-muted">No sync has run yet. Connect an account and run your first audit.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {runs.map((run, i) => {
                      const st = RUN_STATUS[run.status] ?? RUN_STATUS.error;
                      return (
                        <li key={i} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: TONE[st.tone] }} />
                            <span className="uppercase text-cockpit-muted">{run.platform}</span>
                            <span style={{ color: TONE[st.tone] }}>{st.label}</span>
                          </span>
                          <span className="flex-shrink-0 tabular-nums text-cockpit-muted">{run.rows_written ?? 0} rows · {fmtAgo(run.started_at)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-2 text-2xs text-cockpit-muted">The audit trail that proves your numbers are live.</p>
              </Panel>
            )}

            <Panel>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Recent reports</h3>
                <Link href="/reports" className="text-xs font-semibold" style={{ color: TONE.ice }}>All →</Link>
              </div>
              {reports.length === 0 ? (
                <p className="text-sm text-cockpit-muted">Reports land here after each audit.</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {reports.map((rp) => (
                    <li key={rp.id}>
                      <Link href={`/reports/${rp.id}`} className="flex items-center justify-between gap-2 hover:underline">
                        <span className="truncate">{rp.title || "Audit report"}</span>
                        <span className="flex-shrink-0 text-2xs text-cockpit-muted">{fmtAgo(rp.created_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {!aiEnabled && (
              <Panel>
                <h3 className="text-sm font-bold">AI specialist team</h3>
                <p className="mt-1 text-xs text-cockpit-muted">12 specialists grounded in your live numbers — included in Pro.</p>
                <Link href="/billing" className="mt-2 inline-block rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-600">See Pro →</Link>
              </Panel>
            )}
          </aside>
        </ModeAware>
      </div>

      <p className="mt-6 text-center text-2xs text-cockpit-muted">
        Read-only analysis. No live ad was changed. Every action needs your explicit approval.
      </p>
    </div>
  );
}
