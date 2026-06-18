import "server-only";
import { hashEmail, hashPhone } from "@/lib/pii";

// Direct Meta Lead Ads ingestion → the lead-quality loop. READ-ONLY: we only READ lead-gen
// leads from the Graph API and upsert hashed rows into lead_events; we never edit an ad.
// PII (email/phone) is stored ONLY as a one-way salted hash (lib/pii), never plaintext.
//
// Note: reading lead-gen leads needs a Page access token with `leads_retrieval` (Meta App
// Review) — separate from the ads_read insights token. Activation is documented in .env/runbook.

const GRAPH = "https://graph.facebook.com/v21.0";

export type MetaLeadField = { name?: string; values?: string[] };
export type MetaLead = { id: string; created_time?: string; campaign_name?: string; ad_name?: string; field_data?: MetaLeadField[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pull a field value by trying a list of candidate field names (Meta names vary by form).
export function extractField(fields: MetaLeadField[] | undefined, names: string[]): string | null {
  for (const f of fields || []) {
    const n = String(f?.name || "").toLowerCase();
    if (names.includes(n)) { const v = (f?.values || []).find((x) => String(x || "").trim()); if (v) return String(v).trim(); }
  }
  return null;
}

// Derive a 0–10 lead-quality signal from a lead's answers (the engine multiplies this by 10).
// FB lead-gen leads carry no quality score, so we infer one from completeness + validity:
// a valid email/phone and a name are the strongest signals; extra answered fields add a little.
export function deriveLeadQuality(fields: MetaLeadField[] | undefined): number {
  const email = extractField(fields, ["email", "work_email"]);
  const phone = extractField(fields, ["phone_number", "phone", "work_phone"]);
  const name = extractField(fields, ["full_name", "name", "first_name"]);
  let score = 0;
  if (email && EMAIL_RE.test(email)) score += 3.5;
  if (phone && phone.replace(/\D+/g, "").length >= 8) score += 3;
  if (name) score += 1.5;
  // Extra answered fields beyond the core three signal a more engaged/qualified lead.
  const core = new Set(["email", "work_email", "phone_number", "phone", "work_phone", "full_name", "name", "first_name", "last_name"]);
  const extra = (fields || []).filter((f) => !core.has(String(f?.name || "").toLowerCase()) && (f?.values || []).some((v) => String(v || "").trim())).length;
  score += Math.min(2, extra * 0.5);
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

// Map a Meta lead into a hashed lead_events row (idempotent on event_id). No plaintext PII.
export function mapLeadToEvent(orgId: string, lead: MetaLead) {
  const email = extractField(lead.field_data, ["email", "work_email"]);
  const phone = extractField(lead.field_data, ["phone_number", "phone", "work_phone"]);
  return {
    organisation_id: orgId,
    event_id: `meta_lead_${lead.id}`,
    lead_id: String(lead.id),
    platform: "meta",
    campaign_name: lead.campaign_name ?? null,
    status: "new",
    sale_value_aud: null,
    lead_quality_score: deriveLeadQuality(lead.field_data),
    email_hash: hashEmail(email),
    phone_hash: hashPhone(phone),
    source: "meta_leadads",
    closed_date: null,
  };
}

// Fetch lead-gen leads for one form. `sinceUnix` (epoch seconds) pulls only newer leads.
export async function fetchLeadgenLeads(token: string, formId: string, sinceUnix?: number): Promise<MetaLead[]> {
  const params = new URLSearchParams({ fields: "id,created_time,campaign_name,ad_name,field_data", access_token: token, limit: "200" });
  if (sinceUnix) params.set("filtering", JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: sinceUnix }]));
  const r = await fetch(`${GRAPH}/${encodeURIComponent(formId)}/leads?${params.toString()}`);
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error?.message || `Meta Lead Ads API error (HTTP ${r.status})`);
  return (j.data || []) as MetaLead[];
}
