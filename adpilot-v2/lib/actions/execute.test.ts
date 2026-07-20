import { describe, it, expect, afterEach } from "vitest";
import { executeAction, writeEnabled, WriteDisabledError } from "@/lib/actions/execute";

// These assert the SAFETY gates fire BEFORE any network call — so they need no mocks.
const base = { platform: "meta", entity_level: "campaign", external_entity_id: "123", action: "pause" } as any;
const prev = process.env.ADS_WRITE_ENABLED;
const prevExecution = process.env.AD_WRITE_EXECUTION_ENABLED;

describe("ad-write safety gate", () => {
  afterEach(() => {
    if (prev === undefined) delete process.env.ADS_WRITE_ENABLED; else process.env.ADS_WRITE_ENABLED = prev;
    if (prevExecution === undefined) delete process.env.AD_WRITE_EXECUTION_ENABLED; else process.env.AD_WRITE_EXECUTION_ENABLED = prevExecution;
  });

  it("writeEnabled() stays disabled even when the legacy env switch is set", () => {
    delete process.env.AD_WRITE_EXECUTION_ENABLED;
    process.env.ADS_WRITE_ENABLED = "1"; expect(writeEnabled()).toBe(false);
    process.env.ADS_WRITE_ENABLED = "0"; expect(writeEnabled()).toBe(false);
    delete process.env.ADS_WRITE_ENABLED; expect(writeEnabled()).toBe(false);
  });

  it("throws WriteDisabledError for every execution attempt (no network)", async () => {
    delete process.env.ADS_WRITE_ENABLED;
    await expect(executeAction("tok", base)).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("rejects every live platform even when the legacy switch is set", async () => {
    process.env.ADS_WRITE_ENABLED = "1";
    await expect(executeAction("tok", { ...base, platform: "tiktok" })).rejects.toBeInstanceOf(WriteDisabledError);
  });

  it("requires the dedicated production execution switch", () => {
    delete process.env.ADS_WRITE_ENABLED;
    delete process.env.AD_WRITE_EXECUTION_ENABLED; expect(writeEnabled()).toBe(false);
    process.env.AD_WRITE_EXECUTION_ENABLED = "1"; expect(writeEnabled()).toBe(true);
  });

  it("does not enable a budget change when the legacy switch is set", async () => {
    process.env.ADS_WRITE_ENABLED = "1";
    await expect(executeAction("tok", { ...base, action: "set_budget", params: { daily_budget: 100 } })).rejects.toBeInstanceOf(WriteDisabledError);
  });
});
