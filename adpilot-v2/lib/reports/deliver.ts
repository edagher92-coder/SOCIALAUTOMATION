import "server-only";

// Report delivery scaffold — Google Drive upload + Gmail send for generated report PDFs.
// INERT until Google credentials are configured (GOOGLE_DELIVERY_* env): returns a clear
// NOT_CONFIGURED status rather than throwing, so the rest of the app works with delivery off.
// (Same pattern as the organic-sync scaffold.) PDF generation itself is LIVE — see lib/reports/pdf.ts.
// Read-only posture is unaffected: this only stores/sends a report a human already produced.

export type DeliveryConfig = {
  driveClientEmail?: string;
  drivePrivateKey?: string;
  driveFolderId?: string;
  gmailFrom?: string;
};

export function deliveryConfig(): DeliveryConfig {
  return {
    driveClientEmail: process.env.GOOGLE_DELIVERY_CLIENT_EMAIL,
    drivePrivateKey: process.env.GOOGLE_DELIVERY_PRIVATE_KEY,
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    gmailFrom: process.env.GOOGLE_GMAIL_FROM,
  };
}

// Drive upload needs at minimum a service-account email + private key.
export function deliveryConfigured(cfg: DeliveryConfig = deliveryConfig()): boolean {
  return Boolean(cfg.driveClientEmail && cfg.drivePrivateKey);
}

export type DeliveryResult =
  | { ok: true; channel: "drive" | "gmail"; id: string }
  | { ok: false; configured: false }
  | { ok: false; configured: true; error: string };

/**
 * Deliver a generated report PDF to Google Drive (or email it via Gmail). INERT
 * (`configured: false`) until the Google service-account credentials are set — wire the real
 * Drive upload / Gmail send here once GOOGLE_DELIVERY_* are configured (owner-gated: needs a
 * Google service account with Drive/Gmail scopes + domain-wide delegation for Gmail). Never
 * throws on missing config, so callers can attempt delivery unconditionally.
 */
export async function deliverReportPdf(
  _pdf: Uint8Array,
  _opts: { filename: string; to?: string; channel?: "drive" | "gmail" },
): Promise<DeliveryResult> {
  if (!deliveryConfigured()) return { ok: false, configured: false };
  // TODO(owner-gated): implement the Drive upload / Gmail send with the configured service account.
  return { ok: false, configured: true, error: "Delivery not yet implemented — generation is live; wire Drive/Gmail here." };
}
