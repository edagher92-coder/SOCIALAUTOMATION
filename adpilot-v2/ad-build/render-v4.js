// AdPilot OS V3 — "Two Accounts. One Audit." 9:16 ad renderer (1080x1920, 30fps).
// Real demo data, plan tiers, two-account framing. Fully vector. See SCRIPT-V3.md.
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const FD = path.join(__dirname, "fonts");
try { GlobalFonts.registerFromPath(path.join(FD, "Anton.ttf"), "Anton"); } catch {}
// Real static Inter weights (the variable Inter.ttf has an inert weight axis in this
// canvas build, so 700/800 silently render Regular — these statics fix that).
const IW = path.join(__dirname, "node_modules", "inter-ui", "web");
const _rf = (file, fam) => { try { GlobalFonts.registerFromPath(path.join(IW, file), fam); } catch {} };
_rf("Inter-Regular.woff2", "InterReg"); _rf("Inter-Medium.woff2", "InterMed"); _rf("Inter-SemiBold.woff2", "InterSemi");
_rf("Inter-Bold.woff2", "InterBold"); _rf("Inter-ExtraBold.woff2", "InterX");
const DISP = "Anton";
const UI = "InterReg", UI4 = "InterReg", UI5 = "InterMed", UI6 = "InterSemi", UI7 = "InterBold", UI8 = "InterX";

const W = 1080, H = 1920, FPS = 30;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

const C = {
  command: "#161221", navy: "#211a2e", surface: "#faf7f4", surf2: "#f0e9e1",
  coral: "#f9603f", coralDk: "#e84b2c", amber: "#ffb224",
  ink: "#1c1726", white: "#ffffff", mutedD: "#9b94a8", mutedL: "#6b6478",
  green: "#16a34a", yellow: "#ca8a04", orange: "#ea580c", red: "#dc2626",
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const seg = (lt, start, dur) => clamp((lt - start) / dur);
const r2 = n => Math.round(n * 100) / 100;

function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function shadow(c, b, dx = 0, dy = 0) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy; }
function noShadow() { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function gradH(x, y, w, h) { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); return g; }
function fill(c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
function vignette(cx, cy, r, color, a) { ctx.save(); ctx.globalAlpha = a; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
// The REAL app background: warm #faf7f4 with three soft radial glows (globals.css bg-mesh),
// drifting glacially so the stage breathes without panning. The product world is LIGHT.
function meshStage(lt) {
  fill(C.surface);
  const dx = 8 * Math.sin(lt * 0.5), dy = 6 * Math.cos(lt * 0.42);
  const glow = (gx, gy, r, col) => { ctx.save(); const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  glow(170 + dx, 300 + dy, 720, "rgba(249,96,63,0.11)");
  glow(910 - dx, 360 - dy, 780, "rgba(255,178,36,0.13)");
  glow(540, 1520 + dy, 820, "rgba(249,96,63,0.06)");
}
// White raised card with the product's real warm two-layer shadow + hairline border.
function shadowCard(x, y, w, h, r = 24, hero) {
  shadow("rgba(28,23,38,0.10)", hero ? 40 : 30, 0, hero ? 18 : 13); ctx.fillStyle = C.white; rr(x, y, w, h, r); ctx.fill(); noShadow();
  ctx.lineWidth = 1; ctx.strokeStyle = "#ece5dc"; rr(x, y, w, h, r); ctx.stroke();
}
function richLine(segs, x, y, font, bold = false) {
  ctx.font = font; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  let cx = x - total / 2;
  for (const s of segs) { ctx.fillStyle = s.c; ctx.fillText(s.t, cx, y); if (bold) { ctx.lineWidth = 1.4; ctx.strokeStyle = s.c; ctx.strokeText(s.t, cx, y); } cx += ctx.measureText(s.t).width; }
}
function captionPill(segs, cy, prog, dark) {
  if (prog <= 0) return;
  ctx.save(); const e = easeOutBack(clamp(prog)); ctx.globalAlpha = clamp(prog * 1.4);
  ctx.font = `44px ${UI8}`; let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  const padX = 42, h = 90, w = total + padX * 2, x = 540 - w / 2, y = cy - h / 2;
  ctx.translate(540, cy); ctx.scale(e, e); ctx.translate(-540, -cy);
  shadow("rgba(0,0,0,0.3)", 26, 0, 10); ctx.fillStyle = dark ? C.white : C.ink; rr(x, y, w, h, h / 2); ctx.fill(); noShadow();
  // recolor segs text on pill (invert)
  const fontc = dark ? C.command : C.white;
  ctx.font = `44px ${UI8}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let tw = 0; for (const s of segs) tw += ctx.measureText(s.t).width; let cx = 540 - tw / 2;
  for (const s of segs) { ctx.fillStyle = s.pill || fontc; ctx.fillText(s.t, cx, cy + 15); cx += ctx.measureText(s.t).width; }
  ctx.restore();
}
function eyebrow(text, y, color) { ctx.fillStyle = color; ctx.font = `28px ${UI7}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; let s = 0; const sp = 4; for (const ch of text) s += ctx.measureText(ch).width + sp; let cx = 540 - (s - sp) / 2; ctx.textAlign = "left"; for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } }
function demoTag(dark) {
  ctx.save(); ctx.globalAlpha = 0.7; ctx.font = `22px ${UI6}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.fillText("● Demo account · illustrative", 540, 1820); ctx.restore();
}
function brandTag(dark) { ctx.save(); ctx.globalAlpha = 0.5; ctx.font = `24px ${UI7}`; ctx.textAlign = "center"; ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.textBaseline = "alphabetic"; ctx.fillText("ADPILOT OS  ·  V3", 540, 120); ctx.restore(); }
function progress(gt, total) { ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(0, H - 8, W, 8); ctx.fillStyle = gradH(0, H - 8, W * clamp(gt / total), 8); ctx.fillRect(0, H - 8, W * clamp(gt / total), 8); }

// ---- gauge: faithful to the REAL product (full 360° ring, single band colour, round cap,
// 12-o'clock start, clockwise). Mirrors components/AnalyzeClient.tsx Gauge exactly. ----
function gauge(cx, cy, R, frac, dark) {
  const start = -Math.PI / 2;
  ctx.lineWidth = Math.round(R * 0.155); ctx.lineCap = "round";
  ctx.strokeStyle = dark ? "#2a2336" : "#eef2f7"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  const score = Math.round(clamp(frac) * 100);
  if (frac > 0.004) { ctx.strokeStyle = bandColor(score); ctx.beginPath(); ctx.arc(cx, cy, R, start, start + Math.PI * 2 * clamp(frac), false); ctx.stroke(); }
}
function bandColor(score) { return score < 40 ? C.red : score < 60 ? C.orange : score < 80 ? C.yellow : C.green; }
function bandLabel(score) { return score < 40 ? "CRITICAL" : score < 60 ? "AT RISK" : score < 80 ? "WATCH" : "HEALTHY"; }

// ---- verdict pill ----
function vIcon(key, x, y, s, col) {
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.15; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (key === "kill") { rr(x - s / 2, y - s / 2, s, s, s * 0.22); ctx.fill(); }
  else if (key === "reduce") { ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.16); ctx.lineTo(x, y + s * 0.22); ctx.lineTo(x + s * 0.4, y - s * 0.16); ctx.stroke(); }
  else if (key === "scale") { ctx.beginPath(); ctx.moveTo(x, y + s * 0.42); ctx.lineTo(x, y - s * 0.42); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - s * 0.34, y - s * 0.06); ctx.lineTo(x, y - s * 0.42); ctx.lineTo(x + s * 0.34, y - s * 0.06); ctx.stroke(); }
  else if (key === "refresh") { ctx.beginPath(); ctx.arc(x, y, s * 0.36, Math.PI * 0.4, Math.PI * 1.85); ctx.stroke(); const ax = x + Math.cos(Math.PI * 0.4) * s * 0.36, ay = y + Math.sin(Math.PI * 0.4) * s * 0.36; ctx.beginPath(); ctx.moveTo(ax + 2, ay - s * 0.16); ctx.lineTo(ax + s * 0.18, ay + 2); ctx.lineTo(ax - s * 0.12, ay + s * 0.08); ctx.closePath(); ctx.fill(); }
  else { ctx.lineWidth = s * 0.12; ctx.beginPath(); ctx.arc(x, y, s * 0.32, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, s * 0.09, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - s * 0.45, y); ctx.lineTo(x - s * 0.3, y); ctx.moveTo(x + s * 0.3, y); ctx.lineTo(x + s * 0.45, y); ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x, y - s * 0.3); ctx.moveTo(x, y + s * 0.3); ctx.lineTo(x, y + s * 0.45); ctx.stroke(); }
}
function verdictPill(x, y, w, h, key, label, fillCol, prog) {
  const e = easeOutBack(clamp(prog)); if (e <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(prog * 1.6); ctx.translate(x + w / 2, y + h / 2); ctx.scale(e, e); ctx.translate(-(x + w / 2), -(y + h / 2));
  if (fillCol) { shadow("rgba(249,96,63,0.4)", 22, 0, 8); ctx.fillStyle = fillCol; rr(x, y, w, h, h / 2); ctx.fill(); noShadow(); }
  else { ctx.fillStyle = "rgba(255,255,255,0.05)"; rr(x, y, w, h, h / 2); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.22)"; rr(x, y, w, h, h / 2); ctx.stroke(); }
  const col = fillCol ? C.white : C.mutedD; vIcon(key, x + h * 0.55, y + h / 2, h * 0.46, col);
  ctx.fillStyle = fillCol ? C.white : C.white; ctx.font = `36px ${UI8}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, x + h * 0.95, y + h / 2 + 2);
  ctx.restore();
}

// ---- avatar chip ----
function avatar(cx, cy, r, ini, name, role, prog, dark) {
  const e = easeOutBack(clamp(prog)); if (e <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(prog * 1.6); ctx.translate(cx, cy); ctx.scale(e, e); ctx.translate(-cx, -cy);
  ctx.lineWidth = 6; ctx.strokeStyle = gradH(cx - r, cy - r, r * 2, r * 2); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = dark ? C.navy : C.white; ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark ? C.white : C.ink; ctx.font = `${Math.round(r * 0.8)}px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ini, cx, cy + r * 0.06);
  ctx.fillStyle = dark ? C.white : C.ink; ctx.font = `24px ${UI7}`; ctx.textBaseline = "alphabetic"; ctx.fillText(name, cx, cy + r + 34);
  ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.font = `20px ${UI5}`; ctx.fillText(role, cx, cy + r + 60);
  ctx.restore();
}

// ===================== SCENES =====================
function s1(lt) { // HOOK — the $780 -> $0 leak
  fill(C.command); vignette(540, 720, 640, C.coral, 0.16 + 0.1 * (0.5 + 0.5 * Math.sin(lt * 5)));
  // ad row card
  const p = easeOutCubic(seg(lt, 0.1, 0.5));
  ctx.save(); ctx.globalAlpha = p;
  const cx = 150, cy = 360, cw = 780, chh = 300;
  ctx.fillStyle = "rgba(255,255,255,0.05)"; rr(cx, cy, cw, chh, 28); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; rr(cx, cy, cw, chh, 28); ctx.stroke();
  ctx.fillStyle = gradH(cx + 34, cy + 40, 90, 90); rr(cx + 34, cy + 40, 90, 90, 18); ctx.fill();
  ctx.fillStyle = C.white; ctx.font = `34px ${UI7}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Loyalty Promo", cx + 150, cy + 80);
  ctx.fillStyle = C.mutedD; ctx.font = `26px ${UI5}`; ctx.fillText("Meta · App installs", cx + 150, cy + 118);
  // spend counter
  const spend = Math.round(lerp(0, 780, easeOutCubic(clamp(seg(lt, 0.35, 0.6)))));
  ctx.fillStyle = C.white; ctx.font = `64px ${DISP}`; ctx.fillText("$" + spend + " spent", cx + 34, cy + 230);
  // $0 back + broken tag
  if (lt > 1.1) {
    const gl = 0.5 + 0.5 * Math.sin(lt * 22);
    ctx.globalAlpha = p * (lt > 1.4 ? 1 : gl);
    ctx.fillStyle = C.red; ctx.font = `64px ${DISP}`; ctx.textAlign = "right"; ctx.fillText("$0 back", cx + cw - 34, cy + 230);
    ctx.font = `24px ${UI7}`; ctx.fillText("TRACKING BROKEN", cx + cw - 34, cy + 150);
  }
  ctx.restore();
  // headline (lands crisply right out of the dive)
  ctx.globalAlpha = clamp(seg(lt, 0.2, 0.35) * 2);
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `104px ${DISP}`;
  richLine([{ t: "THIS AD SPENT ", c: C.white }, { t: "$780.", c: C.amber }], 540, 900, `104px ${DISP}`);
  richLine([{ t: "IT MADE ", c: C.white }, { t: "$0", c: C.red }, { t: " BACK.", c: C.white }], 540, 1010, `104px ${DISP}`);
  ctx.globalAlpha = clamp(seg(lt, 1.6, 0.5) * 2); ctx.fillStyle = C.amber; ctx.font = `40px ${UI6}`; ctx.textAlign = "center"; ctx.fillText("Two accounts. One audit.", 540, 1110);
  ctx.globalAlpha = 1; demoTag(true);
}

function s2(lt) { // Bean & Bloom diagnosis — 58 Orange (LIGHT product world, gridded)
  meshStage(lt);
  eyebrow("ACCOUNT 1 · BEAN & BLOOM · DEMO", 282, C.mutedL);
  ctx.globalAlpha = clamp(seg(lt, 0.04, 0.3) * 2); ctx.fillStyle = C.ink; ctx.font = `64px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("ONE HONEST SCORE", 540, 412); ctx.globalAlpha = 1;
  const cardP = easeOutCubic(clamp(seg(lt, 0.12, 0.42)));
  ctx.save(); ctx.globalAlpha = cardP; ctx.translate(540, 980); ctx.scale(lerp(0.97, 1, cardP), lerp(0.97, 1, cardP)); ctx.translate(-540, -980);
  shadowCard(96, 480, 888, 990, 28, true); ctx.restore();
  if (cardP > 0.5) {
    const prog = easeOutCubic(clamp(seg(lt, 0.3, 0.85)));
    const frac = 0.58 * prog, score = Math.round(frac * 100);
    gauge(540, 850, 248, frac, false);
    ctx.fillStyle = bandColor(score); ctx.font = `186px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(String(score), 540, 898);
    ctx.fillStyle = C.mutedL; ctx.font = `42px ${UI6}`; ctx.fillText("/ 100", 540, 968);
    const sp = easeOutBack(clamp(seg(lt, 0.92, 0.4)));
    if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.92, 0.3) * 2); ctx.translate(540, 1130); ctx.scale(sp, sp); ctx.translate(-540, -1130); const cw = 220, ch = 68, cxx = 540 - cw / 2, cyy = 1130 - ch / 2; ctx.fillStyle = "rgba(234,88,12,0.12)"; rr(cxx, cyy, cw, ch, ch / 2); ctx.fill(); ctx.fillStyle = C.orange; ctx.font = `33px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("● At risk", 540, 1132); ctx.restore(); }
    ctx.globalAlpha = clamp(seg(lt, 1.05, 0.4) * 2); ctx.fillStyle = C.ink; ctx.font = `36px ${UI6}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("Needs work — act this week.", 540, 1268);
    ctx.fillStyle = C.mutedL; ctx.font = `27px ${UI5}`; ctx.fillText("ROAS 1.04   ·   CPA $32.54 vs $21.08 break-even", 540, 1322); ctx.globalAlpha = 1;
  }
  captionPill([{ t: "Spending " }, { t: "$32.54", pill: C.red }, { t: " to make a $21 sale." }], 1700, seg(lt, 1.25, 0.4), false); demoTag(false);
}

function sFactor(lt) { // WHY THIS SCORE — the real 13-factor breakdown table (LIGHT, credibility)
  meshStage(lt);
  eyebrow("THE REAL 13-FACTOR ENGINE", 282, C.mutedL);
  ctx.globalAlpha = clamp(seg(lt, 0.04, 0.3) * 2); ctx.fillStyle = C.ink; ctx.font = `62px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("WHY THIS SCORE?", 540, 412); ctx.globalAlpha = 1;
  const cardP = easeOutCubic(clamp(seg(lt, 0.1, 0.4)));
  ctx.save(); ctx.globalAlpha = cardP; ctx.translate(540, 980); ctx.scale(lerp(0.97, 1, cardP), lerp(0.97, 1, cardP)); ctx.translate(-540, -980); shadowCard(96, 478, 888, 1004, 28, true); ctx.restore();
  if (cardP > 0.55) {
    const rows = [["Tracking quality", 90, C.green, "15%"], ["CPA vs break-even", 41, C.orange, "15%"], ["Spend efficiency", 48, C.orange, "12%"], ["Conversion rate", 55, C.orange, "10%"], ["Creative freshness", 38, C.red, "8%"], ["Offer strength", 72, C.yellow, "5%"], ["Click-through rate", 63, C.yellow, "8%"]];
    const top = 620;
    ctx.fillStyle = C.mutedL; ctx.font = `22px ${UI7}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("FACTOR", 148, top - 26); ctx.textAlign = "right"; ctx.fillText("SCORE", 932, top - 26);
    ctx.strokeStyle = "#ece5dc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(148, top - 8); ctx.lineTo(932, top - 8); ctx.stroke();
    for (let i = 0; i < rows.length; i++) {
      const [name, score, col, wt] = rows[i], rp = easeOutCubic(clamp(seg(lt, 0.42 + i * 0.07, 0.42))); if (rp <= 0) continue;
      const y = top + 56 + i * 116;
      ctx.save(); ctx.globalAlpha = clamp(rp * 1.4); ctx.translate((1 - rp) * 28, 0);
      ctx.fillStyle = C.ink; ctx.font = `32px ${UI6}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(name, 148, y);
      ctx.fillStyle = C.mutedL; ctx.font = `21px ${UI5}`; ctx.fillText(wt + " weight", 148, y + 30);
      const barX = 470, barW = 320, barY = y - 24; ctx.fillStyle = "#eef2f7"; rr(barX, barY, barW, 16, 8); ctx.fill();
      ctx.fillStyle = col; rr(barX, barY, barW * (score / 100) * clamp(rp * 1.25), 16, 8); ctx.fill();
      ctx.fillStyle = col; ctx.font = `46px ${DISP}`; ctx.textAlign = "right"; ctx.fillText(String(score), 932, y + 10);
      ctx.restore();
    }
  }
  captionPill([{ t: "Every point — " }, { t: "explained.", pill: C.coral }], 1700, seg(lt, 1.0, 0.4), false); demoTag(false);
}

function s3(lt) { // 5 verdicts (LIGHT product world, real verdict chip colours)
  meshStage(lt);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `64px ${DISP}`;
  ctx.fillText("THEN: EXACTLY", 540, 372); richLine([{ t: "WHAT TO ", c: C.ink }, { t: "DO", c: C.coral }], 540, 444, `64px ${DISP}`); ctx.globalAlpha = 1;
  const items = [["fix", "FIX TRACKING", C.coral], ["kill", "KILL", C.red], ["reduce", "REDUCE", C.orange], ["refresh", "REFRESH", C.mutedL], ["scale", "SCALE", C.green]];
  const pw = 600, ph = 114, x = 540 - pw / 2; let y = 640;
  for (let i = 0; i < items.length; i++) { verdictPill(x, y, pw, ph, items[i][0], items[i][1], items[i][2], seg(lt, 0.3 + i * 0.12, 0.5)); y += ph + 24; }
  captionPill([{ t: "Keep · cut · scale — " }, { t: "you decide.", pill: C.coral }], 1700, seg(lt, 0.95, 0.4), false); demoTag(false);
}

function s4(lt) { // Approve — human-in-the-loop (LIGHT product world)
  meshStage(lt);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.ink; ctx.font = `60px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("YOU APPROVE", 540, 432); ctx.globalAlpha = 1;
  const approved = lt > 1.9;
  const w = 820, x = 540 - w / 2, y = 620, hh = 480;
  const cardP = easeOutCubic(clamp(seg(lt, 0.15, 0.4)));
  ctx.save(); ctx.globalAlpha = cardP; ctx.translate(540, y + hh / 2); ctx.scale(lerp(0.97, 1, cardP), lerp(0.97, 1, cardP)); ctx.translate(-540, -(y + hh / 2));
  shadowCard(x, y, w, hh, 28, true);
  const tg = approved ? C.green : C.red, lbl = approved ? "APPROVED" : "KILL";
  ctx.font = `28px ${UI8}`; const tw = ctx.measureText(lbl).width, tagW = 58 + tw + 34, tagH = 56;
  ctx.fillStyle = approved ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)"; rr(x + 40, y + 44, tagW, tagH, tagH / 2); ctx.fill();
  if (approved) { ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; const ix = x + 40 + 30, iy = y + 72; ctx.beginPath(); ctx.moveTo(ix - 11, iy); ctx.lineTo(ix - 3, iy + 9); ctx.lineTo(ix + 13, iy - 11); ctx.stroke(); }
  else { vIcon("kill", x + 40 + 30, y + 72, 28, C.red); }
  ctx.fillStyle = tg; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `28px ${UI8}`; ctx.fillText(lbl, x + 40 + 58, y + 73);
  ctx.fillStyle = approved ? C.mutedL : C.ink; ctx.font = `48px ${UI8}`; ctx.textBaseline = "alphabetic"; ctx.fillText("Menu Reel A", x + 40, y + 208);
  ctx.fillStyle = C.mutedL; ctx.font = `30px ${UI5}`; ctx.fillText("Budget bleeder · $1,250 spent, 18 sales", x + 40, y + 256);
  ctx.fillStyle = C.mutedL; ctx.font = `26px ${UI5}`; ctx.fillText("Read-only — nothing live changes until you approve.", x + 40, y + 302);
  const press = approved ? 0.97 : (lt > 1.7 ? lerp(1, 0.93, (lt - 1.7) / 0.2) : 1);
  ctx.save(); const bw = w - 80, bx = x + 40, by = y + 348, bh = 92; ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
  if (approved) { ctx.fillStyle = "rgba(22,163,74,0.12)"; rr(bx, by, bw, bh, bh / 2); ctx.fill(); ctx.strokeStyle = C.green; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round"; const ix = bx + bw / 2 - 96, iy = by + bh / 2; ctx.beginPath(); ctx.moveTo(ix - 12, iy); ctx.lineTo(ix - 3, iy + 11); ctx.lineTo(ix + 14, iy - 12); ctx.stroke(); ctx.fillStyle = C.green; }
  else { shadow("rgba(249,96,63,0.4)", 22, 0, 10); ctx.fillStyle = gradH(bx, by, bw, bh); rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow(); ctx.fillStyle = C.white; }
  ctx.font = `38px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(approved ? "Approved" : "Approve fix", bx + bw / 2 + (approved ? 18 : 0), by + bh / 2 + 2); ctx.restore();
  ctx.restore();
  if (lt > 1.9 && lt < 2.6) { const rp = (lt - 1.9) / 0.7; ctx.save(); ctx.globalAlpha = (1 - rp) * 0.35; ctx.strokeStyle = C.green; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(540, y + 394, rp * 460, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  captionPill(approved ? [{ t: "That's it. " }, { t: "Done.", pill: C.green }] : [{ t: "You tap " }, { t: "Approve", pill: C.coral }, { t: "." }], 1700, seg(lt, 0.8, 0.4), false); demoTag(false);
}

function s5(lt) { // read-only trust
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const ap = easeOutCubic(clamp(seg(lt, 0.15, 0.5)));
  ctx.save(); ctx.globalAlpha = 0.45 * ap; ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(290, 470, 500, 340, 28); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `26px ${UI7}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("YOUR LIVE AD", 540, 540); ctx.restore();
  const sp = easeOutBack(clamp(seg(lt, 0.3, 0.45)));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.3, 0.3) * 2); ctx.translate(540, 690); ctx.scale(sp, sp); ctx.translate(-540, -690); shadow("rgba(0,0,0,0.25)", 38, 0, 16); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(540, 690, 120, 0, Math.PI * 2); ctx.fill(); noShadow(); ctx.strokeStyle = C.coral; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(540, 672, 38, Math.PI, 0); ctx.stroke(); ctx.fillStyle = C.coral; rr(540 - 52, 672, 104, 78, 16); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = clamp(seg(lt, 0.55, 0.4) * 2); ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `140px ${DISP}`; ctx.fillText("READ-ONLY", 540, 1010);
  ctx.font = `44px ${UI6}`; ctx.fillText("It proposes — you approve.", 540, 1130);
  richLine([{ t: "It ", c: C.white }, { t: "never", c: C.command }, { t: " touches a live ad.", c: C.white }], 540, 1200, `44px ${UI8}`, true);
  ctx.globalAlpha = clamp(seg(lt, 0.9, 0.4) * 2); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `34px ${UI6}`; ctx.fillText("Your data stays private.", 540, 1290);
  ctx.globalAlpha = 1;
}

function s6(lt) { // Account 2 — Coach Maya 80 Green (LIGHT, mirrors s2 exactly)
  meshStage(lt);
  ctx.globalAlpha = clamp(seg(lt, 0.03, 0.25) * 2); ctx.fillStyle = C.ink; ctx.font = `50px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("TWO ACCOUNTS. ONE AUDIT.", 540, 232); ctx.globalAlpha = 1;
  eyebrow("ACCOUNT 2 · COACH MAYA · DEMO", 300, C.mutedL);
  const cardP = easeOutCubic(clamp(seg(lt, 0.12, 0.42)));
  ctx.save(); ctx.globalAlpha = cardP; ctx.translate(540, 980); ctx.scale(lerp(0.97, 1, cardP), lerp(0.97, 1, cardP)); ctx.translate(-540, -980);
  shadowCard(96, 480, 888, 990, 28, true); ctx.restore();
  if (cardP > 0.5) {
    const prog = easeOutCubic(clamp(seg(lt, 0.3, 0.85)));
    const frac = 0.80 * prog, score = Math.round(frac * 100);
    gauge(540, 850, 248, frac, false);
    ctx.fillStyle = bandColor(score); ctx.font = `186px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(String(score), 540, 898);
    ctx.fillStyle = C.mutedL; ctx.font = `42px ${UI6}`; ctx.fillText("/ 100", 540, 968);
    const sp = easeOutBack(clamp(seg(lt, 0.92, 0.4)));
    if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.92, 0.3) * 2); ctx.translate(540, 1130); ctx.scale(sp, sp); ctx.translate(-540, -1130); const cw = 240, ch = 68, cxx = 540 - cw / 2, cyy = 1130 - ch / 2; ctx.fillStyle = "rgba(22,163,74,0.12)"; rr(cxx, cyy, cw, ch, ch / 2); ctx.fill(); ctx.fillStyle = C.green; ctx.font = `33px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("● Healthy", 540, 1132); ctx.restore(); }
    ctx.globalAlpha = clamp(seg(lt, 1.05, 0.4) * 2); ctx.fillStyle = C.ink; ctx.font = `36px ${UI6}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("Healthy — scale-eligible.", 540, 1268);
    ctx.fillStyle = C.mutedL; ctx.font = `27px ${UI5}`; ctx.fillText("ROAS 2.19   ·   $9,924 spend → $21,716 revenue", 540, 1322); ctx.globalAlpha = 1;
  }
  captionPill([{ t: "Green. " }, { t: "Scale-eligible.", pill: C.green }], 1700, seg(lt, 1.25, 0.4), false); demoTag(false);
}

function s7(lt) { // Maya money (surface light)
  fill(C.surface); brandTag(false);
  eyebrow("COACH MAYA · 2.19× ROAS · DEMO", 250, C.mutedL);
  // ROAS big
  ctx.globalAlpha = clamp(seg(lt, 0.1, 0.4) * 2); ctx.fillStyle = C.green; ctx.font = `200px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("2.19×", 540, 560); ctx.globalAlpha = 1;
  ctx.fillStyle = C.mutedL; ctx.font = `34px ${UI6}`; ctx.fillText("return on ad spend", 540, 610);
  // spend -> revenue bars
  const bx = 150, bw = 780; const p = easeOutCubic(clamp(seg(lt, 0.35, 0.7)));
  ctx.fillStyle = C.ink; ctx.font = `32px ${UI7}`; ctx.textAlign = "left"; ctx.fillText("Spend", bx, 760); ctx.textAlign = "right"; ctx.fillText("$9,924", bx + bw, 760);
  ctx.fillStyle = "#e7ddd0"; rr(bx, 780, bw, 44, 22); ctx.fill(); ctx.fillStyle = C.ink; rr(bx, 780, bw * 0.457, 44, 22); ctx.fill();
  const rev = Math.round(lerp(9924, 21716, p));
  ctx.fillStyle = C.ink; ctx.font = `32px ${UI7}`; ctx.textAlign = "left"; ctx.fillText("Revenue", bx, 900); ctx.textAlign = "right"; ctx.fillStyle = C.green; ctx.fillText("$" + rev.toLocaleString(), bx + bw, 900);
  ctx.fillStyle = "#e7ddd0"; rr(bx, 920, bw, 44, 22); ctx.fill(); ctx.fillStyle = C.green; rr(bx, 920, bw * p, 44, 22); ctx.fill();
  // scale chips
  const c1 = easeOutBack(clamp(seg(lt, 0.8, 0.4))), c2 = easeOutBack(clamp(seg(lt, 0.95, 0.4)));
  function chip(cx, cy, w, txt, pr) { if (pr <= 0) return; ctx.save(); ctx.globalAlpha = clamp(pr * 1.6); ctx.translate(cx, cy); ctx.scale(easeOutBack(clamp(pr)), easeOutBack(clamp(pr))); ctx.translate(-cx, -cy); ctx.fillStyle = C.green; rr(cx - w / 2, cy - 36, w, 72, 36); ctx.fill(); vIcon("scale", cx - w / 2 + 40, cy, 30, C.white); ctx.fillStyle = C.white; ctx.font = `28px ${UI8}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, cx - w / 2 + 70, cy + 2); ctx.restore(); }
  chip(540, 1080, 560, "Scale: Day-1 Hook Reel", c1);
  chip(540, 1170, 520, "Scale: Free Guide Optin", c2);
  captionPill([{ t: "$9,924 in → " }, { t: "$21,716", pill: C.green }, { t: " out." }], 1500, seg(lt, 0.5, 0.4), false); demoTag(false);
}

function s8(lt) { // 12 specialists (LIGHT product world, diagonal-wavefront stagger)
  meshStage(lt);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; richLine([{ t: "12 ", c: C.coral }, { t: "AI SPECIALISTS", c: C.ink }], 540, 360, `60px ${DISP}`); ctx.fillStyle = C.mutedL; ctx.font = `30px ${UI6}`; ctx.fillText("grounded in your real numbers", 540, 410); ctx.globalAlpha = 1;
  const team = [["M", "Mira", "Meta"], ["T", "Travis", "TikTok"], ["D", "Dana", "Data"], ["S", "Stella", "Creative"], ["Ti", "Titan", "Offer"], ["Mi", "Milo", "Auto"], ["A", "Atlas", "Tracking"], ["R", "Riley", "Reports"], ["P", "Paige", "Policy"], ["Pi", "Piper", "Product"], ["Q", "Quinn", "QA"], ["C", "Command", "Router"]];
  const cols = 3, r = 78, sx = 230, stx = 310, sy = 620, sty = 296;
  for (let i = 0; i < 12; i++) { const col = i % cols, row = (i / cols) | 0; avatar(sx + col * stx, sy + row * sty, r, team[i][0], team[i][1], team[i][2], seg(lt, 0.22 + (col + row) * 0.05, 0.5), false); } demoTag(false);
}

function s9(lt) { // plan tiers (surface light)
  fill(C.surface); brandTag(false);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.ink; ctx.font = `60px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; richLine([{ t: "FREE TO START. ", c: C.ink }, { t: "$49", c: C.coral }, { t: " A MONTH.", c: C.ink }], 540, 320, `54px ${DISP}`); ctx.globalAlpha = 1;
  const tiers = [
    { n: "STARTER", price: "$49", sub: "/mo AUD", line: "Audit it yourself", pop: false, x: 90, w: 290, y: 520, h: 560 },
    { n: "PRO", price: "$149", sub: "/mo AUD", line: "The AI team on it", pop: true, x: 400, w: 290, y: 460, h: 660 },
    { n: "EXPERT", price: "$399", sub: "/mo AUD", line: "For agencies", pop: false, x: 710, w: 290, y: 520, h: 560 },
  ];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i], pr = easeOutBack(clamp(seg(lt, 0.25 + i * 0.12, 0.5))); if (pr <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.25 + i * 0.12, 0.3) * 2.5); const off = (1 - clamp(pr)) * 60;
    if (t.pop) { const pulse = 1 + 0.015 * Math.sin(lt * 5); ctx.translate(540, t.y + off + t.h / 2); ctx.scale(pulse, pulse); ctx.translate(-540, -(t.y + off + t.h / 2)); shadow("rgba(249,96,63,0.4)", 30, 0, 10); }
    else shadow("rgba(28,23,38,0.1)", 22, 0, 12);
    ctx.fillStyle = C.white; rr(t.x, t.y + off, t.w, t.h, 26); ctx.fill(); noShadow();
    if (t.pop) { ctx.lineWidth = 3; ctx.strokeStyle = C.coral; rr(t.x, t.y + off, t.w, t.h, 26); ctx.stroke(); ctx.fillStyle = gradH(t.x, t.y + off - 60, t.w, 50); rr(t.x + t.w / 2 - 110, t.y + off - 54, 220, 50, 25); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `24px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("MOST POPULAR", t.x + t.w / 2, t.y + off - 28); }
    ctx.fillStyle = C.ink; ctx.font = `32px ${UI7}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(t.n, t.x + t.w / 2, t.y + off + 64);
    ctx.fillStyle = t.pop ? C.coral : C.ink; ctx.font = `84px ${DISP}`; ctx.fillText(t.price, t.x + t.w / 2, t.y + off + 168);
    ctx.fillStyle = C.mutedL; ctx.font = `24px ${UI6}`; ctx.fillText(t.sub, t.x + t.w / 2, t.y + off + 206);
    ctx.fillStyle = C.mutedL; ctx.font = `26px ${UI5}`;
    const words = t.line.split(" "); ctx.fillText(words.slice(0, 2).join(" "), t.x + t.w / 2, t.y + off + 270); if (words.length > 2) ctx.fillText(words.slice(2).join(" "), t.x + t.w / 2, t.y + off + 304);
    ctx.restore();
  }
  captionPill([{ t: "Pro = auto-sync + 12 agents + studio." }], 1500, seg(lt, 0.7, 0.4), false);
}

function s10(lt) { // receipts
  fill(C.command);
  const p = easeOutBack(clamp(seg(lt, 0.1, 0.5)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.1, 0.3) * 2); ctx.translate(540, 900); ctx.scale(lerp(0.85, 1, clamp(p)), lerp(0.85, 1, clamp(p))); ctx.translate(-540, -900);
  ctx.strokeStyle = gradH(200, 700, 680, 400); ctx.lineWidth = 3; rr(200, 700, 680, 420, 24); ctx.stroke();
  ctx.fillStyle = C.coral; ctx.font = `64px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("RECEIPTS", 540, 800);
  ctx.fillStyle = C.white; ctx.font = `36px ${UI6}`;
  ctx.fillText("Real demo accounts · real numbers", 540, 880);
  ctx.fillText("~6 months of Meta & TikTok data", 540, 935);
  ctx.fillText("scored by the real 13-factor engine", 540, 990);
  ctx.fillStyle = C.mutedD; ctx.font = `26px ${UI5}`; ctx.fillText("182 days · ~910 snapshots/account · read-only", 540, 1060);
  ctx.restore(); ctx.globalAlpha = 1;
}

function s11(lt) { // end card
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lp = easeOutBack(clamp(seg(lt, 0.1, 0.5)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.1, 0.3) * 2); ctx.translate(540, 740); ctx.scale(lerp(0.8, 1, clamp(lp)), lerp(0.8, 1, clamp(lp))); ctx.translate(-540, -740);
  shadow("rgba(0,0,0,0.2)", 28, 0, 12); ctx.fillStyle = C.white; rr(360, 660, 110, 110, 28); ctx.fill(); noShadow(); ctx.fillStyle = gradH(384, 684, 62, 62); rr(384, 684, 62, 62, 16); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `68px ${UI8}`; ctx.fillText("AdPilot OS", 500, 716);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(500, 752, 72, 40, 10); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `24px ${UI8}`; ctx.textAlign = "center"; ctx.fillText("V3", 536, 773);
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.4, 0.4) * 2); ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `40px ${UI6}`;
  ctx.fillText("Know exactly what your ads", 540, 960); ctx.fillText("are doing to your money.", 540, 1012);
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, lt - 0.7) * 7);
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.6, 0.3) * 2); const bw = 600, bh = 120, bx = 540 - bw / 2, by = 1110; ctx.translate(540, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-540, -(by + bh / 2)); shadow("rgba(0,0,0,0.25)", 28, 0, 12); ctx.fillStyle = C.white; rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow(); ctx.fillStyle = C.coral; ctx.font = `48px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Run your free audit", 540, by + bh / 2 + 2); ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.8, 0.4) * 2); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `28px ${UI6}`; ctx.textAlign = "center"; ctx.fillText("Read-only · Meta + TikTok · free to start · no results guaranteed", 540, 1320); ctx.globalAlpha = 1;
}

// ===================== INTRO (scroll through a loaded business) =====================
function s0(lt) {
  const TAU2 = Math.PI * 2;
  fill(C.surface);

  // ---- camera: eased scroll that settles the leak row at screen-centre, then a slam ----
  const SETTLE = 824;
  let sy = SETTLE * easeInOutCubic(clamp((lt - 1.9) / 6.5));
  if (lt > 9.0) sy = SETTLE + easeOutCubic(clamp((lt - 9.0) / 0.2)) * 40;
  // ---- transition: push-zoom into the leak row ----
  const tz = clamp((lt - 9.2) / 0.7), z = lerp(1, 2.35, easeInOutCubic(tz)), ox = 540, oy = 860;
  const trig = 1500;

  const card = (x, y, w, h, r = 24) => {
    shadow("rgba(28,23,38,0.06)", 28, 0, 14); ctx.fillStyle = C.white; rr(x, y, w, h, r); ctx.fill(); noShadow();
    ctx.lineWidth = 1; ctx.strokeStyle = "#ece5dc"; rr(x, y, w, h, r); ctx.stroke();
  };
  const ebrow = (t, y) => { ctx.fillStyle = C.mutedD; ctx.font = `22px ${UI6}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; let cx = 92, sp = 3; for (const ch of t) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } };
  const chip = (x, y, w, h, fc, txt, tc, fs) => { ctx.fillStyle = fc; rr(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = tc; ctx.font = `${fs}px ${UI7}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + w / 2, y + h / 2 + 1); };
  const ent = (pageY, h, fn) => {
    const e = easeOutCubic(clamp((trig - (pageY - sy)) / 240));
    if (e <= 0.002) return;
    ctx.save(); ctx.globalAlpha *= e; const cyc = pageY + h / 2;
    ctx.translate(0, (1 - e) * 50); ctx.translate(540, cyc); ctx.scale(lerp(0.97, 1, e), lerp(0.97, 1, e)); ctx.translate(-540, -cyc); fn(); ctx.restore();
  };

  // ===== scrolled + zoomed dashboard =====
  ctx.save();
  ctx.translate(ox, oy); ctx.scale(z, z); ctx.translate(-ox, -oy);
  ctx.translate(0, -sy);

  ent(200, 0, () => ebrow("ACCOUNT HEALTH", 224));
  ent(240, 340, () => {
    card(60, 240, 960, 340);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.mutedL; ctx.font = `24px ${UI6}`; ctx.fillText("Campaign health", 100, 312);
    ctx.fillStyle = C.orange; ctx.font = `132px ${UI8}`; ctx.fillText("58", 100, 452);
    const w58 = ctx.measureText("58").width; ctx.fillStyle = C.mutedL; ctx.font = `34px ${UI6}`; ctx.fillText("/100", 100 + w58 + 14, 452);
    chip(100, 480, 150, 50, "rgba(234,88,12,0.12)", "At risk", C.orange, 24);
    ctx.textAlign = "right"; ctx.fillStyle = C.ink; ctx.font = `64px ${UI8}`; ctx.fillText("1.04×", 980, 352);
    ctx.fillStyle = C.mutedD; ctx.font = `22px ${UI6}`; ctx.fillText("ROAS", 980, 390);
    ctx.fillStyle = C.mutedL; ctx.font = `26px ${UI5}`; ctx.fillText("$4,068 → $4,250", 980, 432);
    ctx.fillStyle = "#ece5dc"; rr(100, 548, 880, 12, 6); ctx.fill();
    const mg = ctx.createLinearGradient(100, 0, 100 + 880 * 0.58, 0); mg.addColorStop(0, C.red); mg.addColorStop(1, C.orange);
    ctx.fillStyle = mg; rr(100, 548, 880 * 0.58, 12, 6); ctx.fill();
  });

  ent(660, 0, () => ebrow("CONNECTED ACCOUNTS", 684));
  for (const [plat, handle, ay] of [["Meta", "Bean & Bloom Café", 704], ["TikTok", "@beanandbloom", 820]]) ent(ay, 96, () => {
    card(60, ay, 960, 96);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = C.ink; ctx.font = `30px ${UI6}`; ctx.fillText(handle, 110, ay + 44);
    ctx.fillStyle = C.mutedL; ctx.font = `24px ${UI5}`; ctx.fillText(plat, 110, ay + 76);
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(848, ay + 50, 8, 0, TAU2); ctx.fill(); ctx.font = `22px ${UI6}`; ctx.fillText("Synced", 868, ay + 58);
  });

  ent(998, 0, () => ebrow("CAMPAIGNS · LAST 30 DAYS", 1022));
  ent(1038, 300, () => {
    card(60, 1038, 960, 300); const hdr = 1094;
    ctx.fillStyle = C.mutedD; ctx.font = `22px ${UI6}`; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.fillText("CAMPAIGN", 100, hdr);
    ctx.textAlign = "right"; ctx.fillText("SPEND", 740, hdr); ctx.fillText("ROAS", 980, hdr);
    ctx.strokeStyle = "#ece5dc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(100, hdr + 18); ctx.lineTo(980, hdr + 18); ctx.stroke();
    let ry = hdr + 68;
    for (const [n, sp, ro, c] of [["Weekend Brunch Promo", "$900", "2.4×", C.green], ["New Menu Launch", "$1,250", "0.5×", C.red], ["Loyalty App Installs", "$780", "—", C.mutedD], ["Catering Enquiries", "$640", "1.4×", C.green]]) {
      ctx.fillStyle = C.ink; ctx.font = `28px ${UI5}`; ctx.textAlign = "left"; ctx.fillText(n, 100, ry);
      ctx.font = `28px ${UI6}`; ctx.textAlign = "right"; ctx.fillText(sp, 740, ry); ctx.fillStyle = c; ctx.fillText(ro, 980, ry); ry += 56;
    }
  });

  ent(1430, 0, () => {
    ctx.fillStyle = C.ink; ctx.font = `30px ${UI7}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Needs your attention", 92, 1454);
    chip(92 + ctx.measureText("Needs your attention").width + 16, 1428, 44, 36, "rgba(155,148,168,0.18)", "4", C.mutedL, 22);
  });
  const props = [
    ["kill", C.red, "KILL", "Menu Reel A", "Budget bleeder · $1,250 spent, 18 sales", 1490],
    ["fix", C.coral, "FIX TRACKING", "Loyalty Promo", "$780 spent · $0 back · tracking broken", 1654],
    ["reduce", C.orange, "REDUCE", "Catering Lead Form", "CPA above break-even — trim spend", 1818],
    ["scale", C.green, "SCALE", "Brunch Carousel", "Strong ROAS — scale the winner", 1982],
  ];
  for (let i = 0; i < props.length; i++) {
    const [k, col, tag, name, reason, py] = props[i], isLeak = i === 1, hl = isLeak ? clamp((lt - 7.0) / 1.0) : 0;
    ent(py, 140, () => {
      card(60, py, 960, 140);
      if (isLeak && hl > 0) { const gl = 0.5 + 0.5 * Math.sin(lt * 6); ctx.save(); ctx.lineWidth = 2 + 2 * hl; ctx.strokeStyle = C.coral; ctx.globalAlpha *= hl * (0.55 + 0.45 * gl); rr(60, py, 960, 140, 24); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.fillStyle = col; ctx.globalAlpha *= 0.13; rr(92, py + 35, 70, 70, 18); ctx.fill(); ctx.restore();
      vIcon(k, 127, py + 70, 36, col);
      ctx.font = `18px ${UI7}`; const tw = ctx.measureText(tag).width; chip(186, py + 26, tw + 30, 34, col, tag, C.white, 18);
      ctx.fillStyle = C.ink; ctx.font = `32px ${UI7}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(name, 186, py + 96);
      ctx.fillStyle = (isLeak && hl > 0.5) ? C.red : C.mutedL; ctx.font = `25px ${UI5}`; ctx.fillText(reason, 186, py + 126);
      ctx.strokeStyle = C.mutedD; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(956, py + 58); ctx.lineTo(972, py + 70); ctx.lineTo(956, py + 82); ctx.stroke();
    });
  }
  ctx.restore();

  // ===== pinned app bar (fades as the transition darkens) =====
  const barA = (1 - clamp((lt - 9.2) / 0.4)) * clamp(seg(lt, 1.7, 0.4));
  if (barA > 0.01) {
    ctx.save(); ctx.globalAlpha = barA;
    shadow("rgba(28,23,38,0.05)", 18, 0, 6); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fillRect(0, 0, W, 132); noShadow();
    ctx.strokeStyle = "#ece5dc"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 132); ctx.lineTo(W, 132); ctx.stroke();
    ctx.fillStyle = gradH(60, 38, 56, 56); rr(60, 38, 56, 56, 16); ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = `36px ${UI8}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("AdPilot OS", 132, 66);
    const wm = ctx.measureText("AdPilot OS").width; chip(132 + wm + 12, 50, 54, 32, "rgba(249,96,63,0.12)", "V3", C.coral, 20);
    ctx.fillStyle = gradH(956, 42, 48, 48); ctx.beginPath(); ctx.arc(980, 66, 24, 0, TAU2); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `26px ${UI8}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("B", 980, 67);
    ctx.restore();
  }

  // ===== bottom scrim + caption toast =====
  let bsg = ctx.createLinearGradient(0, H - 520, 0, H); bsg.addColorStop(0, "rgba(250,247,244,0)"); bsg.addColorStop(1, "rgba(250,247,244,0.98)"); ctx.fillStyle = bsg; ctx.fillRect(0, H - 520, W, 520);
  if (lt > 2.2 && lt < 9.2) {
    const beats = ["Reads every Meta & TikTok campaign", "Scores your account 0–100", "Finds what's leaking — and the fix"];
    const L0 = lt - 2.3, SW = 2.2, bi = Math.min(beats.length - 1, Math.floor(L0 / SW)), bl = L0 - bi * SW, last = bi === beats.length - 1;
    const bp = clamp(bl / 0.35) * (1 - (last ? 0 : clamp((bl - 1.9) / 0.3)));
    captionPill([{ t: beats[bi] }], 1640, bp, true);
  }

  // ===== title card (first ~1.9s) — staggered reveal, lift-off exit =====
  const scrimA = 1 - clamp(seg(lt, 1.45, 0.55));
  if (scrimA > 0.01) { ctx.save(); ctx.globalAlpha = scrimA; ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H); ctx.restore(); vignette(540, 720, 760, C.coral, 0.05 * scrimA); }
  const grpOut = clamp(seg(lt, 1.45, 0.4)), grpAlpha = 1 - easeInOutCubic(grpOut), grpLift = easeOutCubic(grpOut) * 120;
  if (grpAlpha > 0.01) {
    ctx.save(); ctx.globalAlpha = grpAlpha; ctx.translate(0, -grpLift); ctx.textBaseline = "alphabetic";
    const rise = p => (1 - easeOutBack(clamp(p))) * 26;
    const p0 = seg(lt, 0.10, 0.45);
    if (p0 > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(p0); ctx.translate(0, rise(p0)); ctx.font = `42px ${UI8}`; const ww = ctx.measureText("AdPilot OS").width, lockW = 76 + 18 + ww + 12 + 54, lx = 540 - lockW / 2; shadow("rgba(249,96,63,0.28)", 36, 0, 8); ctx.fillStyle = gradH(lx, 422, 76, 76); rr(lx, 422, 76, 76, 20); ctx.fill(); noShadow(); ctx.fillStyle = C.ink; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("AdPilot OS", lx + 94, 460); chip(lx + 94 + ww + 12, 444, 54, 32, "rgba(249,96,63,0.12)", "V3", C.coral, 20); ctx.restore(); ctx.textBaseline = "alphabetic"; }
    const p1 = seg(lt, 0.28, 0.4);
    if (p1 > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(p1); ctx.translate(0, rise(p1)); ctx.fillStyle = C.mutedL; ctx.font = `24px ${UI6}`; const t = "AD ACCOUNT AUDIT · AUTOMATED"; let s2 = 0, sp = 3.4; for (const ch of t) s2 += ctx.measureText(ch).width + sp; let cx = 540 - (s2 - sp) / 2; ctx.textAlign = "left"; for (const ch of t) { ctx.fillText(ch, cx, 562); cx += ctx.measureText(ch).width + sp; } ctx.restore(); }
    const ph = seg(lt, 0.36, 0.4); if (ph > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(ph); ctx.fillStyle = gradH(540 - 48, 596, 96, 4); rr(540 - 48, 596, 96, 4, 2); ctx.fill(); ctx.restore(); }
    const p2 = seg(lt, 0.42, 0.5);
    if (p2 > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(p2); ctx.translate(0, rise(p2) * 1.3); ctx.fillStyle = C.ink; ctx.font = `92px ${UI8}`; ctx.textAlign = "center"; ctx.fillText("It runs your ads.", 540, 728); ctx.restore(); }
    const p3 = seg(lt, 0.56, 0.5);
    if (p3 > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(p3); ctx.translate(0, rise(p3) * 1.3); richLine([{ t: "You run ", c: C.ink }, { t: "everything.", c: C.coral }], 540, 824, `92px ${UI8}`); ctx.restore(); }
    const p4 = seg(lt, 0.74, 0.45);
    if (p4 > 0) { ctx.save(); ctx.globalAlpha *= easeOutCubic(p4) * 0.92; ctx.fillStyle = C.mutedL; ctx.font = `33px ${UI5}`; ctx.textAlign = "center"; ctx.fillText("Audits every dollar — you approve every fix.", 540, 898); ctx.restore(); }
    ctx.restore();
  }

  // ===== transition: dark closes onto the leak behind a coral→amber wavefront =====
  if (tz > 0) {
    const tp = easeInOutCubic(tz), rad = lerp(1250, 46, tp);
    const g = ctx.createRadialGradient(ox, oy, rad * 0.62, ox, oy, rad); g.addColorStop(0, "rgba(22,18,33,0)"); g.addColorStop(1, C.command);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalAlpha = 1 - tp * 0.4; ctx.lineWidth = 7; ctx.strokeStyle = gradH(ox - rad, oy - rad, rad * 2, rad * 2); ctx.beginPath(); ctx.arc(ox, oy, rad, 0, TAU2); ctx.stroke(); ctx.restore();
    if (tz > 0.9) { ctx.save(); ctx.globalAlpha = (tz - 0.9) / 0.1; fill(C.command); ctx.restore(); }
  }
  if (tz < 0.4) demoTag(false);
}

// V4 lineup: problem → score → WHY (13-factor) → verdicts → approve → read-only → payoff
// account (green) → its money → the team → pricing → CTA. Light product world throughout.
const SCENES = [[s0, 10.0], [s2, 4.6], [sFactor, 5.4], [s3, 4.2], [s4, 3.6], [s5, 4.2], [s6, 4.4], [s7, 3.6], [s8, 4.4], [s9, 4.6], [s11, 4.8]];
const TOTAL = SCENES.reduce((a, s) => a + s[1], 0);
function renderAt(gt) {
  ctx.clearRect(0, 0, W, H);
  let acc = 0;
  for (let i = 0; i < SCENES.length; i++) { const [fn, d] = SCENES[i]; if (gt < acc + d || i === SCENES.length - 1) { fn(gt - acc); break; } acc += d; }
  const p = clamp(gt / TOTAL);
  ctx.fillStyle = "rgba(140,140,150,0.18)"; ctx.fillRect(0, H - 8, W, 8);
  ctx.fillStyle = gradH(0, H - 8, W * p, 8); ctx.fillRect(0, H - 8, W * p, 8);
}

const mode = process.argv[2] || "preview";
if (mode === "preview") { const dir = path.join(__dirname, "preview-v3"); fs.mkdirSync(dir, { recursive: true }); let acc = 0, i = 1; for (const [, d] of SCENES) { renderAt(acc + d * 0.62); fs.writeFileSync(path.join(dir, `s${i}.png`), canvas.toBuffer("image/png")); acc += d; i++; } console.log(`preview-v3: ${i - 1} scenes (total ${TOTAL}s)`); }
else if (mode === "frame") { renderAt(parseFloat(process.argv[3] || "0")); fs.writeFileSync(path.join(__dirname, "frame-v3.png"), canvas.toBuffer("image/png")); console.log("frame-v3 @", process.argv[3]); }
else if (mode === "all") { const dir = path.join(__dirname, "frames-v3"); fs.mkdirSync(dir, { recursive: true }); const n = Math.round(TOTAL * FPS); for (let f = 0; f < n; f++) { renderAt(f / FPS); fs.writeFileSync(path.join(dir, `f${String(f + 1).padStart(5, "0")}.png`), canvas.toBuffer("image/png")); if (f % 90 === 0) process.stdout.write(`\r  ${f}/${n}`); } console.log(`\nrendered ${n} frames (${TOTAL}s)`); }
