import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { knowledgeFor } from "@/lib/agents/knowledge";

export const runtime = "nodejs";

const Body = z.object({
  headline: z.string().max(500).optional(),
  primary: z.string().max(5000).optional(),
  description: z.string().max(1000).optional(),
  platform: z.enum(["meta", "tiktok", "both"]).default("both"),
});

// Build Paige's policy-review prompt: her persona system string + the committed
// `policy` knowledge doc + the submitted copy, asking for per-item verdicts and
// compliant rewrites. Helper kept local — not exported from the route module.
function buildUserPrompt(input: z.infer<typeof Body>): string {
  const kb = knowledgeFor("paige");
  const items = [
    input.headline?.trim() ? `- HEADLINE: ${input.headline.trim()}` : "",
    input.primary?.trim() ? `- PRIMARY TEXT: ${input.primary.trim()}` : "",
    input.description?.trim() ? `- DESCRIPTION: ${input.description.trim()}` : "",
  ].filter(Boolean).join("\n");

  return [
    kb ? `REFERENCE KNOWLEDGE (current policy essentials — guidance, not legal advice):\n${kb}\n` : "",
    `Target platform(s): ${input.platform}.`,
    "",
    "Review each piece of ad copy below for Meta/TikTok policy risk and Australian Consumer Law (ACCC) exposure.",
    "For EACH item give:",
    "  • a verdict — one of: pass | flag | fix",
    "  • a one-line reason (cite the rule: personal attributes, unsupported/absolute/earnings claim, prohibited category, misleading representation, etc.)",
    "  • a compliant rewrite (only when the verdict is flag or fix; keep the intent and stay in Australian English).",
    "",
    "Copy to review:",
    items || "(no copy submitted)",
    "",
    "Structure your answer as: What I found · Why it matters · Safe proposal (per-item verdicts + rewrites) · Risk & how to reverse.",
  ].filter((l) => l !== null && l !== undefined).join("\n");
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const hasCopy = [parsed.data.headline, parsed.data.primary, parsed.data.description].some((v) => (v || "").trim());
  if (!hasCopy) return NextResponse.json({ error: "Add some copy to check (headline, primary text or description)." }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "ai_team")) {
    return NextResponse.json({ error: "The Policy Check is part of the AI specialist team — a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
  }

  const paige = getAgent("paige");
  if (!paige) return NextResponse.json({ error: "Policy specialist unavailable", code: "NO_AGENT" }, { status: 500 });

  try {
    const text = await callClaude({ system: paige.system, user: buildUserPrompt(parsed.data), maxTokens: 1200 });
    if (!text || !text.trim())
      return NextResponse.json({ error: "The policy check returned an empty answer. Please try again.", code: "EMPTY" }, { status: 502 });
    return NextResponse.json({ text, agent: { id: paige.id, name: paige.name } });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the policy check.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "AI error", code: "AI_ERROR" }, { status: 502 });
  }
}
