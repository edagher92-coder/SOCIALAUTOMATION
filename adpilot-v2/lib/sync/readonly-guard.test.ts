/**
 * readonly-guard.test.ts
 *
 * Defence-in-depth CI guard: proves AdPilot never gains a write path.
 *
 * Three invariants:
 *   (a) GREP: sync layer source contains no non-GET fetch calls and no write-scope strings.
 *   (b) WRITE-DISABLED: executeAction() throws WriteDisabledError when ADS_WRITE_ENABLED is unset.
 *   (c) SCOPE-CEILING: connect/token route records only read-only scopes (no ads_management).
 */

import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { executeAction, WriteDisabledError } from "@/lib/actions/execute";

// ---------------------------------------------------------------------------
// (a) GREP INVARIANT — sync layer source must contain no write-method fetch calls
//     and no ads_management scope string.
// ---------------------------------------------------------------------------
describe("(a) sync-layer grep invariant — read-only fetch + no write scopes", () => {
  const SYNC_DIR = join(process.cwd(), "lib/sync");

  // Collect all .ts files in lib/sync/ that are NOT test files.
  function syncSourceFiles(): string[] {
    return readdirSync(SYNC_DIR)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".spec.ts"))
      .map((f) => join(SYNC_DIR, f));
  }

  it("contains no fetch() call with a non-GET HTTP method (POST/PUT/PATCH/DELETE)", () => {
    const badMethodRe = /method\s*:\s*["'`](POST|PUT|PATCH|DELETE)["'`]/i;
    for (const filePath of syncSourceFiles()) {
      const src = readFileSync(filePath, "utf8");
      expect(
        badMethodRe.test(src),
        `${filePath} contains a non-GET fetch method — sync module must be read-only`,
      ).toBe(false);
    }
  });

  it("contains no ads_management scope string used as a requested/stored scope (write-scope must never be granted)", () => {
    // We must not request or store ads_management as a scope. However, the sync module
    // legitimately references "ads_management" in error-message parsing regex (to detect when
    // Meta's API reports a permission problem with that scope) and in comments. Those are safe.
    // We therefore check only the patterns that would actually REQUEST or STORE the write scope:
    //  - OAuth scope query-param:  scope=...ads_management
    //  - A scopes array literal:   ["ads_management"] or ["ads_read", "ads_management", ...]
    //  - A fetch body granting it: "scope":"ads_management"
    const writeScopeRequested =
      /scope=(?:[^"'\s]*,)?ads_management|["'`]ads_management["'`]\s*[,\])]|scope["']\s*:\s*["']ads_management/;
    for (const filePath of syncSourceFiles()) {
      const src = readFileSync(filePath, "utf8");
      expect(
        writeScopeRequested.test(src),
        `${filePath} appears to REQUEST or STORE ads_management as a scope — sync module must not hold write permissions`,
      ).toBe(false);
    }
  });

  it("contains no direct POST to Meta mutation edges (/ads, /adsets, /campaigns write paths)", () => {
    // Match URL fragments that indicate write calls to Meta campaign-management endpoints.
    // Read endpoints (GET /insights, GET /adaccounts, GET /me/...) are fine.
    // The pattern targets strings like "/act_*/ads", "/act_*/adsets", "/act_*/campaigns"
    // combined with a POST method, or a literal POST to those paths.
    const metaWriteEdge = /fetch\([^)]*\/(ads|adsets|campaigns)['")\s,][^)]*method\s*:\s*["']POST/is;
    for (const filePath of syncSourceFiles()) {
      const src = readFileSync(filePath, "utf8");
      expect(
        metaWriteEdge.test(src),
        `${filePath} appears to POST to a Meta mutation edge — sync module must be read-only`,
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// (b) WRITE-DISABLED INVARIANT — executeAction() must throw WriteDisabledError
//     when ADS_WRITE_ENABLED is absent or falsey. Mirror the exact call shape
//     from lib/actions/execute.test.ts.
// ---------------------------------------------------------------------------
describe("(b) write-disabled invariant — executeAction() refuses when kill-switch is off", () => {
  const base = {
    platform: "meta",
    entity_level: "campaign",
    external_entity_id: "123",
    action: "pause",
  } as const;

  const prev = process.env.ADS_WRITE_ENABLED;
  afterEach(() => {
    if (prev === undefined) delete process.env.ADS_WRITE_ENABLED;
    else process.env.ADS_WRITE_ENABLED = prev;
  });

  it("throws WriteDisabledError when the legacy setting is absent", async () => {
    delete process.env.ADS_WRITE_ENABLED;
    await expect(executeAction("tok", base)).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("throws WriteDisabledError when the legacy setting is '0'", async () => {
    process.env.ADS_WRITE_ENABLED = "0";
    await expect(executeAction("tok", base)).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("throws WriteDisabledError when the legacy setting is empty", async () => {
    process.env.ADS_WRITE_ENABLED = "";
    await expect(executeAction("tok", base)).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("thrown error has name WriteDisabledError and informative message", async () => {
    delete process.env.ADS_WRITE_ENABLED;
    const err = await executeAction("tok", base).catch((e) => e);
    expect(err).toBeInstanceOf(WriteDisabledError);
    expect(err.name).toBe("WriteDisabledError");
    expect(err.message).toMatch(/execution is disabled/i);
  });
});

// ---------------------------------------------------------------------------
// (c) SCOPE-CEILING INVARIANT (static) — connect/token route must record only
//     read-only scopes. Read the file at runtime; assert what is actually written.
// ---------------------------------------------------------------------------
describe("(c) scope-ceiling invariant — token route records only read-only scopes", () => {
  const TOKEN_ROUTE = join(process.cwd(), "app/api/connect/token/route.ts");

  it("records ads_read and read_insights for Meta (no ads_management)", () => {
    const src = readFileSync(TOKEN_ROUTE, "utf8");

    // The route contains: ["ads_read", "read_insights"]
    expect(src).toMatch(/["']ads_read["']/);
    expect(src).toMatch(/["']read_insights["']/);
  });

  it("records ads.read for TikTok (no write scope)", () => {
    const src = readFileSync(TOKEN_ROUTE, "utf8");
    expect(src).toMatch(/["']ads\.read["']/);
  });

  it("does NOT contain ads_management as a stored scope literal", () => {
    const src = readFileSync(TOKEN_ROUTE, "utf8");
    // ads_management must not appear in the scopes array assignment.
    // The route may mention it in an error-message string (checking a token the USER presented);
    // we specifically check that the stored `scopes` variable does not include it.
    // Find the scopes assignment and assert ads_management is absent from it.
    const scopesAssignmentRe = /const\s+scopes\s*=\s*[^;]+;/s;
    const match = src.match(scopesAssignmentRe);
    expect(match).not.toBeNull();
    const scopesDecl = match![0];
    expect(scopesDecl).not.toMatch(/ads_management/);
  });

  it("the scopes assignment contains no write-scope literals at all", () => {
    const src = readFileSync(TOKEN_ROUTE, "utf8");
    const scopesAssignmentRe = /const\s+scopes\s*=\s*[^;]+;/s;
    const match = src.match(scopesAssignmentRe);
    expect(match).not.toBeNull();
    const scopesDecl = match![0];
    // No known write scopes should appear in the assignment
    const writeScopes = ["ads_management", "ads_write", "business_management"];
    for (const ws of writeScopes) {
      expect(scopesDecl, `Write scope '${ws}' must not appear in the stored scopes`).not.toMatch(ws);
    }
  });
});
