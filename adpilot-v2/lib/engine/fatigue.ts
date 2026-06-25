// V6 P3 diagnostics — predictive creative fatigue (pure, read-only).
// The differentiator: catch fatigue BEFORE performance craters. The leading signal is a falling
// hold-rate (people stop watching) while CTR is still flat — engagement decays before clicks do.
// V6 P2 sharpens this with a statistical CHANGE-POINT: instead of only a linear-slope forecast +
// peak-fraction floor, we pin the exact day the engagement series stepped down, with a confidence
// statement — so the team knows when fatigue began, not just that a trend looks soft.
import { slope, trend, mean, type Trend } from "./timeseries";
import { changePoint, confidenceLabel } from "./changepoint";

export type FatigueStatus = "healthy" | "watch" | "fatigued";

export interface FatiguePoint { ctr: number; holdRate?: number | null; frequency?: number | null }

// The pinned onset of a sustained downward step in the engagement series.
export interface FatigueOnset {
  metric: "holdRate" | "ctr"; // which series turned (hold-rate is the leading signal)
  index: number;              // index in that series where the level stepped down
  daysAgo: number;            // data points since the onset (daily series → ~days ago)
  dropPct: number;            // fractional size of the step: (before - after) / before
  confidence: number;         // 0..1
  confidenceLabel: "low" | "moderate" | "high";
}

export interface FatigueResult {
  status: FatigueStatus;
  daysToFatigue: number | null; // forward forecast; null when not declining / not enough data
  ctrTrend: Trend;
  holdTrend: Trend;
  onset: FatigueOnset | null;   // backward detection: when the creative actually turned
  reason: string;
}

const FREQ_FATIGUE = 4;      // frequency at/above which fatigue is likely
const CTR_FLOOR_FRAC = 0.7;  // hard backstop: "fatigued" once CTR falls to 70% of its series peak

// Run the change-point detector on the leading signal (hold-rate) first, then CTR. Only a DOWNWARD
// step counts as a fatigue onset. Returns the pinned onset or null.
function detectOnset(ctrs: number[], holds: number[]): FatigueOnset | null {
  const candidates: Array<["holdRate" | "ctr", number[]]> = [];
  if (holds.length >= 6) candidates.push(["holdRate", holds]);
  if (ctrs.length >= 6) candidates.push(["ctr", ctrs]);
  for (const [metric, arr] of candidates) {
    const cp = changePoint(arr);
    if (cp && cp.delta < 0 && cp.meanBefore > 0) {
      return {
        metric,
        index: cp.index,
        daysAgo: (arr.length - 1) - cp.index,
        dropPct: (cp.meanBefore - cp.meanAfter) / cp.meanBefore,
        confidence: cp.confidence,
        confidenceLabel: confidenceLabel(cp.confidence),
      };
    }
  }
  return null;
}

export function predictFatigue(series: FatiguePoint[]): FatigueResult {
  const ctrs = series.map((p) => p.ctr).filter((v) => Number.isFinite(v)) as number[];
  const holds = series.map((p) => p.holdRate).filter((v): v is number => Number.isFinite(v as number));
  const freqNow = [...series].reverse().find((p) => Number.isFinite(p.frequency as number))?.frequency ?? null;

  const ctrTrend = trend(ctrs);
  const holdTrend = holds.length >= 3 ? trend(holds) : "flat";

  if (ctrs.length < 3) {
    return { status: "healthy", daysToFatigue: null, ctrTrend, holdTrend, onset: null, reason: "Not enough history yet to judge fatigue." };
  }

  const onset = detectOnset(ctrs, holds);
  const onsetNote = onset
    ? ` Change-point: ${onset.metric === "holdRate" ? "hold-rate" : "CTR"} stepped down ~${onset.daysAgo} day(s) ago (${Math.round(onset.dropPct * 100)}% drop, ${onset.confidenceLabel} confidence).`
    : "";

  const ctrSlope = slope(ctrs); // per-day change
  const current = ctrs[ctrs.length - 1];
  const peak = Math.max(...ctrs);
  const floor = peak * CTR_FLOOR_FRAC;

  // Forward forecast: days until CTR hits the fatigue floor, if it's declining (kept as a bonus
  // alongside the change-point onset).
  let daysToFatigue: number | null = null;
  if (ctrSlope != null && ctrSlope < 0 && current > floor) {
    daysToFatigue = Math.max(0, Math.round((current - floor) / Math.abs(ctrSlope)));
  }

  // Already fatigued: high frequency + a clearly falling CTR, CTR already below the floor, or a
  // high-confidence deep downward change-point in the CTR series that has persisted.
  const deepCtrOnset = !!onset && onset.metric === "ctr" && onset.confidenceLabel === "high" && onset.dropPct >= 0.25;
  if ((freqNow != null && freqNow >= FREQ_FATIGUE && ctrTrend === "falling") || current <= floor || deepCtrOnset) {
    return {
      status: "fatigued",
      daysToFatigue: 0,
      ctrTrend, holdTrend, onset,
      reason: (freqNow != null && freqNow >= FREQ_FATIGUE
        ? `Frequency ${freqNow.toFixed(1)} with falling CTR — creative is fatigued. Refresh now (propose a paused duplicate of the winning angle).`
        : "CTR has fallen to its fatigue floor — refresh the creative.") + onsetNote,
    };
  }

  // Predictive early-warning: hold-rate decaying while CTR still holds — the leading signal, now
  // corroborated by (or surfaced from) a change-point onset in the hold-rate series.
  if ((holdTrend === "falling" && ctrTrend !== "rising") || (onset?.metric === "holdRate" && onset.confidenceLabel !== "low")) {
    return {
      status: "watch",
      daysToFatigue,
      ctrTrend, holdTrend, onset,
      reason: (daysToFatigue != null
        ? `Hold-rate is dropping while CTR still holds — early fatigue. Likely fatigued in ~${daysToFatigue} day(s); queue a refresh now.`
        : "Hold-rate is dropping while CTR still holds — early fatigue signal; queue a refresh.") + onsetNote,
    };
  }

  // Declining CTR without the hold signal yet → watch with a forecast, or a moderate+ CTR onset.
  if ((ctrTrend === "falling" && daysToFatigue != null && daysToFatigue <= 7) || (onset?.metric === "ctr" && onset.confidenceLabel !== "low")) {
    return { status: "watch", daysToFatigue, ctrTrend, holdTrend, onset, reason: `CTR declining — on track to fatigue in ~${daysToFatigue ?? "?"} day(s). Prepare a fresh angle.` + onsetNote };
  }

  return { status: "healthy", daysToFatigue, ctrTrend, holdTrend, onset, reason: `Creative healthy (CTR ${ctrTrend}${mean(ctrs) != null ? `, avg ${(mean(ctrs)! * 100).toFixed(2)}%` : ""}).` + onsetNote };
}
