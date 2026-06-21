import { describe, it, expect } from "vitest";
import { buildReportPdf } from "@/lib/reports/pdf";

const head = (u: Uint8Array) => String.fromCharCode(...Array.from(u.slice(0, 5)));

describe("buildReportPdf", () => {
  it("renders a valid PDF from a full payload", async () => {
    const pdf = await buildReportPdf(
      {
        health: {
          total: 72, band: "Yellow", guidance: "Solid — a few fixes will lift this.",
          findings: [{ severity: "CRITICAL", message: "CPA is above break-even on 2 campaigns." }],
        },
        summary: { spend: 1234.5, cpa: 41.2, break_even_cpa: 38, roas: 2.1, leads: 30, revenue: 2600 },
        decisions: [{ verdict: "reduce", name: "Campaign A", proposal: "Cut budget 20% while CPA recovers." }],
      },
      { title: "Weekly health", periodLabel: "weekly", brandName: "Acme Co", primaryColor: "#0b5fff" },
    );
    expect(head(pdf)).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(800);
  });

  it("does not throw on an empty / partial payload", async () => {
    const empty = await buildReportPdf({}, {});
    expect(head(empty)).toBe("%PDF-");
    const partial = await buildReportPdf({ health: { total: 50, band: "Orange" } }, { title: "Partial" });
    expect(head(partial)).toBe("%PDF-");
  });

  it("tolerates a non-object payload without throwing", async () => {
    expect(head(await buildReportPdf(null, {}))).toBe("%PDF-");
  });

  it("renders an optional Projected impact section when supplied", async () => {
    const withProj = await buildReportPdf(
      {
        summary: { spend: 12.8, leads: 1, cpa: 11.01 },
        projection: {
          basis: "Modelled at flat spend; ranges, not guarantees.",
          rows: [
            { label: "Baseline (now)", value: "1.0 conv/day, ~$12.80" },
            { label: "Mid", value: "~1.9 conv/day (+85% / -48%)" },
          ],
          caveat: "Validate over a 3-day test (decision floor 15 conversions).",
        },
      },
      { title: "Projection" },
    );
    expect(head(withProj)).toBe("%PDF-");
    // A projection with rows should produce a longer doc than the same payload without it.
    const withoutProj = await buildReportPdf({ summary: { spend: 12.8, leads: 1, cpa: 11.01 } }, { title: "Projection" });
    expect(withProj.length).toBeGreaterThan(withoutProj.length);
  });
});

