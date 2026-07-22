// Auth-gated AI generation for Canva Creator / Bobby / Aria. Server-side key only.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can, type Feature } from "@/lib/entitlements";
import { callClaude, NoKeyError, modelFor } from "@/lib/ai/claude";

export const runtime = "nodejs";

const Body = z.object({
  task: z.enum(["canva", "bobby", "aria"]),
  inputs: z.record(z.string().max(2000)).default({}),
});

// Each task is a paid surface (gated in the nav too). Gate the API itself so the AI cost can't be
// incurred by a free user calling the endpoint directly — matching agents/run + content/draft.
const TASK_FEATURE: Record<string, Feature> = { canva: "creative_studio", bobby: "ai_team", aria: "ai_team" };

const SYSTEM: Record<string, string> = {
  canva:
    "You are Stella, a direct-response ad creative strategist for Meta & TikTok. Numbers-first, Australian English, no hype, no guarantees, no absolute claims. Output practical, copy-paste-ready creative.",
  bobby:
    "You are Bobby, a plain-English Australian small-business advisor in the Andrew Griffiths style: direct, numbers-first, no jargon. Give general business guidance only — not financial, legal, or tax advice.",
  aria:
    "You are Aria, an expert course designer. Practical, structured, outcome-focused, Australian English.",
};

function userPrompt(task: string, i: Record<string, string>): string {
  if (task === "canva")
    return `Write a ${i.platform || "Meta"} ad for "${i.product || "the product"}" targeting ${i.audience || "the audience"}. Offer: ${i.offer || "n/a"}.
Return: 5 scroll-stopping hooks; one primary text (~60 words); a headline; a CTA; a short visual concept; and 4 Canva search terms. Compliant — no guarantees.`;
  if (task === "bobby")
    return `My business: ${i.business || "(not specified)"}. My question: ${i.question || "How do I get more customers?"}.
Give 3 practical moves I can do this week, the ONE number to watch, and what to avoid. Plain English, numbers-first.`;
  return `Design a sellable course. Topic/expertise: ${i.topic || "(topic)"}. Audience: ${i.audience || "(audience)"}. Outcome they want: ${i.outcome || "(outcome)"}.
Return: a one-line course promise; 4 modules with 3 lessons each; and one lead-magnet idea.`;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { task, inputs } = parsed.data;

  // Tier gate (server-side truth — the nav hides these, but the API is the real boundary).
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  const plan = await planForOrg(orgId);
  if (!can(plan, TASK_FEATURE[task]))
    return NextResponse.json({ error: "This AI tool is included in a paid plan. Upgrade to use it.", code: "UPGRADE" }, { status: 403 });

  try {
    // Light, templated creative → Haiku tier to keep token cost down.
    const text = await callClaude({ system: SYSTEM[task], user: userPrompt(task, inputs), maxTokens: 1100, model: modelFor("light") });
    return NextResponse.json({ text });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI generation isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable it.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 502 });
  }
}
