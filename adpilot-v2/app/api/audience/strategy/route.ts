import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError, modelFor } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { getAudienceInsights } from "@/lib/audience/insights";
import { buildAudienceProposals } from "@/lib/audience/proposals";

export const runtime = "nodejs";

// Audience Intelligence — Mira (Meta audience specialist) interprets the org's
// AGGREGATE follower demographics and proposes numbers-first moves. Recomputes
// server-side from the stored insights (never trusts client-supplied numbers).
// Everything is a PROPOSAL the human approves; nothing is applied to a live account.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(await planForOrg(orgId), "ai_team")) {
    return NextResponse.json({ error: "The AI specialist team is a Pro & Expert feature. Upgrade on Billing.", upgrade: true }, { status: 402 });
  }

  const insights = await getAudienceInsights(orgId);
  const p = buildAudienceProposals(insights);
  const mira = getAgent("mira");

  const facts = [
    `Platform: ${insights.platform}; ${insights.followerCount.toLocaleString("en-AU")} followers${insights.source === "sample" ? " (SAMPLE data — state this up front)" : ""}.`,
    `Gender: ${p.femalePct}% women / ${p.malePct}% men.`,
    `Age bands: ${insights.ageGender.map((r) => `${r.bracket} ${Math.round(r.female + r.male)}%`).join(", ")}. Largest: ${p.dominant.bracket} (${p.dominant.sharePct}%).`,
    `Top locations: ${insights.topLocations.slice(0, 4).map((l) => `${l.name} ${l.share}%`).join(", ")}.`,
    `Most active (local): ${p.bestTimes.map((t) => t.label).join(", ")}.`,
    `Primary language: ${insights.topLanguages[0]?.name} (${insights.topLanguages[0]?.share}%).`,
  ].join("\n");

  const userMsg = `Here is a brand's AGGREGATE, anonymised follower audience (no individuals):
${facts}

As the Meta audience specialist, interpret WHO this audience is and WHY that matters, then give numbers-first, prioritised suggestions across: (1) content themes and best posting times, (2) a draft ad audience that mirrors/extends these followers, (3) creative angles per segment. These are PROPOSALS the human approves — never describe anything as auto-applied or guaranteed. Compliant: AU English, no guarantees or absolute claims, no individual-level targeting. Keep it tight and skimmable.`;

  try {
    const text = await callClaude({ system: mira?.system, user: userMsg, maxTokens: 1100, model: modelFor("light") });
    return NextResponse.json({ text });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the strategist.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 502 });
  }
}
