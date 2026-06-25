// V6 P2 diagnostics — change-point detection (pure, read-only). Pins the day a daily series
// stepped to a new level, which is exactly what "creative fatigue onset" is: the day engagement
// turned down and stayed down. We use AMOC (at-most-one-change) least-squares segmentation — the
// single most significant split — the interpretable special case of the PELT family the fatigue
// diagnostic needs. O(n^2), fine for daily windows (<=~90 points). No I/O; null-safe; never throws.
import { mean } from "./timeseries";

export interface ChangePoint {
  index: number;             // first index of the AFTER segment: [0..index-1] | [index..n-1]
  meanBefore: number;
  meanAfter: number;
  delta: number;             // meanAfter - meanBefore (negative = a downward step)
  varianceExplained: number; // 0..1 — how much the 2-segment fit beats a single mean (R^2-like)
  confidence: number;        // 0..1 — varianceExplained tempered by sample size
}

// Sum of squared errors of a segment about its own mean.
function sse(xs: number[]): number {
  const m = mean(xs);
  if (m == null) return 0;
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return s;
}

/**
 * Locate the single most significant change point in a chronological series (oldest→newest).
 * Returns null when the series is too short, perfectly flat, or no split materially beats a
 * single mean (varianceExplained below `minVarianceExplained`). `minSeg` is the minimum points
 * each side, so a one-day blip can't masquerade as a sustained level change.
 */
export function changePoint(
  xs: number[],
  opts: { minSeg?: number; minVarianceExplained?: number } = {},
): ChangePoint | null {
  const minSeg = Math.max(1, opts.minSeg ?? 2);
  const minVE = opts.minVarianceExplained ?? 0.1;
  const n = xs.length;
  if (n < 2 * minSeg) return null;

  const sse0 = sse(xs);
  if (sse0 === 0) return null; // perfectly flat — no change point

  let bestK = -1;
  let bestSse = Infinity;
  for (let k = minSeg; k <= n - minSeg; k++) {
    const s = sse(xs.slice(0, k)) + sse(xs.slice(k));
    if (s < bestSse) { bestSse = s; bestK = k; }
  }
  if (bestK < 0) return null;

  const varianceExplained = (sse0 - bestSse) / sse0;
  if (varianceExplained < minVE) return null;

  const meanBefore = mean(xs.slice(0, bestK))!;
  const meanAfter = mean(xs.slice(bestK))!;
  // More history → more trust in the split. Full weight at ~2 weeks of daily data.
  const sizeFactor = Math.min(1, n / 14);
  const confidence = Math.max(0, Math.min(1, varianceExplained * (0.6 + 0.4 * sizeFactor)));

  return { index: bestK, meanBefore, meanAfter, delta: meanAfter - meanBefore, varianceExplained, confidence };
}

export function confidenceLabel(confidence: number): "low" | "moderate" | "high" {
  if (confidence >= 0.66) return "high";
  if (confidence >= 0.33) return "moderate";
  return "low";
}
