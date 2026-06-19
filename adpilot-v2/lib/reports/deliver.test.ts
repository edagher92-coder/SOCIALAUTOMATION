import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { deliveryConfigured, deliverReportPdf } from "@/lib/reports/deliver";

const KEYS = ["GOOGLE_DELIVERY_CLIENT_EMAIL", "GOOGLE_DELIVERY_PRIVATE_KEY"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => { for (const k of KEYS) { saved[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

describe("report delivery scaffold", () => {
  it("is NOT configured without Google credentials", () => {
    expect(deliveryConfigured()).toBe(false);
  });

  it("deliverReportPdf is inert (configured:false) when unset — never throws", async () => {
    const r = await deliverReportPdf(new Uint8Array([1, 2, 3]), { filename: "x.pdf" });
    expect(r).toEqual({ ok: false, configured: false });
  });

  it("reports configured once creds are present (delivery still stubbed)", async () => {
    process.env.GOOGLE_DELIVERY_CLIENT_EMAIL = "svc@example.iam.gserviceaccount.com";
    process.env.GOOGLE_DELIVERY_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nx\\n-----END PRIVATE KEY-----";
    expect(deliveryConfigured()).toBe(true);
    const r = await deliverReportPdf(new Uint8Array([1]), { filename: "x.pdf" });
    expect(r.ok).toBe(false);
    if (!r.ok && r.configured) expect(r.error).toMatch(/not yet implemented/i);
  });
});
