import "server-only";

// P6.4 — "What to test next" recommender. Deterministic, ICE-ranked, PROPOSE-ONLY test backlog
// derived from the engine's weak health factors + per-ad decisions. Every idea is a one-variable
// hypothesis with a primary metric, a required budget (break-even CPA × 15 conversions), a 7–14 day
// read-out, and a PAUSED-DUPLICATE setup — never a live edit. Pure; null-safe; never throws.

export interface IceScore { impact: number; confidence: number; ease: number; score: number }

export interface TestIdea {
  id: string;
  variable: string;          // the single thing being changed
  hypothesis: string;        // one-variable hypothesis
  primaryMetric: string;     // the metric + target that reads out the test
  requiredBudgetAud: number | null; // break-even CPA × 15 conversions (null if unknown)
  readoutDays: number;       // 7–14
  setup: string;             // paused-duplicate proposal (read-only)
  source: string;            // which weak factor / signal drove this
  ice: IceScore;
}

interface Template {
  key: string;               // canonical variable
  tokens: string[];          // weak-factor substrings that map here
  hypothesis: string;
  primaryMetric: string;
  readoutDays: number;
  impact: number;            // 1–10 base
  confidence: number;        // 1–10 base
  ease: number;              // 1–10 base
}

// One template per testable lever. Tracking is intentionally absent — a broken pixel is a FIX
// (Atlas territory), not an A/B test.
const TEMPLATES: Template[] = [
  { key: "hook", tokens: ["creative", "ctr", "hook", "fatigue", "hold", "thumb"],
    hypothesis: "Test 3 fresh opening hooks against the current winning angle (one variable: the first ~2s).",
    primaryMetric: "Hook rate / CTR — target ≥ the account's trailing best", readoutDays: 7, impact: 9, confidence: 7, ease: 8 },
  { key: "offer", tokens: ["offer", "offer_strength", "value"],
    hypothesis: "Test a stronger offer framing (risk-reversal or value-stack) vs the current offer.",
    primaryMetric: "CVR and CPL — target below break-even CPL", readoutDays: 14, impact: 9, confidence: 6, ease: 5 },
  { key: "landing_page", tokens: ["landing", "landing_page", "page", "alignment", "lp"],
    hypothesis: "Test a message-match landing-page headline that mirrors the winning ad hook.",
    primaryMetric: "Landing-page CVR — target +20% vs control", readoutDays: 14, impact: 8, confidence: 6, ease: 4 },
  { key: "audience", tokens: ["audience", "targeting", "reach", "frequency", "saturation"],
    hypothesis: "Test a broad (age/geo-only) audience against the current interest stack; let the creative find the audience.",
    primaryMetric: "CPA / CPL at equal spend", readoutDays: 14, impact: 6, confidence: 5, ease: 7 },
  { key: "placement", tokens: ["placement", "cpm", "delivery"],
    hypothesis: "Test a Reels/Stories-only placement against Advantage+ placements.",
    primaryMetric: "CPM and CTR by placement", readoutDays: 7, impact: 5, confidence: 5, ease: 7 },
];

function normalise(v: any): string {
  return String(typeof v === "string" ? v : v?.label || v?.key || v?.name || "").toLowerCase();
}

const clamp10 = (n: number) => Math.max(1, Math.min(10, n));

// Build the ICE-ranked, propose-only test backlog. `opts.max` caps the list (default 6).
export function recommendTests(payload: any, opts: { max?: number } = {}): TestIdea[] {
  const p = payload && typeof payload === "object" ? payload : {};
  const h = p.health && typeof p.health === "object" ? p.health : {};
  const weakest = (Array.isArray(h.weakest) ? h.weakest : []).map(normalise).filter(Boolean);
  const decisions = Array.isArray(p.decisions) ? p.decisions.filter(Boolean) : [];
  const breakEvenCpa = Number.isFinite(+p?.summary?.break_even_cpa) ? +p.summary.break_even_cpa : null;
  const requiredBudgetAud = breakEvenCpa != null ? Math.round(breakEvenCpa * 15) : null;

  // Signals that bump confidence: a "refresh" verdict (creative is dying) → the hook test; a
  // weak factor naming a template's token → that template.
  const wantsRefresh = decisions.some((d: any) => d?.verdict === "refresh");

  const chosen = new Map<string, TestIdea>();
  const consider = (t: Template, source: string, confBump: number) => {
    if (chosen.has(t.key)) {
      // strengthen confidence if a second signal points at the same lever
      const cur = chosen.get(t.key)!;
      cur.ice.confidence = clamp10(cur.ice.confidence + 1);
      cur.ice.score = cur.ice.impact * cur.ice.confidence * cur.ice.ease;
      return;
    }
    const confidence = clamp10(t.confidence + confBump);
    chosen.set(t.key, {
      id: `TEST-${t.key}`,
      variable: t.key,
      hypothesis: t.hypothesis,
      primaryMetric: t.primaryMetric,
      requiredBudgetAud,
      readoutDays: t.readoutDays,
      setup: "Set up as a PAUSED DUPLICATE — the original keeps running untouched; publish manually after human review.",
      source,
      ice: { impact: t.impact, confidence, ease: t.ease, score: t.impact * confidence * t.ease },
    });
  };

  // 1) Weak health factors → matching templates (the primary driver).
  for (const w of weakest) {
    const t = TEMPLATES.find((tpl) => tpl.tokens.some((tok) => w.includes(tok)));
    if (t) consider(t, `weak factor: ${w}`, 1); // +1 confidence: the engine flagged it
  }
  // 2) A "refresh" verdict means creative is dying → ensure the hook test is on the list.
  if (wantsRefresh) consider(TEMPLATES[0], "per-ad verdict: refresh", 1);

  return Array.from(chosen.values())
    .sort((a, b) => b.ice.score - a.ice.score)
    .slice(0, opts.max ?? 6);
}
