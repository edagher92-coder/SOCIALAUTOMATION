// AdPilot OS V2 — creative scorecard engine (P6.4 / master plan next PR).
// Proposes-only, read-only. Groups raw ad rows by ad identity, aggregates them,
// computes per-creative engagement metrics, runs the decision engine, and returns
// a ranked scorecard. No live edits — safe:true on every verdict.

import type { Row, Cfg } from "./types";
import { decide } from "./decisions";
import { predictFatigue } from "./fatigue";
import * as M from "./metrics";

export interface CreativeScorecardRow {
  adKey: string;          // stable identity: ad_id ?? ad_name ?? campaign_name ?? "(ad)"
  adName: string;         // display name
  spend: number;
  impressions: number;
  clicks: number;
  /** video-only: 3-second views / impressions */
  hookRate: number | null;
  /** video-only: thruplay / 3-second views */
  holdRate: number | null;
  /** current CTR */
  ctr: number | null;
  /** highest CTR seen across date range rows; null if only one data point */
  ctrPeak: number | null;
  /** (ctrPeak - ctr) / ctrPeak [0-1]; null if no meaningful peak */
  ctrDecay: number | null;
  fatigueStatus: "healthy" | "watch" | "fatigued";
  fatigueOnsetDaysAgo: number | null;
  verdict: string;
  reason: string;
  cpa: number | null;
  roas: number | null;
  /** Daily CTR series, oldest→newest (last 14 points), for the trend sparkline. Empty when <2 days. */
  ctrSeries: number[];
}

function adKey(r: Row): string {
  return String(r.ad_id ?? r.ad_name ?? r.campaign_name ?? "(ad)");
}

function adName(r: Row): string {
  return String(r.ad_name ?? r.campaign_name ?? r.ad_id ?? "(ad)");
}

function sumN(rows: Row[], field: string): number {
  return rows.reduce((s, r) => s + (Number(r[field]) || 0), 0);
}

// Peak CTR across the daily rows in a group. Returns null if fewer than two rows
// (no meaningful inter-row comparison), or if all CTRs are zero/null.
function peakCtr(rows: Row[]): number | null {
  if (rows.length < 2) return null;
  let peak: number | null = null;
  for (const r of rows) {
    const c = r.ctr != null ? Number(r.ctr) : M.ctr(Number(r.clicks) || 0, Number(r.impressions) || 0);
    if (c != null && Number.isFinite(c) && c > 0 && (peak === null || c > peak)) peak = c;
  }
  return peak;
}

export function computeCreativeScorecard(rows: Row[], cfg: Cfg): CreativeScorecardRow[] {
  if (!rows.length) return [];

  // Group rows by ad identity.
  const groups: Record<string, Row[]> = {};
  for (const r of rows) {
    const k = adKey(r);
    (groups[k] = groups[k] ?? []).push(r);
  }

  const out: CreativeScorecardRow[] = [];

  for (const [key, grp] of Object.entries(groups)) {
    // Aggregate: sum all additive fields.
    const spend = sumN(grp, "spend");
    const impressions = sumN(grp, "impressions");
    const clicks = sumN(grp, "clicks");
    const leads = sumN(grp, "leads");
    const purchases = sumN(grp, "purchases");
    const revenue = sumN(grp, "revenue");
    const reach = sumN(grp, "reach");
    const video3Sec = sumN(grp, "video_3_sec_views");
    const thruplay = sumN(grp, "thruplay_views");

    const ctr = M.ctr(clicks, impressions);
    const cpa = M.cpa(spend, purchases);
    const roas = M.roas(revenue, spend);
    const freq = M.frequency(impressions, reach) ?? 0;

    // Video engagement metrics: only meaningful when video fields are present.
    const isVideo = video3Sec > 0;
    const hookRate = isVideo ? M.hookRate(video3Sec, impressions) : null;
    const holdRate = isVideo ? M.holdRate(thruplay, video3Sec) : null;

    // Peak CTR for decay — only compare within the group's own history.
    const ctrPk = peakCtr(grp);
    const ctrDecay =
      ctrPk != null && ctr != null && ctrPk > 0 ? (ctrPk - ctr) / ctrPk : null;

    // Fatigue detection: build the engagement series sorted oldest→newest.
    const series = [...grp]
      .sort((a, b) => String(a.date ?? "").localeCompare(String(b.date ?? "")))
      .map((r) => ({
        ctr: Number(r.ctr) || (r.impressions ? Number(r.clicks) / Number(r.impressions) : 0),
        holdRate: r.hold_rate != null ? Number(r.hold_rate) : null,
        frequency: r.frequency != null ? Number(r.frequency) : null,
      }));
    const fatigue = grp.length >= 3 ? predictFatigue(series) : { status: "healthy" as const, onset: null };

    // Daily CTR trend for the sparkline — same sorted series the fatigue detector saw, so the
    // chart and the fatigue verdict can never disagree about the data. Capped at 14 points.
    const ctrSeries = grp.length >= 2 ? series.slice(-14).map((s) => Math.round(s.ctr * 10000) / 10000) : [];

    // Aggregate row for the decision engine.
    const aggRow: Row = {
      ad_id: key, ad_name: adName(grp[0]), spend, impressions, clicks, leads, purchases, revenue,
      reach, frequency: freq, ctr,
      tracking_status: grp[0]?.tracking_status ?? "ok",
    };

    const d = decide(aggRow, cfg, ctrPk, null);

    out.push({
      adKey: key,
      adName: adName(grp[0]),
      spend,
      impressions,
      clicks,
      hookRate,
      holdRate,
      ctr,
      ctrPeak: ctrPk,
      ctrDecay,
      fatigueStatus: fatigue.status,
      fatigueOnsetDaysAgo: (fatigue as any).onset?.daysAgo ?? null,
      verdict: d.verdict,
      reason: d.reason,
      cpa,
      roas,
      ctrSeries,
    });
  }

  // Rank: kill/reduce first (highest waste priority), then by spend desc.
  const RANK: Record<string, number> = {
    kill: 0, reduce: 1, "fix-tracking": 2, refresh: 3, "insufficient-data": 4, keep: 5, scale: 6, duplicate: 7,
  };
  out.sort((a, b) => {
    const rd = (RANK[a.verdict] ?? 5) - (RANK[b.verdict] ?? 5);
    if (rd !== 0) return rd;
    return b.spend - a.spend;
  });

  return out;
}
