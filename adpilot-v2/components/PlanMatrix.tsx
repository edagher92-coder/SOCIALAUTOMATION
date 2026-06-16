import { PLANS, planPriceLabel } from "@/lib/plans";
import { FEATURE_MIN_PLAN, FEATURE_LABEL, PLAN_LABEL, can, requiredPlan, type Feature } from "@/lib/entitlements";

// Tier comparison matrix — the differentiation surface. Driven entirely by PLANS + entitlements,
// so it can never drift from what the app actually gates. Presentational/server-renderable.
// A ✓ means the tier includes the feature; the cheapest tier that unlocks each row is emphasised
// (that's the "what you gain by upgrading" cue). Prices come from planPriceLabel (owner-gated).
export default function PlanMatrix() {
  const features = Object.keys(FEATURE_MIN_PLAN) as Feature[];
  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="p-3 text-left text-xs font-bold uppercase tracking-wide text-muted">Feature</th>
            {PLANS.map((p) => (
              <th key={p.id} className={`p-3 text-center ${p.mostPopular ? "bg-brand-50" : ""}`}>
                <div className="font-extrabold">{p.label}</div>
                <div className="text-xs font-semibold text-brand">{planPriceLabel(p)}</div>
                {p.mostPopular && <div className="text-2xs font-bold uppercase tracking-wide text-brand">Most popular</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((f) => {
            const need = requiredPlan(f);
            return (
              <tr key={f} className="border-b border-border-subtle/60">
                <td className="p-3 font-semibold text-ink">{FEATURE_LABEL[f]}</td>
                {PLANS.map((p) => {
                  const has = can(p.id, f);
                  const isUnlockTier = p.id === need; // cheapest tier that adds this feature
                  return (
                    <td key={p.id} className={`p-3 text-center ${p.mostPopular ? "bg-brand-50/50" : ""}`}>
                      {has
                        ? <span className={isUnlockTier ? "font-extrabold text-teal" : "text-teal"} title={isUnlockTier ? `New in ${PLAN_LABEL[need]}` : undefined}>✓</span>
                        : <span className="text-muted/40">—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
