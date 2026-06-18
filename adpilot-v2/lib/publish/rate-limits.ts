// Per-account daily publish caps. The platform APIs rate-limit API-published content and
// flag/restrict accounts that exceed it (Instagram caps API-published posts to ~50/24h and
// Reels lower; TikTok's content-posting quota is small). We enforce CONSERVATIVE caps before
// every publish so a large queue can never get a client's account banned — over-cap posts are
// deferred to the next window, never failed. Pure cap logic here is unit-tested; the count
// query takes the admin client as an argument (no IO import) so it stays testable.

export type PublishPlatform = "facebook" | "instagram" | "tiktok";

// Conservative trailing-24h caps, kept safely under the platforms' published limits.
export const DAILY_CAPS: Record<string, number> = {
  facebook: 50,
  instagram: 50, // feed image/video
  instagram_reel: 25, // Reels are throttled harder by Meta
  tiktok: 15, // TikTok content-posting quota is small (esp. unaudited apps)
};

// Reels are a distinct bucket from the Instagram feed (separate platform cap).
export function capKey(platform: string, mediaType?: string | null): string {
  if (platform === "instagram" && mediaType === "reel") return "instagram_reel";
  return platform;
}

export function dailyCap(platform: string, mediaType?: string | null): number {
  return DAILY_CAPS[capKey(platform, mediaType)] ?? 50;
}

// Pure decision: given how many were already published in the trailing window, is one more allowed?
export function withinCap(publishedInWindow: number, platform: string, mediaType?: string | null): boolean {
  return publishedInWindow < dailyCap(platform, mediaType);
}

// Count successful publishes in the trailing 24h for an org+platform, matching the cap bucket
// (Instagram Reels are counted separately from the feed). `admin` is a Supabase client.
export async function publishedInBucket(
  admin: any,
  orgId: string,
  platform: string,
  mediaType?: string | null,
): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  try {
    let q = admin
      .from("content_posts")
      .select("id", { count: "exact", head: true })
      .eq("organisation_id", orgId)
      .eq("platform", platform)
      .eq("status", "published")
      .gte("published_at", since);
    if (platform === "instagram") {
      q = mediaType === "reel" ? q.eq("media_type", "reel") : q.in("media_type", ["image", "video"]);
    }
    const { count } = await q;
    return count || 0;
  } catch {
    // Fail open: a transient count error must never halt the publish pipeline. The platform's
    // own rate limit (which rejects a genuinely over-limit post) remains the backstop.
    return 0;
  }
}

// Convenience: resolve the live cap decision for a post about to publish.
export async function checkPublishCap(
  admin: any,
  orgId: string,
  platform: string,
  mediaType?: string | null,
): Promise<{ allowed: boolean; used: number; cap: number }> {
  const used = await publishedInBucket(admin, orgId, platform, mediaType);
  const cap = dailyCap(platform, mediaType);
  return { allowed: used < cap, used, cap };
}
