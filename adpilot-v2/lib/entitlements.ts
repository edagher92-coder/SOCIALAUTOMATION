// Subscription entitlements — the single source of truth for feature gating by plan.
// Pure module (no DB / no server-only) so both UI and API routes can import it.
// To change what each tier unlocks, edit FEATURE_MIN_PLAN below — nothing else.

export type Plan = "free" | "starter" | "pro" | "expert";

export type Feature =
  | "csv_import"
  | "health_score"
  | "reports"
  | "api_connect"      // OAuth + dev-token connection
  | "auto_sync"        // cadence-based automated pulls
  | "ai_team"          // AI specialist layer
  | "content_publish"  // upload + schedule/publish own organic content (lower tiers up)
  | "creative_studio"  // AI-drafted creative + Canva/Adobe (higher tiers)
  | "messenger_automation" // no-prompt Messenger profile setup via Graph API (premium)
  | "ad_write"         // GUARDED live ad changes (pause/resume/budget) — top tier, double-gated
  | "lead_quality_loop" // inbound CRM/lead webhook → populates lead_quality_score
  | "multi_client"
  | "white_label"
  | "expert_plugins";  // team-built extras, top tier only

// Plan ladder, low → high. "agency" is an alias for the top "expert" tier.
export const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, pro: 2, expert: 3 };
export const PLAN_LABEL: Record<Plan, string> = { free: "Free", starter: "Starter", pro: "Pro", expert: "Expert" };

export function normalisePlan(raw?: string | null): Plan {
  const p = (raw || "free").toLowerCase().trim();
  if (p === "agency" || p === "enterprise") return "expert";
  if (p === "expert" || p === "pro" || p === "starter" || p === "free") return p as Plan;
  return "free";
}

// Minimum plan that unlocks each feature.
//   - The two TOP tiers (pro + expert) get the API automated plugins.
//   - Expert-only features are the team-built extras.
export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  csv_import: "free",
  health_score: "free",
  reports: "starter",
  api_connect: "pro",       // top two tiers
  auto_sync: "pro",         // top two tiers
  ai_team: "pro",           // top two tiers
  content_publish: "starter", // lower tiers up: upload + schedule/publish own content
  creative_studio: "pro",   // higher tiers: AI-drafted creative + Canva/Adobe
  messenger_automation: "expert", // premium: no-prompt Messenger profile setup
  ad_write: "expert",       // expert only — and additionally env-gated + typed-YES per action
  lead_quality_loop: "pro", // top two tiers: ingest CRM/lead events to score lead quality
  multi_client: "pro",
  white_label: "expert",    // expert only
  expert_plugins: "expert", // expert only — team-built additions
};

export const FEATURE_LABEL: Record<Feature, string> = {
  csv_import: "CSV import",
  health_score: "Health Score",
  reports: "Saved reports",
  api_connect: "API / dev-link connect",
  auto_sync: "Automated sync (cadence)",
  ai_team: "AI specialist team",
  content_publish: "Content upload & publishing",
  creative_studio: "AI Creative Studio",
  messenger_automation: "Messenger automation (no-prompt setup)",
  ad_write: "Guarded ad changes (pause/budget)",
  lead_quality_loop: "Lead-quality / CRM loop",
  multi_client: "Multi-client workspaces",
  white_label: "White-label reports",
  expert_plugins: "Expert plugins (team-built)",
};

export function can(plan: Plan, feature: Feature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** Smallest plan that satisfies a feature — handy for upgrade prompts. */
export function requiredPlan(feature: Feature): Plan {
  return FEATURE_MIN_PLAN[feature];
}
