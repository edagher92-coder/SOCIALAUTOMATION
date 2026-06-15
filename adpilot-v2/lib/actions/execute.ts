import "server-only";

// Guarded executor for live ad changes. Multiple independent gates protect it:
//  1. ADS_WRITE_ENABLED env kill-switch (off by default — even for Expert orgs).
//  2. A write-scope (ads_management) token must exist, or the platform rejects the write.
//  3. The API layer requires a typed-YES confirmation + Expert entitlement before calling this.
// Prior state is captured for revert. Meta is supported now; TikTok is intentionally not yet
// wired (throws) rather than shipping a half-correct writer.

const V = "v21.0";

export class WriteDisabledError extends Error {
  constructor() { super("Ad-write is disabled. Set ADS_WRITE_ENABLED=1 on the server to allow live changes."); this.name = "WriteDisabledError"; }
}
export const isWriteDisabled = (e: any) => e?.name === "WriteDisabledError";

export type AdAction = {
  platform: string;
  entity_level: string;
  external_entity_id: string;
  action: string;
  params?: any;
};

export function writeEnabled(): boolean {
  return process.env.ADS_WRITE_ENABLED === "1";
}

async function metaGet(token: string, id: string, fields: string) {
  const r = await fetch(`https://graph.facebook.com/${V}/${id}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`);
  const j: any = await r.json();
  if (!r.ok || j?.error) throw new Error(j?.error?.message || `Meta read error ${r.status}`);
  return j;
}
async function metaPost(token: string, id: string, body: Record<string, any>) {
  const r = await fetch(`https://graph.facebook.com/${V}/${id}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...body, access_token: token }),
  });
  const j: any = await r.json();
  if (!r.ok || j?.error) throw new Error(j?.error?.message || `Meta write error ${r.status}`);
  return j;
}

// Snapshot the fields we might change, so the action is reversible.
export async function captureState(token: string, action: AdAction): Promise<any> {
  if (action.platform !== "meta") return null;
  const j = await metaGet(token, action.external_entity_id, "status,daily_budget,lifetime_budget,name");
  return { status: j.status ?? null, daily_budget: j.daily_budget ?? null, lifetime_budget: j.lifetime_budget ?? null, name: j.name ?? null };
}

function metaBodyFor(action: AdAction): Record<string, any> {
  if (action.action === "pause") return { status: "PAUSED" };
  if (action.action === "resume") return { status: "ACTIVE" };
  if (action.action === "set_budget") {
    const cents = Math.round(Number(action.params?.daily_budget) * 100);
    if (!Number.isFinite(cents) || cents <= 0) throw new Error("Invalid daily_budget (expects a positive amount in the account currency).");
    return { daily_budget: cents };
  }
  throw new Error("Unknown action");
}

export async function executeAction(token: string, action: AdAction): Promise<string> {
  if (!writeEnabled()) throw new WriteDisabledError();
  if (action.platform !== "meta") throw new Error("Only Meta ad-write is supported currently (TikTok ad-write is not yet enabled).");
  const body = metaBodyFor(action);
  await metaPost(token, action.external_entity_id, body);
  return JSON.stringify(body);
}

export async function revertAction(token: string, action: AdAction, prior: any): Promise<string> {
  if (!writeEnabled()) throw new WriteDisabledError();
  if (action.platform !== "meta" || !prior) throw new Error("Nothing to revert.");
  const body: Record<string, any> = {};
  if (prior.status) body.status = prior.status;
  if (action.action === "set_budget" && prior.daily_budget != null) body.daily_budget = prior.daily_budget;
  if (Object.keys(body).length === 0) throw new Error("No reversible prior state captured.");
  await metaPost(token, action.external_entity_id, body);
  return JSON.stringify(body);
}
