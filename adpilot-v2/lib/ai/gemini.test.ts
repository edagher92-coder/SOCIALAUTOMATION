import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Verifies the Gemini/Imagen client's request shaping + response parsing WITHOUT a live API call.
// fetch is mocked; module state is reset each test.

const ENV = ["GEMINI_API_KEY", "GEMINI_IMAGE_MODEL"];
const saved: Record<string, string | undefined> = {};

function res(data: any, ok = true, status = 200) {
  return { ok, status, json: async () => data, text: async () => JSON.stringify(data) } as any;
}

beforeEach(() => { for (const k of ENV) { saved[k] = process.env[k]; delete process.env[k]; } vi.resetModules(); });
afterEach(() => { for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } vi.restoreAllMocks(); });

describe("gemini image client", () => {
  it("throws GeminiNotConfigured with no API key", async () => {
    const { generateImage, GeminiNotConfigured } = await import("./gemini");
    await expect(generateImage({ prompt: "a warm product flat-lay" })).rejects.toBeInstanceOf(GeminiNotConfigured);
  });

  it("posts to the Imagen predict endpoint and returns a base64 data URL", async () => {
    process.env.GEMINI_API_KEY = "k-123";
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return res({ predictions: [{ bytesBase64Encoded: "QUJD", mimeType: "image/png" }] });
    }));
    const { generateImage } = await import("./gemini");
    const out = await generateImage({ prompt: "coral gradient hero", aspect: "9:16", numVariations: 1 });

    expect(out).toEqual([{ url: "data:image/png;base64,QUJD", mimeType: "image/png" }]);
    const c = calls[0];
    expect(c.url).toContain("imagen-4.0-fast-generate-001:predict");
    expect(c.init.headers["x-goog-api-key"]).toBe("k-123");
    const body = JSON.parse(c.init.body);
    expect(body.instances[0].prompt).toBe("coral gradient hero");
    expect(body.parameters.aspectRatio).toBe("9:16");
    expect(body.parameters.sampleCount).toBe(1);
  });

  it("honours GEMINI_IMAGE_MODEL override and clamps sampleCount", async () => {
    process.env.GEMINI_API_KEY = "k";
    process.env.GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002";
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => { calls.push({ url, init }); return res({ predictions: [{ bytesBase64Encoded: "x" }] }); }));
    const { generateImage } = await import("./gemini");
    await generateImage({ prompt: "x", numVariations: 9 });
    expect(calls[0].url).toContain("imagen-3.0-generate-002:predict");
    expect(JSON.parse(calls[0].init.body).parameters.sampleCount).toBe(4); // clamped to max 4
  });

  it("throws when the API errors and when no image comes back", async () => {
    process.env.GEMINI_API_KEY = "k";
    vi.stubGlobal("fetch", vi.fn(async () => res({ error: "nope" }, false, 429)));
    const m = await import("./gemini");
    await expect(m.generateImage({ prompt: "x" })).rejects.toThrow(/429/);
    vi.stubGlobal("fetch", vi.fn(async () => res({ predictions: [] })));
    await expect(m.generateImage({ prompt: "x" })).rejects.toThrow(/no image/i);
  });

  it("parseDataUrl extracts mime + base64, rejects non-data URLs", async () => {
    const { parseDataUrl } = await import("./gemini");
    expect(parseDataUrl("data:image/png;base64,QUJD")).toEqual({ mimeType: "image/png", base64: "QUJD" });
    expect(parseDataUrl("https://example.com/x.png")).toBeNull();
    expect(parseDataUrl("data:text/plain;base64,QUJD")).toBeNull();
  });

  it("editImage posts an inline image part to gemini-2.5-flash-image and returns a data URL", async () => {
    process.env.GEMINI_API_KEY = "k-9";
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return res({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "WllZ" } }] } }] });
    }));
    const { editImage } = await import("./gemini");
    const out = await editImage({ prompt: "put it on marble", image: { base64: "QUJD", mimeType: "image/png" } });
    expect(out).toEqual([{ url: "data:image/png;base64,WllZ", mimeType: "image/png" }]);
    expect(calls[0].url).toContain("gemini-2.5-flash-image:generateContent");
    const body = JSON.parse(calls[0].init.body);
    expect(body.generationConfig.responseModalities).toEqual(["IMAGE"]);
    expect(body.contents[0].parts[1].inlineData.data).toBe("QUJD");
  });
});
