import { describe, it, expect } from "vitest";
import { capKey, dailyCap, withinCap, checkPublishCap } from "./rate-limits";

describe("publish rate-limits", () => {
  it("buckets Instagram Reels separately from the feed", () => {
    expect(capKey("instagram", "reel")).toBe("instagram_reel");
    expect(capKey("instagram", "image")).toBe("instagram");
    expect(capKey("instagram", "video")).toBe("instagram");
    expect(capKey("facebook", "image")).toBe("facebook");
    expect(capKey("tiktok", "video")).toBe("tiktok");
  });

  it("applies conservative per-bucket daily caps (Reels < feed)", () => {
    expect(dailyCap("instagram", "reel")).toBe(25);
    expect(dailyCap("instagram", "image")).toBe(50);
    expect(dailyCap("facebook")).toBe(50);
    expect(dailyCap("tiktok")).toBe(15);
    expect(dailyCap("unknown")).toBe(50); // safe default
  });

  it("allows up to the cap and blocks at/over it", () => {
    expect(withinCap(0, "tiktok")).toBe(true);
    expect(withinCap(14, "tiktok")).toBe(true);
    expect(withinCap(15, "tiktok")).toBe(false); // at cap
    expect(withinCap(40, "instagram", "reel")).toBe(false);
    expect(withinCap(24, "instagram", "reel")).toBe(true);
  });

  it("checkPublishCap counts the bucket via the supabase client and decides", async () => {
    // Minimal fake supabase query builder that records filters and returns a fixed count.
    const calls: any = {};
    const makeQ = (count: number) => {
      const q: any = {};
      for (const m of ["select", "eq", "gte", "in"]) q[m] = (...a: any[]) => { (calls[m] ||= []).push(a); return q; };
      q.then = (res: any) => res({ count }); // awaiting the builder resolves to { count }
      return q;
    };
    const admin = { from: () => makeQ(15) };
    const r = await checkPublishCap(admin, "org-1", "tiktok", "video");
    expect(r).toEqual({ allowed: false, used: 15, cap: 15 });

    const admin2 = { from: () => makeQ(3) };
    const r2 = await checkPublishCap(admin2, "org-1", "instagram", "reel");
    expect(r2).toEqual({ allowed: true, used: 3, cap: 25 });
  });
});
