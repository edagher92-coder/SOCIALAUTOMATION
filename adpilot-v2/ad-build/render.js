// AdPilot OS — 9:16 vertical ad renderer (1080x1920, 30fps)
// Fully vector. Renders frames with @napi-rs/canvas, assembled to MP4 by ffmpeg.
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

// ---- fonts ----
const FD = path.join(__dirname, "fonts");
try { GlobalFonts.registerFromPath(path.join(FD, "Anton.ttf"), "Anton"); } catch {}
try { GlobalFonts.registerFromPath(path.join(FD, "Montserrat.ttf"), "Montserrat"); } catch {}
const DISP = "Anton";        // big headlines / numbers
const BODY = "Montserrat";   // captions / labels
const UI   = "Liberation Sans"; // ui text (has real bold)

// ---- canvas ----
const W = 1080, H = 1920, FPS = 30;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

// ---- palette ----
const C = {
  coral: "#f9603f", coralDk: "#e84b2c", amber: "#ffb224", amberDk: "#ff9500",
  bg: "#f5efe8", bg2: "#efe7dc", ink: "#1c1726", dark: "#171221",
  muted: "#8b8290", line: "#e7ddd0", white: "#ffffff",
  green: "#2fbf71", yellow: "#ffce4d", orange: "#ff8a3d", red: "#e5484d",
};

// ---- math / ease ----
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t, s = 1.7) => { const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
// timed entrance: returns 0..1 progress for an element starting at `start` over `dur`
const seg = (lt, start, dur) => clamp((lt - start) / dur);

// ---- low level helpers ----
function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function shadow(color, blur, dx = 0, dy = 0) {
  ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy;
}
function noShadow() { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function coralGrad(x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); return g;
}
// text with optional letter-spacing; returns total width
function trackedWidth(str, sp) {
  let w = 0; for (const ch of str) w += ctx.measureText(ch).width + sp; return w - sp;
}
function fillTracked(str, x, y, sp, align = "center") {
  const total = trackedWidth(str, sp);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  ctx.textAlign = "left";
  for (const ch of str) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  return total;
}
// rich centered line: segments [{t,color}], single line, big display
function richLine(segs, x, y, font, color, bold = false) {
  ctx.font = font; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  let cx = x - total / 2;
  for (const s of segs) {
    ctx.fillStyle = s.color || color; ctx.fillText(s.t, cx, y);
    if (bold) { ctx.lineWidth = 1.4; ctx.strokeStyle = s.color || color; ctx.strokeText(s.t, cx, y); }
    cx += ctx.measureText(s.t).width;
  }
}
function bg(top, bot) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
// soft drifting brand blobs for life (subtle)
function blobs(gt, alpha = 0.10) {
  ctx.save(); ctx.globalAlpha = alpha;
  const a = ctx.createRadialGradient(260 + Math.sin(gt * 0.5) * 40, 380, 0, 260, 380, 360);
  a.addColorStop(0, C.coral); a.addColorStop(1, "rgba(249,96,63,0)");
  ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
  const b = ctx.createRadialGradient(840 + Math.cos(gt * 0.4) * 40, 1500, 0, 840, 1500, 380);
  b.addColorStop(0, C.amber); b.addColorStop(1, "rgba(255,178,36,0)");
  ctx.fillStyle = b; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function brandTag(alpha = 1) { // quiet top brand anchor
  ctx.save(); ctx.globalAlpha = 0.55 * alpha; ctx.fillStyle = C.ink;
  ctx.font = `700 26px ${UI}`; ctx.textBaseline = "alphabetic";
  // dot
  ctx.globalAlpha = 0.9 * alpha;
  const dx = 540 - (trackedWidth("ADPILOT OS", 4) / 2) - 26;
  const g = coralGrad(dx, 96, 18, 18); ctx.fillStyle = g;
  rr(dx, 96, 18, 18, 6); ctx.fill();
  ctx.globalAlpha = 0.5 * alpha; ctx.fillStyle = C.ink;
  fillTracked("ADPILOT OS", 540 + 12, 112, 4, "center");
  ctx.restore();
}
function progress(gt, total) {
  const p = clamp(gt / total);
  ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, H - 10, W, 10);
  ctx.fillStyle = coralGrad(0, H - 10, W * p, 10); ctx.fillRect(0, H - 10, W * p, 10);
}
function vignette(alpha) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// caption pill (mute-first) bottom-center
function captionPill(segs, cy, prog) {
  ctx.save();
  const e = easeOutBack(clamp(prog / 1));
  ctx.globalAlpha = clamp(prog * 1.4);
  ctx.font = `800 46px ${BODY}`;
  let total = 0; for (const s of segs) total += ctx.measureText(s.t).width;
  const padX = 46, h = 96, w = total + padX * 2;
  const x = 540 - w / 2, y = cy - h / 2;
  ctx.translate(540, cy); ctx.scale(e, e); ctx.translate(-540, -cy);
  shadow("rgba(28,23,38,0.18)", 30, 0, 12);
  ctx.fillStyle = C.white; rr(x, y, w, h, h / 2); ctx.fill(); noShadow();
  richLine(segs, 540, cy + 16, `800 46px ${BODY}`, C.ink, true);
  ctx.restore();
}

// ===================== ICONS (vector) =====================
function iconKill(x, y, s, col) { // stop square
  ctx.fillStyle = col; rr(x - s / 2, y - s / 2, s, s, s * 0.22); ctx.fill();
}
function iconReduce(x, y, s, col) { // down chevron
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.18); ctx.lineTo(x, y + s * 0.22); ctx.lineTo(x + s * 0.4, y - s * 0.18); ctx.stroke();
}
function iconScale(x, y, s, col) { // up arrow
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.42); ctx.lineTo(x, y - s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - s * 0.34, y - s * 0.06); ctx.lineTo(x, y - s * 0.42); ctx.lineTo(x + s * 0.34, y - s * 0.06); ctx.stroke();
}
function iconRefresh(x, y, s, col) { // circular arrow
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.15; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(x, y, s * 0.38, Math.PI * 0.35, Math.PI * 1.8); ctx.stroke();
  const ax = x + Math.cos(Math.PI * 0.35) * s * 0.38, ay = y + Math.sin(Math.PI * 0.35) * s * 0.38;
  ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(ax + s * 0.02, ay - s * 0.16); ctx.lineTo(ax + s * 0.2, ay + s * 0.02); ctx.lineTo(ax - s * 0.12, ay + s * 0.08); ctx.closePath(); ctx.fill();
}
function iconFix(x, y, s, col) { // target/crosshair
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.arc(x, y, s * 0.34, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - s * 0.46, y); ctx.lineTo(x - s * 0.3, y);
  ctx.moveTo(x + s * 0.3, y); ctx.lineTo(x + s * 0.46, y);
  ctx.moveTo(x, y - s * 0.46); ctx.lineTo(x, y - s * 0.3);
  ctx.moveTo(x, y + s * 0.3); ctx.lineTo(x, y + s * 0.46); ctx.stroke();
}
function iconLock(x, y, s, col) {
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.12; ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y - s * 0.12, s * 0.26, Math.PI, 0); ctx.stroke(); // shackle
  rr(x - s * 0.34, y - s * 0.12, s * 0.68, s * 0.5, s * 0.1); ctx.fill();      // body
}
function iconCheck(x, y, s, col, prog = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = s * 0.16; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const p1 = [x - s * 0.34, y + s * 0.02], p2 = [x - s * 0.08, y + s * 0.28], p3 = [x + s * 0.38, y - s * 0.28];
  const t = clamp(prog);
  ctx.beginPath(); ctx.moveTo(p1[0], p1[1]);
  if (t < 0.5) { const k = t / 0.5; ctx.lineTo(lerp(p1[0], p2[0], k), lerp(p1[1], p2[1], k)); }
  else { ctx.lineTo(p2[0], p2[1]); const k = (t - 0.5) / 0.5; ctx.lineTo(lerp(p2[0], p3[0], k), lerp(p2[1], p3[1], k)); }
  ctx.stroke();
}
const VICONS = { fix: iconFix, kill: iconKill, reduce: iconReduce, refresh: iconRefresh, scale: iconScale };

// verdict pill
function verdictPill(x, y, w, h, key, label, filled, prog) {
  const e = easeOutBack(clamp(prog));
  if (e <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(prog * 1.5);
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(e, e); ctx.translate(-(x + w / 2), -(y + h / 2));
  if (filled) { shadow("rgba(249,96,63,0.35)", 24, 0, 10); ctx.fillStyle = coralGrad(x, y, w, h); rr(x, y, w, h, h / 2); ctx.fill(); noShadow(); }
  else { ctx.fillStyle = C.white; shadow("rgba(28,23,38,0.10)", 16, 0, 8); rr(x, y, w, h, h / 2); ctx.fill(); noShadow(); ctx.lineWidth = 2; ctx.strokeStyle = C.line; rr(x, y, w, h, h / 2); ctx.stroke(); }
  const iconCol = filled ? C.white : C.coral;
  const cy = y + h / 2;
  // icon chip
  ctx.save(); ctx.globalAlpha *= 1;
  VICONS[key](x + h * 0.55, cy, h * 0.5, iconCol); ctx.restore();
  ctx.fillStyle = filled ? C.white : C.ink;
  ctx.font = `800 38px ${BODY}`; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(label, x + h * 0.95, cy + 2);
  ctx.restore();
}

// avatar chip
function avatarChip(cx, cy, r, initials, name, role, ringGrad, prog) {
  const e = easeOutBack(clamp(prog));
  if (e <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(prog * 1.5);
  ctx.translate(cx, cy); ctx.scale(e, e); ctx.translate(-cx, -cy);
  // ring
  ctx.lineWidth = 7; ctx.strokeStyle = ringGrad ? coralGrad(cx - r, cy - r, r * 2, r * 2) : C.line;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  // fill
  ctx.fillStyle = C.white; shadow("rgba(28,23,38,0.10)", 14, 0, 8); ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.fill(); noShadow();
  if (initials === "@hub") { iconFix(cx, cy, r * 0.95, C.coral); }
  else { ctx.fillStyle = C.ink; ctx.font = `${Math.round(r * 0.78)}px ${DISP}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(initials, cx, cy + r * 0.08); }
  ctx.fillStyle = C.ink; ctx.font = `800 28px ${BODY}`; ctx.textBaseline = "alphabetic";
  ctx.fillText(name, cx, cy + r + 40);
  ctx.fillStyle = C.muted; ctx.font = `600 22px ${BODY}`;
  ctx.fillText(role, cx, cy + r + 70);
  ctx.restore();
}

// ===================== SCENES =====================
function scene1(lt, dur) { // HOOK
  bg(C.dark, "#241a30");
  // pulsing coral radial
  const pulse = 0.5 + 0.5 * Math.sin(lt * 6);
  ctx.save(); ctx.globalAlpha = 0.18 + 0.12 * pulse;
  const g = ctx.createRadialGradient(540, 760, 0, 540, 760, 620);
  g.addColorStop(0, C.coral); g.addColorStop(1, "rgba(249,96,63,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();

  // mini spend chart card
  const cardP = easeOutCubic(seg(lt, 0.1, 0.5));
  ctx.save(); ctx.globalAlpha = cardP;
  const cx = 170, cy = 470, cw = 740, chh = 360;
  ctx.fillStyle = "rgba(255,255,255,0.06)"; rr(cx, cy, cw, chh, 28); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; rr(cx, cy, cw, chh, 28); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = `700 24px ${UI}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("AD SPEND · LAST 7 DAYS", cx + 34, cy + 50);
  // rising line
  const pts = [[0,.8],[.16,.62],[.32,.7],[.5,.4],[.66,.5],[.82,.24],[1,.12]];
  const drawP = clamp(seg(lt, 0.25, 0.7));
  ctx.strokeStyle = C.coral; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  const gx = cx + 40, gy = cy + 110, gw = cw - 80, gh = 170;
  for (let i = 0; i < pts.length; i++) {
    const fp = i / (pts.length - 1);
    if (fp > drawP) break;
    const px = gx + pts[i][0] * gw, py = gy + pts[i][1] * gh;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // burning $ counter (down)
  const amt = Math.round(lerp(4820, 3910, easeInOutCubic(clamp(seg(lt, 0.4, 1.0)))));
  ctx.fillStyle = C.white; ctx.font = `64px ${DISP}`; ctx.textAlign = "left";
  ctx.fillText("$" + amt.toLocaleString(), cx + 34, cy + chh - 36);
  ctx.fillStyle = C.red; ctx.font = `700 30px ${UI}`;
  ctx.fillText("▼ leaking", cx + 360, cy + chh - 40);
  ctx.restore();

  // headline
  const hP = easeOutBack(clamp(seg(lt, 0.55, 0.45)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.55, 0.3) * 2);
  ctx.translate(540, 1060); ctx.scale(lerp(0.9, 1, clamp(hP)), lerp(0.9, 1, clamp(hP))); ctx.translate(-540, -1060);
  ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.font = `96px ${DISP}`;
  ctx.fillText("YOUR ADS ARE", 540, 1040);
  ctx.fillText("SPENDING", 540, 1140);
  richLine([{ t: "YOUR ", color: C.white }, { t: "MONEY", color: C.coral }], 540, 1240, `96px ${DISP}`, C.white);
  ctx.restore();
  // sub
  ctx.globalAlpha = clamp(seg(lt, 1.0, 0.5) * 2);
  ctx.fillStyle = C.amber; ctx.font = `600 44px ${BODY}`; ctx.textAlign = "center";
  ctx.fillText("…and you don't know why.", 540, 1330);
  ctx.globalAlpha = 1;
}

function scene2(lt, dur) { // TWIST — command center
  bg(C.bg, C.bg2); blobs(lt); brandTag(clamp(seg(lt,0.3,0.5)));
  // heading
  ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  ctx.font = `64px ${DISP}`; ctx.fillText("COMMAND CENTER", 540, 360);
  ctx.fillStyle = C.muted; ctx.font = `600 32px ${BODY}`; ctx.fillText("your live ads control room", 540, 410);
  ctx.globalAlpha = 1;
  // 4 cards cascade
  const cards = [
    { t: "HEALTH SCORE", v: "61/100", c: C.orange },
    { t: "OPEN PROPOSALS", v: "7", c: C.coral },
    { t: "CONNECTED", v: "Meta · TikTok", c: C.green, small: true },
    { t: "REPORTS", v: "12", c: C.ink },
  ];
  const gx = 150, gy = 560, cw = 372, chh = 300, gap = 36;
  for (let i = 0; i < 4; i++) {
    const col = i % 2, row = (i / 2) | 0;
    const x = gx + col * (cw + gap), y = gy + row * (chh + gap);
    const p = easeOutBack(clamp(seg(lt, 0.25 + i * 0.12, 0.5)));
    if (p <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.25 + i * 0.12, 0.3) * 2.5);
    const off = (1 - clamp(p)) * 80;
    shadow("rgba(28,23,38,0.10)", 26, 0, 14);
    ctx.fillStyle = C.white; rr(x, y + off, cw, chh, 30); ctx.fill(); noShadow();
    ctx.fillStyle = C.muted; ctx.font = `700 26px ${BODY}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(cards[i].t, x + 36, y + off + 64);
    ctx.fillStyle = cards[i].c; ctx.font = cards[i].small ? `${44}px ${DISP}` : `${88}px ${DISP}`;
    ctx.fillText(cards[i].v, x + 36, y + off + (cards[i].small ? 180 : 210));
    // accent bar
    ctx.fillStyle = cards[i].c; rr(x + 36, y + off + chh - 50, 70, 12, 6); ctx.fill();
    ctx.restore();
  }
  captionPill([{ t: "So I let " }, { t: "THIS", color: C.coral }, { t: " read them." }], 1560, seg(lt, 0.9, 0.4));
  progress(lt + 2, 41);
}

function gauge(cx, cy, R, frac, lt) {
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25; // 270deg
  // track
  ctx.lineWidth = 46; ctx.lineCap = "round";
  const bands = [[C.green, 0, .25], [C.yellow, .25, .5], [C.orange, .5, .75], [C.red, .75, 1]];
  for (const [col, s, e] of bands) {
    ctx.strokeStyle = col; ctx.beginPath();
    ctx.arc(cx, cy, R, lerp(a0, a1, s) + 0.02, lerp(a0, a1, e) - 0.02); ctx.stroke();
  }
  // needle
  const ang = lerp(a0, a1, frac);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  ctx.fillStyle = C.ink; shadow("rgba(0,0,0,0.2)", 12, 0, 4);
  ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(0, -10); ctx.lineTo(R - 30, 0); ctx.lineTo(0, 10); ctx.closePath(); ctx.fill();
  ctx.restore(); noShadow();
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
}
function scene3(lt, dur) { // SCORE
  bg(C.bg, C.bg2); blobs(lt); brandTag();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  richLine([{ t: "It scores your account ", color: C.ink }, { t: "0–100", color: C.coral }], 540, 360, `800 50px ${BODY}`, C.ink, true);
  ctx.globalAlpha = 1;
  const cx = 540, cy = 920, R = 320;
  const frac = lerp(0, 0.61, easeOutCubic(clamp(seg(lt, 0.2, 1.1))));
  gauge(cx, cy, R, frac, lt);
  const num = Math.round(frac * 100);
  ctx.fillStyle = C.ink; ctx.font = `200px ${DISP}`; ctx.textAlign = "center";
  ctx.fillText(String(num), cx, cy + 40);
  ctx.fillStyle = C.muted; ctx.font = `54px ${DISP}`; ctx.fillText("/ 100", cx, cy + 120);
  // band chip stamp
  const sp = easeOutBack(clamp(seg(lt, 1.15, 0.4)));
  if (sp > 0) {
    ctx.save(); ctx.globalAlpha = clamp(seg(lt, 1.15, 0.3) * 2);
    ctx.translate(cx, cy + 290); ctx.scale(sp, sp); ctx.translate(-cx, -(cy + 290));
    const w = 360, h = 86, x = cx - w / 2, y = cy + 290 - h / 2;
    shadow("rgba(255,138,61,0.4)", 24, 0, 10); ctx.fillStyle = C.orange; rr(x, y, w, h, h / 2); ctx.fill(); noShadow();
    ctx.font = `800 40px ${BODY}`; ctx.textBaseline = "middle";
    const lbl = "AT RISK", tw = ctx.measureText(lbl).width, dotR = 9, gp = 18, grp = dotR * 2 + gp + tw, gx0 = cx - grp / 2, mid = y + h / 2;
    ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(gx0 + dotR, mid, dotR, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = "left"; ctx.fillText(lbl, gx0 + dotR * 2 + gp, mid + 2);
    ctx.lineWidth = 1.4; ctx.strokeStyle = C.white; ctx.strokeText(lbl, gx0 + dotR * 2 + gp, mid + 2);
    ctx.restore();
  }
  captionPill([{ t: "Mine? " }, { t: "At risk.", color: C.orange }], 1560, seg(lt, 1.4, 0.4));
  progress(lt + 5, 41);
}

function scene4(lt, dur) { // VERDICTS
  bg(C.bg, C.bg2); blobs(lt); brandTag();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = C.ink;
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  ctx.font = `64px ${DISP}`; ctx.fillText("THEN IT TELLS YOU", 540, 420);
  richLine([{ t: "EXACTLY ", color: C.coral }, { t: "WHAT TO DO", color: C.ink }], 540, 500, `64px ${DISP}`, C.ink);
  ctx.globalAlpha = 1;
  const items = [
    ["fix", "FIX TRACKING", false], ["kill", "KILL", true], ["reduce", "REDUCE", false],
    ["refresh", "REFRESH", false], ["scale", "SCALE", false],
  ];
  const pw = 620, ph = 130, x = 540 - pw / 2; let y = 660;
  for (let i = 0; i < items.length; i++) {
    verdictPill(x, y, pw, ph, items[i][0], items[i][1], items[i][2], seg(lt, 0.3 + i * 0.14, 0.5));
    y += ph + 26;
  }
  progress(lt + 11, 41);
}

function scene5(lt, dur) { // PROPOSALS — approve
  bg(C.bg, C.bg2); blobs(lt); brandTag();
  ctx.textAlign = "center"; ctx.fillStyle = C.ink; ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  ctx.font = `60px ${DISP}`; ctx.fillText("YOU JUST APPROVE", 540, 360);
  ctx.fillStyle = C.muted; ctx.font = `600 32px ${BODY}`; ctx.fillText("safe, prioritised fixes", 540, 410);
  ctx.globalAlpha = 1;
  // back cards
  for (let i = 2; i >= 1; i--) {
    const p = clamp(seg(lt, 0.2 + (2 - i) * 0.1, 0.4));
    ctx.save(); ctx.globalAlpha = p * 0.5;
    const w = 760 - i * 40, x = 540 - w / 2, y = 560 + i * 30 + (1 - p) * 40;
    shadow("rgba(28,23,38,0.08)", 20, 0, 10); ctx.fillStyle = C.white; rr(x, y, w, 150, 26); ctx.fill(); noShadow();
    ctx.restore();
  }
  // main card
  const mp = easeOutCubic(clamp(seg(lt, 0.3, 0.5)));
  const approved = lt > 1.9;
  ctx.save(); ctx.globalAlpha = clamp(mp * 2);
  const w = 820, x = 540 - w / 2, y = 700 + (1 - mp) * 60, hh = 470;
  shadow("rgba(28,23,38,0.14)", 36, 0, 18); ctx.fillStyle = C.white; rr(x, y, w, hh, 34); ctx.fill(); noShadow();
  // kill / approved tag (dynamic width so the label never clips)
  const tg = approved ? C.green : C.red;
  const tlabel = approved ? "APPROVED" : "KILL";
  ctx.font = `800 32px ${BODY}`; const ttw = ctx.measureText(tlabel).width;
  const padL = 72, padR = 38, tagH = 64, tagW = padL + ttw + padR, tagX = x + 40, tagY = y + 44, tagMid = tagY + tagH / 2;
  ctx.fillStyle = tg; rr(tagX, tagY, tagW, tagH, tagH / 2); ctx.fill();
  if (!approved) iconKill(tagX + 40, tagMid, 34, C.white); else iconCheck(tagX + 40, tagMid, 38, C.white, clamp(seg(lt, 1.9, 0.3)));
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(tlabel, tagX + padL, tagMid + 2);
  // title
  ctx.fillStyle = C.ink; ctx.font = `800 52px ${BODY}`; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.fillText("Ad set 3", x + 44, y + 200);
  ctx.fillStyle = C.muted; ctx.font = `500 36px ${BODY}`;
  ctx.fillText("Spending with no conversions.", x + 44, y + 256);
  // approve button
  const press = approved ? 0.96 : (lt > 1.7 ? lerp(1, 0.92, (lt - 1.7) / 0.2) : 1);
  ctx.save();
  const bw = w - 88, bx = x + 44, by = y + 320, bh = 96;
  ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(press, press); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
  ctx.fillStyle = approved ? C.green : coralGrad(bx, by, bw, bh);
  shadow(approved ? "rgba(47,191,113,0.4)" : "rgba(249,96,63,0.4)", 24, 0, 12);
  rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow();
  ctx.fillStyle = C.white; ctx.font = `800 40px ${BODY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(approved ? "Approved" : "Approve fix", bx + bw / 2, by + bh / 2 + 2);
  ctx.restore();
  ctx.restore();
  // ripple
  if (lt > 1.9 && lt < 2.6) {
    const rp = (lt - 1.9) / 0.7; ctx.save(); ctx.globalAlpha = (1 - rp) * 0.5;
    ctx.strokeStyle = C.green; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, y + 368, rp * 460, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  captionPill(approved ? [{ t: "That's it. " }, { t: "Done.", color: C.green }] : [{ t: "Tap " }, { t: "APPROVE", color: C.coral }, { t: "." }], 1610, seg(lt, 0.9, 0.4));
  progress(lt + 16.5, 41);
}

function scene6(lt, dur) { // SAFETY
  // gradient bg
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.12; for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? C.white : "rgba(0,0,0,0.3)"; } ctx.restore();
  // protected "live ad" behind glass
  const ap = easeOutCubic(clamp(seg(lt, 0.15, 0.5)));
  ctx.save(); ctx.globalAlpha = 0.5 * ap;
  ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(290, 470, 500, 360, 30); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = `700 26px ${UI}`; ctx.textAlign = "center";
  ctx.fillText("YOUR LIVE AD", 540, 530); ctx.restore();
  // lock badge stamp
  const sp = easeOutBack(clamp(seg(lt, 0.3, 0.45)));
  if (sp > 0) {
    ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.3, 0.3) * 2);
    ctx.translate(540, 700); ctx.scale(sp, sp); ctx.translate(-540, -700);
    shadow("rgba(0,0,0,0.25)", 40, 0, 18); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(540, 700, 130, 0, Math.PI * 2); ctx.fill(); noShadow();
    iconLock(540, 700, 150, C.coral); ctx.restore();
  }
  // text
  ctx.globalAlpha = clamp(seg(lt, 0.55, 0.4) * 2);
  ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `150px ${DISP}`;
  ctx.fillText("READ-ONLY", 540, 1040);
  ctx.font = `600 46px ${BODY}`;
  ctx.fillText("It proposes fixes —", 540, 1170);
  richLine([{ t: "it ", color: C.white }, { t: "NEVER", color: C.ink }, { t: " touches your ads.", color: C.white }], 540, 1240, `800 46px ${BODY}`, C.white, true);
  ctx.globalAlpha = clamp(seg(lt, 0.9, 0.4) * 2);
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = `600 36px ${BODY}`;
  ctx.fillText("Your data stays private.", 540, 1330);
  ctx.globalAlpha = 1;
  progress(lt + 23, 41);
}

function scene7(lt, dur) { // TEAM
  bg(C.bg, C.bg2); blobs(lt); brandTag();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  richLine([{ t: "12 ", color: C.coral }, { t: "AI SPECIALISTS", color: C.ink }], 540, 360, `66px ${DISP}`, C.ink);
  ctx.fillStyle = C.muted; ctx.font = `600 34px ${BODY}`; ctx.fillText("reading YOUR real numbers", 540, 414);
  ctx.globalAlpha = 1;
  const team = [
    ["M", "Mira", "Meta"], ["T", "Travis", "TikTok"], ["D", "Dana", "Data"], ["S", "Stella", "Creative"],
    ["Ti", "Titan", "Offer"], ["Mi", "Milo", "Auto"], ["A", "Atlas", "Tracking"], ["R", "Riley", "Reports"],
    ["P", "Paige", "Policy"], ["Pi", "Piper", "Product"], ["Q", "Quinn", "QA"], ["@hub", "Router", "Command"],
  ];
  const cols = 3, r = 92, gx = 540, startX = 200, stepX = 340, startY = 620, stepY = 360;
  for (let i = 0; i < team.length; i++) {
    const col = i % cols, row = (i / cols) | 0;
    const cx = startX + col * stepX, cy = startY + row * stepY;
    avatarChip(cx, cy, r, team[i][0], team[i][1], team[i][2], true, seg(lt, 0.25 + i * 0.07, 0.5));
  }
  progress(lt + 28.5, 41);
}

function scene8(lt, dur) { // PRICE
  bg(C.bg, C.bg2); blobs(lt); brandTag();
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = C.ink;
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2);
  ctx.font = `60px ${DISP}`; ctx.fillText("POWERFUL ISN'T", 540, 520);
  richLine([{ t: "EX", color: C.ink }, { t: "PENSIVE", color: C.coral }], 540, 596, `60px ${DISP}`, C.ink);
  ctx.globalAlpha = 1;
  // price card
  const p = easeOutBack(clamp(seg(lt, 0.25, 0.5)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.25, 0.3) * 2.5);
  const w = 720, hh = 540, x = 540 - w / 2, y = 720;
  ctx.translate(540, y + hh / 2); ctx.scale(lerp(0.85, 1, clamp(p)), lerp(0.85, 1, clamp(p))); ctx.translate(-540, -(y + hh / 2));
  shadow("rgba(28,23,38,0.14)", 40, 0, 20); ctx.fillStyle = C.white; rr(x, y, w, hh, 40); ctx.fill(); noShadow();
  ctx.fillStyle = C.muted; ctx.font = `600 40px ${BODY}`; ctx.fillText("from", 540, y + 130);
  ctx.fillStyle = C.coral; ctx.font = `230px ${DISP}`; ctx.fillText("$97", 540, y + 350);
  ctx.fillStyle = C.ink; ctx.font = `700 34px ${BODY}`; ctx.fillText("Pays for itself the first", 540, y + 440);
  ctx.fillText("budget leak it catches.", 540, y + 486);
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.7, 0.4) * 2); ctx.fillStyle = C.muted; ctx.font = `600 30px ${BODY}`;
  ctx.fillText("Meta + TikTok · CSV or auto-sync", 540, 1410);
  ctx.globalAlpha = 1;
  progress(lt + 33.5, 41);
}

function scene9(lt, dur) { // CTA / END
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // logo lockup
  const lp = easeOutBack(clamp(seg(lt, 0.1, 0.5)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.1, 0.3) * 2);
  ctx.translate(540, 760); ctx.scale(lerp(0.8, 1, clamp(lp)), lerp(0.8, 1, clamp(lp))); ctx.translate(-540, -760);
  // tile
  shadow("rgba(0,0,0,0.2)", 30, 0, 14); ctx.fillStyle = C.white; rr(380, 660, 120, 120, 32); ctx.fill(); noShadow();
  ctx.fillStyle = coralGrad(404, 684, 72, 72); rr(404, 684, 72, 72, 20); ctx.fill();
  ctx.fillStyle = C.white; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.font = `74px ${DISP}`;
  ctx.fillText("AdPilot OS", 530, 724);
  // V3 badge
  ctx.fillStyle = "rgba(255,255,255,0.25)"; rr(530, 760, 78, 44, 12); ctx.fill();
  ctx.fillStyle = C.white; ctx.font = `800 26px ${BODY}`; ctx.textAlign = "center"; ctx.fillText("V3", 569, 783);
  ctx.restore();
  // tagline
  ctx.globalAlpha = clamp(seg(lt, 0.4, 0.4) * 2);
  ctx.fillStyle = C.white; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.font = `600 42px ${BODY}`;
  ctx.fillText("Know exactly what your ads", 540, 980);
  ctx.fillText("are doing to your money.", 540, 1036);
  // CTA button pulse
  const pulse = 1 + 0.04 * Math.sin(Math.max(0, lt - 0.7) * 7);
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.6, 0.3) * 2);
  const bw = 620, bh = 128, bx = 540 - bw / 2, by = 1140;
  ctx.translate(540, by + bh / 2); ctx.scale(pulse, pulse); ctx.translate(-540, -(by + bh / 2));
  shadow("rgba(0,0,0,0.25)", 30, 0, 14); ctx.fillStyle = C.white; rr(bx, by, bw, bh, bh / 2); ctx.fill(); noShadow();
  ctx.fillStyle = C.coral; ctx.font = `800 52px ${BODY}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Run your free audit", 540, by + bh / 2 + 2);
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.8, 0.4) * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.font = `600 30px ${BODY}`; ctx.textAlign = "center";
  ctx.fillText("Meta + TikTok · read-only · CSV or auto-sync", 540, 1340);
  ctx.globalAlpha = 1;
}

// ---- timeline ----
const SCENES = [
  [scene1, 2.0], [scene2, 3.0], [scene3, 6.0], [scene4, 5.5], [scene5, 6.5],
  [scene6, 5.5], [scene7, 5.0], [scene8, 4.0], [scene9, 3.5],
];
const TOTAL = SCENES.reduce((a, s) => a + s[1], 0);
function renderAt(gt) {
  ctx.clearRect(0, 0, W, H);
  let acc = 0;
  for (const [fn, d] of SCENES) {
    if (gt < acc + d || (fn === SCENES[SCENES.length - 1][0] && gt >= acc)) { fn(gt - acc, d); return; }
    acc += d;
  }
}

// ---- CLI ----
const mode = process.argv[2] || "preview";
if (mode === "preview") {
  const dir = path.join(__dirname, "preview"); fs.mkdirSync(dir, { recursive: true });
  let acc = 0, i = 1;
  for (const [, d] of SCENES) { renderAt(acc + d * 0.62); fs.writeFileSync(path.join(dir, `scene${i}.png`), canvas.toBuffer("image/png")); acc += d; i++; }
  console.log(`preview: ${i - 1} scene frames -> preview/  (total ${TOTAL}s)`);
} else if (mode === "frame") {
  const t = parseFloat(process.argv[3] || "0"); renderAt(t);
  fs.writeFileSync(path.join(__dirname, "frame.png"), canvas.toBuffer("image/png")); console.log("frame.png @", t);
} else if (mode === "all") {
  const dir = path.join(__dirname, "frames"); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(TOTAL * FPS);
  for (let f = 0; f < n; f++) {
    renderAt(f / FPS);
    fs.writeFileSync(path.join(dir, `f${String(f + 1).padStart(5, "0")}.png`), canvas.toBuffer("image/png"));
    if (f % 60 === 0) process.stdout.write(`\r  frame ${f}/${n}`);
  }
  console.log(`\nrendered ${n} frames -> frames/  (${TOTAL}s @ ${FPS}fps)`);
}
