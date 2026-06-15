"use client";
import { useState } from "react";

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
    <div className="relative h-[150px] w-[150px]">
      <svg width={150} height={150} viewBox="0 0 150 150">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={13} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={col} strokeWidth={13} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-extrabold" style={{ color: col }}>{Math.round(score)}</div>
        <div className="text-xs text-muted">/ 100</div>
      </div>
    </div>
  );
}

export default function AnalyzeClient() {
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
      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        <div className="mb-3 flex flex-wrap gap-2">
          {(["clean", "fatigued", "broken"] as const).map((k) => (
            <button key={k} onClick={() => setCsv(SAMPLES[k])}
              className="rounded-lg border border-brand px-3 py-1.5 text-sm font-semibold text-brand">{k}</button>
          ))}
        </div>
        <label className="block text-sm font-bold">Average sale value (AUD)</label>
        <input type="number" value={avg} onChange={(e) => setAvg(+e.target.value)}
          className="mb-2 w-full rounded-lg border border-[#e3e8ef] p-2" />
        <label className="block text-sm font-bold">Gross margin (0–1)</label>
        <input type="number" step="0.01" value={margin} onChange={(e) => setMargin(+e.target.value)}
          className="mb-2 w-full rounded-lg border border-[#e3e8ef] p-2" />
        <label className="block text-sm font-bold">CSV (paste a Meta/TikTok export)</label>
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)}
          className="mb-3 h-40 w-full rounded-lg border border-[#e3e8ef] p-2 font-mono text-xs" />
        <button onClick={run} disabled={busy}
          className="w-full rounded-lg bg-brand py-2.5 font-bold text-white disabled:opacity-60">
          {busy ? "Analysing…" : "Analyse →"}
        </button>
        <p className="mt-2 text-xs text-muted">Break-even CPA = avg sale × margin · Break-even ROAS = 1 ÷ margin.</p>
      </div>

      <div className="rounded-2xl border border-[#e3e8ef] bg-white p-5 shadow-card">
        {err && <p className="text-band-red">{err}</p>}
        {!res && !err && <p className="text-muted">Pick a sample or paste a CSV, then Analyse.</p>}
        {res && (
          <div>
            <div className="flex flex-wrap items-center gap-5">
              <Gauge score={res.health.total} band={res.health.band} />
              <div className="min-w-[220px] flex-1">
                <span className="inline-block rounded-full px-3 py-1 text-sm font-extrabold text-white"
                  style={{ background: BANDC[res.health.band] || "#5a6577" }}>{res.health.band}</span>
                <div className="mt-2 font-bold">{res.health.guidance}</div>
                <div className="text-sm text-muted">Weakest: {res.health.weakest.join(", ") || "—"}</div>
                {res.health.breakdown?.data_confidence?.score != null && (
                  <div className="text-sm text-muted">Data confidence: <b>{Math.round(res.health.breakdown.data_confidence.score)}/100</b></div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Spend", res.summary.spend], ["CPA", res.summary.cpa], ["Break-even CPA", res.summary.break_even_cpa],
                ["ROAS", res.summary.roas], ["Break-even ROAS", res.summary.break_even_roas], ["MER", res.summary.mer],
                ["Leads", res.summary.leads], ["Purchases", res.summary.purchases]].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-[#f4f7fb] p-2.5">
                  <b className="block text-lg">{f2(v as number)}</b><span className="text-xs text-muted">{k}</span>
                </div>
              ))}
            </div>

            <details className="mt-4 rounded-xl border border-[#e3e8ef] p-3">
              <summary className="cursor-pointer font-bold">Why this score? — factor breakdown</summary>
              <table className="mt-2 w-full text-sm">
                <thead><tr className="text-left text-muted"><th className="py-1">Factor</th><th>Score</th><th>Weight</th><th>Contribution</th></tr></thead>
                <tbody>
                  {Object.entries(res.health.breakdown).sort((a: any, b: any) => b[1].weight - a[1].weight).map(([k, b]: any) => (
                    <tr key={k} className="border-t border-[#eef2f7]">
                      <td className="py-1">{FACTORLABEL[k] || k}</td>
                      <td>{b.score == null ? "N/A" : Math.round(b.score) + "/100"}</td>
                      <td>{b.weight}%</td>
                      <td>{b.score == null ? "—" : Math.round(b.weighted_points * 10) / 10 + " pts"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <h3 className="mt-4 font-bold">Findings</h3>
            <table className="w-full text-sm">
              <tbody>
                {res.health.findings.map((fd: any, i: number) => (
                  <tr key={i} className="border-t border-[#eef2f7]">
                    <td className="py-1"><span className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ background: SEVC[fd.severity] || "#5a6577" }}>{fd.severity}</span></td>
                    <td>{fd.factor}</td><td>{fd.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-4 font-bold">Proposals <span className="text-xs font-normal text-muted">(proposals only — nothing live changed)</span></h3>
            <table className="w-full text-sm">
              <tbody>
                {res.decisions.map((d: any, i: number) => (
                  <tr key={i} className="border-t border-[#eef2f7]">
                    <td className="py-1 font-bold capitalize">{d.verdict}</td>
                    <td>{d.name}<div className="text-xs text-muted">{d.platform}</div></td>
                    <td>{d.reason}</td><td>{d.proposal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
