// V6 P3 diagnostics — statistical significance helpers (pure, null-safe, read-only).
// Used to GATE keep/kill/scale verdicts so we never act confidently on a noisy sample:
// e.g. only "scale" when the lower bound of the conversion rate confidently beats the target,
// only "kill" when the upper bound is confidently below it. Otherwise hold / collect more data.

export interface Interval { point: number; low: number; high: number }

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Wilson score interval for a binomial proportion (more accurate than normal approx at small n
// or extreme rates). z=1.96 ≈ 95%. Returns null when there's no data.
export function wilsonInterval(successes: number, trials: number, z = 1.96): Interval | null {
  if (!Number.isFinite(trials) || trials <= 0) return null;
  const s = Math.max(0, Math.min(successes, trials));
  const p = s / trials;
  const z2 = z * z;
  const denom = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) / denom;
  return { point: clamp01(p), low: clamp01(center - margin), high: clamp01(center + margin) };
}

// Confidently BETTER than target: the whole 95% interval sits above it (lower bound > target).
export function confidentlyAbove(successes: number, trials: number, target: number, z = 1.96): boolean {
  const ci = wilsonInterval(successes, trials, z);
  return !!ci && ci.low > target;
}

// Confidently WORSE than target: the whole 95% interval sits below it (upper bound < target).
export function confidentlyBelow(successes: number, trials: number, target: number, z = 1.96): boolean {
  const ci = wilsonInterval(successes, trials, z);
  return !!ci && ci.high < target;
}

// Is the sample big enough to draw a conclusion at all? (decision-floor companion)
export function enoughData(trials: number, minTrials = 100): boolean {
  return Number.isFinite(trials) && trials >= minTrials;
}

// Verdict confidence for a measured rate vs a break-even/target rate, given the sample size.
// "high" => the CI is entirely on one side of the target; "low" => the CI straddles it (hold).
export function rateConfidence(successes: number, trials: number, target: number, z = 1.96): "above" | "below" | "inconclusive" {
  if (confidentlyAbove(successes, trials, target, z)) return "above";
  if (confidentlyBelow(successes, trials, target, z)) return "below";
  return "inconclusive";
}
