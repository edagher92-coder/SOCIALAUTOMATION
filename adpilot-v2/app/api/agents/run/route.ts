import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { callClaude, NoKeyError } from "@/lib/ai/claude";
import { getAgent } from "@/lib/agents/registry";

export const runtime = "nodejs";

const Body = z.object({ agentId: z.string().min(1), question: z.string().max(2000).optional() });

const money = (n: any) => (n == null || isNaN(+n) ? "?" : `$${(+n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
const num = (n: any) => (n == null || isNaN(+n) ? "?" : (+n).toFixed(2));

// Compact, read-only grounding from the org's latest saved analysis + open proposals.
function buildGrounding(payload: any, recs: any[]): string {
  if (!payload && (!recs || recs.length === 0)) {
    return "ACCOUNT CONTEXT: no analysed data yet (nothing synced or uploaded). Give general, safe guidance and tell the user to connect an account or paste a CSV for specific numbers.";
  }
  const lines: string[] = ["ACCOUNT CONTEXT (read-only, latest analysis):"];
  const s = payload?.summary;
  if (s) {
    lines.push(`- Spend ${money(s.spend)} · leads ${s.leads ?? "?"} · purchases ${s.purchases ?? "?"} · revenue ${money(s.revenue)} · CPA ${money(s.cpa)} · ROAS ${num(s.roas)} · MER ${num(s.mer)}.`);
    lines.push(`- Break-even CPA ${money(s.break_even_cpa)} · break-even ROAS ${num(s.break_even_roas)}.`);
  }
  const h = payload?.health;
  if (h) {
    const weakest = (h.weakest || []).slice(0, 3).map((w: any) => (typeof w === "string" ? w : w.label || w.key || w.name)).filter(Boolean).join(", ");
    lines.push(`- Health ${Math.round(h.total)}/100 (${h.band})${weakest ? ` · weakest: ${weakest}` : ""}.`);
    const crit = (h.findings || []).filter((f: any) => f.severity === "CRITICAL").slice(0, 4).map((f: any) => f.message);
    if (crit.length) lines.push(`- Critical findings: ${crit.join("; ")}`);
  }
  if (recs && recs.length) {
    lines.push(`- Open proposals: ${recs.slice(0, 8).map((r) => `${r.verdict} → ${r.entity_name}`).join("; ")}.`);
  }
  return lines.join("\n");
}

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
  const [{ data: rep }, { data: recs }] = await Promise.all([
    admin.from("reports").select("payload").eq("organisation_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("recommendations").select("verdict,entity_name,platform,reason").eq("organisation_id", orgId).eq("status", "open").limit(20),
  ]);
  const grounding = buildGrounding((rep as any)?.payload, (recs as any[]) || []);

  const q = parsed.data.question?.trim();
  const userMsg = `${grounding}\n\n${q ? `The user asks: ${q}` : "Give your top findings and safe, prioritised proposals for this account right now."}`;

  try {
    const text = await callClaude({ system: agent.system, user: userMsg, maxTokens: 1200 });
    return NextResponse.json({ text, agent: { id: agent.id, name: agent.name } });
  } catch (e: any) {
    if (e instanceof NoKeyError)
      return NextResponse.json({ error: "AI isn't configured yet. Add ANTHROPIC_API_KEY on the server to enable the team.", code: "NO_KEY" }, { status: 503 });
    return NextResponse.json({ error: e.message || "AI error" }, { status: 502 });
  }
}
