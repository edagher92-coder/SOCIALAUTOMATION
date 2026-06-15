// AdPilot OS V2 — metric formulas (TypeScript port of the parity-tested engine).
// Zero-division returns null (rendered "N/A"), never throws.

export type Num = number | null;

export const ROAS_ANOMALY_THRESHOLD = 20;

export const safeDiv = (n: number, d: number): Num => (!d ? null : n / d);

export const ctr = (clicks: number, imp: number): Num => safeDiv(clicks, imp);
export const cpc = (spend: number, clicks: number): Num => safeDiv(spend, clicks);
export const cpm = (spend: number, imp: number): Num => {
  const v = safeDiv(spend, imp);
  return v == null ? null : v * 1000;
};
export const cpl = (spend: number, leads: number): Num => safeDiv(spend, leads);
export const cpa = (spend: number, purchases: number): Num => safeDiv(spend, purchases);
export const roas = (rev: number, spend: number): Num => safeDiv(rev, spend);
export const mer = (rev: number, spend: number): Num => safeDiv(rev, spend);
export const frequency = (imp: number, reach: number): Num => safeDiv(imp, reach);
export const hookRate = (s3: number, imp: number): Num => safeDiv(s3, imp);
export const holdRate = (tp: number, s3: number): Num => safeDiv(tp, s3);
export const convRate = (p: number, clicks: number): Num => safeDiv(p, clicks);
export const breakEvenCpa = (avg: number, gm: number): number => avg * gm;
export const breakEvenRoas = (gm: number): Num => safeDiv(1, gm);
export const variancePct = (a: number, t: number): Num => safeDiv((a - t) * 100, t);
export const isRoasAnomaly = (r: Num): boolean => r != null && r >= ROAS_ANOMALY_THRESHOLD;
export const blendedCpa = (spends: number[], convs: number[]): Num =>
  safeDiv(spends.reduce((a, b) => a + b, 0), convs.reduce((a, b) => a + b, 0));

export const fmt = (v: Num, dp = 2): string =>
  v == null ? "N/A" : Number(v).toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });
