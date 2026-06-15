// AdPilot OS V2 — auto-audit: derive 13 health factors + findings from rows (TS port).
import type { Row, Cfg, Aggregate, Finding, AccountScore, CampaignScore } from "./types";
import * as M from "./metrics";
import { computeHealth } from "./health";

const NEUTRAL = 70;

function cpaScore(cpa: number | null, be: number): number | null {
  if (cpa == null || be <= 0) return null;
  const over = (cpa - be) / be;
  const pts: [number, number][] = [[0, 100], [0.1, 80], [0.25, 60], [0.5, 35], [0.75, 10]];
  if (over <= 0) return 100;
  if (over >= 0.75) return 10;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    if (over >= x0 && over <= x1) return y0 + ((over - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 10;
}
function ctrScore(c: number | null): number {
  if (c == null) return 50;
  const p = c * 100;
  if (p >= 2) return 95;
  if (p >= 1) return 60 + (p - 1) * 35;
  if (p >= 0.5) return 30 + ((p - 0.5) / 0.5) * 30;
  return Math.max(10, (p / 0.5) * 30);
}
function freshnessScore(freq: number | null): number {
  if (freq == null || freq < 1) return 80;
  if (freq <= 2) return 90;
  if (freq <= 3) return 65;
  if (freq <= 4) return 35;
  return 12;
}
function convRateScore(cr: number | null): number {
  if (cr == null) return 50;
  const p = cr * 100;
  if (p >= 3) return 90;
  if (p >= 1.5) return 55 + ((p - 1.5) / 1.5) * 35;
  if (p >= 0.5) return 25 + ((p - 0.5) / 1.0) * 30;
  return Math.max(10, (p / 0.5) * 25);
}
function trackingScore(rows: Row[], agg: Aggregate): number {
  const w: Record<string, number> = { ok: 100, active: 100, partial: 60, review: 30, broken: 12 };
  const tot = rows.reduce((a, r) => a + (r.spend || 0), 0) || 1;
  let s = 0;
  for (const r of rows) s += (w[(r.tracking_status || "ok").toLowerCase()] ?? 70) * (r.spend || 0) / tot;
  if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0) s = Math.min(s, 30);
  const missing = rows.filter((r) => !r.utm_campaign).length;
  if (rows.length && missing) s -= (15 * missing) / rows.length;
  return Math.max(0, Math.min(100, s));
}
function namingScore(rows: Row[]): number {
  if (!rows.length) return NEUTRAL;
  let ok = 0;
  for (const r of rows) {
    const segs = String(r.campaign_name || "").split("_");
    if (segs.length >= 4 && segs.some((x) => /^\d{8}$/.test(x))) ok++;
  }
  return (100 * ok) / rows.length;
}
function dataConfScore(agg: Aggregate): number {
  if (agg.clicks >= 200 || agg.purchases >= 30) return 100;
  if (agg.clicks >= 50 || agg.purchases >= 15) return 70;
  if (agg.clicks >= 20) return 40;
  return 15;
}
function sev(score: number): Finding["severity"] {
  if (score < 25) return "CRITICAL";
  if (score < 45) return "HIGH";
  if (score < 65) return "MEDIUM";
  return "LOW";
}

export function aggregate(rows: Row[]): Aggregate {
  const s = (k: string): number => rows.reduce((a, r) => a + (r[k] || 0), 0);
  const spend = s("spend");
  return {
    spend, impressions: s("impressions"), reach: s("reach"), clicks: s("clicks"),
    leads: s("leads"), purchases: s("purchases"), revenue: s("revenue"),
    ctr: M.ctr(s("clicks"), s("impressions")), cpa: M.cpa(spend, s("purchases")),
    roas: M.roas(s("revenue"), spend), conv_rate: M.convRate(s("purchases"), s("clicks")),
  };
}

export function scoreAccount(rows: Row[], cfg: Cfg): AccountScore {
  const agg = aggregate(rows);
  const be = M.breakEvenCpa(cfg.average_sale_value, cfg.gross_margin);
  const freq = M.frequency(agg.impressions, agg.reach);
  const factors: Record<string, number> = {};
  const na: string[] = [];

  factors.tracking_quality = trackingScore(rows, agg);
  const cs = cpaScore(agg.cpa, be);
  if (cs == null) na.push("cpa"); else factors.cpa = cs;
  factors.ctr = ctrScore(agg.ctr);
  factors.conversion_rate = convRateScore(agg.conv_rate);
  factors.creative_freshness = freshnessScore(freq);
  factors.naming_quality = namingScore(rows);
  factors.data_confidence = dataConfScore(agg);
  if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0) factors.data_confidence = Math.min(factors.data_confidence, 20);
  factors.budget_pacing = 85;
  const lq = rows.map((r) => r.lead_quality_score).filter((v) => v) as number[];
  if (!lq.length) na.push("lead_quality"); else factors.lead_quality = lq.reduce((a, b) => a + b, 0) / lq.length;
  const effBase = cs == null ? 50 : cs;
  factors.spend_efficiency = 0.6 * effBase + 0.4 * factors.data_confidence;
  factors.cpc = 0.5 * factors.ctr + 0.5 * NEUTRAL;
  factors.offer_strength = NEUTRAL;
  factors.landing_page_alignment = NEUTRAL;

  const res = computeHealth(factors, na) as AccountScore;
  res.agg = agg;
  res.break_even_cpa = be;
  res.findings = findings(factors, agg, be, freq, na);
  return res;
}

function findings(factors: Record<string, number>, agg: Aggregate, be: number, freq: number | null, na: string[]): Finding[] {
  const out: Finding[] = [];
  if (agg.spend > 0 && agg.purchases === 0 && agg.leads === 0)
    out.push({ severity: "CRITICAL", factor: "tracking_quality", message: "Spend with zero recorded conversions/leads — verify pixel/events before any budget decision." });
  if ("cpa" in factors && agg.cpa && agg.cpa > be)
    out.push({ severity: sev(factors.cpa), factor: "cpa", message: `CPA ${M.fmt(agg.cpa)} over break-even ${M.fmt(be)}.` });
  if (freq && freq >= 4)
    out.push({ severity: "HIGH", factor: "creative_freshness", message: `Frequency ${freq.toFixed(1)} ≥ 4.0 — creative fatigue; refresh.` });
  const seen = new Set(out.map((o) => o.factor));
  Object.entries(factors).sort((a, b) => a[1] - b[1]).forEach(([f, s]) => {
    if (s < 45 && !seen.has(f)) { out.push({ severity: sev(s), factor: f, message: `${f} weak (score ${Math.round(s)}).` }); seen.add(f); }
  });
  if (na.length) out.push({ severity: "INFO", factor: na.join(","), message: "Not derivable from media data — needs human input (e.g. lead quality from CRM; offer/landing review)." });
  return out.slice(0, 8);
}

export function scoreByCampaign(rows: Row[], cfg: Cfg): CampaignScore[] {
  const groups: Record<string, Row[]> = {};
  for (const r of rows) {
    const k = r.campaign_name || r.campaign_id || "(unnamed)";
    (groups[k] = groups[k] || []).push(r);
  }
  const out = Object.entries(groups).map(([name, grp]) => {
    const res = scoreAccount(grp, cfg);
    const a = res.agg;
    return {
      campaign: name,
      platforms: Array.from(new Set(grp.map((r) => r.platform || "?"))).sort(),
      ads: grp.length, spend: a.spend, cpa: a.cpa, roas: a.roas,
      health: res.total, band: res.band, top_finding: res.findings.length ? res.findings[0].message : "",
    };
  });
  out.sort((a, b) => a.health - b.health);
  return out;
}
