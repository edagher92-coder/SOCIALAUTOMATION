import { describe, it, expect } from "vitest";
import { estimateCostUsd, parseUsage } from "@/lib/telemetry/ai-usage";

describe("estimateCostUsd", () => {
  it("prices a Sonnet call from the published per-MTok rates", () => {
    // 1M input @ $3 + 1M output @ $15 = $18.00
    const c = estimateCostUsd({ model: "claude-sonnet-4-6", input: 1_000_000, output: 1_000_000, cacheRead: 0, cacheWrite: 0 });
    expect(c).toBeCloseTo(18, 6);
  });
  it("prices cache reads at 0.1x input and writes at 1.25x input (Opus)", () => {
    // 1M cache-read @ $0.50 + 1M cache-write @ $6.25 = $6.75
    const c = estimateCostUsd({ model: "claude-opus-4-8", input: 0, output: 0, cacheRead: 1_000_000, cacheWrite: 1_000_000 });
    expect(c).toBeCloseTo(6.75, 6);
  });
  it("tolerates a date-suffixed model id (prefix match) — Haiku", () => {
    const c = estimateCostUsd({ model: "claude-haiku-4-5-20251001", input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 });
    expect(c).toBeCloseTo(1, 6); // $1 / MTok input
  });
  it("falls back to Sonnet pricing for an unknown model rather than zero", () => {
    const c = estimateCostUsd({ model: "some-future-model", input: 1_000_000, output: 0, cacheRead: 0, cacheWrite: 0 });
    expect(c).toBeCloseTo(3, 6);
  });
});

describe("parseUsage", () => {
  it("maps the Claude Messages API usage shape, defaulting missing fields to 0", () => {
    const u = parseUsage("claude-sonnet-4-6", { input_tokens: 1200, output_tokens: 340, cache_read_input_tokens: 900 });
    expect(u).toEqual({ model: "claude-sonnet-4-6", input: 1200, output: 340, cacheRead: 900, cacheWrite: 0 });
  });
  it("is null-safe", () => {
    expect(parseUsage("claude-haiku-4-5", null)).toEqual({ model: "claude-haiku-4-5", input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
  });
});
