// Account-level organic analysis — the whole-account counterpart to projectBoost. Pure, no I/O,
// browser-safe and unit-tested. Takes the org's organic posts + its real CPM per platform and
// produces: a summary, a ranked list of boost-worthy winners (significance-gated by the per-post
// engine), a "hold / improve organically first" list, plus deterministic expectations and
// plain-English explanations. Numbers-first, estimates not guarantees, read-only.
import { projectBoost, type OrganicPlatform } from "./boost";
import type { CpmByPlatform } from "./cpm";
import type {
  OrganicPostInput, OrganicSummary, PlatformSummary, BoostRecommendation,
  AccountOrganicAnalysis, AccountAnalysisOptions,
} from "./types";

const DEFAULT_BUDGET = 100;
const PLATFORMS: OrganicPlatform[] = ["meta", "tiktok"];
const platformLabel = (p: OrganicPlatform) => (p === "tiktok" ? "TikTok" : "Meta");

const nonNeg = (n: number | null | undefined) => (Number.isFinite(n) && (n as number) > 0 ? (n as number) : 0);
const r0 = (n: number) => Math.max(0, Math.round(n));
const enAU = (n: number) => r0(n).toLocaleString("en-AU");
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

const SAFETY =
  "Read-only analysis — estimates, not guarantees. No post was boosted or charged. You approve any spend in Ads Manager.";

function summarise(posts: OrganicPostInput[]): OrganicSummary {
  let totalReach = 0, totalImpressions = 0, totalEngagements = 0;
  const buckets = new Map<OrganicPlatform, { posts: number; reach: number; impressions: number; engagements: number }>();
  for (const p of posts) {
    const reach = nonNeg(p.reach), impr = nonNeg(p.impressions), eng = nonNeg(p.engagements);
    totalReach += reach; totalImpressions += impr; totalEngagements += eng;
    const b = buckets.get(p.platform) ?? { posts: 0, reach: 0, impressions: 0, engagements: 0 };
    b.posts += 1; b.reach += reach; b.impressions += impr; b.engagements += eng;
    buckets.set(p.platform, b);
  }
  const byPlatform: PlatformSummary[] = PLATFORMS
    .filter((pl) => buckets.has(pl))
    .map((pl) => {
      const b = buckets.get(pl)!;
      return { platform: pl, posts: b.posts, reach: b.reach, impressions: b.impressions, engagements: b.engagements,
        engagementRate: b.reach > 0 ? b.engagements / b.reach : 0 };
    });
  return {
    posts: posts.length, totalReach, totalImpressions, totalEngagements,
    avgEngagementRate: totalReach > 0 ? totalEngagements / totalReach : 0,
    byPlatform,
  };
}

export function analyseAccount(
  posts: OrganicPostInput[],
  cpm: CpmByPlatform,
  opts: AccountAnalysisOptions = {},
): AccountOrganicAnalysis {
  const budget = opts.budgetPerPost && opts.budgetPerPost > 0 ? opts.budgetPerPost : DEFAULT_BUDGET;
  const clean = (posts || []).filter((p) => p && (p.platform === "meta" || p.platform === "tiktok"));
  const summary = summarise(clean);

  // Project every post, then split winners (worth-boosting) from holds.
  const projected = clean.map((post) => ({
    post,
    recommendedBudget: budget,
    projection: projectBoost({ post, budget, cpm: cpm?.[post.platform] ?? null }),
  }));

  const winners = projected.filter((x) => x.projection.verdict === "worth-boosting");
  const holds = projected.filter((x) => x.projection.verdict !== "worth-boosting");

  // Rank winners by projected impact (added engagements), strongest first.
  winners.sort((a, b) => b.projection.projectedAddedEngagements - a.projection.projectedAddedEngagements);
  const cap = opts.maxRecommended && opts.maxRecommended > 0 ? opts.maxRecommended : winners.length;
  const recommendations: BoostRecommendation[] = winners.slice(0, cap).map((x, i) => ({ ...x, rank: i + 1 }));

  const totalRecommendedBudget = recommendations.reduce((s, r) => s + r.recommendedBudget, 0);
  const projectedAddedReach = recommendations.reduce((s, r) => s + r.projection.incrementalReach, 0);
  const projectedAddedEngagements = recommendations.reduce((s, r) => s + r.projection.projectedAddedEngagements, 0);

  // --- Deterministic expectations (numbers-first) ---
  const expectations: string[] = [];
  if (recommendations.length > 0) {
    expectations.push(
      `Boost your ${recommendations.length} boost-ready ${recommendations.length === 1 ? "post" : "posts"} at $${r0(budget)} each (~$${enAU(totalRecommendedBudget)}) → an estimated +${enAU(projectedAddedReach)} reach and +${enAU(projectedAddedEngagements)} engagements.`,
    );
    const top = recommendations[0];
    expectations.push(
      `Your strongest candidate${top.post.name ? ` — "${top.post.name}"` : ` on ${platformLabel(top.post.platform)}`}: ${pct(top.projection.engagementRate)} organic engagement, projected +${enAU(top.projection.incrementalReach)} reach for $${r0(top.recommendedBudget)} (${`$${(Math.round(top.projection.costPer1kIncrementalReach * 100) / 100).toLocaleString("en-AU")}`}/1k reached).`,
    );
  } else {
    expectations.push("No posts clear the engagement benchmark with enough data yet — nothing is boost-ready, so hold your spend and keep testing organically.");
  }

  // --- Deterministic explanations (plain English) ---
  const explanations: string[] = [];
  explanations.push(
    `${clean.length} ${clean.length === 1 ? "post" : "posts"} analysed · ${enAU(summary.totalReach)} total organic reach · ${pct(summary.avgEngagementRate)} average engagement.`,
  );
  if (recommendations.length > 0) {
    explanations.push(
      `${recommendations.length} ${recommendations.length === 1 ? "post is" : "posts are"} resonating above benchmark with enough signal — boosting amplifies what's already working.`,
    );
  }
  const belowCount = holds.filter((h) => h.projection.confidence === "below").length;
  const thinCount = holds.length - belowCount;
  if (belowCount > 0) explanations.push(`${belowCount} ${belowCount === 1 ? "post is" : "posts are"} below benchmark — strengthen the hook/offer before paying to widen reach.`);
  if (thinCount > 0) explanations.push(`${thinCount} ${thinCount === 1 ? "post needs" : "posts need"} more organic reach before a confident call can be made.`);

  return {
    summary,
    recommendations,
    hold: holds.map((h) => h.post),
    expectations,
    explanations,
    totalRecommendedBudget,
    projectedAddedReach,
    projectedAddedEngagements,
    safety: SAFETY,
  };
}
