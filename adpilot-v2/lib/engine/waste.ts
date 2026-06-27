// AdPilot OS V2 — wasted-spend aggregator (P6.4 / master plan next PR).
// Sums ad spend on creative rows with a kill or reduce verdict. Read-only;
// never proposes an action — only surfaces the number so the human can decide.

import type { CreativeScorecardRow } from "./creative";

export interface WastedSpendSummary {
  /** Total spend on kill + reduce ads (AUD by default). */
  total: number;
  /** Number of ads with verdict "kill". */
  killCount: number;
  /** Number of ads with verdict "reduce". */
  reduceCount: number;
  /** Spend on kill-verdict ads only. */
  killSpend: number;
  /** Spend on reduce-verdict ads only. */
  reduceSpend: number;
  /** Proportion of total account spend flagged as wasted [0–1]. Null if total spend is 0. */
  wastedFraction: number | null;
}

export function computeWastedSpend(
  scorecard: CreativeScorecardRow[],
  totalAccountSpend?: number,
): WastedSpendSummary {
  let killCount = 0, reduceCount = 0, killSpend = 0, reduceSpend = 0;
  for (const row of scorecard) {
    if (row.verdict === "kill") { killCount++; killSpend += row.spend; }
    else if (row.verdict === "reduce") { reduceCount++; reduceSpend += row.spend; }
  }
  const total = killSpend + reduceSpend;
  const accountSpend = totalAccountSpend ?? scorecard.reduce((s, r) => s + r.spend, 0);
  const wastedFraction = accountSpend > 0 ? total / accountSpend : null;
  return { total, killCount, reduceCount, killSpend, reduceSpend, wastedFraction };
}
