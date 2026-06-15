import { describe, it, expect, vi } from "vitest";

// ---------------------------------------------------------------------------
// agents/run grounding-text builder.
//
// buildGrounding() turns the org's latest saved report payload + open proposals
// into a compact, read-only ACCOUNT CONTEXT block. We import the route module
// directly (its supabase/org/claude deps are mocked so import has no side
// effects) and exercise the pure builder across present/missing/malformed input.
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/org", () => ({ getActiveOrgId: async () => "org-1", planForOrg: async () => "pro" }));
vi.mock("@/lib/ai/claude", () => ({
  callClaude: async () => "ok",
  NoKeyError: class NoKeyError extends Error {},
}));

import { buildGrounding } from "@/lib/agents/grounding";

describe("buildGrounding", () => {
  it("returns the no-data framing when there is no payload and no proposals", () => {
    const text = buildGrounding(null, []);
    expect(text).toContain("no analysed data yet");
    expect(text).toContain("connect an account or paste a CSV");
  });

  it("returns the no-data framing for an empty object payload and non-array recs", () => {
    expect(buildGrounding({}, null as any)).toContain("no analysed data yet");
    expect(buildGrounding(undefined, undefined as any)).toContain("no analysed data yet");
  });

  it("renders the summary line with money + numeric formatting", () => {
    const text = buildGrounding({
      summary: { spend: 12000, leads: 240, purchases: 18, revenue: 36000, cpa: 50, roas: 3, mer: 3, break_even_cpa: 75, break_even_roas: 1.5 },
    }, []);
    expect(text).toContain("ACCOUNT CONTEXT (read-only, latest analysis):");
    expect(text).toContain("$12,000");      // spend formatted as money
    expect(text).toContain("leads 240");
    expect(text).toContain("purchases 18");
    expect(text).toContain("$36,000");      // revenue
    expect(text).toContain("CPA $50");
    expect(text).toContain("ROAS 3.00");    // num() → 2dp
    expect(text).toContain("Break-even CPA $75");
    expect(text).toContain("break-even ROAS 1.50");
  });

  it("renders '?' for missing/NaN summary numbers without throwing", () => {
    const text = buildGrounding({ summary: { spend: null, roas: "abc" } }, []);
    // money()/num() collapse null/NaN to "?" (no "$" prefix), e.g. "Spend ?".
    expect(text).toContain("Spend ?");
    expect(text).toContain("ROAS ?");
    expect(text).toContain("leads ?");
  });

  it("renders the health line, rounds total, and lists critical findings", () => {
    const text = buildGrounding({
      health: {
        total: 72.6,
        band: "FAIR",
        weakest: ["Tracking", { label: "Creative" }, { key: "offer" }],
        findings: [
          { severity: "CRITICAL", message: "Pixel firing zero events" },
          { severity: "WARN", message: "ignored warning" },
          { severity: "CRITICAL", message: "Spend with no recorded results" },
        ],
      },
    }, []);
    expect(text).toContain("Health 73/100 (FAIR)");      // 72.6 → 73
    expect(text).toContain("weakest: Tracking, Creative, offer");
    expect(text).toContain("Critical findings: Pixel firing zero events; Spend with no recorded results");
    expect(text).not.toContain("ignored warning");
  });

  it("tolerates a malformed health object (non-array findings/weakest, bad total)", () => {
    const text = buildGrounding({ health: { total: "n/a", band: undefined, weakest: "oops", findings: "oops" } }, []);
    expect(text).toContain("Health ?/100 (?)");
    expect(text).not.toContain("weakest:");
    expect(text).not.toContain("Critical findings:");
  });

  it("lists open proposals (capped at 8) and tolerates missing fields", () => {
    const recs = Array.from({ length: 10 }, (_, i) => ({ verdict: "PAUSE", entity_name: `Ad ${i}` }));
    recs.push({ verdict: undefined as any, entity_name: undefined as any });
    const text = buildGrounding(null, recs);
    expect(text).toContain("Open proposals:");
    expect(text).toContain("PAUSE → Ad 0");
    // capped at 8 → "Ad 8" / "Ad 9" must not appear
    expect(text).not.toContain("Ad 8");
    expect(text).not.toContain("Ad 9");
  });

  it("filters out falsy/null entries in the recs array", () => {
    const text = buildGrounding(null, [null as any, { verdict: "SCALE", entity_name: "Winner" }, undefined as any]);
    expect(text).toContain("SCALE → Winner");
  });

  it("combines summary + health + proposals into one block", () => {
    const text = buildGrounding(
      { summary: { spend: 100 }, health: { total: 50, band: "POOR", findings: [] } },
      [{ verdict: "KILL", entity_name: "Loser" }],
    );
    expect(text).toContain("Spend $100");
    expect(text).toContain("Health 50/100 (POOR)");
    expect(text).toContain("KILL → Loser");
  });
});
