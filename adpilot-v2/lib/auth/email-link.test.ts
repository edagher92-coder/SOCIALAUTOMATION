import { describe, expect, it } from "vitest";
import { parseEmailLinkFragment, safeAuthNext } from "./email-link";

describe("safeAuthNext", () => {
  it("allows local app paths", () => {
    expect(safeAuthNext("/update-password")).toBe("/update-password");
    expect(safeAuthNext("/command?welcome=1")).toBe("/command?welcome=1");
  });

  it("blocks external and protocol-relative redirects", () => {
    expect(safeAuthNext("https://attacker.example", "/login")).toBe("/login");
    expect(safeAuthNext("//attacker.example", "/login")).toBe("/login");
    expect(safeAuthNext(null, "/login")).toBe("/login");
  });

  it("blocks decoded slash, backslash and control-character URL parser bypasses", () => {
    for (const encoded of ["/%2f%2fattacker.example", "/%5c%5cattacker.example", "/%09//attacker.example"]) {
      const value = new URLSearchParams(`next=${encoded}`).get("next");
      expect(safeAuthNext(value, "/command")).toBe("/command");
    }
  });

  it("blocks unapproved internal destinations", () => {
    expect(safeAuthNext("/api/health", "/command")).toBe("/command");
    expect(safeAuthNext("/login", "/command")).toBe("/command");
  });
});

describe("parseEmailLinkFragment", () => {
  it("extracts a complete recovery session", () => {
    expect(parseEmailLinkFragment("#access_token=access-123&refresh_token=refresh-456&type=recovery"))
      .toEqual({ accessToken: "access-123", refreshToken: "refresh-456", type: "recovery" });
  });

  it("rejects incomplete fragments", () => {
    expect(parseEmailLinkFragment("#access_token=access-123&type=recovery")).toBeNull();
    expect(parseEmailLinkFragment("")).toBeNull();
  });
});
