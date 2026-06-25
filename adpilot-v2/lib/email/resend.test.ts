import { describe, it, expect } from "vitest";
import { buildResendPayload } from "@/lib/email/resend";

// The request-body shaper that backs scheduled PDF delivery. Attachments are opt-in, so the
// no-attachment path stays byte-for-byte what existing callers (alerts, plain digests) sent.
describe("buildResendPayload", () => {
  it("omits the attachments key entirely when there are none (backward-compatible)", () => {
    const body = buildResendPayload("from@x.io", "to@y.io", "Subj", "<p>hi</p>");
    expect(body).toEqual({ from: "from@x.io", to: "to@y.io", subject: "Subj", html: "<p>hi</p>" });
    expect("attachments" in body).toBe(false);
  });

  it("includes base64 attachments when supplied (the report PDF)", () => {
    const att = [{ filename: "adpilot-report.pdf", content: "JVBERi0xLjcK" }];
    const body = buildResendPayload("from@x.io", "to@y.io", "Subj", "<p>hi</p>", att);
    expect(body.attachments).toEqual(att);
  });

  it("treats an empty attachment array as no attachments", () => {
    const body = buildResendPayload("from@x.io", "to@y.io", "Subj", "<p>hi</p>", []);
    expect("attachments" in body).toBe(false);
  });
});
