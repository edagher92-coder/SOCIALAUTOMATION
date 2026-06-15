// AdPilot OS V2 — universal schema, CSV parsing + Meta/TikTok column mapping (TS port).
import type { Row } from "./types";

export const NUMERIC = new Set<string>([
  "daily_budget", "lifetime_budget", "spend", "impressions", "reach", "frequency", "clicks",
  "ctr", "cpc", "cpm", "landing_page_views", "leads", "purchases", "revenue", "cost_per_lead",
  "cost_per_purchase", "roas", "video_views", "three_second_views", "six_second_views", "thruplays",
  "hook_rate", "hold_rate", "comments", "shares", "saves", "lead_quality_score", "sales_count", "gross_profit",
]);

export const FIELDS: string[] = [
  "business_id", "business_name", "platform", "ad_account_id", "campaign_id", "campaign_name",
  "adset_id", "adset_name", "ad_id", "ad_name", "date", "objective", "budget_type", "daily_budget",
  "lifetime_budget", "spend", "impressions", "reach", "frequency", "clicks", "ctr", "cpc", "cpm",
  "landing_page_views", "leads", "purchases", "revenue", "cost_per_lead", "cost_per_purchase", "roas",
  "video_views", "three_second_views", "six_second_views", "thruplays", "hook_rate", "hold_rate",
  "comments", "shares", "saves", "lead_quality_score", "sales_count", "gross_profit", "utm_source",
  "utm_medium", "utm_campaign", "utm_content", "utm_term", "tracking_status", "recommendation", "notes",
];

export const META_MAP: Record<string, string> = {
  "Campaign name": "campaign_name", "Ad set name": "adset_name", "Ad name": "ad_name", "Day": "date",
  "Reporting starts": "date", "Amount spent (AUD)": "spend", "Amount spent": "spend", "Impressions": "impressions",
  "Reach": "reach", "Frequency": "frequency", "Link clicks": "clicks", "Clicks (all)": "clicks",
  "Landing page views": "landing_page_views", "Leads": "leads", "Purchases": "purchases",
  "Purchases conversion value": "revenue", "3-second video plays": "three_second_views", "ThruPlays": "thruplays",
};

export const TT_MAP: Record<string, string> = {
  "Campaign name": "campaign_name", "Ad group name": "adset_name", "Ad name": "ad_name", "Date": "date",
  "Cost": "spend", "Impressions": "impressions", "Reach": "reach", "Frequency": "frequency", "Clicks": "clicks",
  "Landing page views": "landing_page_views", "Leads (form)": "leads", "Conversions": "purchases",
  "Total conversion value": "revenue", "Video views": "video_views", "2-second video views": "three_second_views",
  "Video views at 100%": "thruplays",
};

export function toNum(v: any): number | null {
  if (v == null) return null;
  const s = String(v).trim().replace(/[,$%]/g, "");
  if (s === "" || ["N/A", "NA", "-"].includes(s.toUpperCase())) return null;
  const n = Number(s);
  return isNaN(n) ? null : n;
}

export function detectPlatform(h: string[]): "meta" | "tiktok" | "universal" {
  const s = new Set(h);
  if (s.has("Ad group name") || s.has("Cost")) return "tiktok";
  if (s.has("Ad set name") || s.has("Amount spent (AUD)") || s.has("ThruPlays")) return "meta";
  return "universal";
}

// Minimal robust CSV parser (handles quotes, commas, newlines).
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", row: string[] = [], inq = false;
  while (i < text.length) {
    const c = text[i];
    if (inq) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inq = false; }
      else field += c;
    } else if (c === '"') inq = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
    i++;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ""));
}

export function normalise(raw: Row, platform: string): Row {
  const map = platform === "meta" ? META_MAP : platform === "tiktok" ? TT_MAP : null;
  const row: Row = {};
  FIELDS.forEach((f) => (row[f] = null));
  if (platform === "meta" || platform === "tiktok") row.platform = platform;
  for (const key in raw) {
    const field = map ? map[key] || (FIELDS.includes(key) ? key : null) : FIELDS.includes(key) ? key : null;
    if (!field) continue;
    row[field] = NUMERIC.has(field) ? toNum(raw[key]) : raw[key];
  }
  if (platform === "meta" || platform === "tiktok") row.platform = platform;
  return row;
}
