import { describe, it, expect } from "vitest";
import { verdictMeta, bandMeta, cadenceText, VERDICT_META, BAND_META } from "./proposals";

describe("verdictMeta", () => {
  it("returns the mapped label for each known verdict", () => {
    expect(verdictMeta("fix-tracking").label).toBe("Fix tracking");
    expect(verdictMeta("kill").label).toBe("Kill");
    expect(verdictMeta("reduce").label).toBe("Reduce");
    expect(verdictMeta("refresh").label).toBe("Refresh");
    expect(verdictMeta("scale").label).toBe("Scale");
  });

  it("ranks verdicts in severity order fix-tracking < kill < reduce < refresh < scale", () => {
    const order = ["fix-tracking", "kill", "reduce", "refresh", "scale"];
    const ranks = order.map((v) => verdictMeta(v).rank);
    expect(ranks).toEqual([0, 1, 2, 3, 4]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i - 1]).toBeLessThan(ranks[i]);
    }
  });

  it("returns a fallback for an unknown verdict (label echoes input, rank 9)", () => {
    const meta = verdictMeta("mystery");
    expect(meta.label).toBe("mystery");
    expect(meta.emoji).toBe("•");
    expect(meta.cls).toBe("text-muted");
    expect(meta.rank).toBe(9);
  });

  it("the unknown fallback rank sits above every known verdict", () => {
    const known = Object.values(VERDICT_META).map((m) => m.rank);
    expect(Math.max(...known)).toBeLessThan(verdictMeta("anything").rank);
  });
});

describe("bandMeta", () => {
  it("returns the mapped label for each known band", () => {
    expect(bandMeta("Green").label).toBe("Healthy");
    expect(bandMeta("Yellow").label).toBe("Watch");
    expect(bandMeta("Orange").label).toBe("At risk");
    expect(bandMeta("Red").label).toBe("Needs action");
  });

  it("carries through chip + bar classes for a known band", () => {
    expect(bandMeta("Green")).toEqual(BAND_META.Green);
  });

  it("falls back to 'No score yet' for missing / unknown bands", () => {
    const fallback = { label: "No score yet", chip: "bg-white/10 text-white/70", bar: "bg-white/30" };
    expect(bandMeta(undefined)).toEqual(fallback);
    expect(bandMeta("")).toEqual(fallback);
    expect(bandMeta("Purple")).toEqual(fallback);
  });
});

describe("cadenceText", () => {
  it("0 (and negatives) means manual only", () => {
    expect(cadenceText(0)).toBe("manual only");
    expect(cadenceText(-5)).toBe("manual only");
  });

  it("maps the canonical cadences", () => {
    expect(cadenceText(0.5)).toBe("every 30 min");
    expect(cadenceText(1)).toBe("hourly");
    expect(cadenceText(24)).toBe("daily");
    expect(cadenceText(168)).toBe("weekly");
  });

  it("renders custom sub-daily and other custom hour values", () => {
    expect(cadenceText(6)).toBe("every 6h");
    expect(cadenceText(12)).toBe("every 12h");
    expect(cadenceText(48)).toBe("every 48h");
    expect(cadenceText(72)).toBe("every 72h");
  });

  it("defaults to daily when hours is null / undefined", () => {
    expect(cadenceText(null)).toBe("daily");
    expect(cadenceText(undefined)).toBe("daily");
    expect(cadenceText()).toBe("daily");
  });
});
