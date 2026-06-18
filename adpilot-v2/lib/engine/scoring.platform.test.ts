import { describe, it, expect } from "vitest";
import { scoreAccount } from "./audit";

const cfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as const;

// Parity-coordinated scoring changes (mirrored in CPWORK .../audit.py + docs/engine.js):
//  - cpc is now a real signal (spend ÷ clicks), not a CTR proxy.
//  - CTR is judged on a TikTok-specific curve when the whole set is TikTok (Meta/mixed unchanged).
describe("cpc factor — real spend/clicks signal", () => {
  it("scores a $1.00 CPC at 85 (≤$1 band)", () => {
    const rows = [{ platform: "meta", campaign_name: "x", spend: 1000, impressions: 60000, reach: 30000, clicks: 1000, leads: 0, purchases: 20, revenue: 5000, tracking_status: "ok" }];
    const r = scoreAccount(rows as any, { ...cfg });
    expect(r.breakdown.cpc.score).toBe(85);
  });
  it("scores an expensive $3.33 CPC at 40 (≤$4 band)", () => {
    const rows = [{ platform: "meta", campaign_name: "x", spend: 3000, impressions: 150000, reach: 80000, clicks: 900, leads: 0, purchases: 10, revenue: 1500, tracking_status: "ok" }];
    const r = scoreAccount(rows as any, { ...cfg });
    expect(r.breakdown.cpc.score).toBe(40);
  });
});

describe("ctr factor — TikTok-aware benchmark", () => {
  // Identical 0.7% CTR (700 clicks / 100,000 impressions) scored on each platform's curve.
  const mk = (platform: string) => [{ platform, campaign_name: "x", spend: 500, impressions: 100000, reach: 60000, clicks: 700, leads: 0, purchases: 10, revenue: 2000, tracking_status: "ok" }];
  it("a TikTok-only set scores 0.7% CTR higher than Meta (TikTok norms are lower)", () => {
    const meta = scoreAccount(mk("meta") as any, { ...cfg });
    const tiktok = scoreAccount(mk("tiktok") as any, { ...cfg });
    expect(meta.breakdown.ctr.score).toBe(42); // unchanged Meta curve: 0.7% → 42
    expect(tiktok.breakdown.ctr.score).toBeCloseTo(59.29, 1); // TikTok curve: 0.7% → ~59
    expect(tiktok.breakdown.ctr.score as number).toBeGreaterThan(meta.breakdown.ctr.score as number);
  });
  it("a mixed Meta+TikTok set keeps the unchanged Meta curve (no platform applied)", () => {
    const rows = [
      { platform: "meta", campaign_name: "x", spend: 250, impressions: 50000, reach: 30000, clicks: 350, purchases: 5, revenue: 1000, tracking_status: "ok" },
      { platform: "tiktok", campaign_name: "x", spend: 250, impressions: 50000, reach: 30000, clicks: 350, purchases: 5, revenue: 1000, tracking_status: "ok" },
    ];
    const r = scoreAccount(rows as any, { ...cfg });
    expect(r.breakdown.ctr.score).toBe(42); // 0.7% agg → Meta/default curve
  });
});
