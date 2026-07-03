import { describe, it, expect } from "vitest";
import { evaluateGuardrails, DEFAULT_GUARDRAILS, type GuardrailRow } from "./guardrails";

const row = (o: Partial<GuardrailRow> = {}): GuardrailRow => ({
  campaign_name: "Camp A", platform: "meta", date: "2026-07-03", spend: 10, daily_budget: 20, ...o,
});

describe("evaluateGuardrails — campaign ceilings", () => {
  it("returns empty result for no rows", () => {
    const r = evaluateGuardrails([]);
    expect(r.date).toBeNull();
    expect(r.campaigns).toEqual([]);
    expect(r.combined.status).toBe("no-cap");
  });

  it("flags ok / warn / breach at the boundaries", () => {
    const mk = (spend: number) => evaluateGuardrails([row({ spend, daily_budget: 100 })]).campaigns[0];
    expect(mk(84.9).status).toBe("ok");
    expect(mk(85).status).toBe("warn");     // warnAt = 0.85 inclusive
    expect(mk(99.9).status).toBe("warn");
    expect(mk(100).status).toBe("breach");  // 100% inclusive
    expect(mk(140).status).toBe("breach");
  });

  it("campaigns without a budget on record get no-ceiling, never a fabricated pct", () => {
    const r = evaluateGuardrails([row({ daily_budget: null }), row({ campaign_name: "Zero", daily_budget: 0 })]);
    for (const c of r.campaigns) {
      expect(c.status).toBe("no-ceiling");
      expect(c.ceiling).toBeNull();
      expect(c.pct).toBeNull();
    }
  });

  it("sums only the latest date's spend as spendToday", () => {
    const r = evaluateGuardrails([
      row({ date: "2026-07-01", spend: 99 }),
      row({ date: "2026-07-03", spend: 5 }),
      row({ date: "2026-07-03", spend: 7 }),
    ]);
    expect(r.date).toBe("2026-07-03");
    expect(r.campaigns[0].spendToday).toBe(12);
  });

  it("breach emits a HIGH proposal finding that explicitly makes no change", () => {
    const r = evaluateGuardrails([row({ spend: 25, daily_budget: 20 })]);
    const f = r.findings.find((x) => x.severity === "HIGH");
    expect(f).toBeTruthy();
    expect(f!.message).toContain("No change has been made");
  });

  it("sorts breach → warn → ok → no-ceiling, then by spend desc", () => {
    const r = evaluateGuardrails([
      row({ campaign_name: "OK", spend: 10, daily_budget: 100 }),
      row({ campaign_name: "Breach", spend: 30, daily_budget: 20 }),
      row({ campaign_name: "NoBudget", spend: 50, daily_budget: null }),
      row({ campaign_name: "Warn", spend: 90, daily_budget: 100 }),
    ]);
    expect(r.campaigns.map((c) => c.name)).toEqual(["Breach", "Warn", "OK", "NoBudget"]);
  });
});

describe("evaluateGuardrails — learning phase", () => {
  it("flags a campaign that first appeared mid-window and is under 7 days old", () => {
    const rows: GuardrailRow[] = [
      row({ campaign_name: "Old", date: "2026-06-20" }),
      row({ campaign_name: "Old", date: "2026-07-03" }),
      row({ campaign_name: "New", date: "2026-07-01" }),
      row({ campaign_name: "New", date: "2026-07-03" }),
    ];
    const r = evaluateGuardrails(rows);
    const fresh = r.campaigns.find((c) => c.name === "New")!;
    expect(fresh.learning).not.toBeNull();
    expect(fresh.learning!.dayNumber).toBe(3); // 1 Jul → 3 Jul = day 3
    expect(fresh.learning!.advice).toContain("cost per result");
  });

  it("does NOT flag a campaign present from the window start (true start unknown)", () => {
    const r = evaluateGuardrails([
      row({ campaign_name: "A", date: "2026-07-01" }),
      row({ campaign_name: "A", date: "2026-07-03" }),
    ]);
    expect(r.campaigns[0].learning).toBeNull();
  });

  it("does NOT flag once past the learning window", () => {
    const rows: GuardrailRow[] = [
      row({ campaign_name: "Anchor", date: "2026-06-01" }),
      row({ campaign_name: "Aged", date: "2026-06-20" }),
      row({ campaign_name: "Aged", date: "2026-07-03" }),
    ];
    const r = evaluateGuardrails(rows);
    expect(r.campaigns.find((c) => c.name === "Aged")!.learning).toBeNull();
  });
});

describe("evaluateGuardrails — combined cap + projection", () => {
  it("derives the daily cap from monthlyBudget / days in month", () => {
    const r = evaluateGuardrails([row({ spend: 10 })], { monthlyBudget: 3100 }); // July = 31 days
    expect(r.combined.cap).toBeCloseTo(100);
    expect(r.combined.pct).toBeCloseTo(0.1);
    expect(r.combined.status).toBe("ok");
  });

  it("no monthly budget → no-cap, pct null (no fabrication)", () => {
    const r = evaluateGuardrails([row()]);
    expect(r.combined.cap).toBeNull();
    expect(r.combined.pct).toBeNull();
    expect(r.combined.status).toBe("no-cap");
  });

  it("projects end-of-day linearly when now is the snapshot day", () => {
    const now = new Date("2026-07-03T12:00:00Z"); // half the day elapsed
    const r = evaluateGuardrails([row({ spend: 10 })], { now });
    expect(r.combined.projectedEod).toBeCloseTo(20);
  });

  it("does not project off stale data or a barely-started day", () => {
    const stale = evaluateGuardrails([row({ date: "2026-07-01", spend: 10 })], { now: new Date("2026-07-03T12:00:00Z") });
    expect(stale.combined.projectedEod).toBeNull();
    const early = evaluateGuardrails([row({ spend: 10 })], { now: new Date("2026-07-03T00:30:00Z") });
    expect(early.combined.projectedEod).toBeNull(); // < 1h elapsed
  });

  it("combined breach emits a HIGH account-level finding", () => {
    const r = evaluateGuardrails([row({ spend: 200 })], { monthlyBudget: 3100 });
    expect(r.combined.status).toBe("breach");
    expect(r.findings[0].campaign).toBe("(account)");
    expect(r.findings[0].severity).toBe("HIGH");
  });
});

describe("evaluateGuardrails — invariants", () => {
  it("never mutates its input", () => {
    const rows = [row(), row({ campaign_name: "B", date: "2026-07-02" })];
    const snapshot = JSON.parse(JSON.stringify(rows));
    evaluateGuardrails(rows, { monthlyBudget: 1000 });
    expect(rows).toEqual(snapshot);
  });

  it("exposes the documented defaults", () => {
    expect(DEFAULT_GUARDRAILS.warnAt).toBe(0.85);
    expect(DEFAULT_GUARDRAILS.learningDays).toBe(7);
  });
});
