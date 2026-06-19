// Shared contract for the organic-post suite. Every slice (account engine, reports, store,
// ingest API, UI) imports these so they agree on one shape. Read-only, numbers-first.
import type { OrganicPlatform, BoostProjection } from "./boost";

export type { OrganicPlatform } from "./boost";

// One organic post's own (unpaid) performance — the unit of analysis. `id`/`name`/`date` are
// optional so a post can be analysed from a quick manual entry or a stored/synced record alike.
export interface OrganicPostInput {
  id?: string;
  platform: OrganicPlatform;
  name?: string;     // caption/title, for display
  date?: string;     // ISO date posted (optional)
  reach: number;
  impressions: number;
  engagements: number;
}

// Per-platform roll-up inside the account summary.
export interface PlatformSummary {
  platform: OrganicPlatform;
  posts: number;
  reach: number;
  impressions: number;
  engagements: number;
  engagementRate: number;   // reach-weighted
}

// Account-level roll-up across many posts.
export interface OrganicSummary {
  posts: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagements: number;
  avgEngagementRate: number;        // reach-weighted across all posts
  byPlatform: PlatformSummary[];
}

// One ranked boost candidate: the post, its projection at the recommended budget, and its rank.
export interface BoostRecommendation {
  post: OrganicPostInput;
  recommendedBudget: number;
  projection: BoostProjection;
  rank: number;                     // 1 = strongest candidate
}

// The full account analysis the UI + reports render.
export interface AccountOrganicAnalysis {
  summary: OrganicSummary;
  recommendations: BoostRecommendation[];  // worth-boosting, strongest first
  hold: OrganicPostInput[];                // improve-organically-first / not-enough-data
  expectations: string[];                  // "boost the top N for $X → expect ~Y" (numbers-first)
  explanations: string[];                  // plain-English why
  totalRecommendedBudget: number;
  projectedAddedReach: number;             // summed across recommendations at recommended budgets
  projectedAddedEngagements: number;
  safety: string;
}

export interface AccountAnalysisOptions {
  budgetPerPost?: number;   // default boost budget used to rank/cost each candidate (default 100)
  maxRecommended?: number;  // cap the recommendations list (default: all worth-boosting)
}
