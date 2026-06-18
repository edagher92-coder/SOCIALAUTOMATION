import { describe, it, expect } from "vitest";
import { metaGenderAgeToRows, shareMapToNamed, onlineToHourly } from "./parse";

describe("audience parsers (live demographic payloads → AudienceInsights shapes)", () => {
  it("metaGenderAgeToRows: gender×age counts → % rows that sum to ~100", () => {
    const rows = metaGenderAgeToRows({ "F.18-24": 30, "M.18-24": 20, "F.25-34": 25, "M.25-34": 25 });
    expect(rows).toEqual([
      { bracket: "18-24", female: 30, male: 20 },
      { bracket: "25-34", female: 25, male: 25 },
    ]);
    const total = rows.reduce((s, r) => s + r.female + r.male, 0);
    expect(Math.round(total)).toBe(100);
  });

  it("metaGenderAgeToRows: splits unknown-gender (U.*) evenly and skips empty brackets", () => {
    const rows = metaGenderAgeToRows({ "U.25-34": 100 });
    expect(rows).toEqual([{ bracket: "25-34", female: 50, male: 50 }]);
  });

  it("shareMapToNamed: count map → top-N shares, descending", () => {
    const out = shareMapToNamed({ AU: 60, NZ: 30, US: 10 });
    expect(out[0]).toEqual({ name: "AU", share: 60 });
    expect(out.map((x) => x.name)).toEqual(["AU", "NZ", "US"]);
    expect(out.reduce((s, x) => s + x.share, 0)).toBeCloseTo(100, 1);
  });

  it("onlineToHourly: normalises to a 24-length 0–100 curve peaking at the busiest hour", () => {
    const arr = Array.from({ length: 24 }, (_, h) => (h === 20 ? 50 : h === 8 ? 25 : 0));
    const out = onlineToHourly(arr);
    expect(out).toHaveLength(24);
    expect(out[20]).toBe(100); // peak
    expect(out[8]).toBe(50); // half of peak
    expect(Math.max(...out)).toBe(100);
  });

  it("empty / missing payloads degrade safely (no throw, no NaN)", () => {
    expect(metaGenderAgeToRows({})).toEqual([]);
    expect(shareMapToNamed({})).toEqual([]);
    expect(onlineToHourly({})).toEqual(Array.from({ length: 24 }, () => 0));
  });
});
