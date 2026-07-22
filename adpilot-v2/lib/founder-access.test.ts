import { describe, expect, it } from "vitest";
import { isFounderAccount } from "./founder-access";

describe("founder access", () => {
  it("recognises approved founder accounts without exposing their addresses", () => {
    const approved = ["ZWRhZ2hlcjkyQGdtYWlsLmNvbQ==", "bGVsbG9kYWdoZXJAZ21haWwuY29t"].map((value) => Buffer.from(value, "base64").toString("utf8"));
    expect(approved.every((email) => isFounderAccount(email))).toBe(true);
    expect(isFounderAccount(`  ${approved[0].toUpperCase()}  `)).toBe(true);
  });

  it("does not grant access to other or missing accounts", () => {
    expect(isFounderAccount("someone@example.com")).toBe(false);
    expect(isFounderAccount(null)).toBe(false);
  });
});
