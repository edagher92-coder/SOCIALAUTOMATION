import { describe, it, expect } from "vitest";
import { slug, toDateStamp, buildNames, buildTaggedUrl, validate } from "./utm";

// ---------------------------------------------------------------------------
// Pure unit tests for the UTM / naming-convention builder. No AI, no DB.
// ---------------------------------------------------------------------------

describe("slug", () => {
  it("lowercases, trims and replaces spaces with underscores", () => {
    expect(slug("  Hello World ")).toBe("hello_world");
  });
  it("collapses runs of non-alphanumerics to a single underscore", () => {
    expect(slug("Spring  Sale -- 2026!!")).toBe("spring_sale_2026");
  });
  it("strips diacritics", () => {
    expect(slug("Café Brûlée")).toBe("cafe_brulee");
  });
  it("trims leading/trailing underscores", () => {
    expect(slug("__weird__name__")).toBe("weird_name");
  });
  it("returns empty for empty/nullish input", () => {
    expect(slug("")).toBe("");
    expect(slug(undefined)).toBe("");
    expect(slug(null)).toBe("");
  });
});

describe("toDateStamp", () => {
  it("passes through an existing YYYYMMDD", () => {
    expect(toDateStamp("20260616")).toBe("20260616");
  });
  it("normalises an ISO date to YYYYMMDD (UTC)", () => {
    expect(toDateStamp("2026-06-16")).toBe("20260616");
  });
  it("falls back to today for empty input", () => {
    expect(toDateStamp("")).toMatch(/^\d{8}$/);
    expect(toDateStamp(undefined)).toMatch(/^\d{8}$/);
  });
  it("falls back to today for an invalid date", () => {
    expect(toDateStamp("not-a-date")).toMatch(/^\d{8}$/);
  });
});

describe("buildNames", () => {
  it("builds all three names to the standard, slugged and lowercase", () => {
    const out = buildNames({
      business: "Bright Plumbing",
      offer: "$0 Quote",
      objective: "Leads",
      location: "Brisbane QLD",
      date: "2026-06-16",
      audience: "Homeowners 35-60",
      placement: "Feed",
      optimisation: "Conversations",
      angle: "Pain Point",
      format: "UGC Video",
      version: "v1",
    });
    expect(out.campaign).toBe("bright_plumbing_0_quote_leads_brisbane_qld_20260616");
    expect(out.adSet).toBe("homeowners_35_60_feed_conversations");
    expect(out.ad).toBe("pain_point_ugc_video_v1");
  });
  it("never contains spaces or uppercase", () => {
    const out = buildNames({ business: "ACME Co", offer: "MEGA SALE", objective: "Sales", location: "Sydney", audience: "Cold", placement: "Reels", optimisation: "Purchase", angle: "Hook", format: "Static", version: "A" });
    for (const v of Object.values(out)) {
      expect(v).not.toMatch(/\s/);
      expect(v).toBe(v.toLowerCase());
    }
  });
  it("drops missing parts without leaving dangling separators", () => {
    const out = buildNames({ business: "Bright", objective: "Leads", date: "20260616" });
    expect(out.campaign).toBe("bright_leads_20260616");
    expect(out.adSet).toBe("");
    expect(out.ad).toBe("");
  });
});

describe("buildTaggedUrl", () => {
  it("appends slugged utm params and lowercases source/medium", () => {
    const url = buildTaggedUrl({ url: "https://example.com/landing", source: "Facebook", medium: "Paid Social", campaign: "Spring Sale" });
    expect(url).toBe("https://example.com/landing?utm_source=facebook&utm_medium=paid_social&utm_campaign=spring_sale");
  });
  it("uses & when a query string is already present", () => {
    const url = buildTaggedUrl({ url: "https://example.com/?ref=x", source: "meta", medium: "cpc", campaign: "promo" });
    expect(url).toContain("https://example.com/?ref=x&utm_source=meta");
  });
  it("omits empty optional content/term params", () => {
    const url = buildTaggedUrl({ url: "https://example.com", source: "tiktok", medium: "cpc", campaign: "promo" });
    expect(url).not.toContain("utm_content");
    expect(url).not.toContain("utm_term");
  });
  it("includes content and term when provided", () => {
    const url = buildTaggedUrl({ url: "https://example.com", source: "tiktok", medium: "cpc", campaign: "promo", content: "Ad One", term: "Hot Water" });
    expect(url).toContain("utm_content=ad_one");
    expect(url).toContain("utm_term=hot_water");
  });
  it("preserves the fragment after the query string", () => {
    const url = buildTaggedUrl({ url: "https://example.com/page#section", source: "meta", medium: "cpc", campaign: "promo" });
    expect(url.endsWith("#section")).toBe(true);
    expect(url).toContain("utm_campaign=promo");
  });
  it("returns empty string for empty url", () => {
    expect(buildTaggedUrl({ url: "", source: "meta", medium: "cpc", campaign: "promo" })).toBe("");
  });
});

describe("validate", () => {
  it("returns no issues for a clean, conventional campaign name", () => {
    expect(validate("bright_plumbing_quote_leads_brisbane_20260616", "campaign")).toEqual([]);
  });
  it("flags spaces", () => {
    const issues = validate("bright plumbing leads");
    expect(issues.some((i) => /space/i.test(i.issue))).toBe(true);
  });
  it("flags uppercase", () => {
    const issues = validate("Bright_Plumbing_Leads");
    expect(issues.some((i) => /uppercase/i.test(i.issue))).toBe(true);
  });
  it("flags invalid characters", () => {
    const issues = validate("bright-plumbing!leads");
    expect(issues.some((i) => /invalid character/i.test(i.issue))).toBe(true);
  });
  it("flags an empty name and short-circuits", () => {
    const issues = validate("   ");
    expect(issues).toHaveLength(1);
    expect(issues[0].issue).toMatch(/empty/i);
  });
  it("flags a campaign name with too few fields", () => {
    const issues = validate("bright_leads", "campaign");
    expect(issues.some((i) => /missing fields/i.test(i.issue))).toBe(true);
  });
  it("flags an ad-set name with too few fields", () => {
    const issues = validate("cold_feed", "adSet");
    expect(issues.some((i) => /missing fields/i.test(i.issue) && /ad set/i.test(i.issue))).toBe(true);
  });
  it("does not check field count when kind is omitted", () => {
    expect(validate("just_two")).toEqual([]);
  });
});
