import { describe, it, expect } from "vitest";
import { buildAudienceProposals, hourLabel } from "./proposals";
import { SAMPLE_AUDIENCE } from "./insights";
import type { AudienceInsights } from "./types";

describe("hourLabel", () => {
  it("formats 12-hour clock with am/pm", () => {
    expect(hourLabel(0)).toBe("12:00 am");
    expect(hourLabel(8)).toBe("8:00 am");
    expect(hourLabel(12)).toBe("12:00 pm");
    expect(hourLabel(20)).toBe("8:00 pm");
  });
});

describe("buildAudienceProposals (sample)", () => {
  const p = buildAudienceProposals(SAMPLE_AUDIENCE);

  it("computes gender split that sums to 100", () => {
    expect(p.femalePct + p.malePct).toBe(100);
    expect(p.femalePct).toBe(62); // sample is female-leaning
  });

  it("finds the dominant age band", () => {
    expect(p.dominant.bracket).toBe("25-34");
    expect(p.dominant.sharePct).toBe(35);
  });

  it("ranks the top three active hours, evening peak first", () => {
    expect(p.bestTimes).toHaveLength(3);
    expect(p.bestTimes[0].hour).toBe(20); // 84 is the max in the sample
    expect(p.bestTimes[0].label).toBe("8:00 pm");
    // strictly descending by score
    expect(p.bestTimes[0].score).toBeGreaterThanOrEqual(p.bestTimes[1].score);
    expect(p.bestTimes[1].score).toBeGreaterThanOrEqual(p.bestTimes[2].score);
  });

  it("produces draft posts timed to the best hours", () => {
    expect(p.draftPosts.length).toBeGreaterThan(0);
    expect(p.draftPosts[0].hour).toBe(p.bestTimes[0].hour);
    expect(p.draftPosts[0].platform).toBe("instagram");
  });

  it("drafts ad audiences flagged as review-only (never auto-applied)", () => {
    expect(p.adAudiences.length).toBeGreaterThan(0);
    for (const a of p.adAudiences) expect(a.note.toLowerCase()).toContain("draft only");
    // Core audience reflects the top location.
    expect(p.adAudiences[0].spec).toContain("Sydney");
  });

  it("includes a content theme localised to the top city", () => {
    expect(p.contentThemes.some((t) => t.title.includes("Sydney"))).toBe(true);
  });

  it("writes report-ready summary lines", () => {
    expect(p.reportSummary[0]).toContain("8,420 followers");
    expect(p.reportSummary.join(" ")).toContain("25-34");
  });
});

describe("buildAudienceProposals (edge: even split, single band)", () => {
  const even: AudienceInsights = {
    ...SAMPLE_AUDIENCE,
    ageGender: [{ bracket: "25-34", female: 50, male: 50 }],
    activeByHour: new Array(24).fill(0).map((_, h) => (h === 9 ? 100 : 0)),
  };
  const p = buildAudienceProposals(even);

  it("handles a 50/50 split", () => {
    expect(p.femalePct).toBe(50);
    expect(p.malePct).toBe(50);
  });

  it("still returns three best-time slots even with one active hour", () => {
    expect(p.bestTimes).toHaveLength(3);
    expect(p.bestTimes[0].hour).toBe(9);
  });
});
