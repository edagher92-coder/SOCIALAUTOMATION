import { beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { exchangeCodeForSession } }),
}));

import { GET } from "./route";

const request = (path: string) => new Request(`https://app.example${path}`) as any;

beforeEach(() => exchangeCodeForSession.mockReset().mockResolvedValue({ error: null }));

describe("GET /auth/callback", () => {
  it("exchanges a valid code and permits the password destination", async () => {
    const response = await GET(request("/auth/callback?code=valid&next=%2Fupdate-password"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("valid");
    expect(response.headers.get("location")).toBe("https://app.example/update-password");
  });

  it("blocks URL-parser redirect bypasses", async () => {
    for (const next of ["%2F%5C%5Cattacker.example", "%2F%09%2F%2Fattacker.example"]) {
      const response = await GET(request(`/auth/callback?code=valid&next=${next}`));
      expect(response.headers.get("location")).toBe("https://app.example/command");
    }
  });

  it("rejects missing and failed codes", async () => {
    let response = await GET(request("/auth/callback"));
    expect(response.headers.get("location")).toBe("https://app.example/login?notice=recovery-expired");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();

    exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("expired") });
    response = await GET(request("/auth/callback?code=expired"));
    expect(response.headers.get("location")).toBe("https://app.example/login?notice=recovery-expired");
  });
});
