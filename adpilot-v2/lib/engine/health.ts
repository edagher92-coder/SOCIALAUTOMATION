// AdPilot OS V2 — canonical 13-factor Campaign Health Score (TS port).
import type { BandName, HealthResult, FactorBreakdown } from "./types";

export const HEALTH_WEIGHTS: Record<string, number> = {
  tracking_quality: 15,
  cpa: 15,
  spend_efficiency: 12,
  conversion_rate: 10,
  ctr: 8,
  lead_quality: 8,
  creative_freshness: 8,
  cpc: 7,
  naming_quality: 5,
  offer_strength: 5,
  landing_page_alignment: 4,
  budget_pacing: 2,
  data_confidence: 1,
};

const BANDS: [number, BandName, string][] = [
  [80, "Green", "Healthy — scale-eligible if tracking is clean."],
  [60, "Yellow", "Watch — fix the weak factors before scaling."],
  [40, "Orange", "Needs work — significant issues, act this week."],
  [0, "Red", "Critical — stop and fix before spending more."],
];

export function band(score: number): [BandName, string] {
  for (const [floor, name, guidance] of BANDS) if (score >= floor) return [name, guidance];
  return ["Red", BANDS[3][2]];
}

export function computeHealth(factorScores: Record<string, number>, naFactors: string[] = []): HealthResult {
  const na = new Set(naFactors);
  for (const f in HEALTH_WEIGHTS) if (!(f in factorScores)) na.add(f);

  let activeWeight = 0;
  for (const f in HEALTH_WEIGHTS) if (!na.has(f)) activeWeight += HEALTH_WEIGHTS[f];
  if (activeWeight === 0) throw new Error("All health factors are N/A — cannot score.");

  const breakdown: Record<string, FactorBreakdown> = {};
  let total = 0;
  for (const f in HEALTH_WEIGHTS) {
    const w = HEALTH_WEIGHTS[f];
    if (na.has(f)) {
      breakdown[f] = { score: null, weight: w, adjusted_weight: 0, weighted_points: 0 };
      continue;
    }
    const adj = (w * 100) / activeWeight;
    const pts = (factorScores[f] * adj) / 100;
    total += pts;
    breakdown[f] = { score: factorScores[f], weight: w, adjusted_weight: adj, weighted_points: pts };
  }
  total = Math.round(total * 100) / 100;
  const [name, guidance] = band(total);

  const losses: [number, string][] = [];
  for (const f in breakdown) {
    const b = breakdown[f];
    if (b.score == null) continue;
    losses.push([(b.adjusted_weight * (100 - b.score)) / 100, f]);
  }
  losses.sort((a, b) => b[0] - a[0]);

  return { total, band: name, guidance, breakdown, weakest: losses.slice(0, 3).map((x) => x[1]) };
}

export const weightsSum = (): number => Object.values(HEALTH_WEIGHTS).reduce((a, b) => a + b, 0);
