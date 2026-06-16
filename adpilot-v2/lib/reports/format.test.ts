import { describe, it, expect } from "vitest";
import { buildReportMarkdown, buildRileyReportInstruction, type ReportPayload } from "./format";
import { REPORT_SECTIONS, SAFETY_FOOTER } from "./templates";

const payload: ReportPayload = {
  config: { business_name: "Bean & Bloom", currency: "AUD", average_sale_value: 34, gross_margin: 0.62 },
  summary: {
    spend: 5000, leads: 40, purchases: 12, revenue: 16800,
    ctr: 0.015, cpc: 0.5, cpm: 7.5, frequency: 2.1, conv_rate: 0.01,
    cpl: 125, cpa: 67.8, roas: 3.36, mer: 3.36, break_even_cpa: 21.08, break_even_roas: 1.61,
  },
  health: { total: 58, band: "Orange", guidance: "Needs work.", findings: [], weakest: [], breakdown: {} },
  campaigns: [{ campaign: "Retargeting", platforms: ["meta"], spend: 3000, cpa: 40, roas: 4.2, health: 72, band: "Yellow" }],
  decisions: [
    { verdict: "scale", name: "Retargeting", platform: "meta", proposal: "Propose a paused duplicate at +20% budget — needs typed YES." },
    { verdict: "keep", name: "Prospecting", platform: "meta", proposal: "Hold." },
  ],
  safety: "Read-only analysis. No live ad was changed. Budget moves need a typed YES.",
};

describe("buildReportMarkdown", () => {
  const md = buildReportMarkdown(payload, { kind: "weekly", periodLabel: "Week of 9–15 Jun 2026" });

  it("includes the business name, period and a deterministic KPI table", () => {
    expect(md).toContain("Bean & Bloom");
    expect(md).toContain("Week of 9–15 Jun 2026");
    expect(md).toContain("| Spend | $5,000.00 |");
    expect(md).toContain("Break-even CPA");
  });

  it("renders the By Campaign table for weekly/monthly", () => {
    expect(md).toContain("## By Campaign");
    expect(md).toContain("Retargeting");
  });

  it("lists actionable recommendations but excludes 'keep' verdicts", () => {
    expect(md).toContain("**SCALE**");
    expect(md).not.toContain("Prospecting"); // keep verdict filtered out
  });

  it("always carries the safety footer", () => {
    expect(md).toContain(payload.safety!);
  });

  it("renders N/A for a missing metric instead of fabricating", () => {
    const thin = buildReportMarkdown({ summary: { spend: 100 } }, { kind: "daily", periodLabel: "Today" });
    expect(thin).toContain("| CPA | N/A |");
    expect(thin).toContain(SAFETY_FOOTER); // falls back to the constant footer
  });

  it("uses Australian spelling in the Riley instruction", () => {
    const instr = buildRileyReportInstruction(payload, { kind: "weekly", periodLabel: "x" });
    expect(instr.toLowerCase()).toContain("australian english");
    expect(instr).toContain(REPORT_SECTIONS.weekly[0]);
  });
});
