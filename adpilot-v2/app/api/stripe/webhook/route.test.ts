import { describe, it, expect, beforeEach, vi } from "vitest";

// Stripe webhook: signature handling + plan validation. Stripe SDK and the admin client are
// mocked; normalisePlan (pure) is the real module.
const constructEvent = vi.fn();
const writes: { table: string; op: string; values?: any }[] = [];

vi.mock("stripe", () => ({
  default: class { webhooks = { constructEvent: (...a: any[]) => constructEvent(...a) }; },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      return {
        upsert: (values: any) => { writes.push({ table, op: "upsert", values }); return Promise.resolve({ error: null }); },
        update: (values: any) => ({ eq: () => { writes.push({ table, op: "update", values }); return Promise.resolve({ error: null }); } }),
      };
    },
  }),
}));
vi.mock("@/lib/org", () => ({ ensureOrg: async () => "org-1" }));

import { POST } from "./route";

const checkout = (plan?: string) => ({
  type: "checkout.session.completed",
  data: { object: { id: "sess_1", customer: "cus_1", subscription: "sub_1", metadata: { user_id: "u1", ...(plan !== undefined ? { plan } : {}) } } },
});
const post = () => new Request("https://x/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": "t=1,v1=sig" }, body: "{}" });

beforeEach(() => {
  writes.length = 0; constructEvent.mockReset();
  process.env.STRIPE_SECRET_KEY = "sk_test"; process.env.STRIPE_WEBHOOK_SECRET = "whsec";
});

describe("stripe webhook", () => {
  it("rejects an invalid signature with 400", async () => {
    constructEvent.mockImplementation(() => { throw new Error("bad signature"); });
    const r = await POST(post());
    expect(r.status).toBe(400);
    expect(writes.length).toBe(0);
  });

  it("does NOT write a subscription for an unknown plan (logs, 200)", async () => {
    constructEvent.mockReturnValue(checkout("wizard"));
    const r = await POST(post());
    expect(r.status).toBe(200);
    expect((await r.json()).warning).toBe("unknown_plan");
    expect(writes.length).toBe(0); // no silent downgrade-to-free write
  });

  it("upserts an active subscription for a valid paid plan", async () => {
    constructEvent.mockReturnValue(checkout("pro"));
    const r = await POST(post());
    expect(r.status).toBe(200);
    const up = writes.find((w) => w.table === "billing_subscriptions" && w.op === "upsert");
    expect(up).toBeTruthy();
    expect(up!.values.plan).toBe("pro");
    expect(up!.values.status).toBe("active");
  });

  it("does NOT write when a valid-plan checkout has no subscription id (logs, 200)", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "sess_1", customer: "cus_1", subscription: "", metadata: { user_id: "u1", plan: "pro" } } },
    });
    const r = await POST(post());
    expect(r.status).toBe(200);
    expect((await r.json()).warning).toBe("no_subscription");
    expect(writes.length).toBe(0);
  });

  it("flips status to canceled on subscription deletion", async () => {
    constructEvent.mockReturnValue({ type: "customer.subscription.deleted", data: { object: { id: "sub_1", status: "canceled" } } });
    const r = await POST(post());
    expect(r.status).toBe(200);
    const upd = writes.find((w) => w.table === "billing_subscriptions" && w.op === "update");
    expect(upd!.values.status).toBe("canceled");
  });
});
