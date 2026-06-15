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

async function publishFacebook(post: PublishablePost): Promise<PublishResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const pageId = process.env.META_PAGE_ID;
  if (!token || !pageId) throw new NotConfiguredError("Facebook");
  if (post.media_url && post.media_type === "image") {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: post.media_url, caption: post.caption || "", access_token: token }),
    });
    const j: any = await r.json();
    if (!r.ok) throw new Error(j.error?.message || "Facebook publish failed");
    return { externalId: j.post_id || j.id };
  }
  const r = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ message: post.caption || "", ...(post.media_url ? { link: post.media_url } : {}), access_token: token }),
  });
  const j: any = await r.json();
  if (!r.ok) throw new Error(j.error?.message || "Facebook publish failed");
  return { externalId: j.id };
}

async function publishInstagram(post: PublishablePost): Promise<PublishResult> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  const igId = process.env.IG_USER_ID;
  if (!token || !igId) throw new NotConfiguredError("Instagram");
  if (!post.media_url) throw new Error("Instagram requires a media_url (image or video).");
  const isVideo = post.media_type === "video" || post.media_type === "reel";
  const params: any = { caption: post.caption || "", access_token: token };
  if (isVideo) { params.media_type = post.media_type === "reel" ? "REELS" : "VIDEO"; params.video_url = post.media_url; }
  else { params.image_url = post.media_url; }
  // 1) create media container
  const c = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(params),
  });
  const cj: any = await c.json();
  if (!c.ok) throw new Error(cj.error?.message || "Instagram container failed");
  // 2) publish the container
  const p = await fetch(`https://graph.facebook.com/v21.0/${igId}/media_publish`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ creation_id: cj.id, access_token: token }),
  });
  const pj: any = await p.json();
  if (!p.ok) throw new Error(pj.error?.message || "Instagram publish failed");
  return { externalId: pj.id };
}

async function publishTikTok(post: PublishablePost): Promise<PublishResult> {
  const token = process.env.TIKTOK_PUBLISH_TOKEN;
  if (!token) throw new NotConfiguredError("TikTok");
  if (!post.media_url) throw new Error("TikTok requires a media_url (video).");
  // Content Posting API (Direct Post, PULL_FROM_URL). Defaults to SELF_ONLY — unaudited
  // apps can't post public; flip privacy once the app is approved for content posting.
  const r = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      post_info: { title: post.caption || "", privacy_level: "SELF_ONLY" },
      source_info: { source: "PULL_FROM_URL", video_url: post.media_url },
    }),
  });
  const j: any = await r.json();
  if (j?.error?.code && j.error.code !== "ok") throw new Error(j.error.message || "TikTok publish failed");
  return { externalId: j?.data?.publish_id };
}

export async function publishPost(post: PublishablePost): Promise<PublishResult> {
  switch (post.platform) {
    case "facebook": return publishFacebook(post);
    case "instagram": return publishInstagram(post);
    case "tiktok": return publishTikTok(post);
    default: throw new Error("Unknown platform");
  }
}
