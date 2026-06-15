import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { researchWithWebSearch, NoKeyError } from "@/lib/ai/claude";
import { KNOWLEDGE, type KnowledgeDomain } from "@/lib/agents/knowledge";

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

function parseJson(text: string): any | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1] : text;
  const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
  if (start < 0 || end < 0) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
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
      if (!parsed?.body) { errors.push(`${domain}: unparseable`); continue; }
      await admin.from("knowledge_docs").upsert({
        domain,
        title: parsed.title || KNOWLEDGE[domain].title,
        body: String(parsed.body).slice(0, 6000),
        sources: Array.isArray(parsed.sources) ? parsed.sources.slice(0, 8) : [],
        model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
        updated_at: new Date().toISOString(),
      }, { onConflict: "domain" });
      refreshed++;
    } catch (e: any) {
      if (e instanceof NoKeyError) break;
      errors.push(`${domain}: ${e?.message || "failed"}`);
    }
  }
  return NextResponse.json({ refreshed, errors });
}
