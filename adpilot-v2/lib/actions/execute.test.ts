import { describe, it, expect, afterEach } from "vitest";
import { executeAction, writeEnabled, WriteDisabledError } from "@/lib/actions/execute";

// These assert the SAFETY gates fire BEFORE any network call — so they need no mocks.
const base = { platform: "meta", entity_level: "campaign", external_entity_id: "123", action: "pause" } as any;
const prev = process.env.ADS_WRITE_ENABLED;

describe("ad-write safety gate", () => {
  afterEach(() => { if (prev === undefined) delete process.env.ADS_WRITE_ENABLED; else process.env.ADS_WRITE_ENABLED = prev; });

  it("writeEnabled() reflects the env kill-switch", () => {
    process.env.ADS_WRITE_ENABLED = "1"; expect(writeEnabled()).toBe(true);
    process.env.ADS_WRITE_ENABLED = "0"; expect(writeEnabled()).toBe(false);
    delete process.env.ADS_WRITE_ENABLED; expect(writeEnabled()).toBe(false);
  });

  it("throws WriteDisabledError when the kill-switch is off (no network)", async () => {
    delete process.env.ADS_WRITE_ENABLED;
    await expect(executeAction("tok", base)).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("rejects TikTok even when enabled (not yet supported)", async () => {
    process.env.ADS_WRITE_ENABLED = "1";
    await expect(executeAction("tok", { ...base, platform: "tiktok" })).rejects.toThrow(/Only Meta/);
  });

  it("rejects an invalid budget before any API call", async () => {
    process.env.ADS_WRITE_ENABLED = "1";
    await expect(executeAction("tok", { ...base, action: "set_budget", params: { daily_budget: 0 } })).rejects.toThrow(/Invalid daily_budget/);
  });
});
