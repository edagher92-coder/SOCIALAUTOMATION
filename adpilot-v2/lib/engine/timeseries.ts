// V6 P3 diagnostics — pure time-series helpers over a chronological daily series (oldest→newest).
// Reads the daily account/ad rollup (e.g. account_daily_metrics) to derive trends, week-over-week
// deltas, and robust anomalies. No I/O; null-safe; never throws. Read-only/analytical only.

export type Trend = "rising" | "falling" | "flat";

export function mean(xs: number[]): number | null {
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Median absolute deviation (robust spread). Scaled by 1.4826 to approximate σ for normal data.
export function mad(xs: number[]): number | null {
  const med = median(xs);
  if (med == null) return null;
  const dev = xs.map((x) => Math.abs(x - med));
  const m = median(dev);
  return m == null ? null : m * 1.4826;
}

// Least-squares slope over the series index (per-step change). Null for <2 points.
export function slope(xs: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const xbar = (n - 1) / 2;
  const ybar = mean(xs)!;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (i - xbar) * (xs[i] - ybar); den += (i - xbar) ** 2; }
  return den === 0 ? null : num / den;
}

// Trailing moving average of the last `window` points.
export function movingAverage(xs: number[], window: number): number | null {
  if (xs.length === 0 || window <= 0) return null;
  return mean(xs.slice(-window));
}

// Week-over-week change: mean of the last 7 vs the prior 7. Returns a fraction (+0.2 = +20%).
export function wowDelta(xs: number[]): number | null {
  if (xs.length < 14) return null;
  const last = mean(xs.slice(-7));
  const prev = mean(xs.slice(-14, -7));
  if (last == null || prev == null || prev === 0) return null;
  return (last - prev) / prev;
}

// Robust anomaly indices: points more than k MADs from the median.
export function anomalyIndices(xs: number[], k = 3): number[] {
  const med = median(xs);
  const spread = mad(xs);
  if (med == null || spread == null || spread === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < xs.length; i++) if (Math.abs(xs[i] - med) > k * spread) out.push(i);
  return out;
}

// Direction of the trend relative to the series scale (slope as a fraction of the mean per step).
export function trend(xs: number[], flatBand = 0.02): Trend {
  const s = slope(xs);
  const m = mean(xs);
  if (s == null || m == null || m === 0) return "flat";
  const rel = s / Math.abs(m);
  if (rel > flatBand) return "rising";
  if (rel < -flatBand) return "falling";
  return "flat";
}

export interface SeriesSummary {
  n: number;
  current: number | null;
  avg7: number | null;
  avg30: number | null;
  wowPct: number | null;   // fraction
  trend: Trend;
  anomalyToday: boolean;    // is the latest point an anomaly?
}

export function summariseSeries(xs: number[]): SeriesSummary {
  const anomalies = anomalyIndices(xs);
  return {
    n: xs.length,
    current: xs.length ? xs[xs.length - 1] : null,
    avg7: movingAverage(xs, 7),
    avg30: movingAverage(xs, 30),
    wowPct: wowDelta(xs),
    trend: trend(xs),
    anomalyToday: xs.length > 0 && anomalies.includes(xs.length - 1),
  };
}
