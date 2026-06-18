import { describe, it, expect, vi, afterEach } from "vitest";
import { extractField, deriveLeadQuality, mapLeadToEvent, fetchLeadgenLeads } from "./leadads";

// Pure logic + the Graph fetch (mocked). No live Meta calls. PII must only ever be stored hashed.

const fd = (o: Record<string, string>) => Object.entries(o).map(([name, v]) => ({ name, values: [v] }));

describe("meta lead-ads — field extraction + quality scoring", () => {
  it("extracts a field by candidate names (case-insensitive)", () => {
    expect(extractField(fd({ EMAIL: "a@b.com" }), ["email"])).toBe("a@b.com");
    expect(extractField(fd({ phone_number: "0400000000" }), ["phone_number", "phone"])).toBe("0400000000");
    expect(extractField(fd({ city: "Sydney" }), ["email"])).toBeNull();
  });

  it("scores a complete, valid lead high (0–10 scale the engine ×10s)", () => {
    const s = deriveLeadQuality(fd({ email: "jo@biz.com.au", phone_number: "+61 400 111 222", full_name: "Jo Smith", budget: "$5k", timeframe: "ASAP" }));
    expect(s).toBeGreaterThanOrEqual(9);
    expect(s).toBeLessThanOrEqual(10);
  });

  it("scores a sparse / invalid lead low", () => {
    expect(deriveLeadQuality(fd({ email: "not-an-email" }))).toBeLessThanOrEqual(1);
    expect(deriveLeadQuality([])).toBe(0);
  });

  it("maps a lead to a hashed event — NEVER stores plaintext email/phone", () => {
    const ev = mapLeadToEvent("org-1", { id: "L99", campaign_name: "Winter Promo", field_data: fd({ email: "jo@biz.com", phone_number: "0400000000", full_name: "Jo" }) });
    expect(ev.event_id).toBe("meta_lead_L99");
    expect(ev.source).toBe("meta_leadads");
    expect(ev.platform).toBe("meta");
    expect(ev.campaign_name).toBe("Winter Promo");
    expect(ev.lead_quality_score).toBeGreaterThan(0);
    // hashed, not plaintext
    expect(ev.email_hash).toBeTruthy();
    expect(ev.email_hash).not.toContain("jo@biz.com");
    expect(ev.phone_hash).not.toContain("0400000000");
    expect(JSON.stringify(ev)).not.toContain("jo@biz.com");
  });
});

describe("fetchLeadgenLeads", () => {
  afterEach(() => vi.restoreAllMocks());

  it("calls the form's /leads endpoint and returns parsed leads", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({ data: [{ id: "L1", field_data: fd({ email: "x@y.com" }) }] }) } as any;
    }));
    const leads = await fetchLeadgenLeads("tok", "form123", Math.floor(Date.now() / 1000));
    expect(leads).toHaveLength(1);
    expect(calls[0]).toContain("/form123/leads");
    expect(calls[0]).toContain("filtering=");
  });

  it("throws the Graph error message on failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: { message: "(#190) bad token" } }) } as any)));
    await expect(fetchLeadgenLeads("tok", "f1")).rejects.toThrow(/190|bad token/);
  });
});
