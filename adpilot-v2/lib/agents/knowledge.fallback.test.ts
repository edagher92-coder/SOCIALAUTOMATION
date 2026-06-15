import { describe, it, expect } from "vitest";
import { knowledgeForAgent, knowledgeFor, KNOWLEDGE, AGENT_KNOWLEDGE } from "./knowledge";

// ---------------------------------------------------------------------------
// knowledgeForAgent(): DB-prefer-then-baseline fallback.
//
// We hand it a tiny inline mock Supabase admin client whose knowledge_docs query
// resolves to whatever rows a test configures (no network). We assert it prefers
// live rows when they carry real content and falls back to the committed baseline
// per-domain otherwise.
// ---------------------------------------------------------------------------

// Minimal stub of the `admin.from(...).select(...).in(...)` chain used by the fn.
function makeAdmin(rows: any[] | null, opts: { throwOnIn?: boolean } = {}) {
  return {
    from() {
      const api: any = {
        select() { return api; },
        in() {
          if (opts.throwOnIn) throw new Error("relation \"knowledge_docs\" does not exist");
          return Promise.resolve({ data: rows, error: null });
        },
      };
      return api;
    },
  };
}

describe("knowledgeForAgent", () => {
  it("prefers a live row's body/title/date over the baseline (per domain)", async () => {
    const admin = makeAdmin([
      { domain: "meta", title: "META LIVE 2027", body: "FRESH META GUIDANCE about CTR and frequency thresholds.", updated_at: "2027-01-02T10:00:00.000Z" },
    ]);
    // mira reads meta + policy; only meta has a live row → policy falls back.
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).toContain("META LIVE 2027");
    expect(text).toContain("FRESH META GUIDANCE");
    expect(text).toContain("updated 2027-01-02");
    expect(text).not.toContain(KNOWLEDGE.meta.body); // baseline meta replaced
    // policy had no live row → baseline used
    expect(text).toContain(KNOWLEDGE.policy.title);
    expect(text).toContain(KNOWLEDGE.policy.body);
  });

  it("falls back to the full committed baseline when there are NO live rows", async () => {
    const admin = makeAdmin([]);
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).toBe(knowledgeFor("mira"));
  });

  it("falls back to baseline when data is null", async () => {
    const admin = makeAdmin(null);
    const text = await knowledgeForAgent(admin, "travis");
    expect(text).toBe(knowledgeFor("travis"));
  });

  it("ignores a live row with an empty/whitespace body (keeps the baseline)", async () => {
    const admin = makeAdmin([
      { domain: "meta", title: "ignored", body: "   ", updated_at: "2027-01-01T00:00:00.000Z" },
    ]);
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).toContain(KNOWLEDGE.meta.body); // baseline kept
    expect(text).not.toContain("ignored");
  });

  it("uses the baseline title/date when a live row omits them but has a body", async () => {
    const admin = makeAdmin([
      { domain: "meta", title: "", body: "Some real fresh meta body content here.", updated_at: null },
    ]);
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).toContain("Some real fresh meta body content here.");
    // Title falls back to baseline title, date falls back to baseline date.
    expect(text).toContain(`## ${KNOWLEDGE.meta.title} (current best practice, updated ${KNOWLEDGE.meta.updated})`);
  });

  it("ignores live rows for domains the agent does not read, and unknown domains", async () => {
    const admin = makeAdmin([
      { domain: "tiktok", title: "TT", body: "tiktok body the agent should not see", updated_at: "2027-01-01T00:00:00.000Z" },
      { domain: "bogus", title: "B", body: "garbage domain", updated_at: "2027-01-01T00:00:00.000Z" },
    ]);
    // mira reads meta + policy only.
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).not.toContain("tiktok body the agent should not see");
    expect(text).not.toContain("garbage domain");
    expect(text).toBe(knowledgeFor("mira")); // pure baseline
  });

  it("falls back to baseline when the query throws (table missing)", async () => {
    const admin = makeAdmin(null, { throwOnIn: true });
    const text = await knowledgeForAgent(admin, "mira");
    expect(text).toBe(knowledgeFor("mira"));
  });

  it("survives a null/undefined admin client by returning the baseline", async () => {
    const text = await knowledgeForAgent(null, "mira");
    expect(text).toBe(knowledgeFor("mira"));
  });

  it("returns '' for an unmapped agent id (no DB call needed)", async () => {
    const admin = makeAdmin([{ domain: "meta", title: "x", body: "y", updated_at: "2027-01-01" }]);
    expect(await knowledgeForAgent(admin, "nobody")).toBe("");
    expect(await knowledgeForAgent(admin, "")).toBe("");
  });

  it("covers every configured agent: a fully-empty DB equals knowledgeFor()", async () => {
    const admin = makeAdmin([]);
    for (const agentId of Object.keys(AGENT_KNOWLEDGE)) {
      expect(await knowledgeForAgent(admin, agentId)).toBe(knowledgeFor(agentId));
    }
  });
});
