import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// publish/providers: per-platform dispatch, NotConfigured behaviour (no API call
// when write-scope env is absent), https media guards, and clear API-error paths.
//
// fetch is stubbed so we never hit the network. Platform env vars are set/cleared
// per test to flip the "configured" vs "not configured" branches.
// ---------------------------------------------------------------------------

import { publishPost, isNotConfigured, NotConfiguredError } from "./providers";

const fetchMock = vi.fn();

function ok(json: any) {
  return { ok: true, status: 200, json: async () => json };
}
function fail(status: number, json: any) {
  return { ok: false, status, json: async () => json };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  // Default: everything configured. Individual tests clear specific vars.
  process.env.META_PAGE_ACCESS_TOKEN = "page-tok";
  process.env.META_PAGE_ID = "page-1";
  process.env.IG_USER_ID = "ig-1";
  process.env.TIKTOK_PUBLISH_TOKEN = "tt-tok";
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.META_PAGE_ACCESS_TOKEN;
  delete process.env.META_PAGE_ID;
  delete process.env.IG_USER_ID;
  delete process.env.TIKTOK_PUBLISH_TOKEN;
});

describe("not-configured behaviour (env absent → NotConfiguredError, no API call)", () => {
  it("Facebook: throws NotConfiguredError when page token/id missing", async () => {
    delete process.env.META_PAGE_ACCESS_TOKEN;
    delete process.env.META_PAGE_ID;
    await expect(publishPost({ platform: "facebook", caption: "hi" })).rejects.toSatisfy(isNotConfigured);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Instagram: throws NotConfiguredError when IG user id missing", async () => {
    delete process.env.IG_USER_ID;
    const e = await publishPost({ platform: "instagram", media_url: "https://cdn/x.jpg", media_type: "image" }).catch((x) => x);
    expect(e).toBeInstanceOf(NotConfiguredError);
    expect(isNotConfigured(e)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TikTok: throws NotConfiguredError when publish token missing", async () => {
    delete process.env.TIKTOK_PUBLISH_TOKEN;
    await expect(publishPost({ platform: "tiktok", media_url: "https://cdn/v.mp4", media_type: "video" })).rejects.toSatisfy(isNotConfigured);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("not-configured is distinct from an API error", () => {
    expect(isNotConfigured(new NotConfiguredError("Facebook"))).toBe(true);
    expect(isNotConfigured(new Error("boom"))).toBe(false);
  });
});

describe("platform dispatch (configured → calls the right endpoint)", () => {
  it("routes Facebook image to /photos and returns externalId", async () => {
    fetchMock.mockResolvedValue(ok({ post_id: "p_99" }));
    const res = await publishPost({ platform: "facebook", caption: "c", media_url: "https://cdn/x.jpg", media_type: "image" });
    expect(res.externalId).toBe("p_99");
    expect(fetchMock.mock.calls[0][0]).toContain("/photos");
  });

  it("routes Facebook text to /feed", async () => {
    fetchMock.mockResolvedValue(ok({ id: "f_1" }));
    const res = await publishPost({ platform: "facebook", caption: "just text" });
    expect(res.externalId).toBe("f_1");
    expect(fetchMock.mock.calls[0][0]).toContain("/feed");
  });

  it("routes an Instagram reel through container -> poll status -> media_publish", async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ id: "container_1" }))        // 1) create container
      .mockResolvedValueOnce(ok({ status_code: "FINISHED" }))  // 1b) poll until processed
      .mockResolvedValueOnce(ok({ id: "media_1" }));           // 2) publish
    const res = await publishPost({ platform: "instagram", caption: "c", media_url: "https://cdn/r.mp4", media_type: "reel" });
    expect(res.externalId).toBe("media_1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0][0]).toContain("/media");
    expect(fetchMock.mock.calls[1][0]).toContain("status_code");
    expect(fetchMock.mock.calls[2][0]).toContain("/media_publish");
  });

  it("an Instagram photo skips container polling (2 calls)", async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: "container_img" })).mockResolvedValueOnce(ok({ id: "media_img" }));
    const res = await publishPost({ platform: "instagram", caption: "c", media_url: "https://cdn/x.jpg", media_type: "image" });
    expect(res.externalId).toBe("media_img");
    expect(fetchMock).toHaveBeenCalledTimes(2); // no status poll for photos
    expect(fetchMock.mock.calls[1][0]).toContain("/media_publish");
  });

  it("routes TikTok to the publish init endpoint and returns publish_id", async () => {
    fetchMock.mockResolvedValue(ok({ data: { publish_id: "pub_1" }, error: { code: "ok" } }));
    const res = await publishPost({ platform: "tiktok", caption: "c", media_url: "https://cdn/v.mp4", media_type: "video" });
    expect(res.externalId).toBe("pub_1");
    expect(fetchMock.mock.calls[0][0]).toContain("open.tiktokapis.com");
  });

  it("rejects an unknown platform", async () => {
    await expect(publishPost({ platform: "snapchat" as any })).rejects.toThrow(/Unknown platform/);
  });
});

describe("https media guards (required platforms)", () => {
  it("Instagram requires a media_url", async () => {
    await expect(publishPost({ platform: "instagram", caption: "c" })).rejects.toThrow(/media_url/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Instagram rejects a non-https media_url", async () => {
    await expect(publishPost({ platform: "instagram", media_url: "http://cdn/x.jpg", media_type: "image" })).rejects.toThrow(/https/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TikTok rejects a non-https media_url", async () => {
    await expect(publishPost({ platform: "tiktok", media_url: "http://cdn/v.mp4", media_type: "video" })).rejects.toThrow(/https/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("API-error paths (HTTP failure → throws platform message, NOT NotConfigured)", () => {
  it("surfaces Facebook's error message on a failed response", async () => {
    fetchMock.mockResolvedValue(fail(400, { error: { message: "Invalid page token" } }));
    const e = await publishPost({ platform: "facebook", caption: "c" }).catch((x) => x);
    expect(e.message).toMatch(/Invalid page token/);
    expect(isNotConfigured(e)).toBe(false);
  });

  it("TikTok does NOT report a silent success when HTTP fails", async () => {
    // r.ok=false but body has no error.code — must still throw, never return undefined id.
    fetchMock.mockResolvedValue(fail(500, {}));
    await expect(publishPost({ platform: "tiktok", media_url: "https://cdn/v.mp4", media_type: "video" })).rejects.toThrow(/TikTok publish failed/);
  });

  it("TikTok throws when the API returns a non-ok error code", async () => {
    fetchMock.mockResolvedValue(ok({ error: { code: "spam_risk_too_many_posts", message: "rate limited" } }));
    await expect(publishPost({ platform: "tiktok", media_url: "https://cdn/v.mp4", media_type: "video" })).rejects.toThrow(/rate limited/);
  });
});
