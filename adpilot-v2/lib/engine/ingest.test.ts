// Ingest + schema: platform detection, CSV parsing (quotes/blank rows), column
// mapping + computed metrics, and toNum cleaning. Fixtures are inline string
// literals (no external CSV files).
import { describe, it, expect } from "vitest";
import { parseCsvText } from "./ingest";
import { detectPlatform, parseCSV, toNum } from "./schema";

describe("detectPlatform", () => {
  it("a Meta header => 'meta'", () => {
    expect(detectPlatform(["Campaign name", "Ad set name", "Amount spent (AUD)", "Impressions"])).toBe("meta");
    expect(detectPlatform(["Campaign name", "ThruPlays"])).toBe("meta");
  });

  it("a TikTok header => 'tiktok'", () => {
    expect(detectPlatform(["Campaign name", "Ad group name", "Cost", "Impressions"])).toBe("tiktok");
    expect(detectPlatform(["Cost"])).toBe("tiktok");
  });

  it("an unrecognised header => 'universal'", () => {
    expect(detectPlatform(["campaign_name", "spend", "impressions"])).toBe("universal");
  });
});

describe("toNum", () => {
  it("strips $ , and % symbols", () => {
    expect(toNum("$1,234.50")).toBe(1234.5);
    expect(toNum("1,000")).toBe(1000);
    expect(toNum("1.50%")).toBe(1.5);
  });

  it("treats N/A, '-', and '' as null", () => {
    expect(toNum("N/A")).toBeNull();
    expect(toNum("n/a")).toBeNull();
    expect(toNum("NA")).toBeNull();
    expect(toNum("-")).toBeNull();
    expect(toNum("")).toBeNull();
    expect(toNum(null)).toBeNull();
    expect(toNum(undefined)).toBeNull();
  });

  it("returns null for non-numeric junk and a number for clean values", () => {
    expect(toNum("abc")).toBeNull();
    expect(toNum("42")).toBe(42);
    expect(toNum(42)).toBe(42);
  });
});

describe("parseCSV", () => {
  it("handles quoted fields containing commas", () => {
    const grid = parseCSV(`a,b,c\n"hello, world",2,3`);
    expect(grid[0]).toEqual(["a", "b", "c"]);
    expect(grid[1]).toEqual(["hello, world", "2", "3"]);
  });

  it("handles escaped double-quotes inside a quoted field", () => {
    const grid = parseCSV(`name\n"say ""hi"""`);
    expect(grid[1]).toEqual([`say "hi"`]);
  });

  it("drops fully blank rows", () => {
    const grid = parseCSV(`a,b\n1,2\n\n3,4\n`);
    expect(grid.length).toBe(3); // header + 2 data rows, blank line dropped
    expect(grid[1]).toEqual(["1", "2"]);
    expect(grid[2]).toEqual(["3", "4"]);
  });

  it("handles \\r\\n line endings", () => {
    const grid = parseCSV("a,b\r\n1,2\r\n");
    expect(grid[0]).toEqual(["a", "b"]);
    expect(grid[1]).toEqual(["1", "2"]);
  });
});

describe("parseCsvText — maps known columns + computes metrics", () => {
  const meta = `Campaign name,Amount spent (AUD),Impressions,Reach,Link clicks,Purchases,Purchases conversion value
exampleco_hotwater_leads_brisbane_20260601,2100,280000,160000,4200,118,9639`;

  it("maps Meta columns to the universal schema and tags the platform", () => {
    const rows = parseCsvText(meta);
    expect(rows.length).toBe(1);
    const r = rows[0];
    expect(r.platform).toBe("meta");
    expect(r.campaign_name).toBe("exampleco_hotwater_leads_brisbane_20260601");
    expect(r.spend).toBe(2100);
    expect(r.impressions).toBe(280000);
    expect(r.clicks).toBe(4200);
    expect(r.purchases).toBe(118);
    expect(r.revenue).toBe(9639);
  });

  it("computes ctr / cpc / roas from the mapped numbers", () => {
    const r = parseCsvText(meta)[0];
    // ctr = 4200/280000 = 0.015
    expect(r.ctr).toBeCloseTo(0.015, 6);
    // cpc = 2100/4200 = 0.5
    expect(r.cpc).toBeCloseTo(0.5, 6);
    // roas = 9639/2100 = 4.59
    expect(r.roas).toBeCloseTo(4.59, 2);
  });

  it("detects and maps a TikTok header (Ad group name + Cost)", () => {
    const tt = `Campaign name,Ad group name,Cost,Impressions,Clicks,Conversions,Total conversion value
promo_tiktok,adgroup1,500,50000,1000,40,3000`;
    const r = parseCsvText(tt)[0];
    expect(r.platform).toBe("tiktok");
    expect(r.spend).toBe(500);
    expect(r.clicks).toBe(1000);
    expect(r.purchases).toBe(40);
    expect(r.revenue).toBe(3000);
    expect(r.roas).toBeCloseTo(6, 6);
  });

  it("returns [] for empty input", () => {
    expect(parseCsvText("")).toEqual([]);
  });
});
