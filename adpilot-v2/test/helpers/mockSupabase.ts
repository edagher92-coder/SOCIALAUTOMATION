// Reusable chainable mock of the Supabase JS client for route-handler tests.
//
// It mirrors the fluent PostgREST builder the app uses — from()/select()/eq()/
// order()/limit()/maybeSingle()/single()/insert()/update()/delete()/upsert() — and
// is awaitable at any point in the chain (the builder is a thenable), exactly like
// the real client. Per-table read data is configurable; every write (insert/update/
// delete/upsert) is recorded so tests can assert what the handler persisted.
//
// Usage:
//   const { client, writes, reset } = makeMockSupabase({
//     organisations: [{ id: "o1", name: "Acme" }],
//     billing_subscriptions: [{ organisation_id: "o1", plan: "pro", status: "active" }],
//   });
//   // pass `client` wherever createAdminClient()/createClient() is expected, then:
//   expect(writes.filter((w) => w.table === "content_posts" && w.op === "update")).toHaveLength(1);
//
// Reads honour chained .eq()/.neq()/.lte()/.gte()/.in() filters against the table
// rows, so a handler that scopes by organisation_id gets back only matching rows.
// .maybeSingle() returns the first match (or null); .single() returns the first
// match (or an error when none) — both resolve to { data, error }.

export type Row = Record<string, any>;
export type Tables = Record<string, Row[]>;

export interface WriteRecord {
  table: string;
  op: "insert" | "update" | "delete" | "upsert";
  /** Payload passed to insert/update/upsert (undefined for delete). */
  values?: any;
  /** Filters applied via .eq()/.neq()/etc. before the write resolved. */
  filters: Record<string, any>;
  /** onConflict / other options passed to upsert. */
  options?: any;
}

export interface MockSupabase {
  /** The mock client — shape-compatible with the bits of the Supabase client routes use. */
  client: any;
  /** Every write the handler performed, in order. */
  writes: WriteRecord[];
  /** Replace the table fixtures (keeps the same client + writes references). */
  setTables: (tables: Tables) => void;
  /** Clear recorded writes and (optionally) reset table fixtures. */
  reset: (tables?: Tables) => void;
}

type FilterOp = { kind: "eq" | "neq" | "lte" | "gte" | "lt" | "gt" | "in"; col: string; val: any };

function matches(row: Row, ops: FilterOp[]): boolean {
  return ops.every((f) => {
    const v = row[f.col];
    switch (f.kind) {
      case "eq": return v === f.val;
      case "neq": return v !== f.val;
      case "lte": return v <= f.val;
      case "gte": return v >= f.val;
      case "lt": return v < f.val;
      case "gt": return v > f.val;
      case "in": return Array.isArray(f.val) && f.val.includes(v);
      default: return true;
    }
  });
}

function applyFilters(rows: Row[], ops: FilterOp[]): Row[] {
  return rows.filter((r) => matches(r, ops));
}

function filtersAsObject(ops: FilterOp[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of ops) out[f.col] = f.val;
  return out;
}

export function makeMockSupabase(initial: Tables = {}): MockSupabase {
  let tables: Tables = clone(initial);
  const writes: WriteRecord[] = [];

  function clone(t: Tables): Tables {
    const out: Tables = {};
    for (const k of Object.keys(t)) out[k] = t[k].map((r) => ({ ...r }));
    return out;
  }

  function builder(table: string) {
    const ops: FilterOp[] = [];
    // A pending write is recorded immediately (so it shows up even if the caller
    // never awaits the chain — many handlers fire-and-forget). When awaited, the
    // builder resolves to the appropriate result for the staged operation.
    let pending: { op: WriteRecord["op"]; values?: any; options?: any } | null = null;
    let pendingWrite: WriteRecord | null = null;
    let limitN: number | null = null;
    let selectedAfterWrite = false;
    let autoId = 1;

    // The row a write resolves to when `.select()` was chained (mirrors the real
    // client returning the inserted/updated record). For an array insert we return
    // the first row. A synthetic `id` is added when the payload omits one.
    function writtenRow(): Row | null {
      if (!pending) return null;
      const v = Array.isArray(pending.values) ? pending.values[0] : pending.values;
      if (!v || typeof v !== "object") return v ?? null;
      return "id" in v ? { ...v } : { id: `${table}-${autoId++}`, ...v };
    }

    function rowsForRead(): Row[] {
      const all = tables[table] ?? [];
      const filtered = applyFilters(all, ops);
      return limitN != null ? filtered.slice(0, limitN) : filtered;
    }

    function result() {
      if (pending) {
        // A write with `.select()` chained resolves to the written row(s) (the real
        // client behaviour); without it, to { data: null }. The WriteRecord captured
        // any filters applied along the way.
        if (pendingWrite) pendingWrite.filters = filtersAsObject(ops);
        if (selectedAfterWrite) {
          const row = writtenRow();
          return { data: row == null ? [] : [row], error: null };
        }
        return { data: null, error: null };
      }
      return { data: rowsForRead(), error: null };
    }

    function recordWrite(op: WriteRecord["op"], values?: any, options?: any) {
      pending = { op, values, options };
      pendingWrite = { table, op, values, options, filters: filtersAsObject(ops) };
      writes.push(pendingWrite);
    }

    const api: any = {
      // --- reads ---
      select(_cols?: string) { if (pending) selectedAfterWrite = true; return api; },
      order(_col?: string, _opts?: any) { return api; },
      limit(n: number) { limitN = n; return api; },
      // --- filters ---
      eq(col: string, val: any) { ops.push({ kind: "eq", col, val }); if (pendingWrite) pendingWrite.filters = filtersAsObject(ops); return api; },
      neq(col: string, val: any) { ops.push({ kind: "neq", col, val }); return api; },
      lte(col: string, val: any) { ops.push({ kind: "lte", col, val }); return api; },
      gte(col: string, val: any) { ops.push({ kind: "gte", col, val }); return api; },
      lt(col: string, val: any) { ops.push({ kind: "lt", col, val }); return api; },
      gt(col: string, val: any) { ops.push({ kind: "gt", col, val }); return api; },
      in(col: string, val: any[]) { ops.push({ kind: "in", col, val }); return api; },
      // --- writes ---
      insert(values: any) { recordWrite("insert", values); return api; },
      update(values: any) { recordWrite("update", values); return api; },
      delete() { recordWrite("delete"); return api; },
      upsert(values: any, options?: any) { recordWrite("upsert", values, options); return api; },
      // --- terminators ---
      maybeSingle() {
        if (pending && pendingWrite) pendingWrite.filters = filtersAsObject(ops);
        if (pending) return Promise.resolve({ data: selectedAfterWrite ? writtenRow() : null, error: null });
        return Promise.resolve({ data: rowsForRead()[0] ?? null, error: null });
      },
      single() {
        if (pending && pendingWrite) pendingWrite.filters = filtersAsObject(ops);
        if (pending) {
          const row = selectedAfterWrite ? writtenRow() : null;
          return Promise.resolve(row ? { data: row, error: null } : { data: null, error: { message: "No rows returned" } });
        }
        const rows = rowsForRead();
        return Promise.resolve(rows.length ? { data: rows[0], error: null } : { data: null, error: { message: "No rows found" } });
      },
      // Thenable: lets `await admin.from(t).select().eq(...)` resolve directly.
      then(resolve: any, reject: any) {
        return Promise.resolve(result()).then(resolve, reject);
      },
    };
    return api;
  }

  const client: any = {
    from(table: string) { return builder(table); },
  };

  return {
    client,
    writes,
    setTables(t: Tables) { tables = clone(t); },
    reset(t?: Tables) {
      writes.length = 0;
      if (t) tables = clone(t);
    },
  };
}
