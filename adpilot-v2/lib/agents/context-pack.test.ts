import { describe, it, expect, afterEach } from "vitest";
import { contextPackActive, contextPackId, contextPackGrounding } from "./context-pack";

// The sellable default (env unset) must produce ZERO extra grounding so the shipped
// build's specialist output is byte-identical. A pack only ADDS (tightens) grounding.

afterEach(() => {
  delete process.env.ADPILOT_CONTEXT_PACK_JSON;
});

describe("context-pack loader (env-gated, sellable-safe)", () => {
  it("is inert when the env var is unset (sellable default)", () => {
    delete process.env.ADPILOT_CONTEXT_PACK_JSON;
    expect(contextPackActive()).toBe(false);
    expect(contextPackId()).toBe("");
    expect(contextPackGrounding("mira")).toBe("");
  });

  it("is inert when the env var is empty or malformed JSON", () => {
    process.env.ADPILOT_CONTEXT_PACK_JSON = "   ";
    expect(contextPackGrounding("mira")).toBe("");
    process.env.ADPILOT_CONTEXT_PACK_JSON = "{not json";
    expect(contextPackActive()).toBe(false);
    expect(contextPackGrounding("mira")).toBe("");
  });

  it("is inert when the JSON lacks a string id", () => {
    process.env.ADPILOT_CONTEXT_PACK_JSON = JSON.stringify({ shared: "x" });
    expect(contextPackActive()).toBe(false);
    expect(contextPackGrounding("mira")).toBe("");
  });

  it("appends shared + per-agent grounding when a valid pack is active", () => {
    process.env.ADPILOT_CONTEXT_PACK_JSON = JSON.stringify({
      id: "demo-pack",
      shared: "Business: Example Co. Service area: NSW.",
      agents: { mira: "Meta focus: warm retargeting is the cheapest engine." },
    });
    expect(contextPackActive()).toBe(true);
    expect(contextPackId()).toBe("demo-pack");
    const mira = contextPackGrounding("mira");
    expect(mira).toContain("Example Co");
    expect(mira).toContain("warm retargeting");
    // An agent with no per-agent entry still gets the shared block only.
    const dana = contextPackGrounding("dana");
    expect(dana).toContain("Example Co");
    expect(dana).not.toContain("warm retargeting");
  });
});
