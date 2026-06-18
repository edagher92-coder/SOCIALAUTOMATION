import type { AudienceInsights, Platform } from "./types";

// Deterministic, numbers-first proposal engine for Audience Intelligence.
//
// PURE (no I/O) so it's unit-testable and parity-stable, mirroring the ads engine.
// Everything here is a PROPOSAL: drafts the human reviews and approves. Nothing is
// applied to a live account. AU English, anti-hype — no guarantees or absolute claims.

export type BestTime = { hour: number; label: string; score: number };
export type ContentTheme = { title: string; why: string };
export type DraftPost = { platform: Platform; caption: string; hour: number; whenLabel: string };
export type AdAudience = { name: string; spec: string; note: string };
export type CreativeBrief = { segment: string; angle: string; brief: string };

export type AudienceProposals = {
  dominant: { bracket: string; sharePct: number };
  femalePct: number;
  malePct: number;
  bestTimes: BestTime[];
  contentThemes: ContentTheme[];
  draftPosts: DraftPost[];
  adAudiences: AdAudience[];
  creativeBriefs: CreativeBrief[];
  reportSummary: string[]; // plain-English lines for the white-label report's Audience section
};

// 12-hour clock label, e.g. 20 -> "8:00 pm".
export function hourLabel(h: number): string {
  const period = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:00 ${period}`;
}

// Content themes keyed off the dominant age band — practical, format-led ideas a
// social media manager can run with. Falls back to a sensible general set.
function themesForBand(band: string, topLocation: string): ContentTheme[] {
  const local: ContentTheme = { title: `Local angle — ${topLocation}`, why: `${topLocation} is your single biggest follower city, so location-specific posts (events, partners, “in ${topLocation}” framing) tend to over-index.` };
  const byBand: Record<string, ContentTheme[]> = {
    "18-24": [
      { title: "Short-form trends & sounds", why: "A young-skewing audience responds to fast, native short-form over polished posts." },
      { title: "Relatable, behind-the-scenes", why: "Authentic BTS and day-in-the-life beats studio content for this band." },
    ],
    "25-34": [
      { title: "Save-this how-to carousels", why: "25–34s save and share practical, step-by-step value — strong for reach via shares." },
      { title: "Founder story & behind-the-scenes", why: "This band buys into people and process, not just product." },
    ],
    "35-44": [
      { title: "Proof, results & comparisons", why: "35–44s weigh value and credibility — lean on proof, before/after and clear outcomes (no guarantees)." },
      { title: "Time-saving tips", why: "Practical, time-back content resonates with a busy, family-stage audience." },
    ],
    "45-54": [
      { title: "Clear, benefit-led explainers", why: "This band prefers straightforward, well-captioned posts over fast cuts." },
      { title: "Trust & testimonials", why: "Social proof and longevity signals carry more weight here." },
    ],
  };
  return [...(byBand[band] ?? [
    { title: "Save-this how-to carousels", why: "Practical, step-by-step value earns saves and shares across most audiences." },
    { title: "Founder story & behind-the-scenes", why: "People-and-process content builds trust regardless of age band." },
  ]), local];
}

export function buildAudienceProposals(a: AudienceInsights): AudienceProposals {
  // Gender lean across known male/female shares.
  const totalF = a.ageGender.reduce((s, r) => s + r.female, 0);
  const totalM = a.ageGender.reduce((s, r) => s + r.male, 0);
  const known = totalF + totalM || 1;
  const femalePct = Math.round((totalF / known) * 100);
  const malePct = 100 - femalePct;
  const genderWord = femalePct > malePct ? "women" : malePct > femalePct ? "men" : "an even split";
  const leanPct = Math.max(femalePct, malePct);

  // Dominant age band.
  const withTotals = a.ageGender.map((r) => ({ bracket: r.bracket, total: r.female + r.male }));
  const dom = withTotals.reduce((best, r) => (r.total > best.total ? r : best), withTotals[0]);
  const dominant = { bracket: dom.bracket, sharePct: Math.round(dom.total) };

  // Top 3 active hours (stable: ties broken by earlier hour).
  const bestTimes: BestTime[] = a.activeByHour
    .map((score, hour) => ({ hour, score }))
    .sort((x, y) => y.score - x.score || x.hour - y.hour)
    .slice(0, 3)
    .map((t) => ({ ...t, label: hourLabel(t.hour) }));

  const topLoc = a.topLocations[0]?.name ?? "your main city";
  const top3Loc = a.topLocations.slice(0, 3);
  const topLang = a.topLanguages[0]?.name ?? "English";

  const contentThemes = themesForBand(dominant.bracket, topLoc);

  // Draft posts (status: draft) the user can push to the calendar and edit. Starter
  // copy only — clearly something to personalise before scheduling.
  const draftPosts: DraftPost[] = [
    {
      platform: a.platform,
      caption: `[Starter draft — personalise me] ${contentThemes[0].title}: share one quick, useful thing your followers can act on today. End with a question to invite replies. #${topLoc.replace(/\s+/g, "")}`,
      hour: bestTimes[0]?.hour ?? 19,
      whenLabel: bestTimes[0]?.label ?? hourLabel(19),
    },
    {
      platform: a.platform,
      caption: `[Starter draft — personalise me] ${contentThemes[1].title}: take followers behind the scenes of how you do it. Keep it real and save-worthy.`,
      hour: bestTimes[1]?.hour ?? 12,
      whenLabel: bestTimes[1]?.label ?? hourLabel(12),
    },
  ];

  // Suggested saved audiences — DRAFTS for the human to review before any ad use.
  const ageBands = a.ageGender.map((r) => r.bracket);
  const ageSpan = `${ageBands[0]?.split("-")[0] ?? "18"}–${(ageBands[2] ?? ageBands[ageBands.length - 1] ?? "44").split("-")[1] ?? "44"}`;
  const adAudiences: AdAudience[] = [
    {
      name: "Core — mirrors your followers",
      spec: `Age ${ageSpan}, skewed ${genderWord} (${leanPct}%), in ${top3Loc.map((l) => l.name).join(", ")}. Primary language ${topLang}.`,
      note: "Draft only — review and refine in Ads Manager before spending.",
    },
    {
      name: "Lookalike seed",
      spec: `1% lookalike seeded from your most engaged followers, anchored to ${topLoc}.`,
      note: "Draft only — needs a source audience of engagers; you approve before use.",
    },
  ];

  // Per-segment creative briefs (top two age bands).
  const sorted = [...withTotals].sort((x, y) => y.total - x.total);
  const creativeBriefs: CreativeBrief[] = sorted.slice(0, 2).map((seg, i) => ({
    segment: `${seg.bracket} (${Math.round(seg.total)}% of followers)`,
    angle: i === 0
      ? `Lead with the value your largest segment cares about, framed for ${genderWord}.`
      : `A secondary cut for ${seg.bracket} — same offer, different hook and pacing.`,
    brief: `Format: ${a.platform === "tiktok" ? "9:16 reel, hook in 1s" : "carousel or reel"}. Hook to the ${seg.bracket} mindset; show proof, not promises; CTA: save / DM / link in bio. Localise visuals to ${topLoc} where natural.`,
  }));

  const reportSummary = [
    `${a.followerCount.toLocaleString("en-AU")} followers on ${a.platform}; ${femalePct}% women / ${malePct}% men.`,
    `Largest age group: ${dominant.bracket} (${dominant.sharePct}% of followers).`,
    `Top locations: ${top3Loc.map((l) => `${l.name} (${l.share}%)`).join(", ")}.`,
    `Most active: ${bestTimes.map((t) => t.label).join(", ")} (local time).`,
    `Primary language: ${topLang} (${a.topLanguages[0]?.share ?? 0}%).`,
  ];

  return { dominant, femalePct, malePct, bestTimes, contentThemes, draftPosts, adAudiences, creativeBriefs, reportSummary };
}
