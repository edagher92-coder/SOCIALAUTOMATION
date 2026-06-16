import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Health + config-readiness probe. Reports only PRESENCE booleans for env vars (never their
// values), so it's safe to expose unauthenticated — and lets an operator confirm at a glance
// that a deploy is correctly configured (the most common launch-night failure mode).
const has = (k: string) => Boolean(process.env[k] && String(process.env[k]).trim());

// Is TOKEN_ENCRYPTION_KEY a valid 32-byte key? (boolean only — never echo the key)
function tokenKeyValid(): boolean {
  const k = (process.env.TOKEN_ENCRYPTION_KEY || "").trim();
  if (!k) return false;
  if (/^[0-9a-fA-F]{64}$/.test(k)) return true;
  try { return Buffer.from(k.replace(/[\r\n\t ]/g, "+").replace(/-/g, "+").replace(/_/g, "/"), "base64").length === 32; }
  catch { return false; }
}

export async function GET() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "TOKEN_ENCRYPTION_KEY", "NEXT_PUBLIC_APP_URL", "CRON_SECRET",
  ];
  const missingRequired = required.filter((k) => !has(k));
  const tokenKeyOk = tokenKeyValid();
  const features = {
    ai_team: has("ANTHROPIC_API_KEY"),
    email: has("RESEND_API_KEY"),
    billing: has("STRIPE_SECRET_KEY") && has("STRIPE_WEBHOOK_SECRET"),
    meta_oauth: has("META_APP_ID") && has("META_APP_SECRET"),
    tiktok_oauth: has("TIKTOK_APP_ID") && has("TIKTOK_APP_SECRET"),
    content_publish: has("META_PAGE_ACCESS_TOKEN") || has("TIKTOK_PUBLISH_TOKEN"),
    ingest_api: has("INGEST_API_KEY"),
    ad_write: process.env.ADS_WRITE_ENABLED === "1",
  };
  const ready = missingRequired.length === 0 && tokenKeyOk;
  return NextResponse.json({
    status: ready ? "ok" : "degraded",
    version: "2.0",
    service: "adpilot-os-v2",
    required: Object.fromEntries(required.map((k) => [k, has(k)])),
    missingRequired,
    tokenKeyValid: tokenKeyOk,
    features,
  }, { status: ready ? 200 : 503 });
}
