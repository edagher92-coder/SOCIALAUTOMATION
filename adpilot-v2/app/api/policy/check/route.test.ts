import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// policy/check POST: auth (401), the ai_team entitlement gate (402 for a
// non-pro plan), and the 200 verdict path for a pro plan.
//
// supabase/server, org and the Claude client are mocked; @/lib/entitlements
// (pure) runs for real so the actual feature gate is exercised. Paige's persona
// + the policy knowledge doc are imported through the route for real.
// ---------------------------------------------------------------------------

let CURRENT_USER: any = { id: "u1", email: "e@x.com" };
let CURRENT_PLAN = "pro";
const claudeCalls: Array<{ system?: string; user: string }> = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: CURRENT_USER } }) } }),
}));
vi.mock("@/lib/org", () => ({
  getActiveOrgId: async () => "org-1",
  planForOrg: async () => CURRENT_PLAN,
}));
vi.mock("@/lib/ai/claude", () => ({
  callClaude: async (opts: { system?: string; user: string }) => {
    claudeCalls.push(opts);
    return "What I found · HEADLINE: flag — absolute claim. Safe proposal: rewrite to a substantiated line.";
  },
  NoKeyError: class NoKeyError extends Error {},
}));

import { POST } from "./route";

function post(body: any) {
  return new Request("https://x/api/policy/check", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  CURRENT_USER = { id: "u1", email: "e@x.com" };
  CURRENT_PLAN = "pro";
  claudeCalls.length = 0;
});

describe("auth", () => {
  it("401 when unauthenticated", async () => {
    CURRENT_USER = null;
    const r = await POST(post({ headline: "Best deal ever", platform: "meta" }));
    expect(r.status).toBe(401);
    expect(claudeCalls).toHaveLength(0);
  });
});

describe("entitlement gate", () => {
  it("402 when the org plan lacks ai_team (free/starter)", async () => {
    CURRENT_PLAN = "starter";
    const r = await POST(post({ headline: "Guaranteed results!", platform: "both" }));
    expect(r.status).toBe(402);
    const j = await r.json();
    expect(j.upgrade).toBe(true);
    expect(claudeCalls).toHaveLength(0); // no AI call when gated
  });
});

describe("verdict path", () => {
  it("200 for a pro plan, returns the verdict text and calls Claude with Paige + policy knowledge", async () => {
    const r = await POST(post({ headline: "Lose 10kg guaranteed", primary: "Struggling with debt?", platform: "both" }));
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(typeof j.text).toBe("string");
    expect(j.text.length).toBeGreaterThan(0);
    expect(j.agent).toMatchObject({ id: "paige" });
    expect(claudeCalls).toHaveLength(1);
    // Paige's persona is the system prompt; the policy knowledge + submitted copy are in the user prompt.
    expect(claudeCalls[0].system).toMatch(/Paige/);
    expect(claudeCalls[0].user).toMatch(/policy/i);
    expect(claudeCalls[0].user).toContain("Lose 10kg guaranteed");
  });

  it("400 when no copy is submitted (even for a pro plan)", async () => {
    const r = await POST(post({ platform: "meta" }));
    expect(r.status).toBe(400);
    expect(claudeCalls).toHaveLength(0);
  });
});
