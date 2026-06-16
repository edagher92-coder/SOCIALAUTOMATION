// V6 P3 diagnostics — predictive creative fatigue (pure, read-only).
// The differentiator: catch fatigue BEFORE performance craters. The leading signal is a falling
// hold-rate (people stop watching) while CTR is still flat — engagement decays before clicks do.
// Combined with rising frequency + a declining CTR for the already-fatigued case. Forecasts a
// rough days-to-fatigue from the CTR decline rate so the team can queue a refresh in advance.
import { slope, trend, mean, type Trend } from "./timeseries";

export type FatigueStatus = "healthy" | "watch" | "fatigued";

export interface FatiguePoint { ctr: number; holdRate?: number | null; frequency?: number | null }

export interface FatigueResult {
  status: FatigueStatus;
  daysToFatigue: number | null; // forecast; null when not declining / not enough data
  ctrTrend: Trend;
  holdTrend: Trend;
  reason: string;
}

const FREQ_FATIGUE = 4;      // frequency at/above which fatigue is likely
const CTR_FLOOR_FRAC = 0.7;  // "fatigued" once CTR falls to 70% of its series peak

export function predictFatigue(series: FatiguePoint[]): FatigueResult {
  const ctrs = series.map((p) => p.ctr).filter((v) => Number.isFinite(v)) as number[];
  const holds = series.map((p) => p.holdRate).filter((v): v is number => Number.isFinite(v as number));
  const freqNow = [...series].reverse().find((p) => Number.isFinite(p.frequency as number))?.frequency ?? null;

  const ctrTrend = trend(ctrs);
  const holdTrend = holds.length >= 3 ? trend(holds) : "flat";

  if (ctrs.length < 3) {
    return { status: "healthy", daysToFatigue: null, ctrTrend, holdTrend, reason: "Not enough history yet to judge fatigue." };
  }

  const ctrSlope = slope(ctrs); // per-day change
  const current = ctrs[ctrs.length - 1];
  const peak = Math.max(...ctrs);
  const floor = peak * CTR_FLOOR_FRAC;

  // Forecast days until CTR hits the fatigue floor, if it's declining.
  let daysToFatigue: number | null = null;
  if (ctrSlope != null && ctrSlope < 0 && current > floor) {
    daysToFatigue = Math.max(0, Math.round((current - floor) / Math.abs(ctrSlope)));
  }

  // Already fatigued: high frequency + a clearly falling CTR, or CTR already below the floor.
  if ((freqNow != null && freqNow >= FREQ_FATIGUE && ctrTrend === "falling") || current <= floor) {
    return {
      status: "fatigued",
      daysToFatigue: 0,
      ctrTrend, holdTrend,
      reason: freqNow != null && freqNow >= FREQ_FATIGUE
        ? `Frequency ${freqNow.toFixed(1)} with falling CTR — creative is fatigued. Refresh now (propose a paused duplicate of the winning angle).`
        : "CTR has fallen to its fatigue floor — refresh the creative.",
    };
  }

  // Predictive early-warning: hold-rate decaying while CTR is still holding — the leading signal.
  if (holdTrend === "falling" && ctrTrend !== "rising") {
    return {
      status: "watch",
      daysToFatigue,
      ctrTrend, holdTrend,
      reason: daysToFatigue != null
        ? `Hold-rate is dropping while CTR still holds — early fatigue. Likely fatigued in ~${daysToFatigue} day(s); queue a refresh now.`
        : "Hold-rate is dropping while CTR still holds — early fatigue signal; queue a refresh.",
    };
  }

  // Declining CTR without the hold signal yet → watch with a forecast.
  if (ctrTrend === "falling" && daysToFatigue != null && daysToFatigue <= 7) {
    return { status: "watch", daysToFatigue, ctrTrend, holdTrend, reason: `CTR declining — on track to fatigue in ~${daysToFatigue} day(s). Prepare a fresh angle.` };
  }

  return { status: "healthy", daysToFatigue, ctrTrend, holdTrend, reason: `Creative healthy (CTR ${ctrTrend}${mean(ctrs) != null ? `, avg ${(mean(ctrs)! * 100).toFixed(2)}%` : ""}).` };
}
