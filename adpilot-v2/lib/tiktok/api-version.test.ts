import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TIKTOK_API_VERSION, TIKTOK_API_BASE } from "@/lib/tiktok/api-version";

// TikTok parity with Gap B — the TikTok ingestion read path (the insights pull) must route every
// call through the single shared constant, so a one-line env var bumps the version with no code
// edits. This test FAILS if pull.ts reintroduces a hardcoded `business-api.tiktok.com/open_api/v<NN>`
// literal, so drift can't recur.
describe("TikTok API version — single source of truth", () => {
  it("resolves to a well-formed version and base URL", () => {
    expect(TIKTOK_API_VERSION).toMatch(/^v\d+\.\d+$/);
    expect(TIKTOK_API_BASE).toBe(`https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}`);
  });

  it("defaults to v1.3 when TIKTOK_API_VERSION is unset", () => {
    if (!process.env.TIKTOK_API_VERSION) expect(TIKTOK_API_VERSION).toBe("v1.3");
  });

  it("the ingestion pull does not hardcode a business-api.tiktok.com/open_api/v<NN> version", () => {
    const hardcoded = /business-api\.tiktok\.com\/open_api\/v\d/;
    const src = readFileSync(join(process.cwd(), "lib/sync/pull.ts"), "utf8");
    expect(
      hardcoded.test(src),
      "lib/sync/pull.ts hardcodes a TikTok API version — route it through TIKTOK_API_BASE instead",
    ).toBe(false);
  });
});
