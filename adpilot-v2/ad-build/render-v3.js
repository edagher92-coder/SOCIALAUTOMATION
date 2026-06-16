// AdPilot OS V3 — "Two Accounts. One Audit." 9:16 ad renderer (1080x1920, 30fps).
// Real demo data, plan tiers, two-account framing. Fully vector. See SCRIPT-V3.md.
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const FD = path.join(__dirname, "fonts");
for (const f of ["Anton", "Inter", "Montserrat"]) { try { GlobalFonts.registerFromPath(path.join(FD, f + ".ttf"), f); } catch {} }
const DISP = "Anton";
const UI = "Inter";

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
function richLine(segs, x, y, font, bold = false) {
  ctx.font = font; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  let cx = x - total / 2;
  for (const s of segs) { ctx.fillStyle = s.c; ctx.fillText(s.t, cx, y); if (bold) { ctx.lineWidth = 1.4; ctx.strokeStyle = s.c; ctx.strokeText(s.t, cx, y); } cx += ctx.measureText(s.t).width; }
}
function captionPill(segs, cy, prog, dark) {
  if (prog <= 0) return;
  ctx.save(); const e = easeOutBack(clamp(prog)); ctx.globalAlpha = clamp(prog * 1.4);
  ctx.font = `800 44px ${UI}`; let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  const padX = 42, h = 90, w = total + padX * 2, x = 540 - w / 2, y = cy - h / 2;
  ctx.translate(540, cy); ctx.scale(e, e); ctx.translate(-540, -cy);
  shadow("rgba(0,0,0,0.3)", 26, 0, 10); ctx.fillStyle = dark ? C.white : C.ink; rr(x, y, w, h, h / 2); ctx.fill(); noShadow();
  // recolor segs text on pill (invert)
  const fontc = dark ? C.command : C.white;
  ctx.font = `800 44px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let tw = 0; for (const s of segs) tw += ctx.measureText(s.t).width; let cx = 540 - tw / 2;
  for (const s of segs) { ctx.fillStyle = s.pill || fontc; ctx.fillText(s.t, cx, cy + 15); ctx.lineWidth = 1.2; ctx.strokeStyle = s.pill || fontc; ctx.strokeText(s.t, cx, cy + 15); cx += ctx.measureText(s.t).width; }
  ctx.restore();
}
function eyebrow(text, y, color) { ctx.fillStyle = color; ctx.font = `700 28px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; let s = 0; const sp = 4; for (const ch of text) s += ctx.measureText(ch).width + sp; let cx = 540 - (s - sp) / 2; ctx.textAlign = "left"; for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; } }
function demoTag(dark) {
  ctx.save(); ctx.globalAlpha = 0.7; ctx.font = `600 22px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.fillText("● Demo account · illustrative", 540, 1820); ctx.restore();
}
function brandTag(dark) { ctx.save(); ctx.globalAlpha = 0.5; ctx.font = `700 24px ${UI}`; ctx.textAlign = "center"; ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.textBaseline = "alphabetic"; ctx.fillText("ADPILOT OS  ·  V3", 540, 120); ctx.restore(); }
function progress(gt, total) { ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(0, H - 8, W, 8); ctx.fillStyle = gradH(0, H - 8, W * clamp(gt / total), 8); ctx.fillRect(0, H - 8, W * clamp(gt / total), 8); }

// ---- gauge with V3 health bands: red<.40, orange .40-.60, yellow .60-.80, green>=.80 ----
function gauge(cx, cy, R, frac, dark) {
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  const track = dark ? C.navy : "#e7ddd0";
  ctx.lineWidth = 46; ctx.lineCap = "round";
  ctx.strokeStyle = track; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
  const bands = [[C.red, 0, .40], [C.orange, .40, .60], [C.yellow, .60, .80], [C.green, .80, 1]];
  // draw filled portion only up to frac, colored by band
  for (const [col, s, e] of bands) {
    const fs = s, fe = Math.min(e, frac); if (fe <= fs) continue;
    ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(cx, cy, R, lerp(a0, a1, fs) + 0.015, lerp(a0, a1, fe) - 0.015); ctx.stroke();
  }
  // tip marker on the arc (no center needle, so the score number stays clear)
  const ang = lerp(a0, a1, frac);
  const tx = cx + Math.cos(ang) * R, ty = cy + Math.sin(ang) * R;
  ctx.save(); shadow(dark ? "rgba(0,0,0,0.45)" : "rgba(28,23,38,0.22)", 16, 0, 2);
  ctx.fillStyle = dark ? C.white : C.ink; ctx.beginPath(); ctx.arc(tx, ty, 32, 0, Math.PI * 2); ctx.fill(); noShadow();
  ctx.fillStyle = bandColor(Math.round(frac * 100)); ctx.beginPath(); ctx.arc(tx, ty, 17, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
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
  ctx.fillStyle = fillCol ? C.white : C.white; ctx.font = `800 36px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(label, x + h * 0.95, y + h / 2 + 2);
  ctx.restore();
}

// ---- avatar chip ----
function avatar(cx, cy, r, ini, name, role, prog, dark) {
  const e = easeOutBack(clamp(prog)); if (e <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(prog * 1.6); ctx.translate(cx, cy); ctx.scale(e, e); ctx.translate(-cx, -cy);
  ctx.lineWidth = 6; ctx.strokeStyle = gradH(cx - r, cy - r, r * 2, r * 2); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = dark ? C.navy : C.white; ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = dark ? C.white : C.ink; ctx.font = `${Math.round(r * 0.8)}px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ini, cx, cy + r * 0.06);
  ctx.fillStyle = dark ? C.white : C.ink; ctx.font = `700 24px ${UI}`; ctx.textBaseline = "alphabetic"; ctx.fillText(name, cx, cy + r + 34);
  ctx.fillStyle = dark ? C.mutedD : C.mutedL; ctx.font = `500 20px ${UI}`; ctx.fillText(role, cx, cy + r + 60);
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
  ctx.fillStyle = C.white; ctx.font = `700 34px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText("Loyalty Promo", cx + 150, cy + 80);
  ctx.fillStyle = C.mutedD; ctx.font = `500 26px ${UI}`; ctx.fillText("Meta · App installs", cx + 150, cy + 118);
  // spend counter
  const spend = Math.round(lerp(0, 780, easeOutCubic(clamp(seg(lt, 0.35, 0.6)))));
  ctx.fillStyle = C.white; ctx.font = `64px ${DISP}`; ctx.fillText("$" + spend + " spent", cx + 34, cy + 230);
  // $0 back + broken tag
  if (lt > 1.1) {
    const gl = 0.5 + 0.5 * Math.sin(lt * 22);
    ctx.globalAlpha = p * (lt > 1.4 ? 1 : gl);
    ctx.fillStyle = C.red; ctx.font = `64px ${DISP}`; ctx.textAlign = "right"; ctx.fillText("$0 back", cx + cw - 34, cy + 230);
    ctx.font = `700 24px ${UI}`; ctx.fillText("TRACKING BROKEN", cx + cw - 34, cy + 150);
  }
  ctx.restore();
  // headline
  ctx.globalAlpha = clamp(seg(lt, 0.6, 0.35) * 2);
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `104px ${DISP}`;
  richLine([{ t: "THIS AD SPENT ", c: C.white }, { t: "$780.", c: C.amber }], 540, 900, `104px ${DISP}`);
  richLine([{ t: "IT MADE ", c: C.white }, { t: "$0", c: C.red }, { t: " BACK.", c: C.white }], 540, 1010, `104px ${DISP}`);
  ctx.globalAlpha = clamp(seg(lt, 1.6, 0.5) * 2); ctx.fillStyle = C.amber; ctx.font = `600 40px ${UI}`; ctx.textAlign = "center"; ctx.fillText("Two accounts. One audit.", 540, 1110);
  ctx.globalAlpha = 1; demoTag(true);
}

function s2(lt) { // CAFÉ diagnosis — 58 Orange
  fill(C.command); vignette(540, 880, 560, bandColor(58), 0.12); brandTag(true);
  eyebrow("ACCOUNT 1 · BEAN & BLOOM · DEMO", 250, C.mutedD);
  const frac = lerp(0, 0.58, easeOutCubic(clamp(seg(lt, 0.2, 1.0))));
  const score = Math.round(frac * 100);
  gauge(540, 900, 300, frac, true);
  ctx.fillStyle = bandColor(score); ctx.font = `190px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(String(score), 540, 950);
  ctx.fillStyle = C.mutedD; ctx.font = `48px ${DISP}`; ctx.fillText("/ 100", 540, 1020);
  // band chip
  const sp = easeOutBack(clamp(seg(lt, 1.05, 0.4)));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 1.05, 0.3) * 2); ctx.translate(540, 1200); ctx.scale(sp, sp); ctx.translate(-540, -1200); const w = 300, h = 78, x = 540 - w / 2, y = 1200 - h / 2; ctx.fillStyle = C.orange; rr(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `800 36px ${UI}`; ctx.textBaseline = "middle"; ctx.fillText("AT RISK", 540, 1200 + 2); ctx.restore(); }
  // ROAS + micro stats
  ctx.globalAlpha = clamp(seg(lt, 1.2, 0.4) * 2); ctx.fillStyle = C.mutedD; ctx.font = `500 30px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillText("ROAS 1.04  ·  $4,068 spend → $4,250 rev  ·  CPA $32.54 vs $21.08", 540, 1300);
  ctx.globalAlpha = 1;
  captionPill([{ t: "Spending " }, { t: "$32.54", pill: C.red }, { t: " to make a $21 sale." }], 1480, seg(lt, 1.4, 0.4), true); demoTag(true);
}

function s3(lt) { // 5 verdicts
  fill(C.command); brandTag(true);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `66px ${DISP}`;
  ctx.fillText("THEN: EXACTLY", 540, 360); richLine([{ t: "WHAT TO ", c: C.white }, { t: "DO", c: C.coral }], 540, 432, `66px ${DISP}`); ctx.globalAlpha = 1;
  const items = [["fix", "FIX TRACKING", null], ["kill", "KILL", C.red], ["reduce", "REDUCE", null], ["refresh", "REFRESH", null], ["scale", "SCALE", null]];
  const pw = 600, ph = 118, x = 540 - pw / 2; let y = 560;
  for (let i = 0; i < items.length; i++) { verdictPill(x, y, pw, ph, items[i][0], items[i][1], items[i][2], seg(lt, 0.3 + i * 0.14, 0.5)); y += ph + 22; } demoTag(true);
}

function s4(lt) { // Approve -> kill bleeder
  fill(C.command); brandTag(true);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.white; ctx.font = `60px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("YOU APPROVE", 540, 420); ctx.globalAlpha = 1;
  const approved = lt > 1.9;
  const w = 820, x = 540 - w / 2, y = 640, hh = 420;
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.2, 0.4) * 2);
  shadow("rgba(0,0,0,0.35)", 36, 0, 16); ctx.fillStyle = approved ? "rgba(255,255,255,0.06)" : C.navy; rr(x, y, w, hh, 32); ctx.fill(); noShadow();
  const tg = approved ? C.green : C.red, lbl = approved ? "APPROVED" : "KILL";
  ctx.font = `800 30px ${UI}`; const tw = ctx.measureText(lbl).width, tagW = 64 + tw + 36, tagH = 60;
  ctx.fillStyle = tg; rr(x + 36, y + 40, tagW, tagH, tagH / 2); ctx.fill();
  if (approved) { ctx.strokeStyle = C.white; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round"; const ix = x + 36 + 34, iy = y + 70; ctx.beginPath(); ctx.moveTo(ix - 12, iy); ctx.lineTo(ix - 3, iy + 10); ctx.lineTo(ix + 14, iy - 11); ctx.stroke(); }
  else { vIcon("kill", x + 36 + 34, y + 70, 30, C.white); }
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `800 30px ${UI}`; ctx.fillText(lbl, x + 36 + 64, y + 70);
  ctx.fillStyle = approved ? C.mutedD : C.white; ctx.font = `800 50px ${UI}`; ctx.textBaseline = "alphabetic"; ctx.fillText("Menu Reel A", x + 40, y + 200);
  ctx.fillStyle = C.mutedD; ctx.font = `500 34px ${UI}`; ctx.fillText("Budget bleeder · $1,250 spent, 18 sales", x + 40, y + 250);
  // button
  const press = approved ? 0.97 : (lt > 1.7 ? lerp(1, 0.93, (lt - 1.7) / 0.2) : 1);
  ctx.save(); const bw = w - 80, bx = x + 40, by = y + 300, bh = 90; ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
  ctx.fillStyle = approved ? C.green : gradH(bx, by, bw, bh); shadow(approved ? "rgba(22,163,74,0.4)" : "rgba(249,96,63,0.4)", 22, 0, 10); rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow();
  ctx.fillStyle = C.white; ctx.font = `800 38px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(approved ? "Approved" : "Approve fix", bx + bw / 2, by + bh / 2 + 2); ctx.restore();
  ctx.restore();
  if (lt > 1.9 && lt < 2.6) { const rp = (lt - 1.9) / 0.7; ctx.save(); ctx.globalAlpha = (1 - rp) * 0.5; ctx.strokeStyle = C.green; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, y + 345, rp * 460, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  captionPill(approved ? [{ t: "That's it. " }, { t: "Done.", pill: C.green }] : [{ t: "You tap " }, { t: "Approve", pill: C.coral }, { t: "." }], 1500, seg(lt, 0.8, 0.4), true); demoTag(true);
}

function s5(lt) { // read-only trust
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const ap = easeOutCubic(clamp(seg(lt, 0.15, 0.5)));
  ctx.save(); ctx.globalAlpha = 0.45 * ap; ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(290, 470, 500, 340, 28); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = `700 26px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("YOUR LIVE AD", 540, 540); ctx.restore();
  const sp = easeOutBack(clamp(seg(lt, 0.3, 0.45)));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.3, 0.3) * 2); ctx.translate(540, 690); ctx.scale(sp, sp); ctx.translate(-540, -690); shadow("rgba(0,0,0,0.25)", 38, 0, 16); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(540, 690, 120, 0, Math.PI * 2); ctx.fill(); noShadow(); ctx.strokeStyle = C.coral; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(540, 672, 38, Math.PI, 0); ctx.stroke(); ctx.fillStyle = C.coral; rr(540 - 52, 672, 104, 78, 16); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = clamp(seg(lt, 0.55, 0.4) * 2); ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `140px ${DISP}`; ctx.fillText("READ-ONLY", 540, 1010);
  ctx.font = `600 44px ${UI}`; ctx.fillText("It proposes — you approve.", 540, 1130);
  richLine([{ t: "It ", c: C.white }, { t: "never", c: C.command }, { t: " touches a live ad.", c: C.white }], 540, 1200, `800 44px ${UI}`, true);
  ctx.globalAlpha = clamp(seg(lt, 0.9, 0.4) * 2); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `600 34px ${UI}`; ctx.fillText("Your data stays private.", 540, 1290);
  ctx.globalAlpha = 1;
}

function s6(lt) { // Account two — Maya 80 Green (surface light)
  fill(C.surface); vignette(540, 900, 560, C.green, 0.06);
  ctx.globalAlpha = clamp(seg(lt, 0.03, 0.25) * 2); ctx.fillStyle = C.ink; ctx.font = `52px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("TWO ACCOUNTS. ONE AUDIT.", 540, 215); ctx.globalAlpha = 1;
  eyebrow("ACCOUNT 2 · COACH MAYA · DEMO", 290, C.mutedL);
  const frac = lerp(0, 0.80, easeOutCubic(clamp(seg(lt, 0.2, 1.0))));
  const score = Math.round(frac * 100);
  gauge(540, 920, 300, frac, false);
  ctx.fillStyle = bandColor(score); ctx.font = `190px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(String(score), 540, 970);
  ctx.fillStyle = C.mutedL; ctx.font = `48px ${DISP}`; ctx.fillText("/ 100", 540, 1040);
  const sp = easeOutBack(clamp(seg(lt, 1.05, 0.4)));
  if (sp > 0) { ctx.save(); ctx.globalAlpha = clamp(seg(lt, 1.05, 0.3) * 2); ctx.translate(540, 1220); ctx.scale(sp, sp); ctx.translate(-540, -1220); const w = 320, h = 78, x = 540 - w / 2, y = 1220 - h / 2; ctx.fillStyle = C.green; rr(x, y, w, h, h / 2); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `800 36px ${UI}`; ctx.textBaseline = "middle"; ctx.fillText("HEALTHY", 540, 1222); ctx.restore(); }
  captionPill([{ t: "Green. " }, { t: "Scale-eligible.", pill: C.green }], 1480, seg(lt, 1.3, 0.4), false); demoTag(false);
}

function s7(lt) { // Maya money (surface light)
  fill(C.surface); brandTag(false);
  eyebrow("COACH MAYA · 2.19× ROAS · DEMO", 250, C.mutedL);
  // ROAS big
  ctx.globalAlpha = clamp(seg(lt, 0.1, 0.4) * 2); ctx.fillStyle = C.green; ctx.font = `200px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText("2.19×", 540, 560); ctx.globalAlpha = 1;
  ctx.fillStyle = C.mutedL; ctx.font = `600 34px ${UI}`; ctx.fillText("return on ad spend", 540, 610);
  // spend -> revenue bars
  const bx = 150, bw = 780; const p = easeOutCubic(clamp(seg(lt, 0.35, 0.7)));
  ctx.fillStyle = C.ink; ctx.font = `700 32px ${UI}`; ctx.textAlign = "left"; ctx.fillText("Spend", bx, 760); ctx.textAlign = "right"; ctx.fillText("$9,924", bx + bw, 760);
  ctx.fillStyle = "#e7ddd0"; rr(bx, 780, bw, 44, 22); ctx.fill(); ctx.fillStyle = C.ink; rr(bx, 780, bw * 0.457, 44, 22); ctx.fill();
  const rev = Math.round(lerp(9924, 21716, p));
  ctx.fillStyle = C.ink; ctx.font = `700 32px ${UI}`; ctx.textAlign = "left"; ctx.fillText("Revenue", bx, 900); ctx.textAlign = "right"; ctx.fillStyle = C.green; ctx.fillText("$" + rev.toLocaleString(), bx + bw, 900);
  ctx.fillStyle = "#e7ddd0"; rr(bx, 920, bw, 44, 22); ctx.fill(); ctx.fillStyle = C.green; rr(bx, 920, bw * p, 44, 22); ctx.fill();
  // scale chips
  const c1 = easeOutBack(clamp(seg(lt, 0.8, 0.4))), c2 = easeOutBack(clamp(seg(lt, 0.95, 0.4)));
  function chip(cx, cy, w, txt, pr) { if (pr <= 0) return; ctx.save(); ctx.globalAlpha = clamp(pr * 1.6); ctx.translate(cx, cy); ctx.scale(easeOutBack(clamp(pr)), easeOutBack(clamp(pr))); ctx.translate(-cx, -cy); ctx.fillStyle = C.green; rr(cx - w / 2, cy - 36, w, 72, 36); ctx.fill(); vIcon("scale", cx - w / 2 + 40, cy, 30, C.white); ctx.fillStyle = C.white; ctx.font = `800 28px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, cx - w / 2 + 70, cy + 2); ctx.restore(); }
  chip(540, 1080, 560, "Scale: Day-1 Hook Reel", c1);
  chip(540, 1170, 520, "Scale: Free Guide Optin", c2);
  captionPill([{ t: "$9,924 in → " }, { t: "$21,716", pill: C.green }, { t: " out." }], 1500, seg(lt, 0.5, 0.4), false); demoTag(false);
}

function s8(lt) { // 12 specialists
  fill(C.command); brandTag(true);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; richLine([{ t: "12 ", c: C.coral }, { t: "AI SPECIALISTS", c: C.white }], 540, 320, `60px ${DISP}`); ctx.fillStyle = C.mutedD; ctx.font = `600 30px ${UI}`; ctx.fillText("grounded in your real numbers", 540, 366); ctx.globalAlpha = 1;
  const team = [["M", "Mira", "Meta"], ["T", "Travis", "TikTok"], ["D", "Dana", "Data"], ["S", "Stella", "Creative"], ["Ti", "Titan", "Offer"], ["Mi", "Milo", "Auto"], ["A", "Atlas", "Tracking"], ["R", "Riley", "Reports"], ["P", "Paige", "Policy"], ["Pi", "Piper", "Product"], ["Q", "Quinn", "QA"], ["◆", "Command", "Router"]];
  const cols = 3, r = 82, sx = 230, stx = 310, sy = 560, sty = 330;
  for (let i = 0; i < 12; i++) { const col = i % cols, row = (i / cols) | 0; avatar(sx + col * stx, sy + row * sty, r, team[i][0], team[i][1], team[i][2], seg(lt, 0.25 + i * 0.06, 0.5), true); } demoTag(true);
}

function s9(lt) { // plan tiers (surface light)
  fill(C.surface); brandTag(false);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); ctx.fillStyle = C.ink; ctx.font = `60px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; richLine([{ t: "FROM ", c: C.ink }, { t: "$97", c: C.coral }, { t: " AUD", c: C.ink }], 540, 320, `60px ${DISP}`); ctx.globalAlpha = 1;
  const tiers = [
    { n: "STARTER", price: "$97–297", line: "Audit it yourself", pop: false, x: 90, w: 290, y: 520, h: 560 },
    { n: "PRO", price: "$497–1,497", line: "Put the AI team on it", pop: true, x: 400, w: 290, y: 460, h: 660 },
    { n: "EXPERT", price: "$1,997+", line: "Done for agencies", pop: false, x: 710, w: 290, y: 520, h: 560 },
  ];
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i], pr = easeOutBack(clamp(seg(lt, 0.25 + i * 0.12, 0.5))); if (pr <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.25 + i * 0.12, 0.3) * 2.5); const off = (1 - clamp(pr)) * 60;
    if (t.pop) { const pulse = 1 + 0.015 * Math.sin(lt * 5); ctx.translate(540, t.y + off + t.h / 2); ctx.scale(pulse, pulse); ctx.translate(-540, -(t.y + off + t.h / 2)); shadow("rgba(249,96,63,0.4)", 30, 0, 10); }
    else shadow("rgba(28,23,38,0.1)", 22, 0, 12);
    ctx.fillStyle = C.white; rr(t.x, t.y + off, t.w, t.h, 26); ctx.fill(); noShadow();
    if (t.pop) { ctx.lineWidth = 3; ctx.strokeStyle = C.coral; rr(t.x, t.y + off, t.w, t.h, 26); ctx.stroke(); ctx.fillStyle = gradH(t.x, t.y + off - 60, t.w, 50); rr(t.x + t.w / 2 - 110, t.y + off - 54, 220, 50, 25); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `800 24px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("MOST POPULAR", t.x + t.w / 2, t.y + off - 28); }
    ctx.fillStyle = C.ink; ctx.font = `700 32px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(t.n, t.x + t.w / 2, t.y + off + 64);
    ctx.fillStyle = t.pop ? C.coral : C.ink; ctx.font = `60px ${DISP}`; ctx.fillText(t.price, t.x + t.w / 2, t.y + off + 150);
    ctx.fillStyle = C.mutedL; ctx.font = `500 26px ${UI}`;
    const words = t.line.split(" "); ctx.fillText(words.slice(0, 2).join(" "), t.x + t.w / 2, t.y + off + 210); if (words.length > 2) ctx.fillText(words.slice(2).join(" "), t.x + t.w / 2, t.y + off + 244);
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
  ctx.fillStyle = C.white; ctx.font = `600 36px ${UI}`;
  ctx.fillText("Real demo accounts · real numbers", 540, 880);
  ctx.fillText("~6 months of Meta & TikTok data", 540, 935);
  ctx.fillText("scored by the real 13-factor engine", 540, 990);
  ctx.fillStyle = C.mutedD; ctx.font = `500 26px ${UI}`; ctx.fillText("182 days · ~910 snapshots/account · read-only", 540, 1060);
  ctx.restore(); ctx.globalAlpha = 1;
}

function s11(lt) { // end card
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const lp = easeOutBack(clamp(seg(lt, 0.1, 0.5)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.1, 0.3) * 2); ctx.translate(540, 740); ctx.scale(lerp(0.8, 1, clamp(lp)), lerp(0.8, 1, clamp(lp))); ctx.translate(-540, -740);
  shadow("rgba(0,0,0,0.2)", 28, 0, 12); ctx.fillStyle = C.white; rr(360, 660, 110, 110, 28); ctx.fill(); noShadow(); ctx.fillStyle = gradH(384, 684, 62, 62); rr(384, 684, 62, 62, 16); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `800 68px ${UI}`; ctx.fillText("AdPilot OS", 500, 716);
  ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(500, 752, 72, 40, 10); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `800 24px ${UI}`; ctx.textAlign = "center"; ctx.fillText("V3", 536, 773);
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.4, 0.4) * 2); ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `600 40px ${UI}`;
  ctx.fillText("Know exactly what your ads", 540, 960); ctx.fillText("are doing to your money.", 540, 1012);
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, lt - 0.7) * 7);
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.6, 0.3) * 2); const bw = 600, bh = 120, bx = 540 - bw / 2, by = 1110; ctx.translate(540, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-540, -(by + bh / 2)); shadow("rgba(0,0,0,0.25)", 28, 0, 12); ctx.fillStyle = C.white; rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow(); ctx.fillStyle = C.coral; ctx.font = `800 48px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Run your free audit", 540, by + bh / 2 + 2); ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.8, 0.4) * 2); ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `600 28px ${UI}`; ctx.textAlign = "center"; ctx.fillText("Read-only · Meta + TikTok · from $97 AUD · no results guaranteed", 540, 1320); ctx.globalAlpha = 1;
}

// ===================== INTRO (scroll through a loaded business) =====================
function s0(lt) {
  fill(C.surface);
  const DUR0 = 10, PAGE_H = 3000;
  const sy = (PAGE_H - H) * clamp((lt - 1.9) / (DUR0 - 2.5)); // dashboard scrolls after the title card
  const TAU2 = Math.PI * 2;
  ctx.save(); ctx.translate(0, -sy);
  const card = (x, y, w, h, r = 22) => { shadow("rgba(28,23,38,0.07)", 20, 0, 10); ctx.fillStyle = C.white; rr(x, y, w, h, r); ctx.fill(); noShadow(); };

  // top bar
  ctx.fillStyle = gradH(60, 66, 78, 78); rr(60, 66, 78, 78, 20); ctx.fill();
  ctx.fillStyle = C.ink; ctx.font = `800 52px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText("AdPilot OS", 160, 106);
  const wm = ctx.measureText("AdPilot OS").width; ctx.fillStyle = C.coral; ctx.font = `800 26px ${UI}`; ctx.fillText("V3", 160 + wm + 14, 100);
  ctx.fillStyle = C.mutedL; ctx.font = `500 30px ${UI}`; ctx.textBaseline = "alphabetic"; ctx.fillText("Bean & Bloom Café  ·  Meta · TikTok connected", 60, 198);

  // health card
  card(60, 234, 960, 300);
  ctx.fillStyle = C.mutedL; ctx.font = `700 26px ${UI}`; ctx.textAlign = "left"; ctx.fillText("CAMPAIGN HEALTH", 100, 308);
  ctx.fillStyle = C.orange; ctx.font = `150px ${DISP}`; ctx.fillText("58", 100, 462);
  ctx.fillStyle = C.mutedL; ctx.font = `46px ${DISP}`; ctx.fillText("/100", 268, 462);
  ctx.fillStyle = C.orange; rr(100, 482, 250, 50, 25); ctx.fill(); ctx.fillStyle = C.white; ctx.font = `800 26px ${UI}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ORANGE · AT RISK", 225, 508);
  ctx.textAlign = "right"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = C.ink; ctx.font = `88px ${DISP}`; ctx.fillText("1.04×", 980, 400); ctx.fillStyle = C.mutedL; ctx.font = `500 26px ${UI}`; ctx.fillText("ROAS · $4,068 → $4,250", 980, 448);

  // proposals
  ctx.textAlign = "left"; ctx.fillStyle = C.ink; ctx.font = `800 40px ${UI}`; ctx.fillText("Needs your attention", 60, 612);
  const props = [["kill", C.red, "Kill · Menu Reel A", "Budget bleeder · $1,250 spent, 18 sales"], ["fix", C.coral, "Fix tracking · Loyalty Promo", "$780 spent · 0 conversions · tracking broken"], ["reduce", C.orange, "Reduce · Catering Lead Form", "CPA above break-even — trim spend"], ["scale", C.green, "Scale · Brunch Carousel", "Strong ROAS — pour fuel on the winner"]];
  let py = 652;
  for (const [k, col, title, reason] of props) {
    card(60, py, 960, 150); ctx.fillStyle = col; rr(92, py + 35, 80, 80, 20); ctx.fill(); vIcon(k, 132, py + 75, 44, C.white);
    ctx.fillStyle = C.ink; ctx.font = `800 34px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(title, 204, py + 70);
    ctx.fillStyle = C.mutedL; ctx.font = `500 27px ${UI}`; ctx.fillText(reason, 204, py + 112); py += 170;
  }

  // connected accounts
  ctx.fillStyle = C.ink; ctx.font = `800 40px ${UI}`; ctx.fillText("Connected accounts", 60, py + 36); py += 76;
  for (const [plat, handle] of [["Meta", "Bean & Bloom Café"], ["TikTok", "@beanandbloom"]]) {
    card(60, py, 960, 108); ctx.fillStyle = C.ink; ctx.font = `700 32px ${UI}`; ctx.fillText(handle, 104, py + 52); ctx.fillStyle = C.mutedL; ctx.font = `500 26px ${UI}`; ctx.fillText(plat, 104, py + 86);
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(828, py + 56, 9, 0, TAU2); ctx.fill(); ctx.font = `700 24px ${UI}`; ctx.textAlign = "left"; ctx.fillText("synced", 848, py + 64); py += 128;
  }

  // campaigns table
  ctx.fillStyle = C.ink; ctx.font = `800 40px ${UI}`; ctx.fillText("Campaigns · last 30 days", 60, py + 36); py += 76;
  card(60, py, 960, 318);
  const rows = [["Weekend Brunch Promo", "$900", "2.4×", C.green], ["New Menu Launch", "$1,250", "0.5×", C.red], ["Loyalty App Installs", "$780", "—", C.mutedL], ["Catering Enquiries", "$640", "1.4×", C.green]];
  let ry = py + 78;
  for (const [n, sp, ro, c] of rows) { ctx.fillStyle = C.ink; ctx.font = `600 30px ${UI}`; ctx.textAlign = "left"; ctx.fillText(n, 100, ry); ctx.fillStyle = C.mutedL; ctx.textAlign = "right"; ctx.fillText(sp, 760, ry); ctx.fillStyle = c; ctx.fillText(ro, 980, ry); ry += 74; }
  ctx.restore();

  // ---- fixed overlays ----
  let tg = ctx.createLinearGradient(0, 0, 0, 250); tg.addColorStop(0, "rgba(250,247,244,0.97)"); tg.addColorStop(1, "rgba(250,247,244,0)"); ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 250);
  let bs = ctx.createLinearGradient(0, H - 540, 0, H); bs.addColorStop(0, "rgba(250,247,244,0)"); bs.addColorStop(1, "rgba(250,247,244,0.98)"); ctx.fillStyle = bs; ctx.fillRect(0, H - 540, W, 540);

  // title card (clean) for the first ~2.2s — a surface scrim hides the dashboard so nothing overlaps
  const scrimA = 1 - clamp(seg(lt, 1.5, 0.7));
  if (scrimA > 0.01) { ctx.save(); ctx.globalAlpha = scrimA; ctx.fillStyle = C.surface; ctx.fillRect(0, 0, W, H); ctx.restore(); vignette(540, 780, 720, C.coral, 0.07 * scrimA); }
  const ti = clamp(seg(lt, 0.1, 0.25)) * (1 - clamp(seg(lt, 1.55, 0.55)));
  if (ti > 0.01) {
    ctx.save(); ctx.globalAlpha = ti; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = gradH(540 - 46, 590, 92, 92); rr(540 - 46, 590, 92, 92, 24); ctx.fill();
    ctx.fillStyle = C.ink; ctx.font = `62px ${DISP}`; ctx.fillText("MEET", 540, 800);
    richLine([{ t: "ADPILOT ", c: C.ink }, { t: "OS", c: C.coral }], 540, 905, `116px ${DISP}`);
    ctx.fillStyle = C.mutedL; ctx.font = `600 36px ${UI}`; ctx.fillText("Your read-only ads co-pilot", 540, 975);
    ctx.restore();
  }
  // explainer captions once the dashboard is scrolling
  if (lt > 2.2) {
    const beats = ["Reads every Meta & TikTok campaign", "Scores your account 0–100", "Finds what's leaking — and the fix"];
    const L0 = lt - 2.3, SW = 2.5, bi = Math.min(beats.length - 1, Math.floor(L0 / SW)), bl = L0 - bi * SW;
    const bp = clamp(bl / 0.4) * (1 - clamp((bl - 2.0) / 0.3));
    captionPill([{ t: beats[bi] }], 1650, bp, false);
  }
  demoTag(false);
}

const SCENES = [[s0, 10.0], [s1, 4.5], [s2, 5.0], [s3, 5.0], [s4, 3.5], [s5, 5.0], [s6, 5.0], [s7, 5.0], [s8, 4.0], [s9, 5.0], [s10, 3.0], [s11, 5.5]];
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
