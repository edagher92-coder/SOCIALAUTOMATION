import { describe, expect, it } from "vitest";
import { buildInteractiveDemoSnapshots } from "./workspace";

describe("interactive demo workspace data", () => {
  it("builds six months of deterministic daily data across eight ads", () => {
    const rows = buildInteractiveDemoSnapshots("00000000-0000-0000-0000-000000000001") as Record<string, any>[];

    expect(rows).toHaveLength(1440);
    expect(new Set(rows.map((row) => row.date)).size).toBe(180);
    expect(new Set(rows.map((row) => row.ad_id)).size).toBe(8);
    expect(new Set(rows.map((row) => row.platform))).toEqual(new Set(["meta", "tiktok"]));
    expect(rows.filter((row) => row.tracking_status === "broken")).toHaveLength(180);
  });

  it("contains only synthetic reporting fields and never creates credentials", () => {
    const rows = buildInteractiveDemoSnapshots("00000000-0000-0000-0000-000000000001") as Record<string, any>[];

    expect(rows.every((row) => row.source === "csv" && String(row.notes).includes("Interactive demo"))).toBe(true);
    expect(rows.some((row) => "token" in row || "password" in row || "email" in row)).toBe(false);
    expect(rows.every((row) => Number(row.spend) >= 0 && Number(row.impressions) >= 0)).toBe(true);
  });
});
