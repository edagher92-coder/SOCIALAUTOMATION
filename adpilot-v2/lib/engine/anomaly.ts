// V6 Phase-2 — direction-aware anomaly classifier built on the robust (median/MAD) primitives in
// timeseries.ts. Flags the LATEST point of a daily metric series as a sudden spike/drop, and labels
// whether that move is HARMFUL for the metric (cost up / efficiency down). Pure, null-safe, never
// throws. Read-only/analytical only — never a scoring input, never a verdict.

import { median, mad } from "./timeseries";

export type AnomalyDirection = "spike" | "drop";

export interface MetricAnomaly {
  metric: string;
  value: number;
  baseline: number;             // robust centre (median of the prior history)
  deviationPct: number | null;  // (value - baseline) / baseline
  zMad: number;                 // robust z-score |value - baseline| / MAD
  direction: AnomalyDirection;
  bad: boolean;                 // is this move the harmful direction for THIS metric?
  severity: "watch" | "alert";
}

// Which direction is BAD for each metric. Cost/exposure metrics: an upward spike hurts. Efficiency/
// outcome metrics: a downward drop hurts. Anything else is still reported but flagged bad=false.
const COST_UP_BAD = new Set(["cpl", "cpa", "cpc", "cpm", "spend", "frequency"]);
const EFFICIENCY_DOWN_BAD = new Set(["roas", "ctr", "leads", "purchases", "revenue", "conversions"]);

export interface AnomalyOpts {
  k?: number;          // MADs from the median to count as an anomaly (watch threshold)
  alertK?: number;     // MADs to escalate watch → alert
  minHistory?: number; // minimum prior points needed for a stable baseline
}

// Detect whether the MOST RECENT point of a series is a robust anomaly vs its own history.
// The baseline (median + MAD) is computed from the history EXCLUDING the latest point, so a single
// large reading can't inflate the very spread used to judge it. Returns null when there is too
// little history or the series is flat (MAD 0) — we never manufacture an anomaly from noise.
export function detectLatestAnomaly(metric: string, series: number[], opts: AnomalyOpts = {}): MetricAnomaly | null {
  const k = opts.k ?? 3;
  const alertK = opts.alertK ?? 4.5;
  const minHistory = opts.minHistory ?? 4;
  const xs = series.filter((v) => Number.isFinite(v));
  if (xs.length < minHistory + 1) return null;
  const latest = xs[xs.length - 1];
  const hist = xs.slice(0, -1);
  const med = median(hist);
  const spread = mad(hist);
  if (med == null || spread == null || spread === 0) return null;
  const z = Math.abs(latest - med) / spread;
  if (z < k) return null;
  const direction: AnomalyDirection = latest >= med ? "spike" : "drop";
  const bad =
    (direction === "spike" && COST_UP_BAD.has(metric)) ||
    (direction === "drop" && EFFICIENCY_DOWN_BAD.has(metric));
  return {
    metric,
    value: latest,
    baseline: med,
    deviationPct: med !== 0 ? (latest - med) / med : null,
    zMad: z,
    direction,
    bad,
    severity: z >= alertK ? "alert" : "watch",
  };
}
