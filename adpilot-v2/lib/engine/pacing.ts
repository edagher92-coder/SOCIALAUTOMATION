// Budget pacing — pure, testable. Compares spend-to-date against a pro-rata monthly target and
// projects month-end. Read-only: any recommended daily delta is a PROPOSAL (typed-YES to apply).
// Returns nulls safely on missing/zero inputs (never throws), mirroring lib/engine/metrics.ts.

export type PacingStatus = "Green" | "Amber" | "Red" | "Unknown";

export interface Pacing {
  proRataTarget: number | null;   // expected spend by now
  variance: number | null;        // spendToDate - proRataTarget (+ = over-pacing)
  variancePct: number | null;     // variance / proRataTarget
  projectedMonthEnd: number | null;
  status: PacingStatus;
  recommendedDailyDelta: number | null; // change to daily spend to land on budget (proposal only)
}

export interface PacingInput {
  monthlyBudget: number | null;
  spendToDate: number;
  daysElapsed: number;
  daysInMonth: number;
}

export function pace({ monthlyBudget, spendToDate, daysElapsed, daysInMonth }: PacingInput): Pacing {
  // Not enough information to judge pacing.
  if (!monthlyBudget || monthlyBudget <= 0 || daysInMonth <= 0 || daysElapsed <= 0) {
    return { proRataTarget: null, variance: null, variancePct: null, projectedMonthEnd: null, status: "Unknown", recommendedDailyDelta: null };
  }
  const frac = Math.min(daysElapsed, daysInMonth) / daysInMonth;
  const proRataTarget = monthlyBudget * frac;
  const variance = spendToDate - proRataTarget;
  const variancePct = proRataTarget > 0 ? variance / proRataTarget : null;
  const dailyRate = spendToDate / daysElapsed;
  const projectedMonthEnd = dailyRate * daysInMonth;

  let status: PacingStatus = "Green";
  if (variancePct != null) {
    const m = Math.abs(variancePct);
    status = m <= 0.1 ? "Green" : m <= 0.25 ? "Amber" : "Red";
  }

  // To land exactly on budget: spend the remaining budget across the remaining days.
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  const remaining = monthlyBudget - spendToDate;
  const targetDaily = daysRemaining > 0 ? remaining / daysRemaining : null;
  const recommendedDailyDelta = targetDaily == null ? null : targetDaily - dailyRate;

  return { proRataTarget, variance, variancePct, projectedMonthEnd, status, recommendedDailyDelta };
}

// 0–100 health factor score from pacing (for the engine's budget_pacing factor).
// On pace = 100; tolerates small drift; penalises larger over/under-pacing. Unknown => null
// (so the factor redistributes its weight rather than guessing).
export function pacingScore(p: Pacing): number | null {
  if (p.status === "Unknown" || p.variancePct == null) return null;
  const m = Math.abs(p.variancePct);
  if (m <= 0.1) return 100;
  if (m >= 0.75) return 20;
  // linear 100→20 between 10% and 75% drift
  return Math.round(100 - ((m - 0.1) / 0.65) * 80);
}
