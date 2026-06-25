import { describe, it, expect } from "vitest";
import { analyse } from "@/lib/engine";

// Meta-reported ROAS (purchase_roas) reconciliation. It is surfaced beside the derived
// revenue/spend ROAS as an attribution-window cross-check and must NEVER change the derived
// value or any health score.
const cfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as any;

describe("analyse — Meta-reported ROAS reconciliation", () => {
  it("spend-weights purchase_roas across rows and exposes summary.roas_meta", () => {
    const rows = [
      { platform: "meta", campaign_name: "A", spend: 100, clicks: 50, impressions: 1000, reach: 800, purchases: 5, revenue: 250, roas_meta: 3.0, tracking_status: "ok" },
      { platform: "meta", campaign_name: "B", spend: 300, clicks: 60, impressions: 2000, reach: 1500, purchases: 9, revenue: 600, roas_meta: 5.0, tracking_status: "ok" },
    ];
    const r = analyse(rows as any, cfg);
    // spend-weighted: (3*100 + 5*300) / 400 = 1800/400 = 4.5
    expect(r.summary.roas_meta).toBeCloseTo(4.5, 6);
    // derived ROAS (revenue/spend = 850/400 = 2.125) is independent and unchanged.
    expect(r.summary.roas).toBeCloseTo(2.125, 6);
  });

  it("is null when no row reports purchase_roas (lead-gen / TikTok)", () => {
    const rows = [{ platform: "meta", campaign_name: "A", spend: 100, clicks: 50, impressions: 1000, reach: 800, leads: 3, tracking_status: "ok" }];
    const r = analyse(rows as any, cfg);
    expect(r.summary.roas_meta).toBeNull();
  });

  it("ignores rows with zero spend or non-positive roas_meta", () => {
    const rows = [
      { platform: "meta", campaign_name: "A", spend: 0, purchases: 1, revenue: 10, roas_meta: 9, tracking_status: "ok" },
      { platform: "meta", campaign_name: "B", spend: 200, purchases: 4, revenue: 800, roas_meta: 4, tracking_status: "ok" },
    ];
    const r = analyse(rows as any, cfg);
    expect(r.summary.roas_meta).toBeCloseTo(4.0, 6); // only the spend>0 & roas_meta>0 row counts
  });
});
