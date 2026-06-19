// Audience Intelligence — types for aggregate, anonymised follower insights.
//
// IMPORTANT (compliance): these are AGGREGATE, platform-reported audience insights
// (age bands, gender split, top locations/languages, active hours) pulled via the
// official Graph / TikTok APIs using the connection the user already authorised in
// Connect. We never profile individual followers, store personal data, or scrape —
// the platforms only expose anonymised aggregates, and breakdowns need ~100+ followers.

export type Platform = "instagram" | "facebook" | "tiktok";

// Age bracket split by gender, expressed as a % of the total audience.
export type AgeGenderRow = { bracket: string; female: number; male: number };

export type NamedShare = { name: string; share: number }; // % of audience

export type AudienceInsights = {
  platform: Platform;
  handle: string;
  followerCount: number;
  ageGender: AgeGenderRow[];   // female+male across all rows sums to ~100
  topLocations: NamedShare[];  // descending by share
  topLanguages: NamedShare[];  // descending by share
  activeByHour: number[];      // length 24, relative activity 0–100 by local hour
  source: "sample" | Platform; // "sample" until a Page/IG account is connected
  fetchedAt: string;           // ISO
};
