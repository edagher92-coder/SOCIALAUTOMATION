// AdPilot OS V7 — budget guardrails + pacing evaluator (Cockpit P1).
// Pure and read-only: consumes snapshot rows, returns statuses + PROPOSAL findings.
// It never actions anything and never invents a number — a campaign with no budget on
// record gets status "no-ceiling", not a guessed cap (no-fabrication rule).

export interface GuardrailRow {
  campaign_name?: string | null;
  platform?: string | null;
  date?: string | null; // YYYY-MM-DD
  spend?: number | string | null;
  daily_budget?: number | string | null; // account currency (CSV-sourced); null when unknown
}

export interface CampaignGuardrail {
  key: string;
  name: string;
  platform: string;
  /** Spend on the latest snapshot date. */
  spendToday: number;
  /** Daily budget on record (account currency); null = unknown. */
  ceiling: number | null;
  /** spendToday / ceiling; null when no ceiling. */
  pct: number | null;
  status: "ok" | "warn" | "breach" | "no-ceiling";
  /** Learning-phase heuristic: campaign first appeared inside the data window < LEARNING_DAYS ago. */
  learning: { dayNumber: number; advice: string } | null;
}

export interface GuardrailFinding {
  severity: "HIGH" | "MEDIUM" | "INFO";
  campaign: string;
  message: string; // plain-English condition → proposal sentence; never an action
}

export interface GuardrailsResult {
  /** The snapshot date treated as "today" (latest date in the window); null if no rows. */
  date: string | null;
  campaigns: CampaignGuardrail[];
  combined: {
    spendToday: number;
    /** monthlyBudget / days-in-month; null when the org hasn't set a budget. */
    cap: number | null;
    pct: number | null;
    /** Naive linear projection of end-of-day spend; null when data is stale or the day has barely started. */
    projectedEod: number | null;
    status: "ok" | "warn" | "breach" | "no-cap";
  };
  findings: GuardrailFinding[];
}

// Field-tested defaults (generic; org-overridable via the rules engine later).
export const DEFAULT_GUARDRAILS = {
  warnAt: 0.85,       // warn at 85% of a ceiling
  learningDays: 7,    // treat a newly-seen campaign as in learning for its first 7 days
  minDayFraction: 1 / 24, // don't project end-of-day spend off less than an hour of data
} as const;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const dayDiff = (a: string, b: string): number =>
  Math.round((Date.parse(a) - Date.parse(b)) / 86400_000);

function statusFor(pct: number | null, warnAt: number): CampaignGuardrail["status"] {
  if (pct == null) return "no-ceiling";
  if (pct >= 1) return "breach";
  if (pct >= warnAt) return "warn";
  return "ok";
}

const STATUS_RANK: Record<CampaignGuardrail["status"], number> = { breach: 0, warn: 1, ok: 2, "no-ceiling": 3 };

export function evaluateGuardrails(
  rows: GuardrailRow[],
  opts: { monthlyBudget?: number | null; now?: Date; warnAt?: number } = {},
): GuardrailsResult {
  const warnAt = opts.warnAt ?? DEFAULT_GUARDRAILS.warnAt;
  const dated = rows.filter((r) => r.date && String(r.date).length >= 10);
  if (!dated.length) {
    return { date: null, campaigns: [], combined: { spendToday: 0, cap: null, pct: null, projectedEod: null, status: "no-cap" }, findings: [] };
  }

  const dates = dated.map((r) => String(r.date));
  const latest = dates.reduce((a, b) => (a >= b ? a : b));
  const windowStart = dates.reduce((a, b) => (a <= b ? a : b));

  // Group by campaign identity.
  type Grp = { name: string; platform: string; spendToday: number; ceiling: number | null; firstSeen: string };
  const groups = new Map<string, Grp>();
  for (const r of dated) {
    const name = String(r.campaign_name || "(unnamed)");
    const platform = String(r.platform || "?");
    const key = `${platform}:${name}`;
    const d = String(r.date);
    const g = groups.get(key) ?? { name, platform, spendToday: 0, ceiling: null, firstSeen: d };
    if (d < g.firstSeen) g.firstSeen = d;
    if (d === latest) g.spendToday += num(r.spend);
    const db = r.daily_budget == null ? null : num(r.daily_budget);
    // Prefer the latest non-null budget on record; a 0 budget is "unknown", never a ceiling.
    if (db != null && db > 0) g.ceiling = db;
    groups.set(key, g);
  }

  const findings: GuardrailFinding[] = [];
  const campaigns: CampaignGuardrail[] = [];
  for (const [key, g] of groups) {
    const pct = g.ceiling != null && g.ceiling > 0 ? g.spendToday / g.ceiling : null;
    const status = statusFor(pct, warnAt);

    // Learning heuristic — only when the campaign appeared AFTER the window started (so we
    // actually saw its first day; a campaign present from the window's first day has an
    // unknown true start and is honestly NOT flagged).
    let learning: CampaignGuardrail["learning"] = null;
    const age = dayDiff(latest, g.firstSeen);
    if (g.firstSeen > windowStart && age < DEFAULT_GUARDRAILS.learningDays) {
      learning = {
        dayNumber: age + 1,
        advice: "Learning phase — judge on absolute cost per result, not day-to-day % swings.",
      };
    }

    if (status === "breach") {
      findings.push({
        severity: "HIGH", campaign: g.name,
        message: `${g.name} has spent ${g.spendToday.toFixed(2)} today — ${Math.round((pct as number) * 100)}% of its ${(g.ceiling as number).toFixed(2)} daily budget. Proposal: review delivery and pacing in Ads Manager. No change has been made.`,
      });
    } else if (status === "warn") {
      findings.push({
        severity: "MEDIUM", campaign: g.name,
        message: `${g.name} is at ${Math.round((pct as number) * 100)}% of its daily budget with the day still running. Worth a look before it caps out.`,
      });
    }
    if (learning) {
      findings.push({
        severity: "INFO", campaign: g.name,
        message: `${g.name} is on day ${learning.dayNumber} of learning. ${learning.advice}`,
      });
    }

    campaigns.push({ key, name: g.name, platform: g.platform, spendToday: g.spendToday, ceiling: g.ceiling, pct, status, learning });
  }

  campaigns.sort((a, b) => (STATUS_RANK[a.status] - STATUS_RANK[b.status]) || b.spendToday - a.spendToday);

  // Combined daily cap from the org's monthly budget (if set).
  const spendToday = campaigns.reduce((s, c) => s + c.spendToday, 0);
  const mb = opts.monthlyBudget != null && Number(opts.monthlyBudget) > 0 ? Number(opts.monthlyBudget) : null;
  let cap: number | null = null;
  if (mb != null) {
    const d = new Date(latest + "T00:00:00Z");
    const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    cap = mb / daysInMonth;
  }
  const cPct = cap != null ? spendToday / cap : null;

  // End-of-day projection: only when the caller's "now" is the same calendar day as the
  // latest snapshot (stale data must not be projected) and at least an hour has elapsed.
  let projectedEod: number | null = null;
  const now = opts.now ?? new Date();
  const nowDay = now.toISOString().slice(0, 10);
  if (nowDay === latest) {
    const frac = (now.getUTCHours() * 60 + now.getUTCMinutes()) / 1440;
    if (frac >= DEFAULT_GUARDRAILS.minDayFraction) projectedEod = spendToday / frac;
  }

  const combinedStatus = cap == null ? "no-cap" : statusFor(cPct, warnAt) as "ok" | "warn" | "breach";
  if (combinedStatus === "breach" && cap != null) {
    findings.unshift({
      severity: "HIGH", campaign: "(account)",
      message: `Combined spend today (${spendToday.toFixed(2)}) has passed the pro-rata daily share (${cap.toFixed(2)}) of the monthly budget. Proposal: review which campaign is over-pacing. No change has been made.`,
    });
  }

  return { date: latest, campaigns, combined: { spendToday, cap, pct: cPct, projectedEod, status: combinedStatus }, findings };
}
