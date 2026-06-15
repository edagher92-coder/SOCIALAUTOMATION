// AdPilot OS V2 — shared engine types.

export type Row = Record<string, any>;

export interface Cfg {
  business_name?: string;
  currency?: string;
  average_sale_value: number;
  gross_margin: number;
}

export interface FactorBreakdown {
  score: number | null;
  weight: number;
  adjusted_weight: number;
  weighted_points: number;
}

export interface HealthResult {
  total: number;
  band: BandName;
  guidance: string;
  breakdown: Record<string, FactorBreakdown>;
  weakest: string[];
}

export type BandName = "Green" | "Yellow" | "Orange" | "Red";

export interface Finding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  factor: string;
  message: string;
}

export interface Aggregate {
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  purchases: number;
  revenue: number;
  ctr: number | null;
  cpa: number | null;
  roas: number | null;
  conv_rate: number | null;
}

export interface AccountScore extends HealthResult {
  agg: Aggregate;
  break_even_cpa: number;
  findings: Finding[];
}

export interface CampaignScore {
  campaign: string;
  platforms: string[];
  ads: number;
  spend: number;
  cpa: number | null;
  roas: number | null;
  health: number;
  band: BandName;
  top_finding: string;
}

export interface Decision {
  verdict: "keep" | "kill" | "duplicate" | "scale" | "reduce" | "refresh" | "fix-tracking" | "insufficient-data";
  reason: string;
  proposal: string;
  safe: true;
}
