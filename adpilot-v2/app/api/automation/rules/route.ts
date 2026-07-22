import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { PRESET_RULES } from "@/lib/rules/presets";
import { dryRunRule } from "@/lib/rules/evaluator";
import type { AlertRule } from "@/lib/rules/schema";
import { ALERT_RULE_COLUMNS, alertRuleToInsert, rowToAlertRule } from "@/lib/rules/persistence";

export const runtime = "nodejs";

const Metric = z.enum(["spend", "cpl", "cpa", "cpc", "cpm", "ctr", "roas", "frequency", "leads", "purchases", "conversions"]);
const Operator = z.enum(["gt", "gte", "lt", "lte", "eq", "zscore_gt", "zscore_lt", "pct_change_gt", "pct_change_lt"]);
const Severity = z.enum(["info", "warning", "critical"]);
const Scope = z.enum(["account", "campaign", "ad"]);

const CreateRule = z.object({
  mode: z.literal("create"),
  name: z.string().trim().min(3).max(80),
  metric: Metric,
  operator: Operator,
  threshold: z.number().finite().min(-1_000_000).max(1_000_000),
  window_days: z.number().int().min(3).max(90).optional(),
  min_volume_gate: z.number().int().min(0).max(100_000_000).optional(),
  min_spend_gate: z.number().min(0).max(100_000_000).optional(),
  severity: Severity.default("warning"),
  scope: Scope.default("campaign"),
  platform: z.enum(["meta", "tiktok"]).nullable().optional(),
});

const PostBody = z.discriminatedUnion("mode", [z.object({ mode: z.literal("install-presets") }), CreateRule]);
const PatchBody = z.object({
  id: z.string().uuid(),
  enabled: z.boolean().optional(),
  threshold: z.number().finite().min(-1_000_000).max(1_000_000).optional(),
  severity: Severity.optional(),
  min_volume_gate: z.number().int().min(0).max(100_000_000).nullable().optional(),
  min_spend_gate: z.number().min(0).max(100_000_000).nullable().optional(),
}).refine((value) => Object.keys(value).length > 1, "No changes supplied");

async function context(requireEditor = false) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, requireEditor ? "editor" : undefined);
  if (!orgId) return { forbidden: true as const };
  const plan = await planForOrg(orgId);
  return { supabase, orgId, plan };
}

export async function GET() {
  const ctx = await context();
  if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if ("forbidden" in ctx) return NextResponse.json({ error: "You do not have access to this workspace." }, { status: 403 });
  const since = new Date(Date.now() - 28 * 86_400_000).toISOString().slice(0, 10);
  const [rulesRes, snapshotsRes] = await Promise.all([
    ctx.supabase.from("alert_rules").select(ALERT_RULE_COLUMNS).eq("organisation_id", ctx.orgId).order("created_at", { ascending: true }),
    ctx.supabase.from("campaign_snapshots").select("date,platform,campaign_name,ad_name,ad_id,spend,impressions,clicks,leads,purchases,revenue,frequency").eq("organisation_id", ctx.orgId).gte("date", since).limit(10_000),
  ]);

  const persisted = !rulesRes.error && (rulesRes.data?.length || 0) > 0;
  const rules = persisted ? (rulesRes.data || []).map((row) => rowToAlertRule(row as Record<string, unknown>)) : PRESET_RULES;
  const snapshots = snapshotsRes.data || [];
  const lastDataDate = snapshots.reduce<string | null>((latest, row) => !latest || row.date > latest ? row.date : latest, null);

  return NextResponse.json({
    rules: rules.map((rule) => ({ ...rule, persisted, preview_fires: dryRunRule(rule, snapshots, 14) })),
    persisted,
    tableAvailable: !rulesRes.error,
    canManage: can(ctx.plan, "threshold_alerts"),
    plan: ctx.plan,
    lastDataDate,
  });
}

export async function POST(req: Request) {
  const ctx = await context(true);
  if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if ("forbidden" in ctx) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(ctx.plan, "threshold_alerts")) return NextResponse.json({ error: "Automation rules require Starter or above." }, { status: 403 });
  const parsed = PostBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Check the rule fields and try again." }, { status: 400 });

  if (parsed.data.mode === "install-presets") {
    const existing = await ctx.supabase.from("alert_rules").select("name").eq("organisation_id", ctx.orgId);
    if (existing.error) return NextResponse.json({ error: "The automation table is not available in this environment." }, { status: 503 });
    const existingNames = new Set((existing.data || []).map((row) => row.name));
    const rows = PRESET_RULES.filter((rule) => !existingNames.has(rule.name)).map((rule) => alertRuleToInsert(rule, ctx.orgId));
    if (rows.length) {
      const { error } = await ctx.supabase.from("alert_rules").insert(rows);
      if (error) return NextResponse.json({ error: "Could not install the starter rules." }, { status: 400 });
    }
    return NextResponse.json({ ok: true, installed: rows.length });
  }

  const data = parsed.data;
  const rolling = data.operator.startsWith("zscore") || data.operator.startsWith("pct_change");
  const rule: AlertRule = {
    id: "new",
    name: data.name,
    metric: data.metric,
    operator: data.operator,
    threshold: data.threshold,
    window_days: data.window_days ?? (rolling ? 7 : undefined),
    min_volume_gate: data.min_volume_gate ?? (rolling ? 500 : undefined),
    min_spend_gate: data.min_spend_gate,
    severity: data.severity,
    scope: data.scope,
    platform: data.platform ?? null,
    enabled: true,
  };
  const { error } = await ctx.supabase.from("alert_rules").insert(alertRuleToInsert(rule, ctx.orgId));
  if (error) return NextResponse.json({ error: "Could not save this rule." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const ctx = await context(true);
  if (!ctx) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  if ("forbidden" in ctx) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });
  if (!can(ctx.plan, "threshold_alerts")) return NextResponse.json({ error: "Automation rules require Starter or above." }, { status: 403 });
  const parsed = PatchBody.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid rule update." }, { status: 400 });
  const { id, ...changes } = parsed.data;
  const { error } = await ctx.supabase.from("alert_rules").update({ ...changes, updated_at: new Date().toISOString() }).eq("organisation_id", ctx.orgId).eq("id", id);
  if (error) return NextResponse.json({ error: "Could not update this rule." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
