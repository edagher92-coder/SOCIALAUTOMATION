// Parity test for the TS engine — mirrors the documented QA cases + sample bands.
import { describe, it, expect } from "vitest";
import * as M from "./metrics";
import { computeHealth, weightsSum, band } from "./health";
import { scoreAccount } from "./audit";
import { parseCsvText } from "./ingest";
import { decide } from "./decisions";

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

describe("metrics", () => {
  it("matches documented cases", () => {
    expect(round2((M.ctr(4200, 280000) as number) * 100)).toBe(1.5);
    expect(round2(M.cpc(2100, 4200))).toBe(0.5);
    expect(round2(M.cpm(2100, 280000))).toBe(7.5);
    expect(round2(M.cpa(8000, 118))).toBe(67.8);
    expect(round2(M.mer(45000, 9800))).toBe(4.59);
    expect(round2(M.breakEvenCpa(185, 0.42))).toBe(77.7);
    expect(round2(M.breakEvenRoas(0.42))).toBe(2.38);
    expect(M.cpa(800, 0)).toBeNull();
    expect(M.isRoasAnomaly(M.roas(50000, 500))).toBe(true);
  });
});

describe("health", () => {
  it("weights sum to 100 and all-80 = 80 Green", () => {
    expect(weightsSum()).toBe(100);
    const scores: Record<string, number> = {};
    ["tracking_quality","cpa","spend_efficiency","conversion_rate","ctr","lead_quality","creative_freshness","cpc","naming_quality","offer_strength","landing_page_alignment","budget_pacing","data_confidence"].forEach((k)=>scores[k]=80);
    const r = computeHealth(scores);
    expect(r.total).toBe(80);
    expect(r.band).toBe("Green");
    expect(band(59)[0]).toBe("Orange");
  });
});

const clean = `business_name,platform,campaign_name,date,spend,impressions,reach,clicks,leads,purchases,revenue,three_second_views,thruplays,lead_quality_score,utm_source,utm_medium,utm_campaign,tracking_status
Example Co,meta,exampleco_hotwater_leads_brisbane_20260601,2026-06-13,600,30000,16000,600,40,12,3600,9000,4000,82,meta,paid_social,exampleco_hotwater_leads_brisbane_20260601,ok`;
const broken = `business_name,platform,campaign_name,date,spend,impressions,reach,clicks,leads,purchases,revenue,utm_campaign,tracking_status
Example Co,meta,promo,2026-06-13,1800,90000,40000,540,0,0,0,,broken`;

describe("audit", () => {
  const cfg = { average_sale_value: 200, gross_margin: 0.6 };
  it("clean account is Green", () => {
    const r = scoreAccount(parseCsvText(clean), cfg);
    expect(r.band).toBe("Green");
    expect(r.total).toBeGreaterThanOrEqual(80);
  });
  it("broken tracking is Red with a CRITICAL tracking finding", () => {
    const r = scoreAccount(parseCsvText(broken), cfg);
    expect(r.total).toBeLessThan(40);
    expect(r.findings.some((f) => f.factor === "tracking_quality" && f.severity === "CRITICAL")).toBe(true);
  });
  it("decisions are always safe proposals", () => {
    const rows = parseCsvText(clean);
    expect(decide(rows[0], cfg).safe).toBe(true);
  });
});
