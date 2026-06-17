import { describe, it, expect, afterEach } from "vitest";
import { MODELS, modelFor } from "./claude";

// Locks the cost-routing contract: light tasks default to Haiku, standard to Sonnet,
// deep to Opus — unless an operator pins ANTHROPIC_MODEL, which always wins.

const orig = process.env.ANTHROPIC_MODEL;
afterEach(() => {
  if (orig === undefined) delete process.env.ANTHROPIC_MODEL;
  else process.env.ANTHROPIC_MODEL = orig;
});

describe("modelFor — back-end cost routing", () => {
  it("routes light tasks to Haiku by default", () => {
    delete process.env.ANTHROPIC_MODEL;
    expect(modelFor("light")).toBe(MODELS.light);
    expect(MODELS.light).toBe("claude-haiku-4-5");
  });

  it("routes standard tasks to Sonnet and deep tasks to Opus by default", () => {
    delete process.env.ANTHROPIC_MODEL;
    expect(modelFor("standard")).toBe("claude-sonnet-4-6");
    expect(modelFor("deep")).toBe("claude-opus-4-8");
  });

  it("honours a global ANTHROPIC_MODEL pin for every tier", () => {
    process.env.ANTHROPIC_MODEL = "claude-opus-4-8";
    expect(modelFor("light")).toBe("claude-opus-4-8");
    expect(modelFor("standard")).toBe("claude-opus-4-8");
  });
});
