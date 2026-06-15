import "server-only";

// Durable, dated, sourced domain knowledge that grounds the AI specialists.
// This is the committed baseline (source of truth). Treat all figures as RANGES and
// GUIDANCE, not guarantees — they vary by vertical, geo, and season.
// Last researched: 2026-06-15.

export type KnowledgeDomain = "meta" | "tiktok" | "policy" | "seo";
export type KnowledgeDoc = { title: string; updated: string; body: string; sources: string[] };

export const KNOWLEDGE: Record<KnowledgeDomain, KnowledgeDoc> = {
  meta: {
    title: "Meta (Facebook/Instagram) ad optimization",
    updated: "2026-06-15",
    body: [
      "Benchmarks (ranges; vary by vertical/geo): global average CTR ~1.5–1.8%. Strong verticals: fashion/home decor ~2.8–2.9%; weaker: finance/insurance/healthcare ~0.7–1.0%. Video typically outperforms static (≈1.5–2.5% vs ≈0.8–1.5% CTR).",
      "Creative fatigue: refresh when frequency reaches ~2.5–3.0 OR CTR falls ≥20% from its baseline. CTR can drop ~40% after 4+ exposures — try to keep frequency below ~3.4 on cold audiences.",
      "Creative volume by daily spend: ~10–15 creatives at $100–300/day; 20–30 at $300–1k; 30–50 at $1k–5k; 50–100+ above $5k. Add 3–5 fresh variations weekly.",
      "Advantage+/automated: tends to cut CPA materially vs manual setups and lift CTR via real-time optimization; feed it plenty of creative diversity.",
      "Failure→action: spend with zero recorded results or flagged tracking ⇒ audit pixel/CAPI/events BEFORE any budget call (never scale/cut blind). High frequency + falling CTR ⇒ fatigue ⇒ launch fresh angles as PAUSED duplicates. Implausibly high ROAS ⇒ treat as a tracking anomaly, verify values.",
    ].join("\n"),
    sources: [
      "https://optifox.in/blog/meta-ads-best-practices-2026/",
      "https://www.adamigo.ai/blog/meta-ads-ctr-benchmarks-industry-2026",
      "https://www.digitalapplied.com/blog/facebook-ads-benchmarks-2026-cpc-cpm-ctr-industry",
      "https://mhigrowthengine.com/blog/meta-ads-benchmarks-ecommerce-2026/",
    ],
  },
  tiktok: {
    title: "TikTok ad optimization",
    updated: "2026-06-15",
    body: [
      "Benchmarks (ranges): CPM ~$5–9 (often cheaper reach than Meta); in-feed CTR ~0.6–0.85%; conversion rate ~0.5–1.9%.",
      "Creative diagnostics: hook rate (2s views ÷ impressions) target ~35%; hold rate (6s focused-view ÷ 2s views) target ~45%. A 3s view-rate above ~40% signals a hook the algorithm will distribute. ~71% of whether viewers keep watching is decided in the first ~3 seconds.",
      "Note: 'ThruPlay' is a Meta metric (15s or completion); TikTok measures at 2s plus a 6s view — don't conflate them.",
      "Length: ~15s favours top-of-funnel reach; ~21–34s tends to produce the best in-feed CTR/CVR.",
      "Fatigue is faster than any other platform — produce fresh variants every 7–14 days; run 3–5 creatives per ad group. Spark Ads (boosting organic creator/brand posts) can roughly double in-feed performance and add trust — high leverage.",
      "Failure→action: low CTR (<~0.8%) ⇒ almost always weak first ~1.7s hook, sound-off design, or non-native cues — fix the hook first. Engagement holding but intent dropping ⇒ early fatigue ⇒ refresh.",
    ].join("\n"),
    sources: [
      "https://lebesgue.io/tiktok-ads/tiktok-ads-benchmarks-for-ctr-cr-and-cpm",
      "https://www.mbadv.agency/tiktok-ads/metrics-and-costs",
      "https://www.adsights.ai/blog/topics/ad-performance/thruplay-tiktok-meta-youtube-comparison-2026",
      "https://www.hivehq.ai/blog/tik-tok-spark-ads-best-practices",
      "https://www.webfx.com/blog/social-media/tiktok-benchmarks/",
    ],
  },
  policy: {
    title: "Meta & TikTok ad policy essentials",
    updated: "2026-06-15",
    body: [
      "Meta personal attributes: don't state or imply a user's race, religion, age, health/medical condition, financial status, sexual orientation or similar. Avoid second-person 'you' copy that implies knowledge of an attribute (enforcement now targets indirect implications, automated).",
      "Meta data/claims: don't request financial info (income, debt, card/account numbers) or health info without permission. No misleading/unsupported claims — guaranteed income, instant weight loss, fake scarcity/reviews, unrealistic 'before/after' transformations.",
      "TikTok prohibited (absolute): illegal/controlled drugs & paraphernalia, weapons/explosives, counterfeit goods. No exaggerated/guaranteed results. AI-generated realistic depictions of people/scenes must be clearly labelled; misleading AI content is banned. Don't use tracking to collect health data.",
      "Rewrite risky→compliant: turn 'Struggling with [condition]?' into a product-focused, non-personal claim; remove guarantees/absolutes ('cure', 'guaranteed', '#1'); replace with substantiated, qualified language. Paige has final say on any copy.",
    ].join("\n"),
    sources: [
      "https://transparency.meta.com/policies/ad-standards/",
      "https://www.accelerateddigitalmedia.com/insights/guide-to-social-media-health-ad-restrictions-2026/",
      "https://ads.tiktok.com/help/article/tiktok-ads-policy-misleading-and-false-content",
      "https://www.auditsocials.com/platforms/meta-ad-policies",
    ],
  },
  seo: {
    title: "SEO / AEO for small business (2026)",
    updated: "2026-06-15",
    body: [
      "Visibility in 2026 is increasingly about being the best ANSWER (Answer-Engine Optimization), not just ranking — AI search systems must understand the business. Incomplete/inconsistent/unstructured info makes a business invisible to AI.",
      "Google Business Profile is now an AI marketing hub: complete every field; keep NAP (name/address/phone) identical everywhere; keep hours accurate (consistently-accurate hours get priority in AI local features); pick precise categories; write a keyword-relevant description.",
      "Reviews: AI reads the WORDS in reviews (not just star count) to match services — encourage reviews that mention the specific services you want to rank for.",
      "Foundations still matter: schema/structured data so AI can confidently use your info; consistent citations across directories; fast, crawlable pages; topical content that directly answers real customer questions.",
    ].join("\n"),
    sources: [
      "https://www.searchenginejournal.com/google-visibility-in-2026-depends-on-aeo/564227/",
      "https://thebrandhopper.com/learning-resources/local-seo-google-business-profile-best-practices-for-2026/",
      "https://www.amst.com/resources/2026-seo-checklist-for-small-businesses-from-google-business-profile-to-technical-seo-60384",
      "https://knapsackcreative.com/blog/seo/local-seo-aeo-trends",
    ],
  },
};

// Which knowledge domains each specialist is grounded with.
export const AGENT_KNOWLEDGE: Record<string, KnowledgeDomain[]> = {
  command: ["meta", "tiktok"],
  mira: ["meta", "policy"],
  travis: ["tiktok", "policy"],
  dana: ["meta", "tiktok"],
  stella: ["meta", "tiktok", "policy"],
  titan: ["meta", "seo"],
  atlas: ["meta", "tiktok"],
  riley: ["meta", "tiktok"],
  paige: ["policy"],
};

// Compact reference block for a specialist from the committed baseline (sync).
export function knowledgeFor(agentId: string): string {
  const domains = AGENT_KNOWLEDGE[agentId] || [];
  if (!domains.length) return "";
  return domains
    .map((d) => `## ${KNOWLEDGE[d].title} (current best practice, updated ${KNOWLEDGE[d].updated})\n${KNOWLEDGE[d].body}`)
    .join("\n\n");
}

// Same, but prefers freshly auto-refreshed docs from knowledge_docs (per domain),
// falling back to the committed baseline. Pass an admin Supabase client.
//
// Robustness: a live row only overrides the baseline when it carries a non-empty
// body — a blank/null body (e.g. a partial upsert) is ignored so the specialist
// always reads usable guidance. Each domain falls back independently, so one bad
// row never drops the others. A missing table / query error falls back wholesale.
export async function knowledgeForAgent(admin: any, agentId: string): Promise<string> {
  const domains = AGENT_KNOWLEDGE[agentId] || [];
  if (!domains.length) return "";
  const live: Record<string, { title: string; body: string; updated: string }> = {};
  try {
    const res = await admin?.from?.("knowledge_docs")?.select?.("domain,title,body,updated_at")?.in?.("domain", domains);
    const data = res?.data;
    for (const d of (Array.isArray(data) ? data : [])) {
      const row = d as any;
      const dom = row?.domain;
      // Only accept rows for domains this agent actually reads, with real content.
      if (!dom || !(dom in KNOWLEDGE) || !domains.includes(dom)) continue;
      const body = typeof row.body === "string" ? row.body.trim() : "";
      if (!body) continue;
      const title = typeof row.title === "string" && row.title.trim() ? row.title.trim() : KNOWLEDGE[dom as KnowledgeDomain].title;
      const updated = row.updated_at ? String(row.updated_at).slice(0, 10) : KNOWLEDGE[dom as KnowledgeDomain].updated;
      live[dom] = { title, body, updated };
    }
  } catch { /* table may not exist yet — fall back to baseline */ }
  return domains.map((dom) => {
    const doc = live[dom] || { title: KNOWLEDGE[dom].title, body: KNOWLEDGE[dom].body, updated: KNOWLEDGE[dom].updated };
    return `## ${doc.title} (current best practice, updated ${doc.updated})\n${doc.body}`;
  }).join("\n\n");
}
