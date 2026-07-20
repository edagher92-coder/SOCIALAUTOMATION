import "server-only";
import { META_GRAPH_VERSION } from "@/lib/meta/graph-version";

// Guarded executor for live ad changes. Multiple independent gates protect it:
//  1. ADS_WRITE_ENABLED env kill-switch (off by default — even for Expert orgs).
//  2. A write-scope (ads_management) token must exist, or the platform rejects the write.
//  3. The API layer requires a typed-YES confirmation + Expert entitlement before calling this.
// Prior state is captured for revert. Meta is supported now; TikTok is intentionally not yet
// wired (throws) rather than shipping a half-correct writer.

const V = META_GRAPH_VERSION;

export class WriteDisabledError extends Error {
  constructor() { super("Live ad execution is disabled. An owner must enable the dedicated AD_WRITE_EXECUTION_ENABLED production control first."); this.name = "WriteDisabledError"; }
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
  // Deliberately separate from the legacy ADS_WRITE_ENABLED variable. A production
  // operator must opt in to this exact control after the app review and runbook.
  return process.env.AD_WRITE_EXECUTION_ENABLED === "1";
}

function budgetGuard(action: AdAction, prior?: any) {
  if (action.action !== "set_budget") return;
  if (action.entity_level === "ad") throw new Error("Budgets can only be changed at campaign or ad-set level.");
  const requested = Number(action.params?.daily_budget);
  const previous = Number(prior?.daily_budget) / 100;
  const configuredCap = Number(process.env.AD_WRITE_MAX_DAILY_BUDGET);
  const configuredDelta = Number(process.env.AD_WRITE_MAX_BUDGET_CHANGE_PCT || "0.20");
  if (!Number.isFinite(previous) || previous <= 0) throw new Error("Current daily budget could not be verified. No change was made.");
  if (!Number.isFinite(configuredCap) || configuredCap <= 0) throw new Error("A positive AD_WRITE_MAX_DAILY_BUDGET must be configured before changing budgets.");
  if (!Number.isFinite(configuredDelta) || configuredDelta <= 0 || configuredDelta > 0.5) throw new Error("AD_WRITE_MAX_BUDGET_CHANGE_PCT must be greater than 0 and no more than 0.50.");
  if (requested > configuredCap) throw new Error(`Requested daily budget exceeds the configured execution cap (${configuredCap}).`);
  if (Math.abs(requested - previous) / previous > configuredDelta) throw new Error(`Budget changes are limited to ${(configuredDelta * 100).toFixed(0)}% per approved action.`);
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

export async function executeAction(token: string, action: AdAction, prior?: any): Promise<string> {
  if (!writeEnabled()) throw new WriteDisabledError();
  if (action.platform !== "meta") throw new Error("Only Meta ad-write is supported currently (TikTok ad-write is not yet enabled).");
  budgetGuard(action, prior);
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
