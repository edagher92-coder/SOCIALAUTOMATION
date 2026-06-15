import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import crypto from "crypto";
import { decide, withinHours, verifySignature, buildAiSystemPrompt, type Rule } from "./bot";

// ---------------------------------------------------------------------------
// decide()
// Routing order: payload → welcome(on GET_STARTED) → keyword-contains →
// first-message greeting (welcome in-hours / away out-of-hours) → default → null
// ---------------------------------------------------------------------------
describe("decide", () => {
  const rules: Rule[] = [
    { trigger_type: "payload", trigger: "MENU", reply: "menu-reply" },
    { trigger_type: "payload", trigger: "SHOP", reply: "shop-reply", priority: 5 },
    { trigger_type: "keyword", trigger: "price,cost", reply: "price-reply" },
    { trigger_type: "keyword", trigger: "hours", reply: "hours-reply", priority: 2 },
    { trigger_type: "welcome", reply: "welcome-reply" },
    { trigger_type: "away", reply: "away-reply" },
    { trigger_type: "default", reply: "default-reply" },
  ];
  const ctx = { inHours: true, isNewThread: false };

  it("matches a payload rule (case-insensitive) before anything else", () => {
    expect(decide(rules, { payload: "MENU" }, ctx)).toBe("menu-reply");
    expect(decide(rules, { payload: "menu" }, ctx)).toBe("menu-reply");
    expect(decide(rules, { payload: "Shop" }, ctx)).toBe("shop-reply");
  });

  it("on GET_STARTED with no matching payload rule, falls to the welcome reply", () => {
    expect(decide(rules, { payload: "GET_STARTED" }, ctx)).toBe("welcome-reply");
  });

  it("prefers an explicit GET_STARTED payload rule over the welcome fallback", () => {
    const withGetStarted: Rule[] = [
      { trigger_type: "payload", trigger: "GET_STARTED", reply: "explicit-getstarted" },
      ...rules,
    ];
    expect(decide(withGetStarted, { payload: "GET_STARTED" }, ctx)).toBe("explicit-getstarted");
  });

  it("matches a keyword by substring containment (any of the comma list)", () => {
    expect(decide(rules, { text: "what is the price please" }, ctx)).toBe("price-reply");
    expect(decide(rules, { text: "how much does it COST?" }, ctx)).toBe("price-reply");
    expect(decide(rules, { text: "your opening hours?" }, ctx)).toBe("hours-reply");
  });

  it("greets a new thread with welcome when in hours", () => {
    const text = "totally unrelated chatter";
    expect(decide(rules, { text }, { inHours: true, isNewThread: true })).toBe("welcome-reply");
  });

  it("greets a new thread with away when out of hours", () => {
    const text = "totally unrelated chatter";
    expect(decide(rules, { text }, { inHours: false, isNewThread: true })).toBe("away-reply");
  });

  it("falls back to welcome on a new out-of-hours thread when no away rule exists", () => {
    const noAway = rules.filter((r) => r.trigger_type !== "away");
    expect(decide(noAway, { text: "hi" }, { inHours: false, isNewThread: true })).toBe("welcome-reply");
  });

  it("falls through to the default reply when nothing else matches", () => {
    expect(decide(rules, { text: "no keyword here" }, { inHours: true, isNewThread: false })).toBe("default-reply");
  });

  it("returns null when nothing matches and there is no default rule", () => {
    const noDefault = rules.filter((r) => r.trigger_type !== "default");
    expect(decide(noDefault, { text: "no keyword here" }, { inHours: true, isNewThread: false })).toBeNull();
  });

  it("returns null for an empty rule set", () => {
    expect(decide([], { text: "anything", payload: "GET_STARTED" }, { inHours: true, isNewThread: true })).toBeNull();
  });

  it("orders same-type rules by ascending priority", () => {
    const ordered: Rule[] = [
      { trigger_type: "welcome", reply: "second", priority: 10 },
      { trigger_type: "welcome", reply: "first", priority: 1 },
    ];
    expect(decide(ordered, { payload: "GET_STARTED" }, { inHours: true, isNewThread: false })).toBe("first");
  });
});

// ---------------------------------------------------------------------------
// withinHours()
// now = Date.now() + tz_offset*3_600_000; day = (getUTCDay()+6)%7 (Mon=0..Sun=6);
// open default 8, close default 18, days default Mon-Fri [0..4].
// We pin system time to fixed UTC instants for determinism.
// ---------------------------------------------------------------------------
describe("withinHours", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const pin = (iso: string) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
  };

  it("returns true when bh is null/undefined (always open)", () => {
    expect(withinHours(null)).toBe(true);
    expect(withinHours(undefined)).toBe(true);
  });

  it("is open inside default window on a weekday", () => {
    // 2026-06-15 is a Monday. 12:00 UTC is within 08:00–18:00.
    pin("2026-06-15T12:00:00Z");
    expect(withinHours({})).toBe(true);
  });

  it("respects the open lower bound (inclusive) and below it (closed)", () => {
    pin("2026-06-15T08:00:00Z"); // exactly open_hour → open
    expect(withinHours({ open_hour: 8, close_hour: 18 })).toBe(true);
    pin("2026-06-15T07:00:00Z"); // before open → closed
    expect(withinHours({ open_hour: 8, close_hour: 18 })).toBe(false);
  });

  it("respects the close upper bound (exclusive)", () => {
    pin("2026-06-15T17:00:00Z"); // 17 < 18 → open
    expect(withinHours({ open_hour: 8, close_hour: 18 })).toBe(true);
    pin("2026-06-15T18:00:00Z"); // 18 is not < 18 → closed
    expect(withinHours({ open_hour: 8, close_hour: 18 })).toBe(false);
  });

  it("treats default days as Mon-Fri: closed on the weekend", () => {
    // 2026-06-13 is a Saturday, 2026-06-14 is a Sunday.
    pin("2026-06-13T12:00:00Z");
    expect(withinHours({})).toBe(false);
    pin("2026-06-14T12:00:00Z");
    expect(withinHours({})).toBe(false);
  });

  it("uses Mon=0..Sun=6 day membership", () => {
    // Monday = day 0. Open only on Monday → true on Mon, false on Tue.
    pin("2026-06-15T12:00:00Z"); // Monday
    expect(withinHours({ days: [0] })).toBe(true);
    pin("2026-06-16T12:00:00Z"); // Tuesday (day 1)
    expect(withinHours({ days: [0] })).toBe(false);
    // Sunday = day 6.
    pin("2026-06-14T12:00:00Z"); // Sunday
    expect(withinHours({ days: [6] })).toBe(true);
  });

  it("shifts the clock by tz_offset hours", () => {
    // Real UTC 23:00 Mon. With tz_offset +2 → 01:00 Tue → outside 08-18 and a
    // different day. With tz_offset -4 → 19:00 Mon → outside window but still Mon.
    pin("2026-06-15T23:00:00Z"); // Monday 23:00 UTC
    // No offset: 23:00 Monday → outside default window.
    expect(withinHours({})).toBe(false);
    // Offset that lands the local time inside the window: +10h → 09:00 next day (Tue).
    expect(withinHours({ tz_offset: 10 })).toBe(true); // 09:00 Tue, Tue is in Mon-Fri
    // Offset -16h → 07:00 Monday → before open → closed.
    expect(withinHours({ tz_offset: -16 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// verifySignature()
// ---------------------------------------------------------------------------
describe("verifySignature", () => {
  const secret = "app-secret-123";
  const body = '{"object":"page","entry":[{"id":"1"}]}';
  const sign = (raw: string, s: string) =>
    "sha256=" + crypto.createHmac("sha256", s).update(raw, "utf8").digest("hex");

  it("passes for a correct HMAC-SHA256 signature", () => {
    expect(verifySignature(body, sign(body, secret), secret)).toBe(true);
  });

  it("fails for a tampered body", () => {
    expect(verifySignature(body + " ", sign(body, secret), secret)).toBe(false);
  });

  it("fails for a wrong secret", () => {
    expect(verifySignature(body, sign(body, "other-secret"), secret)).toBe(false);
  });

  it("fails for a malformed / mismatched-length header", () => {
    expect(verifySignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifySignature(body, "not-a-signature", secret)).toBe(false);
  });

  it("fails for an empty / null header", () => {
    expect(verifySignature(body, "", secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
  });

  it("fails for an empty app secret", () => {
    expect(verifySignature(body, sign(body, secret), "")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildAiSystemPrompt()
// PURE: embeds the supplied VERIFIED FACTS verbatim and enforces the strict
// no-hallucination contract. No network — buildAiSystemPrompt never calls the API.
// ---------------------------------------------------------------------------
describe("buildAiSystemPrompt", () => {
  const FACTS = "Standard service is $120. Open Mon-Fri 8-6. Current special: 10% off repairs.";
  const VOICE = "friendly, concise, warm Aussie tone";

  it("embeds the supplied verified facts verbatim", () => {
    const p = buildAiSystemPrompt(FACTS, VOICE);
    expect(p).toContain(FACTS);
  });

  it("includes the brand voice when provided", () => {
    const p = buildAiSystemPrompt(FACTS, VOICE);
    expect(p).toContain(VOICE);
  });

  it("omits the brand-voice line when voice is empty/missing", () => {
    expect(buildAiSystemPrompt(FACTS, "")).not.toContain("BRAND VOICE:");
    expect(buildAiSystemPrompt(FACTS, null)).not.toContain("BRAND VOICE:");
    expect(buildAiSystemPrompt(FACTS)).not.toContain("BRAND VOICE:");
  });

  it("labels the facts as the only source of truth", () => {
    const p = buildAiSystemPrompt(FACTS);
    expect(p).toContain("VERIFIED FACTS");
    expect(p).toMatch(/only.*information you may state as true/i);
  });

  it("states the no-invention rule for prices/specs/policies", () => {
    const p = buildAiSystemPrompt(FACTS).toLowerCase();
    // Must forbid making things up and explicitly cover prices/specs/policies.
    expect(p).toMatch(/never invent/);
    expect(p).toContain("price");
    expect(p).toContain("polic");
    // When a fact is missing, ask or route to the business rather than guess.
    expect(p).toMatch(/do not guess|don't guess|not guess/);
    expect(p).toMatch(/clarifying question|ask the customer|follow up|connect them/i);
  });

  it("forbids collecting finance/credit details in chat", () => {
    const p = buildAiSystemPrompt(FACTS).toLowerCase();
    expect(p).toMatch(/never collect|never request/);
    expect(p).toMatch(/finance|credit|card|banking/);
  });

  it("constrains length to a few short sentences with at most one emoji", () => {
    const p = buildAiSystemPrompt(FACTS);
    expect(p).toMatch(/1.?4 short sentences/i);
    expect(p).toMatch(/at most one emoji/i);
  });

  it("degrades gracefully when no facts are supplied", () => {
    const p = buildAiSystemPrompt("", "");
    // Still produces the strict contract; signals there are no facts to draw on.
    expect(p).toContain("VERIFIED FACTS");
    expect(p).toContain("(none provided)");
    expect(p).toMatch(/never invent/i);
  });

  it("is deterministic for the same inputs", () => {
    expect(buildAiSystemPrompt(FACTS, VOICE)).toBe(buildAiSystemPrompt(FACTS, VOICE));
  });
});
