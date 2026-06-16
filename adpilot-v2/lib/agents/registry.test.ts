// Agent registry contract: roster completeness, lookup behaviour, the public
// projection (no `system` leak), the committed guardrail clauses on EVERY agent,
// and per-specialist prompt pins. Asserts the REAL committed text — where the
// brief's expected clause is not present in the source, we assert its current
// state and note the discrepancy in the report.
import { describe, it, expect } from "vitest";
import { AGENTS, PUBLIC_AGENTS, getAgent } from "./registry";

const ROSTER = [
  "command", "mira", "travis", "dana", "stella", "titan",
  "milo", "atlas", "riley", "paige", "piper", "quinn",
];

describe("registry — roster", () => {
  it("contains every expected agent id (and only those)", () => {
    const ids = AGENTS.map((a) => a.id).sort();
    expect(ids).toEqual([...ROSTER].sort());
    expect(AGENTS.length).toBe(ROSTER.length);
  });

  it("getAgent returns the agent for a known id", () => {
    expect(getAgent("dana")?.name).toContain("Dana");
    expect(getAgent("mira")?.id).toBe("mira");
  });

  it("getAgent('nope') === undefined", () => {
    expect(getAgent("nope")).toBeUndefined();
    expect(getAgent("")).toBeUndefined();
  });
});

describe("registry — public projection has no system leak", () => {
  it("every PUBLIC_AGENTS entry has ONLY {id,name,emoji,domain}", () => {
    expect(PUBLIC_AGENTS.length).toBe(AGENTS.length);
    for (const p of PUBLIC_AGENTS) {
      expect(Object.keys(p).sort()).toEqual(["domain", "emoji", "id", "name"]);
      expect((p as Record<string, unknown>).system).toBeUndefined();
    }
  });

  it("the JSON-serialised public list never contains a system prompt", () => {
    expect(JSON.stringify(PUBLIC_AGENTS)).not.toContain("GUARDRAILS");
    expect(JSON.stringify(PUBLIC_AGENTS)).not.toContain("Propose only");
  });
});

describe("registry — committed guardrail clauses on EVERY agent.system", () => {
  const clauses = [
    "Propose only",
    "never invent figures",
    "no guarantees",
    "no financial/legal/medical",
    "What I found",
    "Why it matters",
    "Safe proposal",
    "Risk", // committed as "Risk & how to reverse"
    "Australian English",
  ];

  for (const agent of AGENTS) {
    it(`${agent.id} carries all committed guardrail clauses`, () => {
      for (const c of clauses) {
        expect(agent.system).toContain(c);
      }
    });
  }

  it("the 4-part scaffold appears in order on every agent", () => {
    for (const agent of AGENTS) {
      const iFound = agent.system.indexOf("What I found");
      const iWhy = agent.system.indexOf("Why it matters");
      const iSafe = agent.system.indexOf("Safe proposal");
      const iRisk = agent.system.indexOf("Risk");
      expect(iFound).toBeGreaterThan(-1);
      expect(iWhy).toBeGreaterThan(iFound);
      expect(iSafe).toBeGreaterThan(iWhy);
      expect(iRisk).toBeGreaterThan(iSafe);
    }
  });
});

describe("registry — per-specialist prompt pins", () => {
  it("dana pins break-even and ROAS anomaly + the decision floor", () => {
    const s = getAgent("dana")!.system;
    expect(s).toMatch(/break-even/i);
    expect(s).toMatch(/anomaly/i);
    expect(s).toMatch(/decision floor/i);
  });

  it("mira pins fatigue and paused-duplicate tests", () => {
    const s = getAgent("mira")!.system;
    expect(s).toMatch(/fatigue/i);
    expect(s).toMatch(/paused-duplicate/i);
  });

  it("milo pins 'Never automate live ad edits'", () => {
    expect(getAgent("milo")!.system).toContain("Never automate live ad edits");
  });
});

// ---------------------------------------------------------------------------
// v4 hardened guardrails: every specialist must carry the AUD currency clause
// and the no-personal-email privacy clause (master operating rules).
// ---------------------------------------------------------------------------
describe("registry — v4 hardened guardrail clauses present on every specialist", () => {
  it("GUARDRAILS mentions AUD (currency clause)", () => {
    for (const agent of AGENTS) {
      expect(agent.system).toContain("AUD");
    }
  });

  it("GUARDRAILS includes a no-personal-email privacy clause", () => {
    for (const agent of AGENTS) {
      expect(agent.system.toLowerCase()).toContain("personal email");
    }
  });
});
