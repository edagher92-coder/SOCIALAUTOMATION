import { describe, it, expect } from "vitest";
import { analyseAccount } from "@/lib/organic/account";
import { buildOrganicReport } from "@/lib/organic/report";
import type { OrganicPostInput } from "@/lib/organic/types";

// Two proven winners (Meta + TikTok), one below-benchmark, one tiny-sample → a realistic analysis.
const POSTS: OrganicPostInput[] = [
  { platform: "meta", name: "Meta winner", reach: 5000, impressions: 12000, engagements: 150 }, // 3% > 2% → boost
  { platform: "tiktok", name: "TikTok winner", reach: 8000, impressions: 20000, engagements: 480 }, // 6% > 4.5% → boost
  { platform: "meta", name: "Weak", reach: 4000, impressions: 9000, engagements: 24 }, // below → hold
  { platform: "meta", name: "Tiny", reach: 100, impressions: 200, engagements: 8 }, // < floor → hold
];
const CPM = { meta: 10, tiktok: 10 };

describe("buildOrganicReport", () => {
  const analysis = analyseAccount(POSTS, CPM, { budgetPerPost: 100 });
  const report = buildOrganicReport(analysis, { businessName: "Acme Co", generatedAt: "19 Jun 2026" });

  it("orders the sections: Summary, Boost-ready, Hold, Expectations, How we worked it out", () => {
    const headings = report.sections.map((s) => s.heading);
    expect(headings).toEqual([
      "Summary",
      "By platform",
      "Boost-ready recommendations",
      "Hold (improve organically first)",
      "What to expect",
      "How we worked it out",
    ]);
  });

  it("builds a recommendations table with one row per recommendation", () => {
    const recSection = report.sections.find((s) => s.heading === "Boost-ready recommendations")!;
    expect(recSection.table).toBeDefined();
    expect(recSection.table!.rows).toHaveLength(analysis.recommendations.length);
    expect(analysis.recommendations.length).toBe(2);
    // Money/int/pct formatting present (en-AU thousands separators, $ money, % rate).
    const md = report.markdown;
    expect(md).toMatch(/\$\d/); // a dollar amount
    expect(md).toMatch(/\d,\d{3}/); // a thousands separator
    expect(md).toMatch(/\d+\.\d%/); // a percentage like 3.0%
  });

  it("summary table carries the account totals", () => {
    const sumSection = report.sections.find((s) => s.heading === "Summary")!;
    const labels = sumSection.table!.rows.map((r) => r[0]);
    expect(labels).toEqual(
      expect.arrayContaining(["Posts analysed", "Total organic reach", "Total impressions", "Avg engagement rate"]),
    );
  });

  it("holds the non-boost-ready posts as bullets", () => {
    const holdSection = report.sections.find((s) => s.heading.startsWith("Hold"))!;
    expect(holdSection.bullets!.length).toBe(analysis.hold.length);
    expect(holdSection.bullets!.length).toBe(2);
  });

  it("renders markdown with every heading and the safety line in italics", () => {
    const md = report.markdown;
    expect(md).toContain("# Acme Co — Organic Boost Report");
    expect(md).toContain("## Summary");
    expect(md).toContain("## By platform");
    expect(md).toContain("## Boost-ready recommendations");
    expect(md).toContain("## Hold (improve organically first)");
    expect(md).toContain("## What to expect");
    expect(md).toContain("## How we worked it out");
    expect(md).toContain("| Rank | Post | Platform |"); // markdown table header
    expect(md).toContain(`_${analysis.safety}_`); // safety footer, italicised
  });

  it("exposes title, subtitle and safety on the report object", () => {
    expect(report.title).toBe("Acme Co — Organic Boost Report");
    expect(report.subtitle).toMatch(/organic reach/);
    expect(report.safety).toBe(analysis.safety);
  });

  it("renders an empty analysis gracefully without throwing", () => {
    const empty = analyseAccount([], CPM);
    expect(() => buildOrganicReport(empty)).not.toThrow();
    const r = buildOrganicReport(empty);
    expect(r.sections).toHaveLength(1);
    expect(r.sections[0].intro).toMatch(/no posts analysed yet/i);
    expect(r.markdown).toMatch(/no posts analysed yet/i);
    expect(r.markdown).toContain(`_${empty.safety}_`);
  });

  it("falls back to a generic post label and default business name when missing", () => {
    const anon = analyseAccount(
      [{ platform: "tiktok", reach: 8000, impressions: 20000, engagements: 480 }],
      CPM,
    );
    const r = buildOrganicReport(anon);
    expect(r.title).toBe("Your account — Organic Boost Report");
    const recSection = r.sections.find((s) => s.heading === "Boost-ready recommendations")!;
    expect(recSection.table!.rows[0]).toContain("TikTok post");
  });
});
