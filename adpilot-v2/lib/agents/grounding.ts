// Compact, read-only grounding from the org's latest saved analysis + open proposals.
// Pure + defensive (tolerates missing/partial payload, non-array recs, malformed
// health/findings/weakest shapes) so it can be unit-tested without a database.
// Lives in lib/ — NOT in the route file — because Next.js route modules may only export
// HTTP handlers + config; exporting a helper from route.ts fails the production build.

const money = (n: any) => (n == null || isNaN(+n) ? "?" : `$${(+n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const num = (n: any) => (n == null || isNaN(+n) ? "?" : (+n).toFixed(2));

export function buildGrounding(payload: any, recs: any[]): string {
  const recList = Array.isArray(recs) ? recs.filter(Boolean) : [];
  const s = payload && typeof payload === "object" ? payload.summary : null;
  const h = payload && typeof payload === "object" ? payload.health : null;
  const hasSummary = s && typeof s === "object";
  const hasHealth = h && typeof h === "object";

  if (!hasSummary && !hasHealth && recList.length === 0) {
    return "ACCOUNT CONTEXT: no analysed data yet (nothing synced or uploaded). Give general, safe guidance and tell the user to connect an account or paste a CSV for specific numbers.";
  }
  const lines: string[] = ["ACCOUNT CONTEXT (read-only, latest analysis):"];
  if (hasSummary) {
    lines.push(`- Spend ${money(s.spend)} · leads ${s.leads ?? "?"} · purchases ${s.purchases ?? "?"} · revenue ${money(s.revenue)} · CPA ${money(s.cpa)} · ROAS ${num(s.roas)} · MER ${num(s.mer)}.`);
    lines.push(`- Break-even CPA ${money(s.break_even_cpa)} · break-even ROAS ${num(s.break_even_roas)}.`);
  }
  if (hasHealth) {
    const weakest = (Array.isArray(h.weakest) ? h.weakest : []).slice(0, 3)
      .map((w: any) => (typeof w === "string" ? w : w?.label || w?.key || w?.name))
      .filter(Boolean).join(", ");
    const total = Number.isFinite(+h.total) ? Math.round(+h.total) : "?";
    lines.push(`- Health ${total}/100 (${h.band ?? "?"})${weakest ? ` · weakest: ${weakest}` : ""}.`);
    const crit = (Array.isArray(h.findings) ? h.findings : [])
      .filter((f: any) => f && f.severity === "CRITICAL").slice(0, 4)
      .map((f: any) => f.message).filter(Boolean);
    if (crit.length) lines.push(`- Critical findings: ${crit.join("; ")}`);
  }
  if (recList.length) {
    const open = recList.slice(0, 8)
      .map((r) => `${r.verdict ?? "?"} → ${r.entity_name ?? "?"}`)
      .join("; ");
    lines.push(`- Open proposals: ${open}.`);
  }
  return lines.join("\n");
}
