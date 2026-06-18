import { describe, it, expect } from "vitest";
import { knowledgeFor, KNOWLEDGE, AGENT_KNOWLEDGE } from "./knowledge";

describe("knowledgeFor", () => {
  it("returns text containing the mapped domain titles for 'mira' (meta + policy)", () => {
    const text = knowledgeFor("mira");
    expect(text).toContain(KNOWLEDGE.meta.title);
    expect(text).toContain(KNOWLEDGE.policy.title);
    // mira is not grounded in tiktok/seo, so those titles must not appear
    expect(text).not.toContain(KNOWLEDGE.tiktok.title);
    expect(text).not.toContain(KNOWLEDGE.seo.title);
  });

  it("emits one '## <title> (current best practice, updated <date>)' header per domain", () => {
    const text = knowledgeFor("mira");
    expect(text).toContain(
      `## ${KNOWLEDGE.meta.title} (current best practice, updated ${KNOWLEDGE.meta.updated})`
    );
    expect(text).toContain(
      `## ${KNOWLEDGE.policy.title} (current best practice, updated ${KNOWLEDGE.policy.updated})`
    );
    // two domains → exactly two section headers
    expect(text.match(/^## /gm)?.length).toBe(2);
  });

  it("includes the domain body content", () => {
    const text = knowledgeFor("mira");
    expect(text).toContain(KNOWLEDGE.meta.body);
    expect(text).toContain(KNOWLEDGE.policy.body);
  });

  it("returns '' for an unmapped agent id", () => {
    expect(knowledgeFor("nobody")).toBe("");
    expect(knowledgeFor("")).toBe("");
  });

  it("covers every configured agent: each mapped agent yields all its domain titles", () => {
    for (const [agentId, domains] of Object.entries(AGENT_KNOWLEDGE)) {
      const text = knowledgeFor(agentId);
      if (domains.length === 0) {
        // routers (e.g. 'command') carry no benchmark knowledge by design — token saving
        expect(text).toBe("");
        continue;
      }
      for (const d of domains) {
        expect(text).toContain(KNOWLEDGE[d].title);
      }
      expect(text.match(/^## /gm)?.length).toBe(domains.length);
    }
  });
});
