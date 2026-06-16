import { describe, it, expect } from "vitest";
import { hashEmail, hashPhone, hashPII, normaliseEmail, normalisePhone } from "./pii";

// PII hashing must be deterministic, one-way, and never echo the plaintext back.
// (Pepper defaults to "" in tests so these expectations stay stable.)

describe("normalisation", () => {
  it("lowercases and trims email", () => {
    expect(normaliseEmail("  Jane.Doe@Example.COM ")).toBe("jane.doe@example.com");
  });

  it("reduces phone to digits only", () => {
    expect(normalisePhone("+61 (400) 000-000")).toBe("61400000000");
    expect(normalisePhone("0400 000 000")).toBe("0400000000");
  });
});

describe("hashEmail / hashPhone determinism", () => {
  it("same input → same hash", () => {
    expect(hashEmail("jane@example.com")).toBe(hashEmail("jane@example.com"));
    expect(hashPhone("0400000000")).toBe(hashPhone("0400000000"));
  });

  it("hashes equal across case/whitespace because of normalisation", () => {
    expect(hashEmail(" Jane@Example.com ")).toBe(hashEmail("jane@example.com"));
    expect(hashPhone("+61 400 000 000")).toBe(hashPhone("61400000000"));
  });

  it("different input → different hash", () => {
    expect(hashEmail("jane@example.com")).not.toBe(hashEmail("john@example.com"));
    expect(hashPhone("0400000000")).not.toBe(hashPhone("0400000001"));
  });
});

describe("output shape", () => {
  it("is 64-char lowercase hex, not the input", () => {
    const h = hashEmail("jane@example.com")!;
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("jane");
    expect(h).not.toContain("@");
  });

  it("phone hash is hex and not the digits", () => {
    const h = hashPhone("0400000000")!;
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain("0400000000");
  });
});

describe("empty / nullish handling", () => {
  it("returns null for null/undefined/empty/whitespace-only", () => {
    expect(hashEmail(null)).toBeNull();
    expect(hashEmail(undefined)).toBeNull();
    expect(hashEmail("   ")).toBeNull();
    expect(hashPhone("")).toBeNull();
    expect(hashPhone("---")).toBeNull(); // strips to no digits
    expect(hashPII(null, "email")).toBeNull();
  });
});

describe("hashPII dispatches by kind", () => {
  it("email kind matches hashEmail; phone kind matches hashPhone", () => {
    expect(hashPII("jane@example.com", "email")).toBe(hashEmail("jane@example.com"));
    expect(hashPII("0400000000", "phone")).toBe(hashPhone("0400000000"));
  });
});

describe("PII_PEPPER fail-closed in production", () => {
  it("throws when hashing in production with no pepper set (refuses reversible hashes)", () => {
    const prev = process.env.NODE_ENV;
    try {
      // @ts-expect-error — NODE_ENV is normally readonly-typed; we override for the test.
      process.env.NODE_ENV = "production";
      expect(() => hashEmail("jane@example.com")).toThrow(/PII_PEPPER/);
    } finally {
      // @ts-expect-error — restore
      process.env.NODE_ENV = prev;
    }
  });

  it("does not throw in test/dev (deterministic fixtures)", () => {
    expect(() => hashEmail("jane@example.com")).not.toThrow();
  });
});
