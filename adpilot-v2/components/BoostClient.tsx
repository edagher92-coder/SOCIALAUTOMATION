"use client";
import { useMemo, useState } from "react";
import { useMode } from "./mode";
import Tip from "./Tip";
import { projectBoost, type OrganicPlatform, type BoostProjection } from "@/lib/organic/boost";
import type { CpmByPlatform } from "@/lib/organic/cpm";

const PLATFORM_LABEL: Record<OrganicPlatform, string> = { meta: "Meta (FB / IG)", tiktok: "TikTok" };

// en-AU formatters, mirroring the engine UI.
const intf = (v: number) => Math.round(v).toLocaleString("en-AU");
const money = (v: number) =>
  "$" + (Math.round(v * 100) / 100).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => (v * 100).toFixed(1) + "%";

const VERDICT_META: Record<BoostProjection["verdict"], { label: string; cls: string; icon: string }> = {
  "worth-boosting":        { label: "Worth boosting",          icon: "🚀", cls: "border-band-green/30 bg-band-green/10 text-band-green" },
  "improve-organic-first": { label: "Improve organically first", icon: "🌱", cls: "border-band-orange/30 bg-band-orange/10 text-band-orange" },
  "insufficient-data":     { label: "Not enough data yet",     icon: "⏳", cls: "border-border-subtle bg-surface text-muted" },
};

export default function BoostClient({ accountCpm }: { accountCpm: CpmByPlatform }) {
  const { mode } = useMode();
  const advanced = mode === "advanced";

  const [platform, setPlatform] = useState<OrganicPlatform>("meta");
  const [reach, setReach] = useState("");
  const [impressions, setImpressions] = useState("");
  const [engagements, setEngagements] = useState("");
  const [budget, setBudget] = useState("100");

  // Strip thousands separators/spaces so a pasted "5,000" doesn't silently evaluate to 0.
  const num = (s: string) => { const v = Number(String(s).replace(/[,\s]/g, "")); return Number.isFinite(v) && v > 0 ? v : 0; };
  const cpm = accountCpm[platform];

  const proj: BoostProjection | null = useMemo(() => {
    const r = num(reach);
    if (r <= 0) return null;
    return projectBoost({
      post: { platform, reach: r, impressions: num(impressions) || r, engagements: num(engagements) },
      budget: num(budget),
      cpm,
    });
  }, [platform, reach, impressions, engagements, budget, cpm]);

  return (
    <div className="grid gap-5 md:grid-cols-[320px_1fr]">
      {/* ---- Inputs ---- */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-card">
        <h2 className="font-bold text-ink">This post, right now</h2>
        <p className="mt-1 text-xs text-muted">Enter what the post earned <b>organically</b> (from the post’s insights). We’ll cost the boost at your real CPM.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Platform</label>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-border-subtle bg-surface p-1 text-xs font-bold">
              {(["meta", "tiktok"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPlatform(p)} aria-pressed={platform === p}
                  className={`rounded-lg px-2 py-1.5 transition ${platform === p ? "bg-brand text-white shadow-sm" : "text-muted hover:bg-surface-raised hover:text-ink"}`}>
                  {PLATFORM_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <Field label="Organic reach" tip={["REACH", "Unique people who saw the post without paying — straight from the post’s insights."]}
            value={reach} onChange={setReach} placeholder="e.g. 5,000" />

          <Field label="Organic impressions" optional tip={["IMPRESSIONS", "Total times the post was shown (can exceed reach). Optional — we use reach if left blank."]}
            value={impressions} onChange={setImpressions} placeholder="e.g. 12,000" />

          <Field label="Engagements" tip={["ENGAGEMENTS", "Likes + comments + shares + saves added together. Drives the engagement rate we test against the benchmark."]}
            value={engagements} onChange={setEngagements} placeholder="e.g. 150" />

          <Field label="Boost budget ($)" tip={["BOOST BUDGET", "What you’d spend promoting this post. We convert it to extra reach at your CPM."]}
            value={budget} onChange={setBudget} placeholder="100" />
        </div>

        <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-2xs text-muted">
          {cpm != null
            ? <>Costed at your real <b>{PLATFORM_LABEL[platform]}</b> CPM of <b>{money(cpm)}</b> (from your synced ads).</>
            : <>No ad data for {PLATFORM_LABEL[platform]} yet — using a <b>benchmark CPM</b>. <a href="/connect" className="font-semibold text-brand">Connect &amp; sync</a> to use your real cost.</>}
        </p>
      </div>

      {/* ---- Results ---- */}
      <div className="min-w-0">
        {!proj ? (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border-subtle bg-surface p-8 text-center text-sm text-muted">
            Enter the post’s organic reach to see the projection.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Verdict */}
            <div className={`rounded-2xl border p-4 ${VERDICT_META[proj.verdict].cls}`}>
              <div className="flex items-center gap-2 font-bold">
                <span aria-hidden>{VERDICT_META[proj.verdict].icon}</span>
                {VERDICT_META[proj.verdict].label}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-ink">{proj.rationale}</p>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Kpi label="Reach now" tip={["ORGANIC REACH", "What the post has reached so far, unpaid."]} value={intf(proj.organicReach)} />
              <Kpi label="+ Added reach (est.)" tip={["INCREMENTAL REACH", "Estimated NEW people the boost would reach. A range, not a promise."]}
                value={"+" + intf(proj.incrementalReach)}
                sub={advanced ? `${intf(proj.incrementalReachRange.low)}–${intf(proj.incrementalReachRange.high)}` : undefined} accent />
              <Kpi label="= Total reach (est.)" tip={["TOTAL PROJECTED REACH", "Organic reach plus the estimated boost reach."]}
                value={intf(proj.totalProjectedReach)} sub={`${(Math.round(proj.reachMultiple * 10) / 10).toLocaleString("en-AU")}× current`} />
              <Kpi label="Cost / 1k reached" tip={["COST PER 1,000 REACHED", "Boost budget ÷ thousands of new people reached. Lower is cheaper reach."]}
                value={money(proj.costPer1kIncrementalReach)} />
              <Kpi label="Engagement rate" tip={["ENGAGEMENT RATE", "Engagements ÷ reach. Tested against the platform benchmark to decide if it’s worth boosting."]}
                value={pct(proj.engagementRate)} sub={advanced ? `vs ~${pct(proj.benchmark)} benchmark` : undefined} />
              <Kpi label="+ Added engagements" tip={["PROJECTED ENGAGEMENTS", "Estimated extra likes/comments/shares from the boost — damped because paid audiences engage less."]}
                value={"+" + intf(proj.projectedAddedEngagements)} />
            </div>

            {advanced && (
              <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 text-2xs text-muted shadow-card">
                <div className="font-bold uppercase tracking-wide text-muted/80">How this is worked out</div>
                <ul className="mt-2 space-y-1">
                  <li>• Paid impressions = budget ÷ CPM × 1,000 = <b>{intf(proj.paidImpressions)}</b> at {money(proj.cpmUsed)} CPM ({proj.cpmSource === "account" ? "your real cost" : "benchmark"}).</li>
                  <li>• Unique reach = impressions ÷ assumed frequency (~1.15), banded for repeat exposure.</li>
                  <li>• “Worth boosting” only fires when the engagement rate’s 95% lower bound clears the benchmark — same significance gate the ad engine uses to scale winners.</li>
                </ul>
              </div>
            )}

            <p className="text-center text-2xs text-muted">{proj.safety}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, optional, tip }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean; tip?: [string, string];
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
        {label}
        {optional && <span className="text-2xs font-normal text-muted">(optional)</span>}
        {tip && <Tip label={tip[0]} term={tip[0]}>{tip[1]}</Tip>}
      </label>
      <input
        className="w-full rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 text-sm text-ink shadow-inner-sm transition placeholder:text-muted hover:border-brand-200 focus:border-brand focus:outline-none focus:shadow-ring-brand"
        inputMode="numeric" type="number" min={0} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
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
