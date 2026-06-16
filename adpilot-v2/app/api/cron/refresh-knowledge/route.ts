import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { researchWithWebSearch, NoKeyError } from "@/lib/ai/claude";
import { KNOWLEDGE, type KnowledgeDomain } from "@/lib/agents/knowledge";
import { parseJson } from "@/lib/agents/refresh";

export const runtime = "nodejs";
export const maxDuration = 300;

// Scheduled knowledge auto-refresh. Uses Anthropic's server-side web_search to re-pull
// current public data and overwrite the per-domain docs the specialists read. Falls back
// to the committed baseline when ANTHROPIC_API_KEY is absent. Secured by CRON_SECRET.
const DOMAINS: { domain: KnowledgeDomain; topic: string }[] = [
  { domain: "meta", topic: "Meta (Facebook/Instagram) paid-ads optimization — CTR/CPC/CPM/ROAS benchmarks by vertical, creative-fatigue & frequency thresholds, Advantage+ best practices, and common failure→action rules" },
  { domain: "tiktok", topic: "TikTok ads optimization — hook rate, hold rate, CTR/CPM benchmarks, Spark Ads, creative cadence/fatigue, and common failure→action rules" },
  { domain: "policy", topic: "Meta and TikTok advertising POLICY essentials — prohibited/restricted categories, personal-attribute & claims rules, AI-content labeling, and risky→compliant rewrites" },
  { domain: "seo", topic: "SEO and Answer-Engine-Optimization (AEO) best practices for small businesses — Google Business Profile, local SEO, reviews-as-signals, and AI search visibility" },
];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = cronAuthorized(req, secret);
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Knowledge refresh needs ANTHROPIC_API_KEY (web search); using committed baseline.", refreshed: 0 }, { status: 503 });
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  let refreshed = 0;
  const errors: string[] = [];

  for (const { domain, topic } of DOMAINS) {
    try {
      const user = `Using the web_search tool, research the CURRENT (as of ${today}) best practices and benchmarks for: ${topic}.
Cross-check at least 3 reputable sources. Return ONLY a JSON object, no prose, no markdown fence:
{"title":"<short title>","body":"<150-280 words: benchmarks as RANGES with caveats (vary by vertical/geo/season), key thresholds, and failure→action rules — guidance, not guarantees>","sources":["<url>","<url>","<url>"]}`;
      const text = await researchWithWebSearch({ user, maxUses: 5, maxTokens: 2000 });
      const parsed = parseJson(text);
      const body = parsed && typeof parsed.body === "string" ? parsed.body.trim() : "";
      // Require real content before we overwrite a good baseline doc.
      if (!body || body.length < 40) { errors.push(`${domain}: unparseable`); continue; }
      const title = typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : KNOWLEDGE[domain].title;
      const sources = Array.isArray(parsed.sources)
        ? parsed.sources.filter((s: any) => typeof s === "string" && s.trim()).slice(0, 8)
        : [];
      const { error } = await admin.from("knowledge_docs").upsert({
        domain,
        title: title.slice(0, 200),
        body: body.slice(0, 6000),
        sources,
        model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
        updated_at: new Date().toISOString(),
      }, { onConflict: "domain" });
      if (error) { errors.push(`${domain}: ${error.message || "upsert failed"}`); continue; }
      refreshed++;
    } catch (e: any) {
      // No key ⇒ nothing further can succeed; stop the loop. Any other per-domain
      // failure is isolated: record it and keep refreshing the remaining domains.
      if (e instanceof NoKeyError) break;
      errors.push(`${domain}: ${e?.message || "failed"}`);
    }
  }
  return NextResponse.json({ refreshed, errors });
}
