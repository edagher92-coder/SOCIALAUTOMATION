import { describe, expect, it } from "vitest";
import { hasOrgAccess } from "@/lib/org";

describe("workspace role access", () => {
  it("keeps viewers read-only", () => {
    expect(hasOrgAccess("viewer", "editor")).toBe(false);
    expect(hasOrgAccess("viewer", "manager")).toBe(false);
  });

  it("lets members operate normal workspace data but not manager settings", () => {
    expect(hasOrgAccess("member", "editor")).toBe(true);
    expect(hasOrgAccess("member", "manager")).toBe(false);
  });

  it("lets owners and admins manage the workspace", () => {
    for (const role of ["owner", "admin"]) {
      expect(hasOrgAccess(role, "editor")).toBe(true);
      expect(hasOrgAccess(role, "manager")).toBe(true);
    }
  });
});
