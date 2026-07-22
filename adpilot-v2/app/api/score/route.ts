// Auth-gated scoring API. Validates input (zod), runs the shared engine, returns JSON.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseCsvText, analyse } from "@/lib/engine";
import { getActiveOrgId } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshOpenRecommendations } from "@/lib/proposals";

export const runtime = "nodejs";

const Body = z.object({
  csv: z.string().min(1).max(5_000_000), // 5 MB cap
  average_sale_value: z.number().positive().max(1_000_000).default(200),
  gross_margin: z.number().min(0.01).max(1).default(0.6),
  business: z.string().max(200).optional(),
  platform: z.enum(["meta", "tiktok"]).optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined, "editor");
  if (!orgId) return NextResponse.json({ error: "You have read-only access to this workspace." }, { status: 403 });

  const { csv, average_sale_value, gross_margin, business, platform } = parsed.data;
  let rows = parseCsvText(csv, platform ?? null);
  if (!rows.length) return NextResponse.json({ error: "No rows parsed — check the CSV headers." }, { status: 422 });
  let capped = false;
  if (rows.length > 20000) { rows = rows.slice(0, 20000); capped = true; }

  let result;
  try {
    result = analyse(rows, { business_name: business, average_sale_value, gross_margin, currency: "AUD" });
  } catch (e: any) {
    return NextResponse.json({ error: "Could not analyse this data — check the CSV columns. " + (e?.message ?? "") }, { status: 422 });
  }

  // Best-effort persistence (saved report + score + recommendations). If the DB
  // isn't configured, analysis still returns — we just don't save.
  let reportId: string | null = null;
  try {
    const admin = createAdminClient();
    await admin.from("health_scores").insert({
      organisation_id: orgId, scope: "account", total: result.health.total, band: result.health.band,
      breakdown: result.health.breakdown, data_confidence: (result.health as any).breakdown?.data_confidence?.score ?? null,
    });
    // Refresh the open Proposals queue: actionable verdicts only, platform-aware
    // dedupe, replacing just the 'open' set. Same shared helper the cron uses so a
    // CSV upload and an auto-sync produce an identical queue.
    await refreshOpenRecommendations(admin, orgId, result.decisions as any[]);
    const { data: rep } = await admin.from("reports").insert({
      organisation_id: orgId, title: `${business || "Analysis"} — health ${Math.round(result.health.total)}`,
      period: new Date().toISOString().slice(0, 10), payload: result, created_by: user.id,
    }).select("id").single();
    reportId = (rep?.id as string) ?? null;
  } catch {
    // persistence is best-effort
  }

  return NextResponse.json({ ...result, capped, rows: rows.length, reportId, saved: !!reportId });
}
