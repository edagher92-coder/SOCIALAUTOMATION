import crypto from "crypto";

// One-way PII hashing for inbound CRM/lead events. AdPilot stores ONLY hashed
// contact details — never plaintext email/phone. This module is deliberately a
// pure, dependency-free wrapper around SHA-256 (NOT the reversible AES in
// lib/crypto.ts) so the same input always maps to the same hash and we can
// match/dedupe a lead across events without ever being able to recover the PII.
//
// SECURITY: hashing is salted with a server-side PEPPER (PII_PEPPER). Production
// MUST set PII_PEPPER to a long random secret so the stored hashes are not just
// plain SHA-256 of an email/phone (which would be reversible via a precomputed
// rainbow table for common addresses). The pepper defaults to "" so local/dev
// and tests stay deterministic, but an unset pepper in production is unsafe.
const PEPPER = process.env.PII_PEPPER || "";

// Fail CLOSED in production: an unset pepper would make stored hashes plain SHA-256 of the
// email/phone — reversible via a precomputed rainbow table, breaking the "never store reversible
// PII" guarantee. In production we refuse to hash rather than persist weak hashes. Dev/test keep
// the deterministic empty default so fixtures stay stable.
function pepper(): string {
  if (!PEPPER && process.env.NODE_ENV === "production") {
    throw new Error("PII_PEPPER must be set in production — refusing to hash PII with an empty pepper (would be reversible).");
  }
  return PEPPER;
}

export type PiiKind = "email" | "phone";

// Normalise an email: trim surrounding whitespace and lowercase (addresses are
// case-insensitive in the local part for all practical CRM matching).
export function normaliseEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

// Normalise a phone to digits only (basic E.164-ish): strip spaces, dashes,
// brackets, dots and a leading "+". We keep the digits as-is rather than
// guessing a country code, so "+61 400 000 000" and "0400000000" normalise to
// their own stable digit strings.
export function normalisePhone(phone: string): string {
  return (phone || "").replace(/\D+/g, "");
}

// SHA-256 of (normalised value + pepper), returned as lowercase hex. One-way:
// there is no inverse. Same input → same hash; different input → different hash.
function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input + pepper(), "utf8").digest("hex");
}

// Hash a single PII value of a known kind. Returns null for empty/whitespace
// input so callers can store NULL rather than a hash of the empty string.
export function hashPII(value: string | null | undefined, kind: PiiKind): string | null {
  if (value == null) return null;
  const normalised = kind === "email" ? normaliseEmail(value) : normalisePhone(value);
  if (!normalised) return null;
  return sha256Hex(normalised);
}

export function hashEmail(email: string | null | undefined): string | null {
  return hashPII(email, "email");
}

export function hashPhone(phone: string | null | undefined): string | null {
  return hashPII(phone, "phone");
}
