import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaudeMultiTurn, NoKeyError, modelFor } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { knowledgeForAgent } from "@/lib/agents/knowledge";
import { contextPackGrounding } from "@/lib/agents/context-pack";
import { buildGrounding } from "@/lib/agents/grounding";
import { recordAiUsage, type TokenUsage } from "@/lib/telemetry/ai-usage";

export const runtime = "nodejs";

const MsgSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});
const Body = z.object({
  messages: z.array(MsgSchema).min(1).max(20),
  agentId: z.string().optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { messages, agentId = "command" } = parsed.data;
  const agent = getAgent(agentId) ?? getAgent("command")!;

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  const plan = await planForOrg(orgId);
  const hasAiTeam = can(plan, "ai_team");

  const admin = createAdminClient();
  const kb = await knowledgeForAgent(admin, agent.id).catch(() => "");
  const pack = contextPackGrounding(agent.id);

  let grounding = "";
  if (hasAiTeam) {
    const [repRes, recsRes] = await Promise.allSettled([
      admin.from("reports").select("payload")
        .eq("organisation_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle(),
      admin.from("recommendations")
        .select("verdict,entity_name,platform,reason")
        .eq("organisation_id", orgId).eq("status", "open").limit(20),
    ]);
    const payload = repRes.status === "fulfilled" ? (repRes.value as any)?.data?.payload : null;
    const recs = recsRes.status === "fulfilled" ? ((recsRes.value as any)?.data as any[]) : null;
    grounding = buildGrounding(payload, recs || []);
    const GROUNDING_CHAR_CAP = 12000;
    if (grounding.length > GROUNDING_CHAR_CAP)
      grounding = grounding.slice(0, GROUNDING_CHAR_CAP) + "\n…[grounding truncated]";
  }

  const systemPrompt = [
    agent.system,
    kb ? `\n\nREFERENCE KNOWLEDGE (current best practice — guidance only; cite ranges, not false precision):\n${kb}` : "",
    pack ? `\n\nACTIVE BUSINESS CONTEXT (private — these rules tighten the guardrails, never loosen them):\n${pack}` : "",
    !hasAiTeam
      ? `\n\nNOTE: This user is on the ${plan} plan without live account data access. Provide expert general guidance based on best practice. When account-specific context would materially change your answer, note that upgrading to Pro unlocks grounded analysis of their actual numbers.`
      : "",
  ].join("");

  // Inject grounding into the final user message only (earlier turns are already context).
  const apiMessages = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === "user" && grounding) {
      return { ...m, content: `${grounding}\n\nUser message: ${m.content}` };
    }
    return m;
  });

  try {
    let usage: TokenUsage | null = null;
    const text = await callClaudeMultiTurn({
      system: systemPrompt,
      messages: apiMessages,
      model: modelFor(agent.model ?? "standard"),
      maxTokens: 1200,
      cacheSystem: true,
      onUsage: (u) => { usage = u; },
    });
    if (!text || !text.trim())
      return NextResponse.json({ error: "Empty response — please try again.", code: "EMPTY" }, { status: 502 });
    if (usage) await recordAiUsage(admin, orgId, usage, `chat:${agent.id}`);
    return NextResponse.json({ text, agent: { id: agent.id, name: agent.name } });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY to enable the assistant.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "AI error", code: "AI_ERROR" }, { status: 502 });
  }
}
