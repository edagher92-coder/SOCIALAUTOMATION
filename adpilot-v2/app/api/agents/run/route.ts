import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError, modelFor } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";
import { knowledgeForAgent } from "@/lib/agents/knowledge";
import { contextPackGrounding } from "@/lib/agents/context-pack";
import { buildGrounding } from "@/lib/agents/grounding";
import { buildRileyReportInstruction } from "@/lib/reports/format";
import { isReportKind } from "@/lib/reports/templates";

export const runtime = "nodejs";

const Body = z.object({ agentId: z.string().min(1), question: z.string().max(2000).optional(), kind: z.string().optional() });

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
  // Token-count guard: cap the volatile grounding so an unusually large saved-report payload
  // can't blow the context window / maxTokens (~4 chars/token heuristic).
  const GROUNDING_CHAR_CAP = 12000; // ≈ 3k tokens
  let grounding = buildGrounding(payload, recs || []);
  if (grounding.length > GROUNDING_CHAR_CAP) {
    console.info("[agents.run] grounding truncated", JSON.stringify({ from: grounding.length, to: GROUNDING_CHAR_CAP }));
    grounding = grounding.slice(0, GROUNDING_CHAR_CAP) + "\n…[grounding truncated to fit the context window]";
  }

  // knowledgeForAgent already falls back to baseline internally; guard the call
  // itself so an unexpected throw can't break grounding.
  const kb = await knowledgeForAgent(admin, agent.id).catch(() => "");
  // Private business context-pack grounding (env-gated; "" in the sellable default build).
  const pack = contextPackGrounding(agent.id);
  const q = parsed.data.question?.trim();
  // Riley report path: when a report kind is requested, append the prose-only contract.
  const kind = parsed.data.kind;
  const reportInstruction = agent.id === "riley" && isReportKind(kind)
    ? `\n\n${buildRileyReportInstruction(payload, { kind, periodLabel: "the latest period" })}`
    : "";
  // Cacheable static prefix (persona + reference knowledge + private pack) — stable across calls.
  // The volatile, account-specific grounding + question go in the user message, so repeat calls to
  // the same specialist reuse the prefix at ~10% input cost (prompt caching).
  const systemPrompt = `${agent.system}${kb ? `\n\nREFERENCE KNOWLEDGE (current best practice — guidance, not guarantees; cite ranges, not false precision):\n${kb}` : ""}${pack ? `\n\nACTIVE BUSINESS CONTEXT (private — honour these rules; they tighten the guardrails, never loosen them):\n${pack}` : ""}`;
  const userMsg = `${grounding}\n\n${q ? `The user asks: ${q}` : "Give your top findings and safe, prioritised proposals for this account right now."}${reportInstruction}`;

  try {
    const text = await callClaude({ system: systemPrompt, user: userMsg, model: modelFor(agent.model ?? "standard"), maxTokens: 1200, cacheSystem: true });
    if (!text || !text.trim())
      return NextResponse.json({ error: "The specialist returned an empty answer. Please try again.", code: "EMPTY" }, { status: 502 });
    return NextResponse.json({ text, agent: { id: agent.id, name: agent.name } });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the team.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e?.message || "AI error", code: "AI_ERROR" }, { status: 502 });
  }
}
