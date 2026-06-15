// MCP / automation ingestion. Push universal-schema rows from a Claude/MCP
// workflow (or any script). Auth either via a logged-in session (uses active org)
// or a server INGEST_API_KEY header + organisation_id. Optionally scores + saves.
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId } from "@/lib/org";
import { analyse } from "@/lib/engine";

export const runtime = "nodejs";

// Constant-time comparison so the API key can't be guessed via timing.
function safeKeyMatch(a: string | null, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a), bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const RowSchema = z.object({
  platform: z.enum(["meta", "tiktok"]).optional(),
  campaign_name: z.string().optional(),
  date: z.string().optional(),
  spend: z.number().optional(), impressions: z.number().optional(), reach: z.number().optional(),
  frequency: z.number().optional(), clicks: z.number().optional(), ctr: z.number().optional(),
  cpc: z.number().optional(), cpm: z.number().optional(), leads: z.number().optional(),
  purchases: z.number().optional(), revenue: z.number().optional(), lead_quality_score: z.number().optional(),
  tracking_status: z.string().optional(),
}).passthrough();

const Body = z.object({
  organisation_id: z.string().uuid().optional(),
  rows: z.array(RowSchema).min(1).max(20000),
  analyze: z.boolean().optional(),
  average_sale_value: z.number().positive().optional(),
  gross_margin: z.number().min(0.01).max(1).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  const { rows, analyze, average_sale_value, gross_margin } = parsed.data;

  // --- Resolve org + authorise ---
  let orgId: string | null = null;
  const apiKey = req.headers.get("x-api-key");
  if (safeKeyMatch(apiKey, process.env.INGEST_API_KEY)) {
    if (!parsed.data.organisation_id) return NextResponse.json({ error: "organisation_id required with x-api-key" }, { status: 400 });
    orgId = parsed.data.organisation_id;
  } else {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorised (sign in or send a valid x-api-key)" }, { status: 401 });
    orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  }

  const admin = createAdminClient();
  // Validate org exists (and get economics for optional scoring).
  const { data: org } = await admin.from("organisations").select("id,average_sale_value,gross_margin").eq("id", orgId).maybeSingle();
  if (!org) return NextResponse.json({ error: "Unknown organisation" }, { status: 404 });

  const snaps = rows.map((r: any) => ({
    organisation_id: orgId, platform: r.platform || "meta", campaign_name: r.campaign_name || null,
    date: r.date || new Date().toISOString().slice(0, 10),
    spend: r.spend ?? null, impressions: r.impressions ?? null, reach: r.reach ?? null, frequency: r.frequency ?? null,
    clicks: r.clicks ?? null, ctr: r.ctr ?? null, cpc: r.cpc ?? null, cpm: r.cpm ?? null,
    leads: r.leads ?? null, purchases: r.purchases ?? null, revenue: r.revenue ?? null,
    lead_quality_score: r.lead_quality_score ?? null, tracking_status: r.tracking_status || "ok", source: "ingest",
  }));
  const { error: insErr } = await admin.from("campaign_snapshots").insert(snaps);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 502 });

  let report: any = null;
  if (analyze) {
    try {
      const result = analyse(rows as any, {
        average_sale_value: average_sale_value ?? (org as any).average_sale_value ?? 200,
        gross_margin: gross_margin ?? (org as any).gross_margin ?? 0.6, currency: "AUD",
      });
      await admin.from("health_scores").insert({ organisation_id: orgId, scope: "account", total: result.health.total, band: result.health.band, breakdown: result.health.breakdown });
      const { data: rep } = await admin.from("reports").insert({ organisation_id: orgId, title: `Ingest — health ${Math.round(result.health.total)}`, period: new Date().toISOString().slice(0, 10), payload: result }).select("id").single();
      report = { id: rep?.id, health: result.health.total, band: result.health.band };
    } catch (e: any) {
      // Rows are already stored; just report that scoring failed rather than 500-ing.
      report = { error: "scoring_failed", message: e?.message ?? "Could not score the ingested rows." };
    }
  }

  return NextResponse.json({ inserted: snaps.length, report });
}
