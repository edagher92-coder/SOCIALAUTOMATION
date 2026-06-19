# AdPilot OS — Meta Sync Diagnostic & Fix Report

**Date:** 2026-06-19
**Area:** Meta (Facebook/Instagram) connect + sync → Campaign Health Score
**Severity:** High (live connections returned 0 real rows; Command Centre showed demo/seed numbers)
**Status:** ✅ Resolved — deployed to `main` (Vercel production)
**Files changed:** `adpilot-v2/lib/sync/pull.ts`
**Commits:**
- `5b78e25` — Improve error handling in account pull process (per-account resilience)
- `b94999b` — Implement pagination for Facebook insights API

---

## 1. Symptom

Connecting Meta via the dev-link token (or running an audit) reported:

```
Connected meta · N account(s) · pulled 0 rows
(first sync note: (#200) Ad account owner has NOT grant ads_management or ads_read permission …)
meta: (#200) Ad account owner has NOT grant ads_management or ads_read permission …
```

The Command Centre stayed on seed/demo figures (`$4,000.00 spend · CPA $200.00 · 51/100`) and never reflected the real account.

## 2. What was NOT the problem (ruled out)

The Meta side was fully correct. Verified live against `act_179081790` (Snow Flow) with the connected token:

| Check | Result |
|---|---|
| Token type | **SYSTEM_USER**, `expires_at: 0` (never) |
| Scopes | `ads_read`, `ads_management`, `read_insights`, … (granted) |
| App `ads_read` access level | **Standard access, Active** |
| `GET act_179081790/insights` (campaign, last_30d) | **OK — 14 rows** |
| `GET act_179081790/insights` (ad, last_30d, time_increment=1) | **OK — 97 rows, $256 spend (14d)** |
| Account fields, funding_source, users, adsets, ads | **All OK** |

i.e. the exact calls AdPilot makes returned real data when run directly. The failure was **client-side**, in AdPilot's sync code.

## 3. Root cause — two bugs in `lib/sync/pull.ts`

### Bug 1 — one unreadable account aborts the entire sync
`syncOrgPlatform()` looped every `connected` account and `await metaPull(...)` **threw** on the first account that returned Meta error `#200`. Two stale accounts left over from earlier user-token connect attempts — `act_1527706362380358` ("Claude") and `act_4498053263813910` ("Elie Dagher") — are **not** assigned to the current System User token, so they `#200`. Because the loop threw on the first one, the whole pull aborted with 0 rows and the app fell back to demo data.

Compounding factors (by design, but they made it sticky):
- The connect route **inserts** accounts and never clears them, so leaving the Account ID blank ("connect all") re-adds every account the token can see, and duplicates accumulate.
- There is **no UI/endpoint to remove** a connected account.
- The auto-sync self-heal only disconnects accounts on **auth** errors (code 190 / 401 / 403), **not** on `#200`, so it could never clear the offending accounts.

### Bug 2 — single-page insights pull misses the scoring window
`metaPull()` read only the **first page** of the Ads Insights response (Meta returns ~25 rows/page). With `time_increment=1` over a 30-day window the result is dozens-to-hundreds of ad-day rows, and **the first page is the oldest dates**. So the 25 inserted rows were all older than 14 days, the scorer's window (`scoreAndAlertOrg` looks back 14 days) was empty, and it returned `scored: false` even though "rows" were written.

## 4. The fix

`adpilot-v2/lib/sync/pull.ts`

**a) Per-account resilience in `syncOrgPlatform()`** — pull each account independently; on a permission/`#200` error, mark that account `disconnected` and continue; only hard-fail when **every** account fails:

```ts
let rows: any[] = [];
const failures: { id: string; message: string }[] = [];
for (const id of ids) {
  try {
    rows = rows.concat(platform === "meta" ? await metaPull(token, id, orgId) : await tiktokPull(token, id, orgId));
  } catch (e: any) {
    const message = String(e?.message || "pull failed");
    failures.push({ id, message });
    if (/\(?#?\s*200\)?|ads_read|ads_management|not\s+grant|permission/i.test(message)) {
      await admin.from("connected_ad_accounts").update({ status: "disconnected" })
        .eq("organisation_id", orgId).eq("platform", platform).eq("external_account_id", id);
    }
  }
}
if (rows.length === 0 && failures.length === ids.length && failures.length > 0) {
  throw new Error(failures[0].message);
}
```

**b) Pagination in `metaPull()`** — request a large page and follow `paging.next` to the end:

```ts
let url = `https://graph.facebook.com/v21.0/${act}/insights?level=ad&date_preset=last_30d&time_increment=1&limit=500`;
const data: any[] = [];
for (let page = 0; url && page < 25; page++) {
  const r = await fetch(url);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Meta API error (HTTP ${r.status})`);
  if (Array.isArray(j.data)) data.push(...j.data);
  url = j?.paging?.next || "";
}
return data.map((d: any) => { /* unchanged mapping */ });
```

Read-only and idempotent — no change to scopes or write behaviour.

## 5. Meta-side prerequisite (one-time, completed)

The durable token the app should use is a **Business System User** token:
- Account `act_179081790` ("networking" / Snow Flow) added to the **snowflowsydney** business portfolio (`1049680525649904`).
- Assigned to System User **"Claude API"** (`61590489518373`) with **Manage ad accounts** (full) access.
- Generated a **never-expiring** token (app: *Comments* `614890192017160`) with `ads_read` + `read_insights` (+ management). `expires_at: 0`.
- In AdPilot's connect form: paste that token and set **Account ID = `act_179081790`** (leaving it blank re-adds the empty/unreadable portfolio accounts).

## 6. Verification (post-deploy)

```
POST /api/sync/meta   → { inserted: 108 }          # was 25 (single page)
POST /api/audit/run   → { rows: 108, scored: true, total: 55.67, band: "Orange" }
```

Command Centre now shows real data:
- **Health Score 56/100 (Orange · scored)**
- **Last audit: $256.58 spend · CPA $256.58 · break-even $120** (real 14-day figures)
- "last pull just now"
- Stale **"Claude" account auto-disconnected** by the new code path.

## 7. Residual / recommended follow-ups

- **Duplicate `connected_ad_accounts` rows** accumulated during troubleshooting (cosmetic; unreadable ones now auto-disconnect on each sync). Consider a de-dupe and a real **"Remove account"** action in the Connections UI.
- **Manual "Sync now" doesn't re-score** — it only writes snapshots. Consider triggering a score after a manual sync, or document that the Command Centre updates on the next audit/auto-sync.
- **`connected_ad_accounts` insert-only** on connect — consider replacing the platform's account set (or upsert) when an explicit Account ID is supplied, to avoid re-adding everything.
- Optional: widen the auto-sync self-heal to treat `#200`/permission errors (not just auth) as "disconnect", mirroring the new `syncOrgPlatform` behaviour.

---

*Prepared as a diagnostics record for the SOCIALAUTOMATION repo (adpilot-v2).*
