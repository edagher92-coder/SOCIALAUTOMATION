import { describe, it, expect } from "vitest";
import { analyseAccount } from "@/lib/organic/account";
import type { OrganicPostInput } from "@/lib/organic/types";

// A spread of posts: two proven winners (Meta + TikTok), one below-benchmark, one tiny-sample,
// one below the reach floor. The account engine should rank winners by impact and hold the rest.
const POSTS: OrganicPostInput[] = [
  { platform: "meta", name: "Meta winner", reach: 5000, impressions: 12000, engagements: 150 },   // 3% > 2% → worth-boosting
  { platform: "tiktok", name: "TikTok winner", reach: 8000, impressions: 20000, engagements: 480 }, // 6% > 4.5% → worth-boosting
  { platform: "meta", name: "Weak", reach: 4000, impressions: 9000, engagements: 24 },             // 0.6% → below → hold
  { platform: "meta", name: "Small", reach: 300, impressions: 600, engagements: 9 },               // inconclusive → hold
  { platform: "meta", name: "Tiny", reach: 100, impressions: 200, engagements: 8 },                // < floor → hold
];

const CPM = { meta: 10, tiktok: 10 };

describe("analyseAccount", () => {
  const a = analyseAccount(POSTS, CPM, { budgetPerPost: 100 });

  it("summarises totals and per-platform splits", () => {
    expect(a.summary.posts).toBe(5);
    expect(a.summary.totalReach).toBe(17400);
    expect(a.summary.byPlatform.find((p) => p.platform === "tiktok")?.posts).toBe(1);
    expect(a.summary.byPlatform.find((p) => p.platform === "meta")?.posts).toBe(4);
  });

  it("recommends only the proven winners, ranked by projected impact", () => {
    expect(a.recommendations).toHaveLength(2);
    // TikTok winner has the higher engagement rate → more projected engagements → rank 1.
    expect(a.recommendations[0].post.name).toBe("TikTok winner");
    expect(a.recommendations[0].rank).toBe(1);
    expect(a.recommendations[1].rank).toBe(2);
    expect(a.recommendations.every((r) => r.projection.verdict === "worth-boosting")).toBe(true);
  });

  it("holds everything that isn't boost-ready, each tagged with its reason", () => {
    expect(a.hold).toHaveLength(3);
    expect(a.hold.map((h) => h.post.name)).toEqual(expect.arrayContaining(["Weak", "Small", "Tiny"]));
    // "Weak" (0.6% over 4,000 reach) is CONFIDENTLY below benchmark; "Small"/"Tiny" are thin samples.
    expect(a.hold.find((h) => h.post.name === "Weak")?.reason).toBe("below-benchmark");
    expect(a.hold.find((h) => h.post.name === "Small")?.reason).toBe("needs-more-data");
    expect(a.hold.find((h) => h.post.name === "Tiny")?.reason).toBe("needs-more-data");
  });

  it("totals the recommended budget and projected added reach", () => {
    expect(a.totalRecommendedBudget).toBe(200); // 2 winners × $100
    expect(a.projectedAddedReach).toBeGreaterThan(0);
    expect(a.projectedAddedEngagements).toBeGreaterThan(0);
  });

  it("produces non-empty expectations and explanations", () => {
    expect(a.expectations.length).toBeGreaterThan(0);
    expect(a.explanations.length).toBeGreaterThan(0);
    expect(a.expectations.join(" ")).toMatch(/boost-ready/i);
  });

  it("recommends nothing (holds spend) when no post clears the gate", () => {
    const weakOnly = analyseAccount(
      [{ platform: "meta", name: "w", reach: 4000, impressions: 9000, engagements: 24 }],
      CPM,
    );
    expect(weakOnly.recommendations).toHaveLength(0);
    expect(weakOnly.expectations.join(" ")).toMatch(/nothing is boost-ready/i);
  });
});
