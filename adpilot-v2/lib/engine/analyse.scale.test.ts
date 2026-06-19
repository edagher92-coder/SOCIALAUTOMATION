import { describe, it, expect } from "vitest";
import { analyse } from "./index";

// Integration guard for the per-campaign scale gate. Before this wiring, analyse() called
// decide() with no health/ctrPeak, so the "scale" verdict was UNREACHABLE in production
// (only branch-level unit tests, which pass health explicitly, ever saw it). These tests assert
// the real one-call path can both emit scale for a healthy, statistically-significant winner and
// withhold it when the win isn't yet significant.
const cfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as const; // break-even CPA = $120

describe("analyse() — per-campaign scale gate", () => {
  it("emits 'scale' for a healthy campaign whose win is statistically significant", () => {
    const rows = [{
      campaign_name: "winners_scale_brisbane_20260601", platform: "meta",
      spend: 1000, impressions: 100000, reach: 50000, clicks: 2000,
      leads: 0, purchases: 60, revenue: 12000, ctr: 0.02, frequency: 2, tracking_status: "ok",
    }];
    const r = analyse(rows as any, { ...cfg });
    expect(r.health.total).toBeGreaterThanOrEqual(70); // its own campaign is healthy
    expect(r.decisions[0].verdict).toBe("scale");
    expect(r.decisions[0].safe).toBe(true); // read-only invariant holds
  });

  it("does NOT scale a profitable-but-not-yet-significant winner (Wilson gate holds)", () => {
    const rows = [{
      campaign_name: "small_test_brisbane_20260601", platform: "meta",
      spend: 120, impressions: 8000, reach: 6000, clicks: 60,
      leads: 0, purchases: 1, revenue: 200, ctr: 0.0075, frequency: 1.33, tracking_status: "ok",
    }];
    const r = analyse(rows as any, { ...cfg });
    expect(r.decisions[0].verdict).not.toBe("scale");
    expect(r.decisions[0].verdict).toBe("keep");
  });

  it("scales a strong campaign even when a separate broken campaign drags the ACCOUNT down (per-campaign, not account-wide)", () => {
    const winner = {
      campaign_name: "winners_scale_brisbane_20260601", platform: "meta",
      spend: 1000, impressions: 100000, reach: 50000, clicks: 2000,
      leads: 0, purchases: 60, revenue: 12000, ctr: 0.02, frequency: 2, tracking_status: "ok",
    };
    const disaster = {
      campaign_name: "broken_promo_national_20260601", platform: "meta",
      spend: 8000, impressions: 400000, reach: 120000, clicks: 1200,
      leads: 0, purchases: 0, revenue: 0, ctr: 0.003, frequency: 3.3, tracking_status: "broken",
    };
    const r = analyse([winner, disaster] as any, { ...cfg });
    const winnerDecision = r.decisions.find((d) => d.name === "winners_scale_brisbane_20260601");
    expect(winnerDecision?.verdict).toBe("scale"); // gated on the winner's own campaign health
  });
});
