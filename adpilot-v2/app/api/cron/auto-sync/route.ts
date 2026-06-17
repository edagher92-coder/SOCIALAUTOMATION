import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncOrgPlatform, type Platform } from "@/lib/sync/pull";
import { scoreAndAlertOrg } from "@/lib/cron/score";
import { can, normalisePlan } from "@/lib/entitlements";

export const runtime = "nodejs";
export const maxDuration = 60;

// Cadence-driven auto-sync. Runs hourly (Vercel cron) and, per org, only pulls when the
// org's chosen cadence is due — then re-scores + alerts. This is what makes the product
// "no prompts once access is given": connect once, pick a cadence, it runs itself.
//   sync_interval_hours: 0 = off · 1 = hourly · 24 = daily · 168 = weekly · or any custom value.
const PLATFORMS: Platform[] = ["meta", "tiktok"];

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  // Fail closed: never run an unauthenticated sweep.
  if (!secret) return NextResponse.json({ error: "Cron not configured (set CRON_SECRET)." }, { status: 503 });
  const url = new URL(req.url);
  const ok = cronAuthorized(req, secret);
  if (!ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: orgs } = await admin.from("organisations")
    .select("id,name,average_sale_value,gross_margin,monthly_budget,lead_close_rate,sync_interval_hours,last_synced_at");

  // Auto-sync is a top-two-tier feature: map every org's active plan up front.
  const { data: subs } = await admin.from("billing_subscriptions").select("organisation_id,plan,status");
  const planFor = new Map<string, string>();
  for (const s of subs || []) if ((s as any).status === "active") planFor.set((s as any).organisation_id, (s as any).plan);

  const now = Date.now();
  const START = now;
  // V6 P1 — fan-out fix. The sweep was a sequential org×platform loop that, past ~10 orgs,
  // blew Vercel's 60s cap and got KILLED mid-loop: remaining orgs silently never synced and it
  // looked like "low activity", not an error. Now: bounded org concurrency + per-org parallel
  // platform pulls + a time-budget guard that DEFERS the rest and reports it (no silent truncation).
  const TIME_BUDGET_MS = 50_000; // headroom under maxDuration=60s to flush the response
  const CONCURRENCY = 4;

  type Outcome = { outcome: "skipped" | "synced" | "failed"; rows: number; scored: number };

  async function processOrg(org: any): Promise<Outcome> {
    if (!can(normalisePlan(planFor.get(org.id)), "auto_sync")) return { outcome: "skipped", rows: 0, scored: 0 }; // plan gate
    const interval = Number(org.sync_interval_hours ?? 24);
    // 0 = off; non-finite/negative (corrupt value) is treated as off rather than running every hour.
    if (!Number.isFinite(interval) || interval <= 0) return { outcome: "skipped", rows: 0, scored: 0 };
    const lastRaw = org.last_synced_at ? new Date(org.last_synced_at).getTime() : 0;
    const last = Number.isFinite(lastRaw) ? lastRaw : 0; // unparseable timestamp → due now
    // Slack for cron jitter, capped at half the interval so a 1h cadence doesn't fire 55min/5min.
    const slackMs = Math.min(300_000, interval * 3_600_000 / 2);
    const dueMs = interval * 3_600_000 - slackMs;
    if (last && now - last < dueMs) return { outcome: "skipped", rows: 0, scored: 0 }; // not due yet

    const { data: accts } = await admin.from("connected_ad_accounts")
      .select("platform").eq("organisation_id", org.id).eq("status", "connected");
    const connected = new Set((accts || []).map((a: any) => a.platform));
    if (connected.size === 0) return { outcome: "skipped", rows: 0, scored: 0 };

    // Pull every connected platform in parallel (they're independent).
    const targets = PLATFORMS.filter((p) => connected.has(p));
    const settled = await Promise.allSettled(targets.map((p) => syncOrgPlatform(admin, org.id, p)));
    let pulled = 0, didSync = false;
    for (let i = 0; i < targets.length; i++) {
      const r = settled[i];
      if (r.status === "fulfilled") { pulled += r.value as number; didSync = true; continue; }
      // Only an AUTH/token failure marks the account disconnected (so the UI can prompt reconnect).
      // A bare "token" substring would wrongly disconnect on transient errors — require auth signals.
      const m = String((r.reason as any)?.message || "").toLowerCase();
      const authFail =
        /\b(401|403)\b/.test(m) ||
        /\bcode\W*190\b/.test(m) ||
        /invalid_grant|reauthenticate|re-?authori[sz]e/.test(m) ||
        /(access[\s_-]?token|oauth|session|credential)\W{0,24}(expired|invalid|revoked|denied)/.test(m) ||
        /(expired|invalid|revoked)\W{0,24}(access[\s_-]?token|oauth|session|credential)/.test(m);
      if (authFail) {
        await admin.from("connected_ad_accounts").update({ status: "disconnected" })
          .eq("organisation_id", org.id).eq("platform", targets[i]);
      }
    }

    // PARTIAL-FAILURE rule: advance the cadence clock only if ≥1 platform pull succeeded.
    if (!didSync) return { outcome: "failed", rows: 0, scored: 0 };
    await admin.from("organisations").update({ last_synced_at: new Date().toISOString() }).eq("id", org.id);
    let scored = 0;
    try { const sr = await scoreAndAlertOrg(admin, org); if (sr.scored) scored = 1; } catch { /* per-org isolation: scoring never rolls back the sync */ }
    return { outcome: "synced", rows: pulled, scored };
  }

  let synced = 0, rows = 0, scored = 0, skipped = 0, failed = 0, deferred = 0, truncated = false;
  const list = orgs || [];
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    // Time-budget guard: stop starting new work before the function is killed; report the rest.
    if (Date.now() - START > TIME_BUDGET_MS) { deferred = list.length - i; truncated = true; break; }
    const batch = list.slice(i, i + CONCURRENCY);
    const outcomes = await Promise.all(batch.map((o) => processOrg(o).catch((): Outcome => ({ outcome: "failed", rows: 0, scored: 0 }))));
    for (const r of outcomes) {
      if (r.outcome === "synced") { synced++; rows += r.rows; scored += r.scored; }
      else if (r.outcome === "failed") failed++;
      else skipped++;
    }
  }
  // Make truncation LOUD instead of silent (the bug this phase fixes).
  if (truncated) console.error(`auto-sync: time budget hit — deferred ${deferred} org(s) to the next run (processed ${list.length - deferred}/${list.length}).`);

  return NextResponse.json({ synced, rows, scored, skipped, failed, deferred, truncated, durationMs: Date.now() - START });
}
