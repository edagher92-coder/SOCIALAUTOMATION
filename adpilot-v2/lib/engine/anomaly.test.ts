import { describe, it, expect } from "vitest";
import { detectLatestAnomaly } from "@/lib/engine/anomaly";
import { analyse } from "@/lib/engine";

describe("detectLatestAnomaly", () => {
  it("flags a harmful cost spike (CPL jumping on the latest day)", () => {
    // Stable ~$10 CPL, then $40 on the last day.
    const a = detectLatestAnomaly("cpl", [10, 11, 9, 10, 12, 10, 9, 40]);
    expect(a).toBeTruthy();
    expect(a!.direction).toBe("spike");
    expect(a!.bad).toBe(true); // cost up = harmful
    expect(a!.deviationPct).toBeGreaterThan(2); // >200% over baseline
  });

  it("flags a harmful efficiency drop (ROAS collapsing on the latest day)", () => {
    const a = detectLatestAnomaly("roas", [3.0, 3.1, 2.9, 3.0, 3.2, 3.0, 2.8, 0.4]);
    expect(a).toBeTruthy();
    expect(a!.direction).toBe("drop");
    expect(a!.bad).toBe(true); // efficiency down = harmful
  });

  it("marks a benign move (CPL DROPPING) as not-bad", () => {
    const a = detectLatestAnomaly("cpl", [20, 21, 19, 20, 22, 20, 21, 3]);
    expect(a).toBeTruthy();
    expect(a!.direction).toBe("drop");
    expect(a!.bad).toBe(false); // cheaper leads are good news
  });

  it("escalates to alert at a large deviation", () => {
    // Baseline median 10, MAD ≈ 2.97. Latest 20 → z≈3.4 (watch); latest 35 → z≈8.4 (alert).
    const base = [10, 12, 8, 10, 12, 8, 10];
    const watch = detectLatestAnomaly("cpc", [...base, 20]);
    const alert = detectLatestAnomaly("cpc", [...base, 35]);
    expect(watch?.severity).toBe("watch");
    expect(alert?.severity).toBe("alert");
  });

  it("returns null for a flat series and for too-little history", () => {
    expect(detectLatestAnomaly("cpl", [10, 10, 10, 10, 10, 10])).toBeNull(); // MAD 0
    expect(detectLatestAnomaly("cpl", [10, 40])).toBeNull(); // not enough baseline
  });
});

describe("analyse — anomaly wiring", () => {
  const cfg = { average_sale_value: 200, gross_margin: 0.6, currency: "AUD" } as any;

  it("surfaces an account-level CPL spike on the most recent day", () => {
    // Calm days with real day-to-day variation (so MAD > 0), then leads collapse on the last day
    // while spend holds → CPL spikes well past the robust baseline.
    const leadsByDay = [10, 12, 8, 10, 12, 8, 10, 1];
    const rows = leadsByDay.map((lz, i) => ({
      platform: "meta", ad_id: "ad1", campaign_name: "C1", date: `2026-06-0${i + 1}`,
      spend: 100, impressions: 5000, clicks: 100, ctr: 0.02,
      leads: lz, purchases: 0, revenue: 0, tracking_status: "ok",
    }));
    const r = analyse(rows as any, cfg) as any;
    expect(Array.isArray(r.anomalies)).toBe(true);
    const cpl = r.anomalies.find((a: any) => a.metric === "cpl");
    expect(cpl).toBeTruthy();
    expect(cpl.direction).toBe("spike");
    expect(cpl.bad).toBe(true);
  });

  it("returns an empty anomaly list without enough daily history", () => {
    const rows = [{ platform: "meta", ad_id: "ad1", campaign_name: "C", date: "2026-06-01", spend: 50, impressions: 1000, clicks: 20, leads: 5, tracking_status: "ok" }];
    const r = analyse(rows as any, cfg) as any;
    expect(r.anomalies).toEqual([]);
  });
});
