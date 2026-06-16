import { describe, it, expect, beforeEach, vi } from "vitest";
import { eraseUserData } from "./erasure";

// Records every delete so we can assert the erasure is correctly SCOPED:
// - sole-member org → the org is deleted (cascade wipes its data)
// - shared org → only the caller's membership is removed (other tenants preserved)
// - user-scoped rows (legal_acceptances, profiles) deleted by the caller's id

type Del = { table: string; filters: Record<string, any> };
let deletes: Del[] = [];
let DB: Record<string, any[]> = {};
const authDeleteUser = vi.fn(async () => {});

function makeAdmin() {
  return {
    auth: { admin: { deleteUser: authDeleteUser } },
    from(table: string) {
      const filters: Record<string, any> = {};
      const api: any = {
        select() { return api; },
        eq(c: string, v: any) { filters[c] = v; return api; },
        delete() {
          const d: any = { _f: {}, eq(c: string, v: any) { d._f[c] = v; return d; },
            then(res: any, rej: any) { deletes.push({ table, filters: { ...d._f } }); return Promise.resolve({ error: null }).then(res, rej); } };
          return d;
        },
        then(res: any, rej: any) {
          // resolve a select: memberships filtered by user_id → that user's orgs; by organisation_id → members
          let rows = DB[table] || [];
          if (table === "memberships" && filters.organisation_id) rows = rows.filter((r) => r.organisation_id === filters.organisation_id);
          else if (table === "memberships" && filters.user_id) rows = rows.filter((r) => r.user_id === filters.user_id);
          return Promise.resolve({ data: rows, error: null }).then(res, rej);
        },
      };
      return api;
    },
  };
}

beforeEach(() => { deletes = []; DB = {}; authDeleteUser.mockClear(); });

describe("eraseUserData — scoped right-to-erasure", () => {
  it("deletes a sole-member org entirely (cascade), plus user-scoped rows + auth", async () => {
    DB = { memberships: [{ organisation_id: "solo", user_id: "u1" }] }; // u1 is the only member of 'solo'
    const r = await eraseUserData(makeAdmin(), "u1");
    expect(r.orgsDeleted).toBe(1);
    expect(r.membershipsRemoved).toBe(0);
    expect(deletes.find((d) => d.table === "organisations" && d.filters.id === "solo")).toBeTruthy();
    expect(deletes.find((d) => d.table === "legal_acceptances" && d.filters.user_id === "u1")).toBeTruthy();
    expect(deletes.find((d) => d.table === "profiles" && d.filters.id === "u1")).toBeTruthy();
    expect(authDeleteUser).toHaveBeenCalledWith("u1");
  });

  it("preserves a shared org — removes only the caller's membership", async () => {
    DB = { memberships: [
      { organisation_id: "shared", user_id: "u1" },
      { organisation_id: "shared", user_id: "u2" }, // another tenant
    ] };
    const r = await eraseUserData(makeAdmin(), "u1");
    expect(r.orgsDeleted).toBe(0);
    expect(r.membershipsRemoved).toBe(1);
    // the org itself is NOT deleted
    expect(deletes.find((d) => d.table === "organisations")).toBeUndefined();
    // only u1's membership row is removed
    const memDel = deletes.find((d) => d.table === "memberships");
    expect(memDel?.filters).toEqual({ organisation_id: "shared", user_id: "u1" });
  });

  it("handles a user with no orgs (still clears user-scoped rows)", async () => {
    DB = { memberships: [] };
    const r = await eraseUserData(makeAdmin(), "u1");
    expect(r.orgsDeleted).toBe(0);
    expect(deletes.find((d) => d.table === "profiles" && d.filters.id === "u1")).toBeTruthy();
  });
});
