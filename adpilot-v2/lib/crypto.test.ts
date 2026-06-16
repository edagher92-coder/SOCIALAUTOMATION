import { describe, it, expect } from "vitest";
import { randomBytes } from "crypto";
import { parseKey, encrypt, decrypt } from "@/lib/crypto";

// The key parser must be forgiving of how a 32-byte key arrives from a dashboard paste:
// clean base64, base64url, hex, a stray '+'-turned-space, or surrounding whitespace.
describe("parseKey — tolerant 32-byte key parsing", () => {
  const bytes = randomBytes(32);
  const b64 = bytes.toString("base64");

  it("accepts clean base64", () => {
    expect(parseKey(b64).equals(bytes)).toBe(true);
  });

  it("trims surrounding whitespace/newlines", () => {
    expect(parseKey(`  ${b64}\n`).equals(bytes)).toBe(true);
  });

  it("accepts 64-char hex", () => {
    expect(parseKey(bytes.toString("hex")).equals(bytes)).toBe(true);
  });

  it("repairs base64url (-_ instead of +/)", () => {
    const url = b64.replace(/\+/g, "-").replace(/\//g, "_");
    expect(parseKey(url).length).toBe(32);
  });

  it("repairs a '+' that was turned into a space by URL-decoding", () => {
    // Deterministic: first byte 0xFB makes the base64 START with '+', exercising the
    // edge case where the '+'-turned-space sits at the very start (naive trimming dropped it).
    const withPlus = Buffer.from(Array.from({ length: 32 }, (_, i) => (i === 0 ? 0xfb : (i * 37 + 11) & 0xff)));
    expect(withPlus.toString("base64").startsWith("+")).toBe(true);
    const mangled = withPlus.toString("base64").replace(/\+/g, " ");
    expect(parseKey(mangled).equals(withPlus)).toBe(true);
  });

  it("rejects empty / missing", () => {
    expect(() => parseKey("")).toThrow(/not set/);
    expect(() => parseKey(undefined)).toThrow(/not set/);
  });

  it("rejects a key that isn't 32 bytes, reporting the byte count", () => {
    expect(() => parseKey(randomBytes(16).toString("base64"))).toThrow(/32 bytes/);
  });
});

describe("encrypt/decrypt round-trip", () => {
  const prev = process.env.TOKEN_ENCRYPTION_KEY;
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");

  it("decrypt(encrypt(x)) === x", () => {
    const secret = "act_token_abc123!@#";
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  if (prev === undefined) { /* leave set for the suite; vitest isolates the process */ }
});
