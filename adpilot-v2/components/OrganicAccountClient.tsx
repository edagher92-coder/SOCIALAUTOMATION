"use client";
import { useMemo, useState } from "react";
import { useMode } from "./mode";
import Tip from "./Tip";
import { analyseAccount } from "@/lib/organic/account";
import { buildOrganicReport } from "@/lib/organic/report";
import { parseOrganicCsv } from "@/lib/organic/csv";
import type { OrganicPostInput } from "@/lib/organic/types";
import type { CpmByPlatform } from "@/lib/organic/cpm";
import type { OrganicPlatform } from "@/lib/organic/boost";

const PLATFORM_LABEL: Record<OrganicPlatform, string> = { meta: "Meta (FB / IG)", tiktok: "TikTok" };
const PLATFORM_SHORT: Record<OrganicPlatform, string> = { meta: "Meta", tiktok: "TikTok" };

// en-AU formatters, mirroring BoostClient / the engine UI.
const intf = (v: number) => Math.round(v).toLocaleString("en-AU");
const money = (v: number) =>
  "$" + (Math.round(v * 100) / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => (v * 100).toFixed(1) + "%";

// One editable row of organic-post inputs (all strings while the user types).
interface Row {
  key: string;
  name: string;
  platform: OrganicPlatform;
  reach: string;
  impressions: string;
  engagements: string;
}

let rowSeq = 0;
const blankRow = (platform: OrganicPlatform = "meta"): Row => ({
  key: `r${rowSeq++}`, name: "", platform, reach: "", impressions: "", engagements: "",
});

const num = (s: string) => { const v = Number(String(s).replace(/[, ]/g, "")); return Number.isFinite(v) && v > 0 ? v : 0; };

function rowsFromPosts(posts: OrganicPostInput[]): Row[] {
  return posts.map((p) => ({
    key: `r${rowSeq++}`,
    name: p.name ?? "",
    platform: p.platform === "tiktok" ? "tiktok" : "meta",
    reach: p.reach ? String(p.reach) : "",
    impressions: p.impressions ? String(p.impressions) : "",
    engagements: p.engagements ? String(p.engagements) : "",
  }));
}

export default function OrganicAccountClient({ accountCpm, initialPosts, canExplain }: {
  accountCpm: CpmByPlatform;
  initialPosts?: OrganicPostInput[];
  canExplain?: boolean;
}) {
  const { mode } = useMode();
  const advanced = mode === "advanced";

  const [rows, setRows] = useState<Row[]>(() =>
    initialPosts && initialPosts.length ? rowsFromPosts(initialPosts) : [blankRow(), blankRow(), blankRow()],
  );
  const [budgetPerPost, setBudgetPerPost] = useState("100");
  const [showCsv, setShowCsv] = useState(false);
  const [csv, setCsv] = useState("");

  function patchRow(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }
  function addRow() { setRows((rs) => [...rs, blankRow()]); }
  function removeRow(key: string) { setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs)); }
  function importCsv() {
    const parsed = parseOrganicCsv(csv); // shared, quote/alias-aware parser (same as the server)
    if (parsed.length) { setRows(rowsFromPosts(parsed)); setCsv(""); setShowCsv(false); }
  }

  // Build the validated post inputs the engine needs (reach > 0). Impressions falls back to reach.
  const validPosts: OrganicPostInput[] = useMemo(
    () =>
      rows
        .filter((r) => num(r.reach) > 0)
        .map((r) => ({
          platform: r.platform,
          name: r.name.trim() || undefined,
          reach: num(r.reach),
          impressions: num(r.impressions) || num(r.reach),
          engagements: num(r.engagements),
        })),
    [rows],
  );

  const budget = num(budgetPerPost) || 100;

  const analysis = useMemo(
    () => (validPosts.length ? analyseAccount(validPosts, accountCpm, { budgetPerPost: budget }) : null),
    [validPosts, accountCpm, budget],
  );

  // Which platforms in play are falling back to a benchmark CPM?
  const benchmarkPlatforms = useMemo(() => {
    const inPlay = new Set(validPosts.map((p) => p.platform));
    return (["meta", "tiktok"] as const).filter((p) => inPlay.has(p) && accountCpm[p] == null);
  }, [validPosts, accountCpm]);

  const copyText = useMemo(() => {
    if (!analysis) return "";
    return [
      "What to expect",
      ...analysis.expectations.map((e) => `• ${e}`),
      "",
      "Why",
      ...analysis.explanations.map((e) => `• ${e}`),
      "",
      analysis.safety,
    ].join("\n");
  }, [analysis]);

  // --- Actions: download report, save posts to the account, AI explainer ---
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [ai, setAi] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState("");

  function downloadReport() {
    if (!analysis) return;
    const report = buildOrganicReport(analysis, { generatedAt: new Date().toLocaleDateString("en-AU") });
    const blob = new Blob([report.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "organic-boost-report.md";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function savePosts() {
    if (!validPosts.length) return;
    setSaveState("saving");
    try {
      const r = await fetch("/api/organic/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: validPosts }),
      });
      setSaveState(r.ok ? "saved" : "error");
    } catch { setSaveState("error"); }
  }

  async function explain() {
    if (!validPosts.length) return;
    setAiBusy(true); setAiErr(""); setAi("");
    try {
      const r = await fetch("/api/organic/explain", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: validPosts, budgetPerPost: budget }),
      });
      const j = await r.json();
      if (r.ok) setAi(j.text || "");
      else setAiErr(j.error || "Couldn’t run the explainer.");
    } catch { setAiErr("Network error — try again."); }
    finally { setAiBusy(false); }
  }

  return (
    <div className="space-y-6">
      {/* ---- Editable post list ---- */}
      <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-ink">Your organic posts</h2>
            <p className="mt-1 text-xs text-muted">
              Enter what each post earned <b>organically</b> (from its insights). We rank which are worth boosting and cost the boost at your real CPM.
            </p>
          </div>
          <button type="button" onClick={() => setShowCsv((v) => !v)}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand">
            {showCsv ? "Hide paste box" : "Paste CSV"}
          </button>
        </div>

        {showCsv && (
          <div className="mt-3 rounded-xl border border-border-subtle bg-surface p-3">
            <label htmlFor="organic-csv" className="mb-1.5 block text-xs font-semibold text-ink">
              Include a <b>header row</b>, then one post per line. Columns can be in any order — we recognise <code className="text-2xs text-muted">name, platform, reach, impressions, engagements</code> (plus aliases like caption, fb/ig, impr, eng).
            </label>
            <textarea id="organic-csv" value={csv} onChange={(e) => setCsv(e.target.value)} rows={4}
              placeholder={"name,platform,reach,impressions,engagements\nLaunch reel,tiktok,8200,15000,640\nSale post,meta,5000,9000,150"}
              className="w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 font-mono text-xs text-ink shadow-inner-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:shadow-ring-brand" />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={importCsv} disabled={!csv.trim()}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50">
                Import rows
              </button>
            </div>
          </div>
        )}

        {/* Column headers (sm+) */}
        <div className="mt-4 hidden gap-2 px-1 text-2xs font-bold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_auto]">
          <span>Post name</span>
          <span>Platform</span>
          <span className="inline-flex items-center gap-1">Reach <Tip label="REACH" term="REACH">Unique people who saw the post unpaid — from the post’s insights.</Tip></span>
          <span className="inline-flex items-center gap-1">Impressions <Tip label="IMPRESSIONS" term="IMPRESSIONS">Total times shown (can exceed reach). Optional — we use reach if blank.</Tip></span>
          <span className="inline-flex items-center gap-1">Engagements <Tip label="ENGAGEMENTS" term="ENGAGEMENTS">Likes + comments + shares + saves. Drives the engagement rate we test.</Tip></span>
          <span className="sr-only">Remove</span>
        </div>

        <div className="mt-2 space-y-2">
          {rows.map((r, i) => (
            <div key={r.key} className="grid grid-cols-2 gap-2 rounded-xl border border-border-subtle p-2 sm:grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_auto] sm:items-center sm:border-0 sm:p-0">
              <label className="col-span-2 sm:col-span-1">
                <span className="mb-1 block text-2xs font-semibold text-muted sm:hidden">Post name</span>
                <input value={r.name} onChange={(e) => patchRow(r.key, { name: e.target.value })}
                  placeholder={`Post ${i + 1}`} aria-label={`Post ${i + 1} name`}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-inner-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:shadow-ring-brand" />
              </label>

              <label className="sm:col-span-1">
                <span className="mb-1 block text-2xs font-semibold text-muted sm:hidden">Platform</span>
                <select value={r.platform} onChange={(e) => patchRow(r.key, { platform: e.target.value as OrganicPlatform })}
                  aria-label={`Post ${i + 1} platform`}
                  className="w-full rounded-lg border border-border-subtle bg-surface px-2 py-2 text-sm text-ink shadow-inner-sm transition focus:border-brand focus:outline-none focus:shadow-ring-brand">
                  <option value="meta">Meta</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </label>

              <NumCell label="Reach" srOnlyLabel={`Post ${i + 1} reach`} value={r.reach} onChange={(v) => patchRow(r.key, { reach: v })} placeholder="5,000" />
              <NumCell label="Impressions" srOnlyLabel={`Post ${i + 1} impressions`} value={r.impressions} onChange={(v) => patchRow(r.key, { impressions: v })} placeholder="12,000" />
              <NumCell label="Engagements" srOnlyLabel={`Post ${i + 1} engagements`} value={r.engagements} onChange={(v) => patchRow(r.key, { engagements: v })} placeholder="150" />

              <div className="col-span-2 flex justify-end sm:col-span-1">
                <button type="button" onClick={() => removeRow(r.key)} disabled={rows.length <= 1}
                  aria-label={`Remove post ${i + 1}`} title="Remove"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-border-subtle text-muted transition hover:border-band-orange hover:text-band-orange disabled:opacity-30">×</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <button type="button" onClick={addRow}
            className="rounded-lg border border-dashed border-border-subtle px-3 py-2 text-sm font-semibold text-muted transition hover:border-brand hover:text-brand">
            + Add post
          </button>

          <label className="text-sm">
            <span className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
              Budget per post ($)
              <Tip label="BUDGET PER POST" term="BUDGET PER POST">What you’d spend boosting each winner. We convert it to extra reach at your CPM to rank candidates.</Tip>
            </span>
            <input value={budgetPerPost} onChange={(e) => setBudgetPerPost(e.target.value)}
              inputMode="numeric" type="number" min={1} aria-label="Budget per post in dollars"
              className="w-28 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-inner-sm transition focus:border-brand focus:outline-none focus:shadow-ring-brand" />
          </label>
        </div>

        {benchmarkPlatforms.length > 0 && (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-2xs text-muted">
            No ad data for {benchmarkPlatforms.map((p) => PLATFORM_SHORT[p]).join(" & ")} yet — using a <b>benchmark CPM</b> for {benchmarkPlatforms.length === 1 ? "it" : "those"}.{" "}
            <a href="/connect" className="font-semibold text-brand">Connect &amp; sync</a> to use your real cost.
          </p>
        )}
      </section>

      {/* ---- Results ---- */}
      {!analysis ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border-subtle bg-surface p-8 text-center text-sm text-muted">
          Add at least one post with organic reach to see which are worth boosting.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Kpi label="Posts analysed" value={intf(analysis.summary.posts)} />
            <Kpi label="Total organic reach"
              tip={["ORGANIC REACH", "Unique people your posts reached, unpaid, across the account."]}
              value={intf(analysis.summary.totalReach)} />
            <Kpi label="Avg engagement rate"
              tip={["ENGAGEMENT RATE", "Engagements ÷ reach, reach-weighted across all posts. Tested against the platform benchmark."]}
              value={pct(analysis.summary.avgEngagementRate)} />
            {analysis.recommendations.length > 0 && (
              <Kpi label="Projected + reach"
                tip={["PROJECTED ADDED REACH", "Estimated NEW people the recommended boosts would reach combined. A range, not a promise."]}
                value={"+" + intf(analysis.projectedAddedReach)} accent />
            )}
            <Kpi label="Recommended budget"
              tip={["RECOMMENDED BUDGET", "Budget per post × the number of boost-ready posts. You approve any spend in Ads Manager."]}
              value={money(analysis.totalRecommendedBudget)} />
          </div>

          {/* Actions: report / save / AI explainer */}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={downloadReport}
              className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-ink shadow-card transition hover:border-brand hover:text-brand">
              ⬇ Download report (.md)
            </button>
            <button type="button" onClick={savePosts} disabled={saveState === "saving" || saveState === "saved"}
              className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-ink shadow-card transition hover:border-brand hover:text-brand disabled:opacity-60">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved to account" : saveState === "error" ? "Save failed — retry" : "Save posts to account"}
            </button>
            {canExplain ? (
              <button type="button" onClick={explain} disabled={aiBusy}
                className="rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-60">
                {aiBusy ? "Thinking…" : ai ? "🧠 Re-explain with AI" : "🧠 Explain with AI"}
              </button>
            ) : (
              <a href="/billing" title="The AI explainer is a Pro & Expert feature"
                className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs font-bold text-muted shadow-card transition hover:border-brand hover:text-brand">
                🧠 Explain with AI — Pro
              </a>
            )}
          </div>
          {aiErr && <p className="rounded-xl bg-band-red/10 px-3 py-2 text-sm text-band-red">{aiErr}</p>}
          {ai && (
            <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
              <h3 className="font-bold text-ink">🧠 Dana explains</h3>
              <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-3 text-sm leading-relaxed text-ink">{ai}</pre>
            </section>
          )}

          {/* Per-platform breakdown */}
          {analysis.summary.byPlatform.length > 0 && (
            <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
              <h3 className="text-2xs font-bold uppercase tracking-wide text-muted">By platform</h3>
              {advanced ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-2xs uppercase tracking-wide text-muted">
                        <th className="pb-2 font-bold">Platform</th>
                        <th className="pb-2 text-right font-bold">Posts</th>
                        <th className="pb-2 text-right font-bold">Reach</th>
                        <th className="pb-2 text-right font-bold">Impressions</th>
                        <th className="pb-2 text-right font-bold">Engagements</th>
                        <th className="pb-2 text-right font-bold">Eng. rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.summary.byPlatform.map((p) => (
                        <tr key={p.platform} className="border-t border-border-subtle">
                          <td className="py-2 font-semibold text-ink">{PLATFORM_LABEL[p.platform]}</td>
                          <td className="py-2 text-right text-ink">{intf(p.posts)}</td>
                          <td className="py-2 text-right text-ink">{intf(p.reach)}</td>
                          <td className="py-2 text-right text-ink">{intf(p.impressions)}</td>
                          <td className="py-2 text-right text-ink">{intf(p.engagements)}</td>
                          <td className="py-2 text-right font-semibold text-ink">{pct(p.engagementRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {analysis.summary.byPlatform.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="font-semibold text-ink">{PLATFORM_LABEL[p.platform]}</span>
                      <span className="text-muted">{intf(p.posts)} {p.posts === 1 ? "post" : "posts"} · {intf(p.reach)} reach · {pct(p.engagementRate)} eng.</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Boost-ready recommendations */}
          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h3 className="font-bold text-ink">🚀 Boost-ready posts</h3>
            <p className="mt-1 text-xs text-muted">
              Ranked by projected impact. Only posts whose engagement is <b>confidently above benchmark</b> qualify — boosting amplifies a proven winner.
            </p>
            {analysis.recommendations.length === 0 ? (
              <p className="mt-3 rounded-xl bg-surface px-3 py-3 text-sm text-muted">
                Nothing is boost-ready yet — no post clears the engagement benchmark with enough data. Keep testing organically before you spend.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {analysis.recommendations.map((rec) => (
                  <div key={rec.rank} className="rounded-2xl border border-band-green/30 bg-band-green/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span aria-hidden className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-band-green text-2xs font-extrabold text-white">{rec.rank}</span>
                        <span className="truncate font-bold text-ink">{rec.post.name || `Untitled ${PLATFORM_SHORT[rec.post.platform]} post`}</span>
                        <span className="flex-shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-2xs font-bold text-muted">{PLATFORM_SHORT[rec.post.platform]}</span>
                      </div>
                      <span className="flex-shrink-0 rounded-full border border-band-green/30 bg-white/60 px-2 py-0.5 text-2xs font-bold text-band-green">{money(rec.recommendedBudget)} boost</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <MiniStat label="Eng. rate" value={pct(rec.projection.engagementRate)}
                        sub={advanced ? `${pct(rec.projection.engagementRateRange.low)}–${pct(rec.projection.engagementRateRange.high)}` : undefined} />
                      <MiniStat label="+ Reach" tip={["INCREMENTAL REACH", "Estimated NEW people the boost reaches — a range, not a promise."]}
                        value={"+" + intf(rec.projection.incrementalReach)}
                        sub={advanced ? `${intf(rec.projection.incrementalReachRange.low)}–${intf(rec.projection.incrementalReachRange.high)}` : undefined} />
                      <MiniStat label="$ / 1k reached" tip={["COST PER 1,000 REACHED", "Boost budget ÷ thousands of new people reached. Lower is cheaper reach."]}
                        value={money(rec.projection.costPer1kIncrementalReach)} />
                      <MiniStat label="+ Engagements" tip={["PROJECTED ENGAGEMENTS", "Estimated extra likes/comments/shares — damped because paid audiences engage less."]}
                        value={"+" + intf(rec.projection.projectedAddedEngagements)} />
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-ink">{rec.projection.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Hold list */}
          {analysis.hold.length > 0 && (
            <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
              <h3 className="font-bold text-ink">🌱 Hold &amp; improve first</h3>
              <p className="mt-1 text-xs text-muted">
                These aren’t boost-ready: either engagement is below benchmark (improve the hook/offer organically first) or there isn’t enough reach yet to call it.
              </p>
              <div className="mt-3 space-y-2">
                {analysis.hold.map((h, i) => {
                  const p = h.post;
                  return (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-3 py-2 text-sm">
                      <span className="min-w-0 truncate text-muted">
                        <span className="font-semibold text-ink">{p.name || `Untitled ${PLATFORM_SHORT[p.platform]} post`}</span>
                        <span className="ml-2 text-2xs">{PLATFORM_SHORT[p.platform]} · {intf(p.reach)} reach · {pct(p.reach > 0 ? p.engagements / p.reach : 0)} eng.</span>
                      </span>
                      <span className="flex-shrink-0 text-2xs text-muted">{h.reason === "needs-more-data" ? "needs more data" : "below benchmark"}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Expectations */}
          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-ink">What to expect</h3>
              <CopyButton label="Copy for report" text={copyText} />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {analysis.expectations.map((e, i) => (
                <li key={i} className="flex gap-2"><span className="text-brand" aria-hidden>•</span><span>{e}</span></li>
              ))}
            </ul>
          </section>

          {/* Explanations */}
          <section className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
            <h3 className="font-bold text-ink">Why</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {analysis.explanations.map((e, i) => (
                <li key={i} className="flex gap-2"><span className="text-teal" aria-hidden>•</span><span>{e}</span></li>
              ))}
            </ul>
          </section>

          {advanced && (
            <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 text-2xs text-muted shadow-card">
              <div className="font-bold uppercase tracking-wide text-muted/80">How this is worked out</div>
              <ul className="mt-2 space-y-1">
                <li>• Each post is projected at {money(budget)}: paid impressions = budget ÷ CPM × 1,000, then unique reach via an assumed boost frequency (~1.15), banded for repeat exposure.</li>
                <li>• A post is “boost-ready” only when its engagement rate’s 95% Wilson lower bound clears the platform benchmark — the same significance gate the ad engine uses to scale winners.</li>
                <li>• Added engagements are damped (paid/cold audiences engage less than your followers). Every figure is an estimate/range, never a guarantee.</li>
              </ul>
            </div>
          )}

          <p className="text-center text-2xs text-muted">{analysis.safety}</p>
        </div>
      )}
    </div>
  );
}

function NumCell({ label, srOnlyLabel, value, onChange, placeholder }: {
  label: string; srOnlyLabel: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="sm:col-span-1">
      <span className="mb-1 block text-2xs font-semibold text-muted sm:hidden">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={srOnlyLabel}
        inputMode="numeric" type="number" min={0} placeholder={placeholder}
        className="w-full rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-ink shadow-inner-sm transition placeholder:text-muted focus:border-brand focus:outline-none focus:shadow-ring-brand" />
    </label>
  );
}

function Kpi({ label, value, sub, tip, accent }: {
  label: string; value: string; sub?: string; tip?: [string, string]; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? "border-brand-200 bg-brand-50" : "border-border-subtle bg-surface-raised"} shadow-card`}>
      <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-muted">
        {label}
        {tip && <Tip label={tip[0]} term={tip[0]}>{tip[1]}</Tip>}
      </div>
      <div className={`mt-1 text-xl font-extrabold tracking-tight ${accent ? "text-brand" : "text-ink"}`}>{value}</div>
      {sub && <div className="text-2xs text-muted">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value, sub, tip }: { label: string; value: string; sub?: string; tip?: [string, string] }) {
  return (
    <div className="rounded-xl border border-band-green/20 bg-white/60 p-2.5">
      <div className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-muted">
        {label}
        {tip && <Tip label={tip[0]} term={tip[0]}>{tip[1]}</Tip>}
      </div>
      <div className="mt-0.5 text-base font-extrabold tracking-tight text-ink">{value}</div>
      {sub && <div className="text-2xs text-muted">{sub}</div>}
    </div>
  );
}

function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ } }}
      className={`rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-brand ${className}`}>
      {done ? "✓ Copied" : label}
    </button>
  );
}
