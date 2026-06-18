import type { AudienceInsights } from "./types";
import { getLiveAudience } from "./live";

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
 * Tries the live platform read first (Facebook Page / Instagram via Graph, then TikTok —
 * see ./live). Live needs a Page/IG token with the audience scopes (pages_read_engagement /
 * instagram_manage_insights), which is owner-gated like the real-account ad audit; until that
 * connection exists — or if a platform withholds a breakdown (needs ~100+ followers) — we fall
 * back to the clearly-labelled SAMPLE_AUDIENCE so the UI never passes partial data off as real.
 */
export async function getAudienceInsights(orgId: string): Promise<AudienceInsights> {
  const live = orgId ? await getLiveAudience(orgId).catch(() => null) : null;
  return live ?? SAMPLE_AUDIENCE;
}
