import "server-only";
import * as M from "@/lib/engine/metrics";
import { REPORT_SECTIONS, SAFETY_FOOTER, SAFETY_HEADER, BREAK_EVEN_NOTE, type ReportKind } from "./templates";

// Pure, DB-free, defensive formatter: turns a saved analyse() payload into deterministic
// AU-English markdown. Numbers come STRAIGHT from the payload (never invented); old payloads
// missing the enriched summary just render "N/A". Riley writes the prose sections around this.

type Num = number | null | undefined;

export type ReportPayload = {
  config?: { business_name?: string; currency?: string; average_sale_value?: number; gross_margin?: number };
  summary?: Record<string, Num>;
  health?: { total?: number; band?: string; guidance?: string; findings?: any[]; weakest?: any[]; breakdown?: Record<string, any> };
  campaigns?: any[];
  decisions?: any[];
  // Per-ad creative-fatigue diagnostic (change-point onset). Only flagged ads; read-only.
  fatigue?: any[];
  // Optional live follower demographics (attached only when a real Page/IG/TikTok is connected).
  audience?: { platform?: string; handle?: string; followerCount?: number; source?: string; summary?: string[] };
  safety?: string;
};

export type ReportOpts = {
  kind: ReportKind;
  periodLabel: string; // e.g. "Week of 9–15 Jun 2026"
  whiteLabel?: { name?: string } | null;
};

const NA = "N/A";
function money(v: Num, ccy = "AUD"): string {
  if (v == null) return NA;
  return `${ccy === "AUD" ? "$" : ccy + " "}${M.fmt(typeof v === "number" ? v : null)}`;
}
function pct(v: Num, dp = 2): string {
  if (v == null) return NA;
  return `${M.fmt((v as number) * 100, dp)}%`;
}
function num(v: Num, dp = 0): string {
  if (v == null) return NA;
  return M.fmt(v as number, dp);
}
function x(v: Num, dp = 2): string {
  if (v == null) return NA;
  return `${M.fmt(v as number, dp)}×`;
}

// Deterministic markdown report. No AI; safe for an old payload (missing fields => N/A).
export function buildReportMarkdown(payload: ReportPayload, opts: ReportOpts): string {
  const ccy = payload?.config?.currency || "AUD";
  const biz = payload?.config?.business_name || "your account";
  const s = payload?.summary || {};
  const h = payload?.health || {};
  const brand = opts.whiteLabel?.name?.trim();
  const out: string[] = [];

  out.push(`# ${biz} — ${titleFor(opts.kind)}`);
  out.push(`_${opts.periodLabel}${brand ? ` · prepared by ${brand}` : ""}_`);
  out.push(`> ${SAFETY_HEADER}`);
  out.push("");

  // Health (audits + monthly lead with it).
  if (h.total != null) {
    out.push(`**Campaign Health Score: ${num(h.total)} / 100 — ${h.band || ""}**`);
    if (h.guidance) out.push(h.guidance);
    const lq = h.breakdown?.lead_quality?.score;
    if (lq != null) out.push(`Lead quality: ${num(lq)} / 100`);
    out.push("");
  }

  // Audience — live follower demographics, only when a real profile is connected (never sample).
  const aud = payload.audience;
  if (aud && Array.isArray(aud.summary) && aud.summary.length) {
    out.push("## Audience");
    out.push(`**${aud.handle || "your profile"}** — ${num(aud.followerCount)} followers${aud.platform ? ` (${aud.platform})` : ""}`);
    for (const line of aud.summary.slice(0, 6)) out.push(`- ${line}`);
    out.push("");
  }

  // Spend & Results — deterministic KPI table straight from the enriched summary.
  out.push("## Spend & Results");
  out.push("| Metric | Value |");
  out.push("|---|---|");
  out.push(`| Spend | ${money(s.spend, ccy)} |`);
  out.push(`| Leads | ${num(s.leads)} |`);
  out.push(`| Purchases | ${num(s.purchases)} |`);
  out.push(`| Revenue | ${money(s.revenue, ccy)} |`);
  out.push(`| CPL | ${money(s.cpl, ccy)} |`);
  out.push(`| CPA | ${money(s.cpa, ccy)} |`);
  out.push(`| Break-even CPA | ${money(s.break_even_cpa, ccy)} |`);
  if (s.break_even_cpl != null) out.push(`| Break-even CPL | ${money(s.break_even_cpl, ccy)} |`);
  out.push(`| ROAS (derived: revenue/spend) | ${x(s.roas)} |`);
  // Meta's own reported ROAS, side-by-side for the human to judge — never replaces the derived value.
  if (s.roas_meta != null) out.push(`| ROAS (Meta-reported, attribution-window difference) | ${x(s.roas_meta)} |`);
  out.push(`| Break-even ROAS | ${x(s.break_even_roas)} |`);
  out.push(`| MER | ${x(s.mer)} |`);
  out.push(`| CTR | ${pct(s.ctr)} |`);
  out.push(`| CPC | ${money(s.cpc, ccy)} |`);
  out.push(`| CPM | ${money(s.cpm, ccy)} |`);
  out.push(`| Frequency | ${num(s.frequency, 2)} |`);
  out.push(`_${BREAK_EVEN_NOTE}_`);
  out.push("");

  // By Campaign — from payload.campaigns (worst-first as the engine returns).
  if (Array.isArray(payload.campaigns) && payload.campaigns.length && wantsCampaigns(opts.kind)) {
    out.push("## By Campaign");
    out.push("| Campaign | Platforms | Spend | CPA | ROAS | Health |");
    out.push("|---|---|---|---|---|---|");
    for (const c of payload.campaigns.slice(0, 15)) {
      out.push(`| ${c.campaign ?? "(campaign)"} | ${(c.platforms || []).join("/") || NA} | ${money(c.spend, ccy)} | ${money(c.cpa, ccy)} | ${x(c.roas)} | ${num(c.health)} (${c.band || ""}) |`);
    }
    out.push("");
  }

  // Creative fatigue — change-point onset diagnostic (only flagged ads; read-only).
  const fatigue = Array.isArray(payload.fatigue) ? payload.fatigue : [];
  if (fatigue.length) {
    out.push("## Creative fatigue (change-point onset)");
    out.push("| Ad | Status | Onset | Confidence |");
    out.push("|---|---|---|---|");
    for (const f of fatigue.slice(0, 15)) {
      const onset = f.onsetDaysAgo != null
        ? `~${num(f.onsetDaysAgo)} day(s) ago${f.dropPct != null ? ` (${num(f.dropPct * 100)}% drop)` : ""}`
        : NA;
      out.push(`| ${f.ad ?? "(ad)"} | ${String(f.status || "").toUpperCase()} | ${onset} | ${f.confidence ?? NA} |`);
    }
    out.push("_Onset = the day the engagement series stepped down (change-point detection). Read-only diagnostic — refresh is a proposal, not an automatic change._");
    out.push("");
  }

  // Recommendations — from payload.decisions (proposals only).
  const recs = (Array.isArray(payload.decisions) ? payload.decisions : []).filter((d) => d && d.verdict && d.verdict !== "keep");
  out.push("## Recommendations (your call on anything monetary)");
  if (recs.length) {
    for (const d of recs.slice(0, 20)) {
      out.push(`- **${String(d.verdict).toUpperCase()}** — ${d.name || d.entity_name || "(ad)"}${d.platform ? ` [${d.platform}]` : ""}: ${d.proposal || d.reason || ""}`);
    }
  } else {
    out.push("- No actionable changes this period — keep current settings and keep watching.");
  }
  out.push("");

  out.push(`_${payload?.safety || SAFETY_FOOTER}_`);
  return out.join("\n");
}

function titleFor(kind: ReportKind): string {
  switch (kind) {
    case "daily": return "Daily Report";
    case "weekly": return "Weekly Report";
    case "monthly": return "Monthly Report";
    case "audit-meta": return "Meta Ads Audit";
    case "audit-tiktok": return "TikTok Ads Audit";
  }
}
function wantsCampaigns(kind: ReportKind): boolean {
  return kind === "weekly" || kind === "monthly";
}

// Prompt suffix telling Riley to write ONLY the plain-English prose sections, in the
// canonical order, citing a metric for every claim — the deterministic tables come from
// buildReportMarkdown, so Riley must not invent numbers.
export function buildRileyReportInstruction(payload: ReportPayload, opts: ReportOpts): string {
  const sections = REPORT_SECTIONS[opts.kind].join(" · ");
  return [
    `Write a ${opts.kind} report for ${opts.periodLabel} as plain-English prose ONLY.`,
    `Follow this section order: ${sections}.`,
    "Do NOT restate metric tables (they are rendered separately) — interpret them: cite the specific metric and window behind every claim.",
    "Keep it numbers-first, anti-hype, Australian English; frame any change as a proposal needing a typed YES; never imply a live ad was edited.",
  ].join(" ");
}
