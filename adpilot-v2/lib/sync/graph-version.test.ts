import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { META_GRAPH_VERSION, META_GRAPH_BASE } from "@/lib/meta/graph-version";

// Gap B — version drift guard. The Meta ingestion read path (insights pull, token/permission
// probe, ad-account discovery) must route every Graph call through the single shared constant,
// so a one-line env var bumps the version with no code edits. This test FAILS if any of those
// files reintroduces a hardcoded `graph.facebook.com/v<NN>` literal, so drift can't recur.
//
// Scope note: this guards the INGESTION path only. Other Meta callers (messenger, publish,
// organic, lead-ads, audience, the OAuth token-exchange URL in lib/oauth/config.ts) currently
// remain on their own v21.0 default and are bumped separately under their own smoke tests.
describe("Meta Graph API version — single source of truth", () => {
  const INGESTION_FILES = [
    "lib/sync/pull.ts",
    "app/api/connect/token/route.ts",
    "app/api/oauth/[platform]/callback/route.ts",
  ];

  it("resolves to a well-formed version and base URL", () => {
    expect(META_GRAPH_VERSION).toMatch(/^v\d+\.\d+$/);
    expect(META_GRAPH_BASE).toBe(`https://graph.facebook.com/${META_GRAPH_VERSION}`);
  });

  it("defaults to v23.0 when META_GRAPH_API_VERSION is unset", () => {
    // The default is the Phase-1 ingestion target. (When the env var is set, that wins — this
    // asserts the safe out-of-the-box default, not the env-override behaviour.)
    if (!process.env.META_GRAPH_API_VERSION) expect(META_GRAPH_VERSION).toBe("v23.0");
  });

  it("no ingestion file hardcodes a graph.facebook.com/v<NN> version", () => {
    const hardcoded = /graph\.facebook\.com\/v\d/;
    for (const rel of INGESTION_FILES) {
      const src = readFileSync(join(process.cwd(), rel), "utf8");
      expect(
        hardcoded.test(src),
        `${rel} hardcodes a Graph API version — route it through META_GRAPH_BASE instead`,
      ).toBe(false);
    }
  });
});
