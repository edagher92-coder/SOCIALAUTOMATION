import { describe, it, expect, vi, afterEach } from "vitest";
import { sendWhatsApp, WhatsAppWindowError, isWhatsAppWindowError } from "./bot";

afterEach(() => vi.unstubAllGlobals());

describe("sendWhatsApp — 24h customer-service window guard", () => {
  it("throws WhatsAppWindowError (before any network call) when the last inbound is older than 23.5h", async () => {
    const old = new Date(Date.now() - 25 * 3_600_000); // 25h ago — window closed
    await expect(sendWhatsApp("tok", "phone", "to", "hi", old)).rejects.toBeInstanceOf(WhatsAppWindowError);
  });

  it("does NOT trip the window guard when the last inbound is recent (well inside 24h)", async () => {
    // Stub fetch so the test is network-free: the guard passes, then the (stubbed) send fails —
    // which must be a plain error, NOT a WhatsAppWindowError.
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network-stubbed"); }));
    const recent = new Date(Date.now() - 60_000); // 1 min ago
    let threwWindow = false;
    try {
      await sendWhatsApp("tok", "phone", "to", "hi", recent);
    } catch (e) {
      threwWindow = isWhatsAppWindowError(e);
    }
    expect(threwWindow).toBe(false);
  });

  it("isWhatsAppWindowError type guard matches the typed error", () => {
    expect(isWhatsAppWindowError(new WhatsAppWindowError())).toBe(true);
    expect(isWhatsAppWindowError(new Error("other"))).toBe(false);
  });
});
