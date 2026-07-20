import { describe, expect, it } from "vitest";
import { cronAuthorized } from "@/lib/cron-auth";

const secret = "release-cron-secret";

describe("cronAuthorized", () => {
  it("accepts the Vercel Cron Bearer credential", () => {
    expect(cronAuthorized(new Request("https://app.example/api/cron/auto-sync", {
      headers: { authorization: `Bearer ${secret}` },
    }), secret)).toBe(true);
  });

  it("fails closed for missing, incorrect, or URL-carried credentials", () => {
    expect(cronAuthorized(new Request("https://app.example/api/cron/auto-sync"), secret)).toBe(false);
    expect(cronAuthorized(new Request("https://app.example/api/cron/auto-sync", {
      headers: { authorization: "Bearer incorrect" },
    }), secret)).toBe(false);
    expect(cronAuthorized(new Request(`https://app.example/api/cron/auto-sync?key=${secret}`), secret)).toBe(false);
  });
});
