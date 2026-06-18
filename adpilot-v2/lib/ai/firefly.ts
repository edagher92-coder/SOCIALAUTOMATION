import "server-only";

// Server-side Adobe Firefly Services client. Keys NEVER leave the server. Generates ad creative
// IMAGES (and reference-guided variations) for the Creative Studio. This is creative generation —
// it never touches a live ad, so it stays inside AdPilot's read-only model.
//
// Auth (Adobe IMS server-to-server): either supply a short-lived FIREFLY_ACCESS_TOKEN directly,
// or set FIREFLY_CLIENT_ID + FIREFLY_CLIENT_SECRET and we mint+cache a client_credentials token.
// x-api-key is the client id. Env-gated: with no creds the feature reports NOT_CONFIGURED.

const IMS_TOKEN_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
const FF = "https://firefly-api.adobe.io";

export class FireflyNotConfigured extends Error {
  constructor() { super("FIREFLY_NOT_CONFIGURED"); this.name = "FireflyNotConfigured"; }
}

// Firefly's supported output sizes by aspect ratio (image3/image4). Picking from this set avoids
// 422 validation errors. 1:1 default; portrait/landscape/story ratios for the common ad placements.
export const FIREFLY_SIZES = {
  "1:1": { width: 2048, height: 2048 },
  "4:3": { width: 2304, height: 1792 },
  "3:4": { width: 1792, height: 2304 },
  "16:9": { width: 2688, height: 1536 },
  "9:16": { width: 1440, height: 2560 },
} as const;
export type FireflyAspect = keyof typeof FIREFLY_SIZES;

let cachedToken: { token: string; exp: number } | null = null;

async function getAuth(): Promise<{ token: string; clientId: string }> {
  const clientId = process.env.FIREFLY_CLIENT_ID;
  if (!clientId) throw new FireflyNotConfigured();
  // Direct token override (handy for a one-off preview test).
  const direct = process.env.FIREFLY_ACCESS_TOKEN;
  if (direct) return { token: direct, clientId };
  const secret = process.env.FIREFLY_CLIENT_SECRET;
  if (!secret) throw new FireflyNotConfigured();
  const now = Date.now();
  if (cachedToken && cachedToken.exp > now + 60_000) return { token: cachedToken.token, clientId };
  const scope = process.env.FIREFLY_SCOPES || "openid,AdobeID,firefly_api,ff_apis";
  const res = await fetch(IMS_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: secret, scope }),
  });
  if (!res.ok) throw new Error(`Firefly auth failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const j: any = await res.json();
  cachedToken = { token: j.access_token, exp: now + (Number(j.expires_in) || 3600) * 1000 };
  return { token: cachedToken.token, clientId };
}

export type FireflyImage = { url: string; seed?: number };

// Generate one or more creative images from a text prompt. Polls the async job to completion.
export async function generateImage(opts: {
  prompt: string;
  aspect?: FireflyAspect;
  numVariations?: number;
  contentClass?: "photo" | "art";
  pollMs?: number;
  maxPolls?: number;
}): Promise<FireflyImage[]> {
  const { token, clientId } = await getAuth();
  const headers = { "x-api-key": clientId, authorization: `Bearer ${token}`, "content-type": "application/json" };
  const body: Record<string, unknown> = {
    prompt: opts.prompt,
    numVariations: Math.min(4, Math.max(1, opts.numVariations ?? 1)),
    size: FIREFLY_SIZES[opts.aspect ?? "1:1"],
  };
  if (opts.contentClass) body.contentClass = opts.contentClass;

  const start = await fetch(`${FF}/v3/images/generate-async`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!start.ok) throw new Error(`Firefly generate failed (${start.status}): ${(await start.text()).slice(0, 300)}`);
  const job: any = await start.json();
  const statusUrl: string | undefined = job.statusUrl || job?.links?.result?.href;
  if (!statusUrl) throw new Error("Firefly: no status URL returned");

  const pollMs = opts.pollMs ?? 2000;
  const maxPolls = opts.maxPolls ?? 25;
  for (let i = 0; i < maxPolls; i++) {
    await new Promise((r) => setTimeout(r, pollMs));
    const s = await fetch(statusUrl, { headers });
    if (!s.ok) throw new Error(`Firefly status failed (${s.status})`);
    const sj: any = await s.json();
    const status = String(sj.status || "").toLowerCase();
    if (status === "succeeded") {
      const outs: any[] = sj.result?.outputs || [];
      const images = outs.map((o) => ({ url: o.image?.url as string, seed: o.seed as number })).filter((o) => !!o.url);
      if (!images.length) throw new Error("Firefly: job succeeded but returned no images");
      return images;
    }
    if (["failed", "cancelled", "canceled", "timeout"].includes(status))
      throw new Error(`Firefly job ${status}: ${sj.error_code || sj.message || "no detail"}`);
  }
  throw new Error("Firefly job timed out while polling");
}
