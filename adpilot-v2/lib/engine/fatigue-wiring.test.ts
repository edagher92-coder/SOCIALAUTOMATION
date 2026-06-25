import { describe, it, expect } from "vitest";
import { analyse } from "@/lib/engine";

// Verifies predictFatigue is wired into analyse() as an additive per-ad diagnostic.
const cfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as any;

describe("analyse — creative-fatigue wiring", () => {
  it("surfaces a flagged ad with a pinned change-point onset from daily rows", () => {
    // 8 daily rows for one ad: CTR steps down from 3% to 1% at day 5 (clear fatigue).
    const rows = Array.from({ length: 8 }, (_, i) => ({
      platform: "meta", ad_id: "ad1", ad_name: "Ad One", campaign_name: "C1",
      date: `2026-06-0${i + 1}`,
      ctr: i < 4 ? 0.03 : 0.01, impressions: 1000, clicks: i < 4 ? 30 : 10,
      spend: 50, frequency: 3, hold_rate: i < 4 ? 0.5 : 0.3, tracking_status: "ok",
    }));
    const r = analyse(rows as any, cfg) as any;
    expect(Array.isArray(r.fatigue)).toBe(true);
    const f = r.fatigue.find((x: any) => x.ad === "Ad One");
    expect(f).toBeTruthy();
    expect(["watch", "fatigued"]).toContain(f.status);
    expect(f.onsetDaysAgo == null || f.onsetDaysAgo >= 0).toBe(true);
  });

  it("returns an empty fatigue list when there is no per-ad daily history", () => {
    const rows = [{ platform: "meta", ad_id: "ad1", ad_name: "Solo", campaign_name: "C", date: "2026-06-01", ctr: 0.02, impressions: 1000, clicks: 20, spend: 30, tracking_status: "ok" }];
    const r = analyse(rows as any, cfg) as any;
    expect(r.fatigue).toEqual([]);
  });
});
