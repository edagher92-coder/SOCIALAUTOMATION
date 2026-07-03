"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fmt } from "@/lib/engine/metrics";
import { Spark } from "@/components/charts";
import type { CreativeScorecardRow } from "@/lib/engine/creative";
import type { WastedSpendSummary } from "@/lib/engine/waste";

// Sort keys for the table.
type SortKey = "spend" | "ctr" | "ctrDecay" | "hookRate" | "holdRate" | "cpa" | "roas" | "verdict";
type SortDir = "asc" | "desc";

const VERDICT_RANK: Record<string, number> = {
  kill: 0, reduce: 1, "fix-tracking": 2, refresh: 3, "insufficient-data": 4, keep: 5, scale: 6, duplicate: 7,
};

const VERDICT_CHIP: Record<string, { label: string; cls: string }> = {
  kill:             { label: "Kill",             cls: "bg-band-red/15 text-band-red" },
  reduce:           { label: "Reduce",           cls: "bg-[#f97316]/15 text-[#f97316]" },
  "fix-tracking":   { label: "Fix tracking",     cls: "bg-[#ffb224]/20 text-[#a16207]" },
  refresh:          { label: "Refresh",          cls: "bg-[#ffb224]/20 text-[#a16207]" },
  keep:             { label: "Keep",             cls: "bg-teal/15 text-teal" },
  scale:            { label: "Scale",            cls: "bg-brand/15 text-brand" },
  duplicate:        { label: "Duplicate",        cls: "bg-brand/10 text-brand" },
  "insufficient-data": { label: "More data",    cls: "bg-border-subtle text-muted" },
};

const FATIGUE_CHIP: Record<string, { label: string; cls: string }> = {
  healthy:  { label: "Healthy",  cls: "bg-teal/10 text-teal" },
  watch:    { label: "Watch",    cls: "bg-[#ffb224]/20 text-[#a16207]" },
  fatigued: { label: "Fatigued", cls: "bg-band-red/15 text-band-red" },
};

function pct(v: number | null): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function numOrDash(v: number | null, dp = 2): string {
  if (v == null) return "—";
  return fmt(v, dp);
}

function SortTh({ label, sortKey, current, dir, onSort }: { label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void }) {
  const active = current === sortKey;
  return (
    <th className="cursor-pointer select-none p-3 text-left text-xs font-bold uppercase tracking-wide text-muted hover:text-ink"
      onClick={() => onSort(sortKey)}>
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active ? "text-brand" : "text-border-subtle"}`} aria-hidden>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </span>
    </th>
  );
}

export default function CreativeScorecardPage() {
  const [scorecard, setScorecard] = useState<CreativeScorecardRow[]>([]);
  const [waste, setWaste] = useState<WastedSpendSummary | null>(null);
  const [currency, setCurrency] = useState("AUD");
  const [windowDays, setWindowDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("verdict");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    setLoading(true);
    fetch("/api/creative/scorecard")
      .then((r) => r.json())
      .then((j) => {
        if (j.upgrade) { setUpgradeNeeded(true); return; }
        if (j.error) { setErr(j.error); return; }
        setScorecard(j.scorecard || []);
        setWaste(j.waste ?? null);
        setCurrency(j.currency || "AUD");
        setWindowDays(j.windowDays || 14);
      })
      .catch(() => setErr("Couldn't load scorecard. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  const handleSort = useCallback((k: SortKey) => {
    setSortDir((prev) => (sortKey === k ? (prev === "asc" ? "desc" : "asc") : "desc"));
    setSortKey(k);
  }, [sortKey]);

  const sorted = [...scorecard].sort((a, b) => {
    let av: any, bv: any;
    if (sortKey === "verdict") {
      av = VERDICT_RANK[a.verdict] ?? 5;
      bv = VERDICT_RANK[b.verdict] ?? 5;
    } else {
      av = a[sortKey] ?? -Infinity;
      bv = b[sortKey] ?? -Infinity;
    }
    const diff = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? diff : -diff;
  });

  const sym = currency === "AUD" ? "$" : `${currency} `;

  if (upgradeNeeded) {
    return (
      <div className="animate-fade-in mx-auto max-w-md py-16 text-center">
        <div className="text-3xl">🎨</div>
        <h1 className="mt-3 text-2xl font-extrabold text-ink">Creative Scorecard</h1>
        <p className="mt-2 text-muted">Per-ad hook rate, hold rate, CTR decay and fatigue signal — ranked by waste priority.</p>
        <p className="mt-4 text-sm text-muted">This feature requires a Pro or Expert plan with a connected ad account.</p>
        <Link href="/billing" className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600">
          Upgrade to Pro →
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Creative Scorecard</h1>
          <p className="mt-1 text-sm text-muted">
            Per-ad engagement diagnostics — last {windowDays} days. Ranked by waste priority.{" "}
            <span className="font-semibold">Read-only — no live ad changes.</span>
          </p>
        </div>
        <Link href="/creative" className="rounded-xl border border-border-subtle bg-white px-3.5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:border-brand hover:text-brand">
          Creative Library →
        </Link>
      </div>

      {/* Wasted spend summary */}
      {waste && waste.total > 0 && (
        <div className="mb-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] rounded-2xl border border-band-red/25 bg-band-red/5 px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-widest text-band-red/80">Potential waste</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-band-red">{sym}{fmt(waste.total)}</div>
            <div className="mt-0.5 text-xs text-muted">
              {waste.killCount} kill · {waste.reduceCount} reduce — {waste.wastedFraction != null ? pct(waste.wastedFraction) : "—"} of spend
            </div>
          </div>
          <div className="flex-1 min-w-[200px] rounded-2xl border border-border-subtle bg-white px-5 py-4 shadow-card">
            <div className="text-xs font-bold uppercase tracking-widest text-muted">Kill spend</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{sym}{fmt(waste.killSpend)}</div>
            <div className="mt-0.5 text-xs text-muted">{waste.killCount} ad{waste.killCount !== 1 ? "s" : ""} flagged for pause</div>
          </div>
          <div className="flex-1 min-w-[200px] rounded-2xl border border-border-subtle bg-white px-5 py-4 shadow-card">
            <div className="text-xs font-bold uppercase tracking-widest text-muted">Reduce spend</div>
            <div className="mt-1 text-2xl font-extrabold tabular-nums text-ink">{sym}{fmt(waste.reduceSpend)}</div>
            <div className="mt-0.5 text-xs text-muted">{waste.reduceCount} ad{waste.reduceCount !== 1 ? "s" : ""} above break-even</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-border-subtle bg-white p-8 text-center text-muted shadow-card">
          Loading creative scorecard…
        </div>
      )}

      {err && !loading && (
        <div role="alert" className="rounded-2xl border border-band-red/30 bg-band-red/5 px-4 py-3 text-sm text-band-red">
          {err}
        </div>
      )}

      {!loading && !err && scorecard.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-subtle bg-surface p-10 text-center">
          <div className="text-3xl" aria-hidden>🎨</div>
          <p className="mt-2 font-bold text-ink">No ad data in the last {windowDays} days</p>
          <p className="mt-1 text-sm text-muted">
            Connect your Meta or TikTok account and run a sync to populate the scorecard.
          </p>
          <Link href="/connect" className="mt-4 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600">
            Connect account →
          </Link>
        </div>
      )}

      {!loading && !err && sorted.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/60">
                <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Ad</th>
                <SortTh label="Verdict"  sortKey="verdict"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Spend"    sortKey="spend"    current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="CTR"      sortKey="ctr"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="CTR Decay" sortKey="ctrDecay" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Trend</th>
                <SortTh label="Hook %"   sortKey="hookRate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Hold %"   sortKey="holdRate" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="CPA"      sortKey="cpa"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Fatigue</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const chip = VERDICT_CHIP[row.verdict] ?? { label: row.verdict, cls: "bg-border-subtle text-muted" };
                const fat = FATIGUE_CHIP[row.fatigueStatus] ?? FATIGUE_CHIP.healthy;
                const decayHigh = row.ctrDecay != null && row.ctrDecay > 0.25;
                return (
                  <tr key={row.adKey} className={`border-b border-border-subtle/60 ${i % 2 !== 0 ? "bg-surface/30" : ""}`}>
                    <td className="max-w-[200px] truncate p-3">
                      <span className="block truncate font-semibold text-ink" title={row.adName}>{row.adName}</span>
                      <span className="block text-2xs text-muted">{row.impressions.toLocaleString("en-AU")} imp · {row.clicks.toLocaleString("en-AU")} clicks</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${chip.cls}`}>{chip.label}</span>
                    </td>
                    <td className="p-3 tabular-nums text-ink">{sym}{fmt(row.spend)}</td>
                    <td className="p-3 tabular-nums text-ink">{pct(row.ctr)}</td>
                    <td className={`p-3 tabular-nums ${decayHigh ? "font-bold text-band-red" : "text-ink"}`}>
                      {pct(row.ctrDecay)}
                    </td>
                    <td className="p-3">
                      {row.ctrSeries && row.ctrSeries.length >= 2
                        ? <Spark values={row.ctrSeries} width={80} height={24} domain="auto" tone={decayHigh ? "bad" : "ice"} />
                        : <span className="text-2xs text-muted">1 day</span>}
                    </td>
                    <td className="p-3 tabular-nums text-ink">{pct(row.hookRate)}</td>
                    <td className="p-3 tabular-nums text-ink">{pct(row.holdRate)}</td>
                    <td className="p-3 tabular-nums text-ink">{row.cpa != null ? `${sym}${fmt(row.cpa)}` : "—"}</td>
                    <td className="p-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${fat.cls}`}>{fat.label}</span>
                      {row.fatigueOnsetDaysAgo != null && (
                        <span className="ml-1 text-2xs text-muted">{row.fatigueOnsetDaysAgo}d ago</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border-subtle bg-surface/40 px-4 py-3 text-xs text-muted">
            {sorted.length} ad{sorted.length !== 1 ? "s" : ""} · last {windowDays} days · proposals only — no live ad was changed
          </div>
        </div>
      )}
    </div>
  );
}
