import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// refresh-knowledge cron route.
//
// Two layers of coverage:
//  1. parseJson(): tolerant extraction across fenced / bare / prose / garbage.
//  2. GET handler: auth + config guards, NO_KEY fallback, per-domain ISOLATION
//     (one domain failing or returning garbage must not abort the rest), upsert
//     correctness, and upsert-error handling.
//
// @/lib/ai/claude.researchWithWebSearch and @/lib/supabase/admin are mocked so
// nothing hits the network. NoKeyError is the real class (instanceof matters).
// ---------------------------------------------------------------------------

const research = vi.fn();

vi.mock("@/lib/ai/claude", async () => {
  class NoKeyError extends Error { constructor() { super("NO_KEY"); this.name = "NoKeyError"; } }
  return {
    NoKeyError,
    researchWithWebSearch: (...a: any[]) => research(...a),
  };
});

// Inline mock Supabase: records every knowledge_docs.upsert() payload and lets a
// test force an upsert error for a specific domain.
let upserts: any[] = [];
let upsertError: ((row: any) => any) | null = null;

function makeAdmin() {
  return {
    from(_table: string) {
      return {
        upsert(row: any) {
          upserts.push(row);
          const error = upsertError ? upsertError(row) : null;
          return Promise.resolve({ error });
        },
      };
    },
  };
}
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => makeAdmin() }));

import { GET } from "./route";
import { parseJson } from "@/lib/agents/refresh";
import { NoKeyError } from "@/lib/ai/claude";

const SECRET = "cron-secret-xyz";
function req(opts: { auth?: string; key?: string } = {}) {
  const url = opts.key ? `https://x/api/cron/refresh-knowledge?key=${opts.key}` : "https://x/api/cron/refresh-knowledge";
  const headers: Record<string, string> = {};
  if (opts.auth) headers["authorization"] = opts.auth;
  return new Request(url, { headers });
}

// A valid-looking doc body (the handler requires >= 40 chars of real content).
const goodBody = "Benchmarks vary by vertical/geo: CTR roughly 1.5-1.8%. Refresh creative when frequency hits ~3.";
const goodDoc = (d: string) => ({ title: `${d} title`, body: goodBody, sources: ["https://a.example", "https://b.example"] });

describe("parseJson", () => {
  it("parses a clean bare JSON object", () => {
    expect(parseJson('{"title":"T","body":"B"}')).toEqual({ title: "T", body: "B" });
  });

  it("parses a ```json fenced block", () => {
    const v = parseJson('```json\n{"title":"T","body":"B"}\n```');
    expect(v).toEqual({ title: "T", body: "B" });
  });

  it("parses a bare ``` (no language) fenced block", () => {
    const v = parseJson('```\n{"title":"T","body":"B"}\n```');
    expect(v).toEqual({ title: "T", body: "B" });
  });

  it("parses JSON embedded in surrounding prose", () => {
    const v = parseJson('Sure! Here is the data:\n{"title":"T","body":"B"}\nHope that helps.');
    expect(v).toEqual({ title: "T", body: "B" });
  });

  it("parses an object that contains nested braces", () => {
    const v = parseJson('prefix {"title":"T","meta":{"a":1},"body":"B"} suffix');
    expect(v).toEqual({ title: "T", meta: { a: 1 }, body: "B" });
  });

  it("tolerates trailing prose after the JSON (slices to the last brace)", () => {
    const v = parseJson('{"title":"T","body":"B"} -- note: ranges are guidance, not guarantees }');
    expect(v?.title).toBe("T");
    expect(v?.body).toBe("B");
  });

  it("returns null for empty / whitespace input", () => {
    expect(parseJson("")).toBeNull();
    expect(parseJson("   \n  ")).toBeNull();
  });

  it("returns null for pure-prose garbage with no object", () => {
    expect(parseJson("I'm sorry, I cannot help with that request.")).toBeNull();
  });

  it("returns null for malformed JSON that can't be repaired", () => {
    expect(parseJson("{ not: valid, json ")).toBeNull();
  });

  it("returns null for a non-string input", () => {
    expect(parseJson(undefined as any)).toBeNull();
    expect(parseJson(123 as any)).toBeNull();
  });

  it("does not treat a bare JSON array as a usable object", () => {
    // top-level array parses but the handler needs an object with .body
    expect(parseJson("[1,2,3]")).toEqual([1, 2, 3]);
  });
});

describe("GET auth + config guards", () => {
  beforeEach(() => {
    research.mockReset();
    upserts = [];
    upsertError = null;
    process.env.CRON_SECRET = SECRET;
    process.env.ANTHROPIC_API_KEY = "sk-test";
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("503 when CRON_SECRET is not configured (fail closed)", async () => {
    delete process.env.CRON_SECRET;
    const r = await GET(req({ key: "anything" }));
    expect(r.status).toBe(503);
  });

  it("401 when the secret is wrong", async () => {
    const r = await GET(req({ key: "nope" }));
    expect(r.status).toBe(401);
  });

  it("accepts the bearer authorization header", async () => {
    research.mockResolvedValue(JSON.stringify(goodDoc("meta")));
    const r = await GET(req({ auth: `Bearer ${SECRET}` }));
    expect(r.status).toBe(200);
  });

  it("503 with refreshed:0 when ANTHROPIC_API_KEY is absent (baseline fallback)", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const r = await GET(req({ key: SECRET }));
    expect(r.status).toBe(503);
    expect((await r.json()).refreshed).toBe(0);
    expect(research).not.toHaveBeenCalled();
  });
});

describe("GET per-domain isolation + upsert", () => {
  beforeEach(() => {
    research.mockReset();
    upserts = [];
    upsertError = null;
    process.env.CRON_SECRET = SECRET;
    process.env.ANTHROPIC_API_KEY = "sk-test";
  });
  afterEach(() => {
    delete process.env.CRON_SECRET;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("refreshes all five domains when every research call returns a good doc", async () => {
    research.mockImplementation(async () => JSON.stringify(goodDoc("x")));
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(5);
    expect(j.errors).toEqual([]);
    expect(upserts).toHaveLength(5);
    // Upsert payload shape is correct.
    expect(upserts[0]).toMatchObject({ domain: expect.any(String), title: expect.any(String), body: expect.any(String) });
    expect(Array.isArray(upserts[0].sources)).toBe(true);
    expect(upserts[0].updated_at).toBeTruthy();
  });

  it("isolates a thrown research error: other domains still refresh", async () => {
    let n = 0;
    research.mockImplementation(async () => {
      n++;
      if (n === 2) throw new Error("rate limited");
      return JSON.stringify(goodDoc("ok"));
    });
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(4);            // 5 domains, 1 failed
    expect(j.errors).toHaveLength(1);
    expect(j.errors[0]).toContain("rate limited");
    expect(upserts).toHaveLength(4);        // the failed domain never upserted
  });

  it("isolates an unparseable/garbage reply (records error, keeps going)", async () => {
    let n = 0;
    research.mockImplementation(async () => {
      n++;
      if (n === 1) return "I cannot help with that."; // unparseable
      return JSON.stringify(goodDoc("ok"));
    });
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(4);
    expect(j.errors.some((e: string) => e.includes("unparseable"))).toBe(true);
    expect(upserts).toHaveLength(4);
  });

  it("rejects a too-short body as unparseable (does not overwrite the baseline)", async () => {
    research.mockResolvedValue(JSON.stringify({ title: "t", body: "too short", sources: [] }));
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(0);
    expect(j.errors).toHaveLength(5);
    expect(upserts).toHaveLength(0);
  });

  it("records an upsert error per-domain without aborting the run", async () => {
    research.mockImplementation(async () => JSON.stringify(goodDoc("ok")));
    let calls = 0;
    upsertError = () => (++calls === 1 ? { message: "duplicate key" } : null);
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(4);            // first upsert errored
    expect(j.errors.some((e: string) => e.includes("duplicate key"))).toBe(true);
  });

  it("stops the loop on NoKeyError (no further research calls)", async () => {
    research.mockRejectedValue(new NoKeyError());
    const r = await GET(req({ key: SECRET }));
    const j = await r.json();
    expect(j.refreshed).toBe(0);
    // Loop breaks on the first NoKeyError → only one research attempt.
    expect(research).toHaveBeenCalledTimes(1);
  });

  it("sanitises sources: drops non-strings and caps at 8", async () => {
    research.mockResolvedValue(JSON.stringify({
      title: "T", body: goodBody,
      sources: ["https://a", 42, null, "https://b", "https://c", "https://d", "https://e", "https://f", "https://g", "https://h", "https://i"],
    }));
    const r = await GET(req({ key: SECRET }));
    await r.json();
    expect(upserts[0].sources.every((s: any) => typeof s === "string")).toBe(true);
    expect(upserts[0].sources.length).toBeLessThanOrEqual(8);
  });
});
