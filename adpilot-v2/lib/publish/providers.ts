import "server-only";

// Organic content publishing (Facebook Page / Instagram / TikTok). Uses WRITE-scope
// credentials set per platform in env — deliberately SEPARATE from the read-only ad
// tokens. When credentials are absent we throw NotConfiguredError so nothing is ever
// silently attempted. This path only publishes content the user created and approved;
// it never touches ad campaigns.

export type PublishablePost = {
  platform: "facebook" | "instagram" | "tiktok";
  caption?: string | null;
  media_url?: string | null;
  media_type?: string | null;
};
export type PublishResult = { externalId?: string };

export class NotConfiguredError extends Error {
  constructor(p: string) {
    super(`Publishing for ${p} isn't configured yet. Add the write-scope token/IDs in env to enable it.`);
    this.name = "NotConfiguredError";
  }
}
export const isNotConfigured = (e: any) => e?.name === "NotConfiguredError";

// Media URLs must be public HTTPS — the platform APIs fetch them server-side and reject
// (or silently fail) on non-https. We re-validate here as a defensive backstop even though
// create-time validation already enforces it, so the publish path can never send a bad URL.
function requireHttpsMedia(post: PublishablePost): string {
  const url = (post.media_url || "").trim();
  if (!url) throw new Error(`${post.platform} requires a media_url.`);
  if (!url.startsWith("https://")) throw new Error("media_url must be a public https URL.");
  return url;
}

async function publishFacebook(post: PublishablePost): Promise<PublishResult> {
  // --- not-configured check first (no API call when credentials are absent) ---
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) throw new NotConfiguredError("Facebook");

  // Photo post: requires an https media URL.
  if (post.media_type === "image") {
    const url = requireHttpsMedia(post);
    const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, caption: post.caption || "", access_token: token }),
    });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error?.message || `Facebook publish failed (HTTP ${r.status})`);
    return { externalId: j.post_id || j.id };
  }

  // Text / link post. A bare Page feed post needs SOMETHING to publish.
  const caption = (post.caption || "").trim();
  const link = post.media_url?.trim();
  if (link && !link.startsWith("https://")) throw new Error("media_url must be a public https URL.");
  if (!caption && !link) throw new Error("Facebook needs a caption (or a link) to publish.");
  const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: caption, ...(link ? { link } : {}), access_token: token }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error?.message || `Facebook publish failed (HTTP ${r.status})`);
  return { externalId: j.id };
}

async function publishInstagram(post: PublishablePost): Promise<PublishResult> {
  // --- not-configured check first ---
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const igId = process.env.IG_USER_ID;
  if (!token || !igId) throw new NotConfiguredError("Instagram");
  // Instagram has no text-only posts: media is mandatory and must be https.
  const url = requireHttpsMedia(post);
  const isVideo = post.media_type === "video" || post.media_type === "reel";
  const params: any = { caption: post.caption || "", access_token: token };
  if (isVideo) { params.media_type = post.media_type === "reel" ? "REELS" : "VIDEO"; params.video_url = url; }
  else { params.image_url = url; }
  // 1) create media container
  const c = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params),
  });
  const cj: any = await c.json().catch(() => ({}));
  if (!c.ok || !cj.id) throw new Error(cj.error?.message || `Instagram container failed (HTTP ${c.status})`);
  // 2) publish the container
  const p = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: cj.id, access_token: token }),
  });
  const pj: any = await p.json().catch(() => ({}));
  if (!p.ok) throw new Error(pj.error?.message || `Instagram publish failed (HTTP ${p.status})`);
  return { externalId: pj.id };
}

async function publishTikTok(post: PublishablePost): Promise<PublishResult> {
  // --- not-configured check first ---
  const token = process.env.TIKTOK_PUBLISH_TOKEN;
  if (!token) throw new NotConfiguredError("TikTok");
  // TikTok is video-only and pulls the file from a public https URL.
  const url = requireHttpsMedia(post);
  // Content Posting API (Direct Post, PULL_FROM_URL). Defaults to SELF_ONLY — unaudited
  // apps can't post public; flip privacy once the app is approved for content posting.
  const r = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      post_info: { title: post.caption || "", privacy_level: "SELF_ONLY" },
      source_info: { source: "PULL_FROM_URL", video_url: url },
    }),
  });
  const j: any = await r.json().catch(() => ({}));
  // TikTok returns error.code === "ok" on success. Treat a non-ok HTTP status, an error
  // code other than "ok", or a missing publish_id as a failure — never report a silent success.
  const code = j?.error?.code;
  if (!r.ok || (code && code !== "ok")) throw new Error(j?.error?.message || `TikTok publish failed (HTTP ${r.status})`);
  const publishId = j?.data?.publish_id;
  if (!publishId) throw new Error("TikTok publish failed — no publish_id returned.");
  return { externalId: publishId };
}

export async function publishPost(post: PublishablePost): Promise<PublishResult> {
  switch (post.platform) {
    case "facebook": return publishFacebook(post);
    case "instagram": return publishInstagram(post);
    case "tiktok": return publishTikTok(post);
    default: throw new Error("Unknown platform");
  }
}
