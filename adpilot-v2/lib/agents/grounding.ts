// Compact, read-only grounding from the org's latest saved analysis + open proposals.
// Pure + defensive (tolerates missing/partial payload, non-array recs, malformed
// health/findings/weakest shapes) so it can be unit-tested without a database.
// Lives in lib/ — NOT in the route file — because Next.js route modules may only export
// HTTP handlers + config; exporting a helper from route.ts fails the production build.
//
// P4.2: `buildStructuredGrounding` returns a structured object (winners/losers, campaign
// breakdown, anomalies/fatigue, and a "what changed" delta vs the previous report). The legacy
// string `buildGrounding` is RETAINED and now renders a superset of that object, so callers see
// the same core lines plus the richer context — and the route's char-cap still bounds it.

const money = (n: any) => (n == null || isNaN(+n) ? "?" : `$${(+n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const num = (n: any) => (n == null || isNaN(+n) ? "?" : (+n).toFixed(2));

export interface GroundingDecision { name: string; verdict: string; platform?: string; reason?: string }

export interface StructuredGrounding {
  hasData: boolean;
  summary: Record<string, number | null> | null;
  health: { total: number | null; band: string | null; weakest: string[]; critical: string[] } | null;
  winners: GroundingDecision[];   // scale / keep
  losers: GroundingDecision[];    // kill / reduce / refresh / fix-tracking
  campaigns: Array<{ campaign: string; spend: number | null; cpa: number | null; roas: number | null; health: number | null; band: string | null }>;
  anomalies: Array<{ metric: string; direction: string | null; severity: string | null }>;
  fatigue: Array<{ ad: string; status: string | null; onsetDaysAgo: number | null }>;
  openProposals: Array<{ verdict: string; entity: string }>;
  whatChanged: string[];
}

const WINNER_VERDICTS = new Set(["scale", "keep"]);
const LOSER_VERDICTS = new Set(["kill", "reduce", "refresh", "fix-tracking"]);

function decName(d: any): string {
  return String(d?.name || d?.entity_name || d?.ad_name || d?.entity || "(ad)");
}

// Structured grounding object (P4.2). `prev` is the previous report payload, used for the delta.
export function buildStructuredGrounding(payload: any, recs: any[], prev?: any): StructuredGrounding {
  const recList = Array.isArray(recs) ? recs.filter(Boolean) : [];
  const p = payload && typeof payload === "object" ? payload : {};
  const s = p.summary && typeof p.summary === "object" ? p.summary : null;
  const h = p.health && typeof p.health === "object" ? p.health : null;
  const decisions = Array.isArray(p.decisions) ? p.decisions.filter(Boolean) : [];

  const summary = s
    ? { spend: nz(s.spend), leads: nz(s.leads), purchases: nz(s.purchases), revenue: nz(s.revenue), cpa: nz(s.cpa), roas: nz(s.roas), mer: nz(s.mer), break_even_cpa: nz(s.break_even_cpa), break_even_roas: nz(s.break_even_roas) }
    : null;

  const health = h
    ? {
        total: Number.isFinite(+h.total) ? Math.round(+h.total) : null,
        band: h.band ?? null,
        weakest: (Array.isArray(h.weakest) ? h.weakest : []).slice(0, 3)
          .map((w: any) => (typeof w === "string" ? w : w?.label || w?.key || w?.name)).filter(Boolean),
        critical: (Array.isArray(h.findings) ? h.findings : [])
          .filter((f: any) => f && f.severity === "CRITICAL").slice(0, 4).map((f: any) => f.message).filter(Boolean),
      }
    : null;

  const winners: GroundingDecision[] = decisions.filter((d: any) => WINNER_VERDICTS.has(d?.verdict)).slice(0, 3)
    .map((d: any) => ({ name: decName(d), verdict: d.verdict, platform: d.platform, reason: d.reason || d.proposal }));
  const losers: GroundingDecision[] = decisions.filter((d: any) => LOSER_VERDICTS.has(d?.verdict)).slice(0, 3)
    .map((d: any) => ({ name: decName(d), verdict: d.verdict, platform: d.platform, reason: d.reason || d.proposal }));

  const campaigns = (Array.isArray(p.campaigns) ? p.campaigns : []).slice(0, 5)
    .map((c: any) => ({ campaign: c?.campaign ?? "(campaign)", spend: nz(c?.spend), cpa: nz(c?.cpa), roas: nz(c?.roas), health: nz(c?.health), band: c?.band ?? null }));

  const anomalies = (Array.isArray(p.anomalies) ? p.anomalies : []).slice(0, 5)
    .map((a: any) => ({ metric: String(a?.metric ?? ""), direction: a?.direction ?? null, severity: a?.severity ?? null }));
  const fatigue = (Array.isArray(p.fatigue) ? p.fatigue : []).slice(0, 5)
    .map((f: any) => ({ ad: String(f?.ad ?? "(ad)"), status: f?.status ?? null, onsetDaysAgo: nz(f?.onsetDaysAgo) }));

  const openProposals = recList.slice(0, 8).map((r) => ({ verdict: String(r.verdict ?? "?"), entity: String(r.entity_name ?? "?") }));

  return {
    hasData: Boolean(summary || health || openProposals.length),
    summary, health, winners, losers, campaigns, anomalies, fatigue, openProposals,
    whatChanged: deltaLines(s, h, prev),
  };
}

function nz(v: any): number | null { return v == null || isNaN(+v) ? null : +v; }

// "What changed" vs the previous report — only the few headline deltas, plain-English.
function deltaLines(s: any, h: any, prev: any): string[] {
  const ps = prev && typeof prev === "object" ? prev.summary : null;
  const ph = prev && typeof prev === "object" ? prev.health : null;
  const out: string[] = [];
  if (h && ph && Number.isFinite(+h.total) && Number.isFinite(+ph.total)) {
    const d = Math.round(+h.total) - Math.round(+ph.total);
    if (d !== 0) out.push(`Health ${Math.round(+ph.total)}→${Math.round(+h.total)} (${d > 0 ? "+" : ""}${d}).`);
  }
  const pair = (label: string, a: any, b: any, fmt: (x: any) => string) => {
    if (a == null || b == null || isNaN(+a) || isNaN(+b)) return;
    if (+a !== +b) out.push(`${label} ${fmt(b)}→${fmt(a)}.`);
  };
  if (s && ps) {
    pair("ROAS", s.roas, ps.roas, (x) => `${num(x)}×`);
    pair("CPA", s.cpa, ps.cpa, (x) => money(x));
    pair("Spend", s.spend, ps.spend, (x) => money(x));
  }
  return out;
}

// Legacy string grounding (back-compat) — now a rendered superset of the structured object.
export function buildGrounding(payload: any, recs: any[], prev?: any): string {
  const g = buildStructuredGrounding(payload, recs, prev);
  if (!g.hasData) {
    return "ACCOUNT CONTEXT: no analysed data yet (nothing synced or uploaded). Give general, safe guidance and tell the user to connect an account or paste a CSV for specific numbers.";
  }
  const lines: string[] = ["ACCOUNT CONTEXT (read-only, latest analysis):"];
  const s = g.summary;
  if (s) {
    lines.push(`- Spend ${money(s.spend)} · leads ${s.leads ?? "?"} · purchases ${s.purchases ?? "?"} · revenue ${money(s.revenue)} · CPA ${money(s.cpa)} · ROAS ${num(s.roas)} · MER ${num(s.mer)}.`);
    lines.push(`- Break-even CPA ${money(s.break_even_cpa)} · break-even ROAS ${num(s.break_even_roas)}.`);
  }
  if (g.health) {
    lines.push(`- Health ${g.health.total ?? "?"}/100 (${g.health.band ?? "?"})${g.health.weakest.length ? ` · weakest: ${g.health.weakest.join(", ")}` : ""}.`);
    if (g.health.critical.length) lines.push(`- Critical findings: ${g.health.critical.join("; ")}`);
  }
  if (g.winners.length) lines.push(`- Top performers: ${g.winners.map((w) => `${w.verdict} → ${w.name}`).join("; ")}.`);
  if (g.losers.length) lines.push(`- Underperformers: ${g.losers.map((w) => `${w.verdict} → ${w.name}`).join("; ")}.`);
  if (g.anomalies.length) lines.push(`- Sudden changes: ${g.anomalies.map((a) => `${a.metric}${a.direction ? ` ${a.direction}` : ""}${a.severity ? ` (${a.severity})` : ""}`).join("; ")}.`);
  if (g.fatigue.length) lines.push(`- Creative fatigue: ${g.fatigue.map((f) => `${f.ad}${f.status ? ` (${f.status})` : ""}${f.onsetDaysAgo != null ? ` ~${f.onsetDaysAgo}d ago` : ""}`).join("; ")}.`);
  if (g.openProposals.length) lines.push(`- Open proposals: ${g.openProposals.map((r) => `${r.verdict} → ${r.entity}`).join("; ")}.`);
  if (g.whatChanged.length) lines.push(`- What changed since last report: ${g.whatChanged.join(" ")}`);
  return lines.join("\n");
}
