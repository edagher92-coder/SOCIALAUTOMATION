import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError, modelFor } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { getAccountCpmByPlatform } from "@/lib/organic/cpm";
import { analyseAccount } from "@/lib/organic/account";
import type { OrganicPostInput } from "@/lib/organic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dana (data specialist) narrates the org's organic boost analysis in plain English — which posts
// to boost and in what order, what to realistically expect for the spend, and why the rest wait.
// Recomputes server-side from the account's REAL CPM so the AI only ever narrates the deterministic
// engine output (never client-supplied conclusions). Everything is a PROPOSAL the human approves.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "ai_team")) {
    return NextResponse.json({ error: "The AI specialist team is a Pro & Expert feature. Upgrade on Billing.", upgrade: true }, { status: 402 });
  }

  const body = await req.json().catch(() => ({}));
  const posts: OrganicPostInput[] = Array.isArray(body?.posts) ? body.posts : [];
  const budgetPerPost = Number(body?.budgetPerPost) > 0 ? Number(body.budgetPerPost) : 100;
  if (posts.length === 0) return NextResponse.json({ error: "Add at least one post to explain." }, { status: 400 });

  // Recompute from the real account CPM; never trust client-supplied verdicts.
  const cpm = await getAccountCpmByPlatform(createAdminClient(), orgId).catch(() => ({ meta: null, tiktok: null }));
  const a = analyseAccount(posts, cpm, { budgetPerPost });
  const dana = getAgent("dana");

  const money = (v: number) => `$${(Math.round(v * 100) / 100).toLocaleString("en-AU")}`;
  const facts = [
    `${a.summary.posts} organic posts; ${a.summary.totalReach.toLocaleString("en-AU")} total reach; ${(a.summary.avgEngagementRate * 100).toFixed(1)}% average engagement.`,
    `Boost-ready (engagement confidently above benchmark + enough data): ${a.recommendations.length}. On hold: ${a.hold.length}.`,
    ...a.recommendations.slice(0, 5).map((r) =>
      `#${r.rank} ${r.post.name || `${r.post.platform} post`} (${r.post.platform}): ${(r.projection.engagementRate * 100).toFixed(1)}% engagement → projected +${Math.round(r.projection.incrementalReach).toLocaleString("en-AU")} reach for ${money(r.recommendedBudget)} (${money(r.projection.costPer1kIncrementalReach)}/1k reached).`),
    `Engine expectations: ${a.expectations.join(" ")}`,
  ].join("\n");

  const userMsg = `Here is a brand's READ-ONLY organic boost analysis, already computed by our engine (do NOT invent or change any numbers):
${facts}

As the data specialist, explain in plain English: which posts to boost and in what order, what to realistically expect for that spend, and why the rest should wait. These are PROPOSALS the human approves in Ads Manager — never describe anything as auto-applied or guaranteed. AU English, numbers-first, no guarantees or absolute claims. Keep it tight and skimmable.`;

  try {
    const text = await callClaude({ system: dana?.system, user: userMsg, maxTokens: 900, model: modelFor("light") });
    return NextResponse.json({ text });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the explainer.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 502 });
  }
}
