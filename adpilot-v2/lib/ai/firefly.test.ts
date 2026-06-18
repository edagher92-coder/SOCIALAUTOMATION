import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Verifies the Firefly client's request shaping + async-job polling WITHOUT any live API call.
// fetch is mocked; module state is reset each test so the token cache can't leak.

const ENV_KEYS = ["FIREFLY_CLIENT_ID", "FIREFLY_CLIENT_SECRET", "FIREFLY_ACCESS_TOKEN", "FIREFLY_SCOPES"];
const saved: Record<string, string | undefined> = {};

function res(data: any, ok = true, status = 200) {
  return { ok, status, json: async () => data, text: async () => JSON.stringify(data) } as any;
}

beforeEach(() => { for (const k of ENV_KEYS) { saved[k] = process.env[k]; delete process.env[k]; } vi.resetModules(); });
afterEach(() => { for (const k of ENV_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } vi.restoreAllMocks(); });

describe("firefly client", () => {
  it("throws FireflyNotConfigured when no credentials are set", async () => {
    const { generateImage, FireflyNotConfigured } = await import("./firefly");
    await expect(generateImage({ prompt: "a coral gradient product shot" })).rejects.toBeInstanceOf(FireflyNotConfigured);
  });

  it("uses a direct access token, posts correct headers/body, polls to success, returns the image URL", async () => {
    process.env.FIREFLY_CLIENT_ID = "client-123";
    process.env.FIREFLY_ACCESS_TOKEN = "tok-abc";
    const calls: any[] = [];
    const fetchMock = vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      if (url.includes("/v3/images/generate-async")) return res({ jobId: "j1", statusUrl: "https://firefly-api.adobe.io/v3/status/j1" });
      if (url.includes("/v3/status/")) {
        return calls.filter((c) => c.url.includes("/v3/status/")).length < 2
          ? res({ status: "running", jobId: "j1" })
          : res({ status: "succeeded", jobId: "j1", result: { outputs: [{ seed: 42, image: { url: "https://img.example/out.png" } }] } });
      }
      throw new Error("unexpected url " + url);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateImage } = await import("./firefly");
    const out = await generateImage({ prompt: "coral gradient hero", aspect: "9:16", pollMs: 1, maxPolls: 5 });

    expect(out).toEqual([{ url: "https://img.example/out.png", seed: 42 }]);
    const gen = calls.find((c) => c.url.includes("generate-async"));
    expect(gen.init.headers["x-api-key"]).toBe("client-123");
    expect(gen.init.headers.authorization).toBe("Bearer tok-abc");
    const body = JSON.parse(gen.init.body);
    expect(body.prompt).toBe("coral gradient hero");
    expect(body.size).toEqual({ width: 1440, height: 2560 }); // 9:16
    expect(body.numVariations).toBe(1);
  });

  it("mints a client_credentials token from IMS when only id+secret are set", async () => {
    process.env.FIREFLY_CLIENT_ID = "client-123";
    process.env.FIREFLY_CLIENT_SECRET = "secret-xyz";
    const calls: any[] = [];
    const fetchMock = vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      if (url.includes("ims/token")) return res({ access_token: "minted-tok", expires_in: 3600 });
      if (url.includes("generate-async")) return res({ statusUrl: "https://firefly-api.adobe.io/v3/status/j2" });
      if (url.includes("/v3/status/")) return res({ status: "succeeded", result: { outputs: [{ seed: 7, image: { url: "https://img/x.png" } }] } });
      throw new Error("unexpected " + url);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateImage } = await import("./firefly");
    const out = await generateImage({ prompt: "test", pollMs: 1, maxPolls: 3 });
    expect(out[0].url).toBe("https://img/x.png");
    const ims = calls.find((c) => c.url.includes("ims/token"));
    expect(ims.init.body.toString()).toContain("grant_type=client_credentials");
    const gen = calls.find((c) => c.url.includes("generate-async"));
    expect(gen.init.headers.authorization).toBe("Bearer minted-tok");
  });

  it("throws when the job fails", async () => {
    process.env.FIREFLY_CLIENT_ID = "c";
    process.env.FIREFLY_ACCESS_TOKEN = "t";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("generate-async")) return res({ statusUrl: "https://firefly-api.adobe.io/v3/status/j3" });
      return res({ status: "failed", error_code: "runtime_error" });
    }));
    const { generateImage } = await import("./firefly");
    await expect(generateImage({ prompt: "x", pollMs: 1, maxPolls: 3 })).rejects.toThrow(/failed/i);
  });
});
