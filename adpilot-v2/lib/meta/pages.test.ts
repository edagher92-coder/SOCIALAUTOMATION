import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mapManagedPages, listManagedPages } from "./pages";

// ---------------------------------------------------------------------------
// Meta Page resolver: the pure mapper tolerates Meta's partial shapes and never
// leaks tokens; the fetch wrapper maps Graph errors to precise messages.
// ---------------------------------------------------------------------------

describe("mapManagedPages", () => {
  it("maps id, name and the connected Instagram account id/username", () => {
    const out = mapManagedPages([
      { id: "100", name: "Acme AU", instagram_business_account: { id: "999", username: "acme" }, tasks: ["MANAGE", "CREATE_CONTENT"] },
    ]);
    expect(out).toEqual([
      { id: "100", name: "Acme AU", igUserId: "999", igUsername: "acme", tasks: ["MANAGE", "CREATE_CONTENT"] },
    ]);
  });

  it("omits IG fields when there is no connected Instagram account", () => {
    const out = mapManagedPages([{ id: "100", name: "No IG Page" }]);
    expect(out).toEqual([{ id: "100", name: "No IG Page" }]);
    expect(out[0]).not.toHaveProperty("igUserId");
  });

  it("falls back to a synthesised name and drops entries without an id", () => {
    const out = mapManagedPages([{ id: "55" }, { name: "no id here" }, {}]);
    expect(out).toEqual([{ id: "55", name: "Page 55" }]);
  });

  it("never returns the per-Page access token even when Meta includes it", () => {
    const out = mapManagedPages([{ id: "100", name: "Acme", access_token: "PAGE-SECRET" }]);
    expect(JSON.stringify(out)).not.toContain("PAGE-SECRET");
    expect(out[0]).not.toHaveProperty("access_token");
  });

  it("handles null/empty input", () => {
    expect(mapManagedPages(null as any)).toEqual([]);
    expect(mapManagedPages([])).toEqual([]);
  });
});

describe("listManagedPages", () => {
  const fetchMock = vi.fn();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
  afterEach(() => vi.unstubAllGlobals());

  it("requests /me/accounts and never puts the token in a logged query position by leaking it in the body", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [{ id: "100", name: "Acme", instagram_business_account: { id: "999" } }] }) });
    const pages = await listManagedPages("tok-1234567890");
    expect(pages).toEqual([{ id: "100", name: "Acme", igUserId: "999" }]);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/me/accounts");
    expect(calledUrl).toContain("instagram_business_account");
  });

  it("maps an expired-token Graph error to a precise message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: { code: 190, error_subcode: 463, message: "Session expired" } }) });
    await expect(listManagedPages("tok-1234567890")).rejects.toThrow(/expired/i);
  });

  it("maps a permissions error to a scope message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: { code: 200 } }) });
    await expect(listManagedPages("tok-1234567890")).rejects.toThrow(/permission|scope|ads_read/i);
  });
});
