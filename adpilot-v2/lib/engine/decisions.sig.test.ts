// V6 — Wilson significance gate on the two aggressive verdicts. The gate only ever makes a
// proposal SAFER: scale needs a statistically confident win; kill (>1.5x break-even) needs a
// statistically confident loss, otherwise it softens to reduce. Point-estimate verdicts (keep,
// reduce, refresh, fix-tracking, insufficient-data) are unchanged.
import { describe, it, expect } from "vitest";
import { decide } from "./decisions";
import type { Cfg, Row } from "./types";

const cfg: Cfg = { average_sale_value: 200, gross_margin: 0.6 }; // break-even CPA = 120

describe("decisions — significance gate", () => {
  it("scales a confident winner (large sample, CPA well under break-even)", () => {
    // cpc=2.5, break-even rate=cpc/be=0.0208; actual rate 0.05 over 400 clicks → confidently above.
    const row: Row = { spend: 1000, clicks: 400, purchases: 20, revenue: 6000, impressions: 50000, reach: 25000, tracking_status: "ok" };
    expect(decide(row, cfg, undefined, 88).verdict).toBe("scale");
  });

  it("does NOT scale a winner whose sample is too thin to be significant (keeps instead)", () => {
    // Same CPA (50) and great health, but only 3 purchases over 60 clicks → CI straddles target.
    const row: Row = { spend: 150, clicks: 60, purchases: 3, revenue: 900, impressions: 8000, reach: 5000, tracking_status: "ok" };
    const d = decide(row, cfg, undefined, 90);
    expect(d.verdict).toBe("keep");
    expect(d.reason.toLowerCase()).toContain("statistically significant");
  });

  it("kills a confident loser (large sample, CPA far above break-even)", () => {
    // cpc=15, break-even rate 0.125; actual 0.05 over 400 clicks → confidently below.
    const row: Row = { spend: 6000, clicks: 400, purchases: 20, revenue: 1000, impressions: 50000, reach: 25000, tracking_status: "ok" };
    expect(decide(row, cfg, undefined, 50).verdict).toBe("kill");
  });

  it("softens a high-CPA loser to reduce when the loss isn't yet statistically confident", () => {
    // CPA = 200 (>1.5x BE = 180), break-even rate = cpc/be = 10/120 ≈ 0.083. Only 3 purchases over
    // 60 clicks → Wilson interval [~0.017, ~0.137] straddles the target, so it's not a confident loss.
    const row: Row = { spend: 600, clicks: 60, purchases: 3, revenue: 200, impressions: 8000, reach: 5000, tracking_status: "ok" };
    const d = decide(row, cfg, undefined, 45);
    expect(d.verdict).toBe("reduce");
    expect(d.proposal.toLowerCase()).not.toContain("delete");
    expect(d.safe).toBe(true);
  });
});
