import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncMetaOrganic } from "@/lib/organic/pull";

export const runtime = "nodejs";
export const maxDuration = 60;

// Scheduled LIVE organic-insights pull (scaffold). Constant-time CRON_SECRET auth, same as the
// other crons. INERT by design: it does nothing (and says so) until the Meta Page/IG read-scope
// token + ids + a target org are configured via env. Read-only — only reads insights.
//
//   META_PAGE_ACCESS_TOKEN  — Page token with pages_read_engagement (+ instagram_manage_insights for IG)
//   META_PAGE_ID            — Facebook Page id (for Page posts)
//   IG_USER_ID              — Instagram business account id (for IG media)
//   ORGANIC_SYNC_ORG_ID     — the org the synced posts belong to (explicit; single-tenant for now)
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  if (!cronAuthorized(req, secret)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const cfg = {
    pageToken: process.env.META_PAGE_ACCESS_TOKEN,
    pageId: process.env.META_PAGE_ID,
    igUserId: process.env.IG_USER_ID,
  };
  const orgId = process.env.ORGANIC_SYNC_ORG_ID;

  // Inert until configured — report clearly rather than erroring, so the cron stays green.
  if (!orgId || !cfg.pageToken || (!cfg.pageId && !cfg.igUserId)) {
    return NextResponse.json({
      configured: false,
      synced: 0,
      note: "Organic sync inactive — set ORGANIC_SYNC_ORG_ID, META_PAGE_ACCESS_TOKEN and META_PAGE_ID/IG_USER_ID to enable.",
    });
  }

  const admin = createAdminClient();
  try {
    const synced = await syncMetaOrganic(admin, orgId, cfg);
    return NextResponse.json({ configured: true, synced });
  } catch (e: any) {
    return NextResponse.json({ configured: true, synced: 0, error: e?.message || "Organic sync failed" }, { status: 502 });
  }
}
