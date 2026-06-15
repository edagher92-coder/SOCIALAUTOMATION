import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { knowledgeForAgent } from "@/lib/agents/knowledge";
import { buildGrounding } from "@/lib/agents/grounding";

export const runtime = "nodejs";

const Body = z.object({ agentId: z.string().min(1), question: z.string().max(2000).optional() });

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const agent = getAgent(parsed.data.agentId);
  if (!agent) return NextResponse.json({ error: "Unknown specialist" }, { status: 404 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "ai_team")) {
    return NextResponse.json({ error: "The AI specialist team is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });
  }

  const admin = createAdminClient();
  // Grounding is best-effort: if either query fails (e.g. table missing on a fresh
  // org), degrade gracefully to the "no analysed data yet" framing rather than 500.
  const [repRes, recsRes] = await Promise.allSettled([
    admin.from("reports").select("payload").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("recommendations").select("verdict,entity_name,platform,reason").eq("organisation_id", orgId).eq("status", "open").limit(20),
  ]);
  const payload = repRes.status === "fulfilled" ? (repRes.value as any)?.data?.payload : null;
  const recs = recsRes.status === "fulfilled" ? ((recsRes.value as any)?.data as any[]) : null;
  const grounding = buildGrounding(payload, recs || []);

  // knowledgeForAgent already falls back to baseline internally; guard the call
  // itself so an unexpected throw can't break grounding.
  const kb = await knowledgeForAgent(admin, agent.id).catch(() => "");
  const q = parsed.data.question?.trim();
  const userMsg = `${kb ? `REFERENCE KNOWLEDGE (current best practice — guidance, not guarantees; cite ranges, not false precision):\n${kb}\n\n` : ""}${grounding}\n\n${q ? `The user asks: ${q}` : "Give your top findings and safe, prioritised proposals for this account right now."}`;

  try {
    const text = await callClaude({ system: agent.system, user: userMsg, maxTokens: 1200 });
    if (!text || !text.trim())
      return NextResponse.json({ error: "The specialist returned an empty answer. Please try again.", code: "EMPTY" }, { status: 502 });
    return NextResponse.json({ text, agent: { id: agent.id, name: agent.name } });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the team.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "AI error", code: "AI_ERROR" }, { status: 502 });
  }
}
