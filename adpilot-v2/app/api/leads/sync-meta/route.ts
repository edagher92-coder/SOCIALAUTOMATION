// Pull Facebook Lead Ads leads → the lead-quality loop. Auth + tier gated (lead_quality_loop;
// Pro & Expert). READ-ONLY: reads lead-gen leads via the Graph API and upserts HASHED rows into
// lead_events (idempotent on event_id) — never edits an ad, never stores plaintext PII.
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveOrgId, planForOrg } from "@/lib/org";
import { can } from "@/lib/entitlements";
import { decrypt } from "@/lib/crypto";
import { fetchLeadgenLeads, mapLeadToEvent } from "@/lib/meta/leadads";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  formIds: z.array(z.string().min(1).max(64)).min(1).max(50),
  sinceDays: z.number().int().min(1).max(90).optional(),
});

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const orgId = await getActiveOrgId(user.id, user.email ?? undefined);
  if (!can(await planForOrg(orgId), "lead_quality_loop"))
    return NextResponse.json({ error: "The lead-quality loop is a Pro & Expert feature. Upgrade on Billing to enable it.", upgrade: true }, { status: 402 });

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Provide formIds (1–50 Meta lead-form ids)." }, { status: 400 });

  const admin = createAdminClient();
  const { data: tok } = await admin.from("platform_tokens")
    .select("ciphertext,iv,auth_tag").eq("organisation_id", orgId).eq("platform", "meta")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!tok?.ciphertext)
    return NextResponse.json({ error: "Connect Meta with a Page token that has leads_retrieval to sync lead-form leads.", code: "NOT_CONFIGURED" }, { status: 503 });

  let token: string;
  try { token = decrypt({ ciphertext: tok.ciphertext, iv: tok.iv, authTag: tok.auth_tag }); }
  catch { return NextResponse.json({ error: "Stored Meta token could not be read. Reconnect the account." }, { status: 502 }); }

  const sinceUnix = parsed.data.sinceDays ? Math.floor((Date.now() - parsed.data.sinceDays * 864e5) / 1000) : undefined;

  try {
    const byForm: Record<string, number> = {};
    let rows: any[] = [];
    for (const formId of parsed.data.formIds) {
      const leads = await fetchLeadgenLeads(token, formId, sinceUnix);
      byForm[formId] = leads.length;
      rows = rows.concat(leads.map((l) => mapLeadToEvent(orgId, l)));
    }
    // Idempotent: upsert on the (org, event_id) unique index so repeated syncs never double-count.
    if (rows.length) {
      const { error } = await admin.from("lead_events").upsert(rows, { onConflict: "organisation_id,event_id" });
      if (error) return NextResponse.json({ error: error.message || "Failed to store leads" }, { status: 502 });
    }
    return NextResponse.json({ synced: rows.length, byForm });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Lead sync failed", code: "LEAD_SYNC_ERROR" }, { status: 502 });
  }
}
