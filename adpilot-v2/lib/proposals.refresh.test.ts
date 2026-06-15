import { describe, it, expect } from "vitest";
import {
  ACTIONABLE_VERDICTS,
  buildRecommendationRows,
  refreshOpenRecommendations,
} from "./proposals";

// ---------------------------------------------------------------------------
// buildRecommendationRows — pure, deterministic, platform-aware dedupe.
// ---------------------------------------------------------------------------
describe("buildRecommendationRows", () => {
  it("keeps only actionable verdicts (drops keep/insufficient-data/duplicate)", () => {
    const rows = buildRecommendationRows("org-1", [
      { verdict: "kill", name: "A", platform: "meta" },
      { verdict: "keep", name: "B", platform: "meta" },
      { verdict: "insufficient-data", name: "C", platform: "meta" },
      { verdict: "duplicate", name: "D", platform: "meta" },
      { verdict: "scale", name: "E", platform: "meta" },
    ]);
    expect(rows.map((r) => r.verdict).sort()).toEqual(["kill", "scale"]);
    // every kept verdict is in the canonical actionable set
    for (const r of rows) expect(ACTIONABLE_VERDICTS.has(r.verdict)).toBe(true);
  });

  it("stamps the org id and carries name/platform/reason/proposal through", () => {
    const [row] = buildRecommendationRows("org-9", [
      { verdict: "reduce", name: "Camp", platform: "tiktok", reason: "why", proposal: "do" },
    ]);
    expect(row).toEqual({
      organisation_id: "org-9",
      verdict: "reduce",
      entity_name: "Camp",
      platform: "tiktok",
      reason: "why",
      proposal: "do",
    });
  });

  it("dedupes identical platform|name|verdict but keeps same name on different platforms", () => {
    const rows = buildRecommendationRows("org-1", [
      { verdict: "kill", name: "Promo", platform: "meta" },
      { verdict: "kill", name: "Promo", platform: "meta" }, // exact dup -> dropped
      { verdict: "kill", name: "Promo", platform: "tiktok" }, // different platform -> kept
      { verdict: "reduce", name: "Promo", platform: "meta" }, // different verdict -> kept
    ]);
    expect(rows).toHaveLength(3);
    const keys = rows.map((r) => `${r.platform}|${r.entity_name}|${r.verdict}`);
    expect(new Set(keys).size).toBe(3);
  });

  it("defaults missing name/platform and tolerates null input", () => {
    expect(buildRecommendationRows("o", null)).toEqual([]);
    expect(buildRecommendationRows("o", undefined)).toEqual([]);
    const [row] = buildRecommendationRows("o", [{ verdict: "scale" }]);
    expect(row.entity_name).toBe("(ad)");
    expect(row.platform).toBe("?");
  });
});

// ---------------------------------------------------------------------------
// refreshOpenRecommendations — inline mock Supabase chained query builder.
// ---------------------------------------------------------------------------
type Op =
  | { kind: "selectOpen"; org: string }
  | { kind: "insert"; rows: any[] }
  | { kind: "deleteIn"; ids: any[] };

function makeAdmin(opts: { priorOpenIds?: string[]; insertError?: any } = {}) {
  const ops: Op[] = [];
  const priorOpenIds = opts.priorOpenIds ?? [];

  function from(_table: string) {
    const state: any = { mode: null, insertRows: null, deleteIds: null, eqs: [] as any[] };
    const builder: any = {
      select(_cols: string) { state.mode = "select"; return builder; },
      insert(rows: any[]) {
        state.mode = "insert";
        ops.push({ kind: "insert", rows });
        return Promise.resolve({ data: null, error: opts.insertError ?? null });
      },
      delete() { state.mode = "delete"; return builder; },
      eq(col: string, val: any) { state.eqs.push([col, val]); return builder; },
      in(_col: string, ids: any[]) {
        // only the delete path uses .in()
        ops.push({ kind: "deleteIn", ids });
        return Promise.resolve({ data: null, error: null });
      },
      // the select-open query awaits the builder directly (no maybeSingle)
      then(resolve: any) {
        const org = (state.eqs.find((e: any) => e[0] === "organisation_id") || [])[1];
        ops.push({ kind: "selectOpen", org });
        resolve({ data: priorOpenIds.map((id) => ({ id })), error: null });
      },
    };
    return builder;
  }

  return { admin: { from }, ops };
}

describe("refreshOpenRecommendations", () => {
  const decisions = [
    { verdict: "kill", name: "Bad", platform: "meta", reason: "r", proposal: "p" },
    { verdict: "keep", name: "Fine", platform: "meta" }, // dropped (non-actionable)
    { verdict: "scale", name: "Win", platform: "tiktok" },
  ];

  it("inserts the actionable rows then clears the previously-open rows (insert-before-delete)", async () => {
    const { admin, ops } = makeAdmin({ priorOpenIds: ["old-1", "old-2"] });
    const res = await refreshOpenRecommendations(admin, "org-1", decisions);

    expect(res).toEqual({ inserted: 2, cleared: 2 });

    const insert = ops.find((o) => o.kind === "insert") as any;
    const del = ops.find((o) => o.kind === "deleteIn") as any;
    const sel = ops.findIndex((o) => o.kind === "selectOpen");
    const insIdx = ops.findIndex((o) => o.kind === "insert");
    const delIdx = ops.findIndex((o) => o.kind === "deleteIn");

    // order: snapshot prior-open ids -> insert new -> delete old
    expect(sel).toBeLessThan(insIdx);
    expect(insIdx).toBeLessThan(delIdx);
    // only actionable rows inserted, all stamped with the org
    expect(insert.rows.map((r: any) => r.verdict).sort()).toEqual(["kill", "scale"]);
    expect(insert.rows.every((r: any) => r.organisation_id === "org-1")).toBe(true);
    // exactly the previously-open ids are removed (never the just-inserted ones)
    expect(del.ids).toEqual(["old-1", "old-2"]);
  });

  it("clears the old queue even when the new analysis has no actionable rows", async () => {
    const { admin, ops } = makeAdmin({ priorOpenIds: ["old-1"] });
    const res = await refreshOpenRecommendations(admin, "org-1", [
      { verdict: "keep", name: "x", platform: "meta" },
    ]);
    expect(res).toEqual({ inserted: 0, cleared: 1 });
    expect(ops.some((o) => o.kind === "insert")).toBe(false);
    expect(ops.find((o) => o.kind === "deleteIn")).toMatchObject({ ids: ["old-1"] });
  });

  it("does NOT clear the existing queue if the insert fails (no empty-queue wipe)", async () => {
    const { admin, ops } = makeAdmin({ priorOpenIds: ["old-1"], insertError: { message: "db down" } });
    const res = await refreshOpenRecommendations(admin, "org-1", decisions);
    expect(res).toEqual({ inserted: 0, cleared: 0 });
    expect(ops.some((o) => o.kind === "deleteIn")).toBe(false); // old rows preserved
  });

  it("is idempotent: re-running produces the same actionable insert set", async () => {
    const a = makeAdmin({ priorOpenIds: ["x"] });
    await refreshOpenRecommendations(a.admin, "org-1", decisions);
    const b = makeAdmin({ priorOpenIds: ["y"] });
    await refreshOpenRecommendations(b.admin, "org-1", decisions);
    const rowsA = (a.ops.find((o) => o.kind === "insert") as any).rows;
    const rowsB = (b.ops.find((o) => o.kind === "insert") as any).rows;
    expect(rowsA).toEqual(rowsB);
  });
});
