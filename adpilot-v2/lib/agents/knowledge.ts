import "server-only";

// Durable, dated, sourced domain knowledge that grounds the AI specialists.
// This is the committed baseline (source of truth). Treat all figures as RANGES and
// GUIDANCE, not guarantees — they vary by vertical, geo, and season.
// Last researched: 2026-06-15.

export type KnowledgeDomain = "meta" | "tiktok" | "policy" | "seo" | "finance_content" | "cro" | "lead_gen";
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
      "Click-to-Message (CTWA / Messenger objective): optimise on CONVERSATIONS STARTED, not link CTR, and track cost-per-conversation rather than link CPC. Quality signals: reply rate (a high reply rate signals genuine intent) and reply depth (multi-turn replies beat one-and-done). Exiting Meta's learning phase needs ~50 optimisation events/ad-set/week, so under-funded ad sets stall in learning — fund an ad set to a fair test budget before judging it on conversation volume. If a funded ad set still produces ~0 conversations after a fair test (≥3 days), the issue is creative/offer, not budget. (Account-specific cost-per-conversation and qualified-lead targets load from the active business context pack, not this baseline.)",
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
    updated: "2026-06-18",
    body: [
      "Benchmarks (ranges): CPM ~$5–9 (often cheaper reach than Meta); in-feed CTR ~0.6–0.85%; conversion rate ~0.5–1.9%. TikTok's CTR norms run well below Meta's — judge an ad against the VERTICAL, not Meta's numbers, before calling it weak.",
      "Creative diagnostics: hook rate (2s views ÷ impressions) target ~35%; hold rate (6s focused-view ÷ 2s views) target ~45%. A 3s view-rate above ~40% signals a hook the algorithm will distribute. ~71% of whether viewers keep watching is decided in the first ~3 seconds.",
      "Note: 'ThruPlay' is a Meta metric (15s or completion); TikTok measures at 2s plus a 6s view — don't conflate them.",
      "Sound is a primary discovery signal: most feed time is sound-ON, so design sound-first — sync the hook to a trending/native audio in the first ~0.5s. Silent, wrong-aspect, or obviously-repurposed Meta creative underperforms regardless of copy. Check trending sounds (Creative Center) before each creative batch; always add on-screen captions too.",
      "Native format wins: 9:16 full-screen, creator-style UGC / talking-to-camera over polished brand films, fast cuts, captions, and a clear single CTA. Reframe and re-edit (don't just reupload) anything made for Meta or landscape.",
      "Spark Ads (boost an organic creator or brand post — keeps its handle, likes & comments) typically beat in-feed non-Spark on CTR/CVR and add social trust; high leverage. Sourcing: pick creators by NICHE FIT + genuine engagement rate (not raw follower count); get a Spark/authorisation code; brief them on the hook + one CTA; keep every claim compliant (Paige has final say).",
      "Targeting: TikTok's algorithm finds the buyer — start BROAD (age/geo only) and let creative do the targeting; broad often beats narrow interest stacks. Cold audiences convert better here than on Meta. When performance dips, refresh the CREATIVE, not the targeting.",
      "Length: ~15s favours top-of-funnel reach; ~21–34s tends to produce the best in-feed CTR/CVR.",
      "Fatigue is faster than any other platform — rotate 3–5 fresh hooks every 7–14 days; queue the next batch before CTR actually drops (an ad running flat for 2+ weeks is already losing algorithmic priority).",
      "Read engagement signals: high saves = strong intent; high shares = reach/virality; comments = brand affinity. Falling CTR with steady watch-time ⇒ early creative fatigue (fix the hook). Steady CTR but falling CVR ⇒ offer / landing-page problem, not creative.",
      "Failure→action: low CTR (<~0.8%) ⇒ almost always a weak first ~1.7s hook, sound-off design, or non-native cues — fix the hook first.",
    ].join("\n"),
    sources: [
      "https://lebesgue.io/tiktok-ads/tiktok-ads-benchmarks-for-ctr-cr-and-cpm",
      "https://www.mbadv.agency/tiktok-ads/metrics-and-costs",
      "https://www.adsights.ai/blog/topics/ad-performance/thruplay-tiktok-meta-youtube-comparison-2026",
      "https://www.hivehq.ai/blog/tik-tok-spark-ads-best-practices",
      "https://www.webfx.com/blog/social-media/tiktok-benchmarks/",
      "https://ads.tiktok.com/business/creativecenter",
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
      "ACCC / Australian Consumer Law: no misleading or deceptive representations about savings, prices, results or outcomes — every claim (e.g. '$X saved', 'X% off', 'results in Y days') must be substantiated and able to be backed up, or omit it.",
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
  finance_content: {
    title: "Finance / business-education content advertising (compliant, numbers-first)",
    updated: "2026-06-15",
    body: [
      "Category framing: this is financial/business EDUCATION content, never personal financial advice. Use 'this is how it works' framing, not 'you should do this'. Never guarantee, imply, or strongly suggest a specific financial outcome for an individual.",
      "Numbers-first hook: open every creative with a specific number, dollar figure, or percentage — not a vague tease or a 'most people don't know' claim. The first line of Meta copy (or first ~2 seconds on TikTok) must carry the number.",
      "Show the maths: state the assumption, run the calculation, show the result. One concept, one calculation, one takeaway per ad unit; if the figure can't be shown in the unit, the landing page or link must show it.",
      "Australian context: AUD (never USD unless explicitly comparing); reference GST (not VAT), ATO (not IRS), ACCC / Australian Consumer Law (not FTC), superannuation (not 401k), PAYG. Regulatory references must be accurate; when unsure, describe the concept and point to a registered professional.",
      "Banned hook words for this category: secret/secrets, guru, get rich (quick), guaranteed returns/results, 'passive income' unless immediately qualified with real numbers and caveats, 'financial freedom' as a standalone promise, and 'wealth/wealthy' as a hook without a specific number.",
      "Meta restricted category: financial products & services is restricted — no specific earnings claims, no implied guaranteed results; follow Meta's current financial-services ad policy. ACCC: do not make misleading representations about savings/outcomes; if a claim can't be substantiated, don't make it.",
      "Disclaimer discipline: any unit that could reasonably read as financial advice must carry a plain-language disclaimer — minimum: 'General information only, not personal financial advice. Speak to a registered adviser for advice specific to your situation.'",
      "Compliant CTAs point to content/tools/opt-ins (e.g. 'Get the free margin calculator', 'Watch the full breakdown', 'Download the P&L explainer'), never to a financial product, investment offer, or an 'earn more / make more money today' promise.",
    ].join("\n"),
    sources: [
      "https://transparency.meta.com/policies/ad-standards/",
      "https://www.accc.gov.au/business/advertising-and-promoting-your-business/false-or-misleading-claims",
      "https://moneysmart.gov.au/",
    ],
  },
  cro: {
    title: "Conversion-rate optimisation & offer-funnel",
    updated: "2026-06-17",
    body: [
      "Benchmarks (ranges; SOURCE matters more than vertical): median landing-page CVR ~6–7%; 'good' ≥10%. By source: paid search ~3–4%, PAID SOCIAL (cold) ~1–2%, email ~15–20%. Cold social has no active intent — judge it against ~1–3%, not against search/email; routing paid clicks to a homepage can suppress CVR ~4–5×.",
      "Levers, by leverage: (1) MESSAGE-MATCH ad↔landing page (headline/offer/visual must mirror the ad); (2) page speed (LCP <~2.5s; ~53% of mobile users abandon >~3s); (3) form length; (4) ONE clear CTA; (5) social proof above the fold.",
      "Form length: CVR ~20–25% at 3 fields → ~17% at 5 → ~11% at 7 → ~3–7% at 10+. Keep lead forms to ~3–5 fields; ask only what sales needs; removing a field tends to lift conversion ~10–20%.",
      "Mobile-first (most paid-social traffic is mobile) and trust/proof near the CTA matter; a weak or unclear offer caps everything downstream — systematic CRO commonly lifts CVR ~30–80% but it compounds the offer, it can't rescue a bad one.",
      "'CPL fine but no sales' is usually NOT media: ~79% of leads never convert (slow follow-up, generic messaging, bad data). Walk the funnel in order — offer → landing page (match/speed/mobile/form/proof) → qualification → speed-to-lead → close. Shift from CPL to cost-per-QUALIFIED-lead and CPA.",
      "Failure→action (Titan): low LP CVR with healthy CTR/CPC ⇒ landing-page/offer problem, not media — check message-match + speed first. Cheap leads + zero sales ⇒ diagnose qualification + speed-to-lead + offer before any budget change. Frame fixes as tests/ranges, never guaranteed outcomes.",
    ].join("\n"),
    sources: [
      "https://www.digitalapplied.com/blog/conversion-rate-benchmarks-2026-industry-channel",
      "https://www.apexure.com/blog/landing-page-conversion-rate-benchmarks-by-industry",
      "https://ventureharbour.com/how-form-length-impacts-conversion-rates/",
      "https://foundrycro.com/blog/google-ads-landing-page-best-practices-2026/",
    ],
  },
  lead_gen: {
    title: "Lead quality, qualification & close-rate benchmarks",
    updated: "2026-06-17",
    body: [
      "Close-rate (lead→sale; ranges, vary by vertical/source/deal size): overall ~20% (B2B ~21%); SaaS ~22%, finance ~19%; booked-enquiry trades higher; quote/proposal-stage win rates far higher (~45–50%). Never compare an 'all-leads' rate to a 'quoted-only' rate.",
      "Channel quality differs sharply: REFERRAL closes best (pre-trusted), organic search strong, PAID SOCIAL (cold) weakest (~8–18% MQL→SQL). Paid-social leads SHOULD close lower than referral/search — a channel-intent gap, not necessarily a broken funnel. Measure stage-to-stage; drop-off compounds.",
      "Speed-to-lead is the biggest controllable lever: contacting within ~5 min vs ~30 min lifts contact/qualify rates dramatically; ~78% of buyers go with whoever responds first, yet only ~7% respond within 5 min — fast follow-up often beats more ad spend.",
      "Lead-quality signals: intent/behaviour (form depth, requested a quote/booking), firmographic/geo fit, contact-data validity, source. Low reply rates, junk data, out-of-area enquiries flag a TARGETING/qualification problem, not a media-volume problem.",
      "Media vs lead-quality/follow-up problem: cheap + plentiful leads that don't close ⇒ qualification/speed/offer (NOT the campaign); expensive/thin leads ⇒ media/creative/targeting. Shift the headline metric from CPL to cost-per-qualified-lead (CPQL) and CPA.",
      "Break-even maths (context for AdPilot's lead-gen verdicts): beCPL = break-even CPA × close rate (= target CPA ÷ leads-per-sale). Target CPA $200 at 20% close ⇒ beCPL ≈ $40; at 10% ⇒ ≈ $20. A 'cheap' CPL above its modelled beCPL still loses money — a low close rate, not the media, is usually what makes a lead-gen account unprofitable. AUD; require the client's real numbers before a verdict; no guaranteed-results claims.",
    ].join("\n"),
    sources: [
      "https://prospeo.io/s/lead-to-close-rate",
      "https://prooflytics.io/blog/mql-to-sql-conversion-rate-benchmarks",
      "https://www.apten.ai/blog/speed-to-lead-benchmarks-2026",
      "https://prospeo.io/s/average-cost-per-lead",
    ],
  },
};

// Which knowledge domains each specialist is grounded with.
export const AGENT_KNOWLEDGE: Record<string, KnowledgeDomain[]> = {
  command: [], // router: decides which specialist owns the request — no benchmark tables needed (token saving)
  mira: ["meta", "policy"],
  travis: ["tiktok", "policy"],
  dana: ["meta", "tiktok", "lead_gen"], // unit economics + close-rate / break-even-CPL maths
  stella: ["meta", "tiktok", "policy"],
  titan: ["cro", "meta", "seo"], // offer/funnel: CRO is his core domain (was the biggest agent↔knowledge gap)
  atlas: ["meta", "tiktok"],
  riley: ["meta", "tiktok"],
  paige: ["policy", "finance_content"], // finance verticals carry the strictest claims rules
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
