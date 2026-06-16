import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// CRM webhook route: PM-C hard rules — fail closed when the secret is unset,
// reject a bad/missing HMAC signature, and accept (202) + persist hashed PII on
// a valid signed sale.recorded. @/lib/supabase/admin is mocked so we can assert
// what gets upserted; @/lib/pii is used for real so we verify it stores HASHES,
// not plaintext.
// ---------------------------------------------------------------------------

const upserts: Array<{ table: string; rows: any; opts: any }> = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      return {
        upsert: (rows: any, opts: any) => {
          upserts.push({ table, rows, opts });
          return Promise.resolve({ error: null });
        },
      };
    },
  }),
}));

import { POST } from "./route";

const SECRET = "crm-secret-xyz";

function sign(raw: string, secret = SECRET): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
}

function post(body: any, header?: string | null) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (header !== null && header !== undefined) headers["x-adpilot-signature"] = header;
  return new Request("https://x/api/webhooks/crm", { method: "POST", headers, body: raw });
}

const SALE = {
  type: "sale.recorded",
  event_id: "evt-1",
  organisation_id: "org-1",
  email: "Jane@Example.com",
  phone: "+61 400 000 000",
  campaign_name: "Winter Sale",
  status: "won",
  sale_value_aud: 1299.5,
  lead_quality_score: 88,
  source: "crm",
  closed_date: "2026-06-16",
};

beforeEach(() => {
  upserts.length = 0;
  process.env.CRM_WEBHOOK_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.CRM_WEBHOOK_SECRET;
  delete process.env.PII_PEPPER;
});

describe("fail closed", () => {
  it("403 when CRM_WEBHOOK_SECRET is unset (even with a plausible signature)", async () => {
    delete process.env.CRM_WEBHOOK_SECRET;
    const raw = JSON.stringify(SALE);
    const r = await POST(post(raw, sign(raw)));
    expect(r.status).toBe(403);
    expect(upserts).toHaveLength(0);
  });

  it("403 when the signature header is missing", async () => {
    const r = await POST(post(SALE, null));
    expect(r.status).toBe(403);
    expect(upserts).toHaveLength(0);
  });

  it("403 on a bad signature", async () => {
    const raw = JSON.stringify(SALE);
    const r = await POST(post(raw, sign(raw, "wrong-secret")));
    expect(r.status).toBe(403);
    expect(upserts).toHaveLength(0);
  });
});

describe("valid signed sale.recorded", () => {
  it("202 and upserts hashed PII + non-PII attribution", async () => {
    const raw = JSON.stringify(SALE);
    const r = await POST(post(raw, sign(raw)));
    expect(r.status).toBe(202);

    expect(upserts).toHaveLength(1);
    const { table, rows, opts } = upserts[0];
    expect(table).toBe("lead_events");
    expect(opts).toMatchObject({ onConflict: "organisation_id,event_id" });

    // Non-PII attribution stored as-is.
    expect(rows).toMatchObject({
      organisation_id: "org-1",
      event_id: "evt-1",
      campaign_name: "Winter Sale",
      status: "won",
      sale_value_aud: 1299.5,
      lead_quality_score: 88,
      closed_date: "2026-06-16",
    });

    // PII stored ONLY as a 64-char hex hash — never the plaintext.
    expect(rows.email_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows.phone_hash).toMatch(/^[0-9a-f]{64}$/);
    const serialised = JSON.stringify(rows);
    expect(serialised).not.toContain("Jane@Example.com");
    expect(serialised).not.toContain("jane@example.com");
    expect(serialised).not.toContain("400 000 000");
    expect(serialised).not.toContain("61400000000");
  });
});

describe("event filtering & org resolution", () => {
  it("202 no-op (no insert) for an unhandled event type", async () => {
    const body = { ...SALE, type: "contact.deleted" };
    const raw = JSON.stringify(body);
    const r = await POST(post(raw, sign(raw)));
    expect(r.status).toBe(202);
    expect(upserts).toHaveLength(0);
  });

  it("202 no-op when the org cannot be resolved", async () => {
    const body = { type: "lead.status_changed", event_id: "e2", status: "qualified" };
    const raw = JSON.stringify(body);
    const r = await POST(post(raw, sign(raw)));
    expect(r.status).toBe(202);
    expect(upserts).toHaveLength(0);
  });
});
