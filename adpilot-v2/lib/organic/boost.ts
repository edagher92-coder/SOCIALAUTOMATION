// Pure, numbers-first organic-post BOOST projection — no I/O, no server-only, safe in the
// browser and unit-testable. Mirrors the lib/engine discipline: it shows the maths, every
// projection is an ESTIMATE/RANGE (never a guarantee), and the "worth boosting" verdict is
// significance-gated (the Wilson lower bound must clear the platform engagement benchmark) so
// we only ever recommend amplifying a PROVEN organic post. AU English. Read-only — proposes,
// never acts.
import { wilsonInterval, rateConfidence } from "@/lib/engine/stats";

export type OrganicPlatform = "meta" | "tiktok";

// What a post already earned organically (unpaid).
export interface OrganicPost {
  platform: OrganicPlatform;
  reach: number;        // unique people reached organically
  impressions: number;  // total organic impressions (>= reach)
  engagements: number;  // likes + comments + shares + saves (sum)
}

export interface BoostInput {
  post: OrganicPost;
  budget: number;       // proposed boost spend (same currency as cpm)
  cpm: number | null;   // the account's REAL CPM for this platform; null -> labelled benchmark
}

// Per-platform model. CPM fallbacks (AUD) are clearly labelled as benchmarks when used; the
// engagement-rate benchmark is a conservative "this post is resonating" threshold that the
// Wilson lower bound must clear before we ever say "worth boosting".
interface PlatformModel { benchmarkCpm: number; engagementBenchmark: number }
const PLATFORM_MODEL: Record<OrganicPlatform, PlatformModel> = {
  meta:   { benchmarkCpm: 12, engagementBenchmark: 0.02 },  // ~2% engagement/reach on FB/IG
  tiktok: { benchmarkCpm: 10, engagementBenchmark: 0.045 }, // ~4.5% on TikTok
};

// A short boost reaches each person ~1.0-1.4x; 1.15 is the point estimate, the band drives the range.
const PAID_FREQUENCY = 1.15;
const PAID_FREQUENCY_LOW = 1.0;   // best case: everyone seen once -> most unique reach
const PAID_FREQUENCY_HIGH = 1.4;  // worst case: more repeats -> less unique reach
// A paid/cold audience engages less than your existing followers. Conservative damping.
const PAID_ENGAGEMENT_DAMPING = 0.6;
// Don't draw a boost conclusion below this organic reach — too little signal to judge.
const MIN_REACH_FLOOR = 200;

export type BoostVerdict = "worth-boosting" | "improve-organic-first" | "insufficient-data";

export interface Range { low: number; high: number }

export interface BoostProjection {
  platform: OrganicPlatform;
  // CPM basis
  cpmUsed: number;
  cpmSource: "account" | "benchmark";
  // organic baseline
  organicReach: number;
  engagementRate: number;          // organic engagements / reach
  engagementRateRange: Range;      // Wilson 95% CI
  benchmark: number;               // platform engagement benchmark used for the gate
  // boost projection
  budget: number;
  paidImpressions: number;
  incrementalReach: number;        // point estimate of NEW people the boost reaches
  incrementalReachRange: Range;
  totalProjectedReach: number;     // organic + incremental (point)
  reachMultiple: number;           // totalProjectedReach / organic reach
  costPer1kIncrementalReach: number;
  projectedAddedEngagements: number;
  projectedAddedEngagementsRange: Range;
  // verdict
  verdict: BoostVerdict;
  confidence: "above" | "below" | "inconclusive";
  rationale: string;
  safety: string;
}

const SAFETY =
  "Read-only projection — estimates, not guarantees. No ad was created, boosted, or charged. You approve any spend in Ads Manager.";

const r0 = (n: number) => Math.max(0, Math.round(n));
const nonNeg = (n: number | null | undefined) => (Number.isFinite(n) && (n as number) > 0 ? (n as number) : 0);

export function projectBoost(input: BoostInput): BoostProjection {
  const { post } = input;
  const model = PLATFORM_MODEL[post.platform];
  const reach = nonNeg(post.reach);
  const engagements = nonNeg(post.engagements);
  const budget = nonNeg(input.budget);

  // CPM: prefer the account's real cost; else a labelled benchmark.
  const hasAccount = input.cpm != null && Number.isFinite(input.cpm) && (input.cpm as number) > 0;
  const cpmUsed = hasAccount ? (input.cpm as number) : model.benchmarkCpm;
  const cpmSource: "account" | "benchmark" = hasAccount ? "account" : "benchmark";

  // Organic engagement rate + its Wilson CI (engagements as "successes" over reach "trials").
  const ci = wilsonInterval(engagements, reach);
  const engagementRate = reach > 0 ? engagements / reach : 0;
  const engagementRateRange: Range = { low: ci?.low ?? 0, high: ci?.high ?? 0 };

  // Boost reach maths: impressions the budget buys, then unique reach via assumed frequency.
  const paidImpressions = cpmUsed > 0 ? (budget / cpmUsed) * 1000 : 0;
  const incrementalReach = paidImpressions / PAID_FREQUENCY;
  const incrementalReachRange: Range = {
    low: paidImpressions / PAID_FREQUENCY_HIGH,  // more repeats -> fewer unique people
    high: paidImpressions / PAID_FREQUENCY_LOW,
  };
  const totalProjectedReach = reach + incrementalReach;
  const reachMultiple = reach > 0 ? totalProjectedReach / reach : 0;
  const costPer1kIncrementalReach = incrementalReach > 0 ? budget / (incrementalReach / 1000) : 0;

  // Projected added engagements: incremental reach x organic engagement rate, damped because a
  // paid/cold audience engages less than your existing followers.
  const projectedAddedEngagements = incrementalReach * engagementRate * PAID_ENGAGEMENT_DAMPING;
  const projectedAddedEngagementsRange: Range = {
    low: incrementalReachRange.low * engagementRateRange.low * PAID_ENGAGEMENT_DAMPING,
    high: incrementalReachRange.high * engagementRateRange.high * PAID_ENGAGEMENT_DAMPING,
  };

  // Verdict — only ever recommend boosting a PROVEN winner (Wilson lower bound clears the benchmark).
  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  const platformLabel = post.platform === "tiktok" ? "TikTok" : "Meta";
  let verdict: BoostVerdict;
  let confidence: "above" | "below" | "inconclusive";
  let rationale: string;

  if (reach < MIN_REACH_FLOOR || engagements <= 0) {
    verdict = "insufficient-data";
    confidence = "inconclusive";
    rationale = `Only ${r0(reach).toLocaleString("en-AU")} organic reach so far — too little signal to judge whether this post is worth boosting. Let it run organically until it clears ~${MIN_REACH_FLOOR} reach, then re-check.`;
  } else {
    confidence = rateConfidence(engagements, reach, model.engagementBenchmark);
    if (confidence === "above") {
      verdict = "worth-boosting";
      rationale = `This post is resonating: ${pct(engagementRate)} organic engagement is confidently above the ~${pct(model.engagementBenchmark)} ${platformLabel} benchmark. Boosting amplifies a proven winner — an estimated +${r0(incrementalReach).toLocaleString("en-AU")} reach for ${`$${r0(budget)}`}.`;
    } else if (confidence === "below") {
      verdict = "improve-organic-first";
      rationale = `Organic engagement (${pct(engagementRate)}) is confidently below the ~${pct(model.engagementBenchmark)} ${platformLabel} benchmark, so paying to show it to more people likely just buys cheap reach with weak response. Strengthen the hook/offer and test organically before spending.`;
    } else {
      verdict = "improve-organic-first";
      rationale = `Engagement (${pct(engagementRate)}) isn't confidently above the ~${pct(model.engagementBenchmark)} ${platformLabel} benchmark yet — the sample can't tell a winner from average. Gather more organic reach (or pick a stronger post) before boosting.`;
    }
  }

  return {
    platform: post.platform,
    cpmUsed, cpmSource,
    organicReach: reach,
    engagementRate, engagementRateRange,
    benchmark: model.engagementBenchmark,
    budget,
    paidImpressions, incrementalReach, incrementalReachRange,
    totalProjectedReach, reachMultiple, costPer1kIncrementalReach,
    projectedAddedEngagements, projectedAddedEngagementsRange,
    verdict, confidence, rationale, safety: SAFETY,
  };
}
