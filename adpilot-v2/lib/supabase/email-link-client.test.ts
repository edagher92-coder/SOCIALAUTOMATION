import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEmailLinkClient } from "./email-link-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
  fetchMock.mockReset().mockResolvedValue(new Response("{}", {
    status: 200,
    headers: { "content-type": "application/json" },
  }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("createEmailLinkClient", () => {
  it("requests a cross-device recovery link without a PKCE code challenge", async () => {
    const client = createEmailLinkClient();
    const { error } = await client.auth.resetPasswordForEmail("owner@example.com", {
      redirectTo: "https://app.example/auth/complete?next=%2Fupdate-password",
    });

    expect(error).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
    const [requestUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(requestUrl).toContain("/auth/v1/recover");
    expect(requestUrl).toContain("redirect_to=");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ email: "owner@example.com" });
    expect(body.code_challenge).toBeNull();
    expect(body.code_challenge_method).toBeNull();
  });
});
