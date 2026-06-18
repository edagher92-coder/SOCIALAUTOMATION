import type { AudienceInsights } from "./types";

// A representative AU audience used until a Facebook Page / Instagram account is
// connected (real follower demographics need a Page/IG id + the
// `instagram_manage_insights` scope, which is owner-gated like the live ad audit).
// Clearly flagged with source: "sample" so the UI never passes it off as real data.
export const SAMPLE_AUDIENCE: AudienceInsights = {
  platform: "instagram",
  handle: "@your_brand",
  followerCount: 8420,
  ageGender: [
    { bracket: "18-24", female: 14, male: 9 },
    { bracket: "25-34", female: 22, male: 13 },
    { bracket: "35-44", female: 12, male: 8 },
    { bracket: "45-54", female: 7, male: 4 },
    { bracket: "55-64", female: 4, male: 2 },
    { bracket: "65+", female: 3, male: 2 },
  ],
  topLocations: [
    { name: "Sydney", share: 24 },
    { name: "Melbourne", share: 19 },
    { name: "Brisbane", share: 12 },
    { name: "Perth", share: 8 },
    { name: "Adelaide", share: 6 },
    { name: "Auckland", share: 5 },
    { name: "Gold Coast", share: 4 },
  ],
  topLanguages: [
    { name: "English", share: 88 },
    { name: "Arabic", share: 4 },
    { name: "Mandarin", share: 3 },
    { name: "Spanish", share: 2 },
  ],
  // Local-time activity: quiet overnight, a morning bump, a lunch bump, evening peak.
  activeByHour: [10, 6, 4, 3, 3, 5, 18, 42, 55, 40, 33, 38, 52, 46, 38, 35, 40, 48, 62, 78, 84, 72, 46, 22],
  source: "sample",
  fetchedAt: new Date().toISOString(),
};

/**
 * Aggregate follower demographics for an org's connected profile.
 *
 * For now this returns the clearly-labelled SAMPLE_AUDIENCE: the live path needs a
 * connected Page/IG account id (not just the ad-account token we store today) plus
 * the `instagram_manage_insights` scope — that connection upgrade is owner-gated,
 * exactly like the real-account ad audit. When it lands, the live Graph/TikTok read
 * slots in here behind the same shape, and `source` flips off "sample".
 */
export async function getAudienceInsights(_orgId: string): Promise<AudienceInsights> {
  return SAMPLE_AUDIENCE;
}
