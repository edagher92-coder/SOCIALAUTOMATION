"use client";
import { useState } from "react";
import { useMode } from "./mode";
import Tip from "./Tip";
import { METRIC_GLOSSARY } from "@/lib/metric-glossary";

const BANDC: Record<string, string> = { Green: "#16a34a", Yellow: "#ca8a04", Orange: "#ea580c", Red: "#dc2626" };
const SEVC: Record<string, string> = { CRITICAL: "#dc2626", HIGH: "#ea580c", MEDIUM: "#ca8a04", LOW: "#16a34a", INFO: "#5a6577" };
const FACTORLABEL: Record<string, string> = {
  tracking_quality: "Tracking quality", cpa: "CPA vs break-even", spend_efficiency: "Spend efficiency",
  conversion_rate: "Conversion rate", ctr: "Click-through rate", lead_quality: "Lead quality",
  creative_freshness: "Creative freshness (fatigue)", cpc: "Cost per click", naming_quality: "Naming convention",
  offer_strength: "Offer strength", landing_page_alignment: "Landing-page alignment", budget_pacing: "Budget pacing",
  data_confidence: "Data confidence",
};
const f2 = (v: number | null) => (v == null ? "N/A" : (Math.round(v * 100) / 100).toLocaleString());

const SAMPLES: Record<string, string> = {
  clean: `business_name,platform,campaign_name,date,spend,impressions,reach,clicks,leads,purchases,revenue,three_second_views,thruplays,lead_quality_score,utm_source,utm_medium,utm_campaign,tracking_status
Example Co,meta,exampleco_hotwater_leads_brisbane_20260601,2026-06-13,600,30000,16000,600,40,12,3600,9000,4000,82,meta,paid_social,exampleco_hotwater_leads_brisbane_20260601,ok
Example Co,tiktok,exampleco_hotwater_leads_brisbane_20260601,2026-06-13,500,28000,15000,560,35,10,3000,8200,3600,78,tiktok,paid_social,exampleco_hotwater_leads_brisbane_20260601,ok`,
  fatigued: `business_name,platform,campaign_name,date,spend,impressions,reach,clicks,leads,purchases,revenue,three_second_views,thruplays,utm_source,utm_medium,utm_campaign,tracking_status
Example Co,meta,exampleco_summer_sales_national_20260401,2026-06-13,2500,280000,62000,2520,0,12,1800,42000,9000,meta,paid_social,exampleco_summer_sales_national_20260401,ok
Example Co,tiktok,summer-sale,2026-06-13,1500,150000,30000,1200,0,8,1200,30000,6000,tiktok,paid_social,summer-sale,ok`,
  broken: `business_name,platform,campaign_name,date,spend,impressions,reach,clicks,leads,purchases,revenue,three_second_views,thruplays,utm_source,utm_medium,utm_campaign,tracking_status
Example Co,meta,promo,2026-06-13,1800,90000,40000,540,0,0,0,12000,3000,,,,broken
Example Co,meta,promo2,2026-06-13,1200,60000,28000,360,0,0,0,8000,2000,,,,broken`,
};

function Gauge({ score, band }: { score: number; band: string }) {
  const col = BANDC[band] || "#5a6577";
  const r = 64, cx = 75, cy = 75, circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative h-[150px] w-[150px] flex-shrink-0">
      <svg width={150} height={150} viewBox="0 0 150 150" aria-hidden>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={13} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={13} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-extrabold tabular-nums" style={{ color: col }}>{Math.round(score)}</div>
        <div className="text-xs font-medium text-muted">/ 100</div>
      </div>
    </div>
  );
}

const SEVERITY_BG: Record<string, string> = {
  CRITICAL: "bg-red-100 text-band-red",
  HIGH:     "bg-orange-100 text-band-orange",
  MEDIUM:   "bg-yellow-100 text-band-yellow",
  LOW:      "bg-green-100 text-band-green",
  INFO:     "bg-gray-100 text-muted",
};

export default function AnalyzeClient() {
  const { mode } = useMode();
  const [csv, setCsv] = useState(SAMPLES.fatigued);
  const [avg, setAvg] = useState(200);
  const [margin, setMargin] = useState(0.6);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setErr(""); setRes(null);
    try {
      const r = await fetch("/api/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, average_sale_value: avg, gross_margin: margin }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(j.error || "Analysis failed"); return; }
      setRes(j);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[320px_1fr]">
      {/* ── Input panel ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Load sample</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {(["clean", "fatigued", "broken"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setCsv(SAMPLES[k])}
              className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand capitalize transition hover:border-brand hover:bg-brand hover:text-white focus-visible:shadow-ring-brand">
              {k}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="avg-sale" className="mb-1.5 block text-xs font-bold text-ink">Average sale value (AUD)</label>
            <input
              id="avg-sale"
              type="number"
              value={avg}
              onChange={(e) => setAvg(+e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm shadow-inner-sm transition hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
            />
          </div>
          <div>
            <label htmlFor="margin" className="mb-1.5 block text-xs font-bold text-ink">Gross margin (0–1)</label>
            <input
              id="margin"
              type="number"
              step="0.01"
              value={margin}
              onChange={(e) => setMargin(+e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 text-sm shadow-inner-sm transition hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
            />
          </div>
          <div>
            <label htmlFor="csv-input" className="mb-1.5 block text-xs font-bold text-ink">CSV — paste a Meta / TikTok export</label>
            <textarea
              id="csv-input"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              className="h-40 w-full rounded-xl border border-border-subtle bg-surface px-3 py-2 font-mono text-xs shadow-inner-sm transition hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
            />
          </div>
        </div>

        <button
          onClick={run}
          disabled={busy}
          className="mt-3 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 focus-visible:shadow-ring-brand disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? "Analysing…" : "Analyse →"}
        </button>
        <p className="mt-3 text-2xs text-muted leading-relaxed">
          Break-even CPA = avg sale × margin · Break-even ROAS = 1 ÷ margin.
        </p>
      </div>

      {/* ── Results panel ───────────────────────────────── */}
      <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
        {/* Error */}
        {err && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-band-red">
            {err}
          </div>
        )}

        {/* Empty state */}
        {!res && !err && (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl" aria-hidden>📊</div>
            <div>
              <p className="font-semibold text-ink">Ready to analyse</p>
              <p className="mt-1 text-sm text-muted">Pick a sample or paste a CSV, then click Analyse.</p>
            </div>
          </div>
        )}

        {/* Results */}
        {res && (
          <div className="animate-fade-in space-y-6">
            {/* Hero: score + verdict */}
            <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border-subtle bg-surface p-5">
              <Gauge score={res.health.total} band={res.health.band} />
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block rounded-full px-3 py-1 text-sm font-extrabold text-white shadow-sm"
                    style={{ background: BANDC[res.health.band] || "#5a6577" }}>
                    {res.health.band}
                  </span>
                  {METRIC_GLOSSARY[res.health.band] && <Tip label={`${res.health.band} band`} term={METRIC_GLOSSARY[res.health.band].term} align="left">{METRIC_GLOSSARY[res.health.band].what}</Tip>}
                </span>
                <p className="mt-2 text-base font-bold text-ink leading-snug">{res.health.guidance}</p>
                {res.health.weakest?.length > 0 && (
                  <p className="mt-1 text-xs text-muted">
                    Weakest: <span className="font-semibold text-ink">{res.health.weakest.join(", ")}</span>
                  </p>
                )}
                {res.health.breakdown?.data_confidence?.score != null && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <span>Data confidence:</span>
                    <span className="font-semibold text-ink">{Math.round(res.health.breakdown.data_confidence.score)}/100</span>
                    <Tip label="Data confidence" term={METRIC_GLOSSARY["Data confidence"].term} align="left">{METRIC_GLOSSARY["Data confidence"].what}</Tip>
                  </p>
                )}
                {res.health.breakdown?.lead_quality?.score != null && (
                  <p className="mt-0.5 text-xs text-muted">
                    Lead quality:{" "}
                    <span className="font-semibold text-ink">{Math.round(res.health.breakdown.lead_quality.score)}/100</span>
                  </p>
                )}
              </div>
            </div>

            {/* Key metrics */}
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted">Key metrics</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[["Spend", res.summary.spend], ["CPA", res.summary.cpa], ["Break-even CPA", res.summary.break_even_cpa],
                  ["ROAS", res.summary.roas], ["Break-even ROAS", res.summary.break_even_roas], ["MER", res.summary.mer],
                  ["Leads", res.summary.leads], ["Purchases", res.summary.purchases]].map(([k, v], i) => {
                  const def = METRIC_GLOSSARY[k as string];
                  return (
                    <div key={k as string} className="rounded-xl border border-border-subtle bg-surface p-3 shadow-inner-sm">
                      <div className="text-lg font-extrabold tabular-nums text-ink">{f2(v as number)}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-2xs font-medium text-muted">
                        <span>{k}</span>
                        {def && <Tip label={k as string} term={def.term} align={i % 2 === 0 ? "left" : "right"}>{def.what}</Tip>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Factor breakdown (advanced) */}
            {mode === "advanced" && (
              <details className="rounded-xl border border-border-subtle" open>
                <summary className="cursor-pointer select-none rounded-xl px-4 py-3 text-sm font-bold text-ink transition hover:bg-surface">
                  Why this score? — factor breakdown
                </summary>
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="w-full text-sm" aria-label="Score factor breakdown">
                    <thead>
                      <tr className="border-b border-border-subtle text-left">
                        <th className="py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted">Factor</th>
                        <th className="py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted">Score</th>
                        <th className="py-2 pr-4 text-xs font-bold uppercase tracking-wider text-muted">Weight</th>
                        <th className="py-2 text-xs font-bold uppercase tracking-wider text-muted">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(res.health.breakdown)
                        .sort((a: any, b: any) => b[1].weight - a[1].weight)
                        .map(([k, b]: any) => (
                          <tr key={k} className="border-b border-border-subtle last:border-0 hover:bg-surface">
                            <td className="py-2 pr-4 font-medium text-ink">
                              <span className="inline-flex items-center gap-1">
                                {FACTORLABEL[k] || k}
                                {METRIC_GLOSSARY[FACTORLABEL[k]] && <Tip label={FACTORLABEL[k]} term={METRIC_GLOSSARY[FACTORLABEL[k]].term} align="left">{METRIC_GLOSSARY[FACTORLABEL[k]].what}</Tip>}
                              </span>
                            </td>
                            <td className="py-2 pr-4 tabular-nums text-muted">{b.score == null ? "N/A" : Math.round(b.score) + "/100"}</td>
                            <td className="py-2 pr-4 tabular-nums text-muted">{b.weight}%</td>
                            <td className="py-2 tabular-nums text-muted">{b.score == null ? "—" : Math.round(b.weighted_points * 10) / 10 + " pts"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            {/* Findings */}
            <div>
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-muted">Findings</p>
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-sm" aria-label="Analysis findings">
                  <tbody>
                    {res.health.findings.map((fd: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface">
                        <td className="py-3 pl-4 pr-3 align-top">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-2xs font-bold ${SEVERITY_BG[fd.severity] || "bg-gray-100 text-muted"}`}>
                            {fd.severity}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-top text-xs font-semibold text-ink">{fd.factor}</td>
                        <td className="py-3 pr-4 align-top text-xs text-muted">{fd.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Proposals */}
            <div>
              <div className="mb-2.5 flex flex-wrap items-baseline gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted">Proposals</p>
                <span className="text-2xs font-medium text-muted">(read-only — nothing live changed)</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="w-full text-sm" aria-label="Campaign proposals">
                  <tbody>
                    {res.decisions.map((d: any, i: number) => (
                      <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-surface">
                        <td className="py-3 pl-4 pr-3 align-top">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-2xs font-bold capitalize ${
                            d.verdict === "scale" ? "bg-green-100 text-band-green" :
                            d.verdict === "kill" || d.verdict === "fix-tracking" ? "bg-red-100 text-band-red" :
                            "bg-gray-100 text-muted"
                          }`}>
                            {d.verdict}
                          </span>
                        </td>
                        <td className="py-3 pr-3 align-top">
                          <div className="text-xs font-semibold text-ink">{d.name}</div>
                          <div className="text-2xs text-muted">{d.platform}</div>
                        </td>
                        <td className="py-3 pr-3 align-top text-xs text-muted">{d.reason}</td>
                        <td className="py-3 pr-4 align-top text-xs text-ink">{d.proposal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
