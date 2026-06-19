import { describe, it, expect } from "vitest";
import { cpmByPlatformFromRows } from "@/lib/organic/cpm";

describe("cpmByPlatformFromRows", () => {
  it("computes a spend-weighted CPM per platform", () => {
    const cpm = cpmByPlatformFromRows([
      { platform: "meta", spend: 100, impressions: 10000 },   // $10 CPM
      { platform: "meta", spend: 50, impressions: 10000 },    // blends -> (150 / 20000)*1000 = $7.50
      { platform: "tiktok", spend: 80, impressions: 8000 },   // $10 CPM
    ]);
    expect(cpm.meta).toBeCloseTo(7.5, 6);
    expect(cpm.tiktok).toBeCloseTo(10, 6);
  });

  it("returns null for a platform with no impressions (so the UI uses a benchmark)", () => {
    const cpm = cpmByPlatformFromRows([{ platform: "meta", spend: 0, impressions: 0 }]);
    expect(cpm.meta).toBeNull();
    expect(cpm.tiktok).toBeNull();
  });

  it("ignores unknown platforms and missing values", () => {
    const cpm = cpmByPlatformFromRows([
      { platform: "google", spend: 999, impressions: 999 } as any,
      { platform: "meta", spend: null, impressions: 5000 },
      { platform: "meta", spend: 60, impressions: 5000 },
    ]);
    // only the 60/10000 contributes a real spend -> (60/10000)*1000 = $6
    expect(cpm.meta).toBeCloseTo(6, 6);
    expect(cpm.tiktok).toBeNull();
  });
});
