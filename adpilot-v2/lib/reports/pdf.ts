import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PDFFont, PDFPage } from "pdf-lib";

// Deterministic, server-side PDF generation for a saved Ads Health Report. Pure pdf-lib
// (no native deps — runs on Vercel's nodejs runtime). Numbers are read straight from the saved
// analysis payload; nothing is invented. Read-only: this only renders a report to a PDF file.

type Color = ReturnType<typeof rgb>;

export type ReportPdfOptions = {
  title?: string;
  periodLabel?: string;
  brandName?: string;
  primaryColor?: string; // hex, e.g. #0b5fff
  generatedAt?: Date;
};

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;
const BAND_RGB: Record<string, Color> = {
  Green: rgb(0.086, 0.639, 0.29),
  Yellow: rgb(0.792, 0.541, 0.016),
  Orange: rgb(0.917, 0.345, 0.047),
  Red: rgb(0.862, 0.149, 0.149),
};

function hexToRgb(hex?: string): Color | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec((hex || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const num = (v: unknown): string =>
  v == null || !Number.isFinite(Number(v)) ? "N/A" : (Math.round(Number(v) * 100) / 100).toLocaleString();

// Word-wrap to a max width for the given font/size (pdf-lib has no auto-wrap).
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildReportPdf(payload: unknown, opts: ReportPdfOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const brand = hexToRgb(opts.primaryColor) || rgb(0.043, 0.373, 1);
  const white = rgb(1, 1, 1);
  const ink = rgb(0.1, 0.12, 0.16);
  const muted = rgb(0.42, 0.46, 0.52);
  const [width, height] = A4;
  const contentW = width - MARGIN * 2;

  let page: PDFPage = doc.addPage(A4);

  // Brand header bar.
  const barH = 56;
  page.drawRectangle({ x: 0, y: height - barH, width, height: barH, color: brand });
  page.drawText(opts.brandName || "AdPilot OS", { x: MARGIN, y: height - 30, size: 16, font: bold, color: white });
  page.drawText("Ads Health Report", { x: MARGIN, y: height - 46, size: 10, font, color: white });

  let y = height - barH - 24;
  const ensure = (space: number) => { if (y - space < MARGIN) { page = doc.addPage(A4); y = height - MARGIN; } };
  const line = (s: string, size: number, f: PDFFont, color: Color = ink, indent = 0) => {
    for (const ln of wrap(s, f, size, contentW - indent)) {
      ensure(size + 4);
      page.drawText(ln, { x: MARGIN + indent, y: y - size, size, font: f, color });
      y -= size + 4;
    }
  };
  const gap = (h = 8) => { y -= h; };

  const p = (payload ?? {}) as Record<string, any>;
  const h = (p.health ?? {}) as Record<string, any>;
  const s = (p.summary ?? {}) as Record<string, any>;
  const generated = (opts.generatedAt || new Date()).toLocaleString("en-AU");

  line(opts.title || "Ads Health Report", 18, bold);
  line(`${opts.periodLabel || "Latest period"} · generated ${generated}`, 9, font, muted);
  gap(10);

  // Health score chip + guidance.
  if (h.total != null) {
    const band = String(h.band || "");
    const label = `${Math.round(Number(h.total))}/100   ${band}`;
    const chipW = bold.widthOfTextAtSize(label, 12) + 18;
    ensure(30);
    page.drawRectangle({ x: MARGIN, y: y - 20, width: chipW, height: 24, color: BAND_RGB[band] || rgb(0.35, 0.4, 0.47) });
    page.drawText(label, { x: MARGIN + 9, y: y - 14, size: 12, font: bold, color: white });
    y -= 32;
    if (h.guidance) line(String(h.guidance), 11, font, ink);
    gap(8);
  }

  // Summary economics.
  line("Summary", 13, bold);
  gap(2);
  const stats: [string, string][] = [
    ["Spend", num(s.spend)], ["CPA", num(s.cpa)],
    ["Break-even CPA", num(s.break_even_cpa)], ["ROAS", num(s.roas)],
    ["Leads", num(s.leads)], ["Revenue", num(s.revenue)],
  ];
  for (const [k, v] of stats) {
    ensure(15);
    page.drawText(k, { x: MARGIN, y: y - 11, size: 10, font, color: muted });
    page.drawText(v, { x: MARGIN + 150, y: y - 11, size: 10, font: bold, color: ink });
    y -= 15;
  }
  gap(10);

  // Findings.
  const findings = Array.isArray(h.findings) ? h.findings : [];
  if (findings.length) {
    line("Findings", 13, bold);
    gap(2);
    for (const f of findings) line(`• [${f?.severity ?? "INFO"}] ${f?.message ?? ""}`, 10, font, ink, 6);
    gap(10);
  }

  // Proposals.
  const decisions = Array.isArray(p.decisions) ? p.decisions : [];
  if (decisions.length) {
    line("Proposals", 13, bold);
    gap(2);
    for (const d of decisions) line(`• ${String(d?.verdict ?? "").toUpperCase()} — ${d?.name ?? ""}: ${d?.proposal ?? ""}`, 10, font, ink, 6);
    gap(10);
  }

  gap(6);
  line("Read-only — AdPilot proposes; the human approves. Nothing in your ad account was changed.", 8, font, muted);

  return await doc.save();
}
