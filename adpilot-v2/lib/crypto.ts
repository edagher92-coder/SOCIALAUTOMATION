import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// AES-256-GCM token encryption. Key from TOKEN_ENCRYPTION_KEY (base64, 32 bytes).
// Generate one with:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

// Parse the 32-byte key from its env string. Deliberately tolerant: a key pasted into a
// dashboard often arrives with stray whitespace, as base64url (-_ instead of +/), with a
// '+' silently turned into a space by URL-decoding, or as 64-char hex. We repair all of
// those and only care that the result is exactly 32 bytes. Exported for unit testing.
export function parseKey(raw: string | undefined | null): Buffer {
  const s = (raw || "").trim();
  if (!s) throw new Error("TOKEN_ENCRYPTION_KEY not set");
  const tries: Buffer[] = [];
  if (/^[0-9a-fA-F]{64}$/.test(s)) tries.push(Buffer.from(s, "hex")); // 64-char hex
  // base64 / base64url, repairing url-safe chars and a '+' that became a space:
  const b64 = s.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  tries.push(Buffer.from(b64, "base64"));
  tries.push(Buffer.from(s, "base64"));
  const k = tries.find((b) => b.length === 32);
  if (!k) {
    const got = Buffer.from(b64, "base64").length;
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to 32 bytes (got ${got}). Use a base64 32-byte key — ` +
      `generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return k;
}

function key(): Buffer {
  return parseKey(process.env.TOKEN_ENCRYPTION_KEY);
}

export function encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext: enc.toString("base64"), iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export function decrypt(parts: { ciphertext: string; iv: string; authTag: string }): string {
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parts.iv, "base64"));
  decipher.setAuthTag(Buffer.from(parts.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(parts.ciphertext, "base64")), decipher.final()]).toString("utf8");
}
