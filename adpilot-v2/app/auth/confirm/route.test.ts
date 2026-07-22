import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { verifyOtp } }),
}));

import { GET } from "./route";

const request = (path: string) => new Request(`https://app.example${path}`) as any;

beforeEach(() => verifyOtp.mockReset().mockResolvedValue({ error: null }));

describe("GET /auth/confirm", () => {
  it("verifies a recovery token hash and opens the password page", async () => {
    const response = await GET(request("/auth/confirm?token_hash=hash-123&type=recovery&next=%2Fupdate-password"));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "hash-123", type: "recovery" });
    expect(response.headers.get("location")).toBe("https://app.example/update-password");
  });

  it("uses a safe recovery default", async () => {
    const response = await GET(request("/auth/confirm?token_hash=hash-123&type=recovery"));
    expect(response.headers.get("location")).toBe("https://app.example/update-password");
  });

  it("blocks external redirects", async () => {
    const response = await GET(request("/auth/confirm?token_hash=hash-123&type=recovery&next=https%3A%2F%2Fattacker.example"));
    expect(response.headers.get("location")).toBe("https://app.example/update-password");
  });

  it("rejects missing, invalid and failed tokens", async () => {
    let response = await GET(request("/auth/confirm?type=recovery"));
    expect(response.headers.get("location")).toBe("https://app.example/login?notice=recovery-expired");
    expect(verifyOtp).not.toHaveBeenCalled();

    response = await GET(request("/auth/confirm?token_hash=hash-123&type=not-real"));
    expect(response.headers.get("location")).toBe("https://app.example/login?notice=email-link-invalid");

    verifyOtp.mockResolvedValueOnce({ error: new Error("expired") });
    response = await GET(request("/auth/confirm?token_hash=hash-123&type=recovery"));
    expect(response.headers.get("location")).toBe("https://app.example/login?notice=recovery-expired");
  });
});
