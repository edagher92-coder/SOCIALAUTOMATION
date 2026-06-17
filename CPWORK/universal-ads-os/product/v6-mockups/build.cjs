/* AdPilot OS — V6 design mockups. Hand-built SVG → PNG (sharp). Brand-accurate. */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT = "/home/user/SOCIALAUTOMATION/CPWORK/universal-ads-os/product/v6-mockups";
fs.mkdirSync(OUT, { recursive: true });
const S = 2; // export scale for crispness
const FF = "DejaVu Sans, sans-serif";

const C = {
  coral: "#f9603f", coral600: "#ea4a27", coral700: "#c2391c",
  coral50: "#fff3ef", coral100: "#ffe4db", coral200: "#ffc6b6",
  amber: "#ffb224", amber50: "#fff8ea", amber100: "#ffedc7",
  navy: "#211a2e", command: "#161221",
  ink: "#1c1726", muted: "#6b6478",
  surface: "#faf7f4", white: "#ffffff", border: "#ece7e1",
  green: "#16a34a", yellow: "#ca8a04", orange: "#ea580c", red: "#dc2626", teal: "#0d9488",
};

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function T(x, y, s, o = {}) {
  const { size = 16, w = 400, fill = C.ink, anc = "start", ls = null, op = 1, ff = FF } = o;
  return `<text x="${x}" y="${y}" font-family="${ff}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anc}"${ls != null ? ` letter-spacing="${ls}"` : ""} opacity="${op}">${esc(s)}</text>`;
}
function R(x, y, w, h, r, fill, o = {}) {
  const { stroke = null, sw = 1.5, op = 1 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${op}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""}/>`;
}
function card(x, y, w, h, r = 18, fill = C.white, o = {}) {
  const sh = R(x, y + 7, w, h, r, "#1c1726", { op: 0.06 });
  return sh + R(x, y, w, h, r, fill, o);
}
function dot(cx, cy, r, fill, op = 1) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`; }
function circle(cx, cy, r, o = {}) { const { fill = "none", stroke = null, sw = 1, op = 1 } = o; return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ""} opacity="${op}"/>`; }
function polar(cx, cy, r, deg) { const a = (deg - 90) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function arc(cx, cy, r, a0, a1, stroke, sw) {
  const [x1, y1] = polar(cx, cy, r, a0), [x2, y2] = polar(cx, cy, r, a1);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
}
function check(x, y, color = C.green) { return `<path d="M ${x} ${y} l 5 5 l 9 -12" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`; }
function btn(x, y, w, h, label, o = {}) {
  const { fill = C.coral, fg = C.white, stroke = null, size = 15 } = o;
  return R(x, y, w, h, 11, fill, stroke ? { stroke, sw: 1.5 } : {}) + T(x + w / 2, y + h / 2 + size * 0.34, label, { size, w: 700, fill: fg, anc: "middle" });
}
function chip(x, y, w, h, label, o = {}) {
  const { fill = C.coral50, fg = C.coral, dotc = null, size = 12.5, stroke = null } = o;
  let s = R(x, y, w, h, h / 2, fill, stroke ? { stroke, sw: 1.2 } : {});
  let tx = x + 14;
  if (dotc) { s += dot(x + 13, y + h / 2, 3.2, dotc); tx = x + 24; }
  s += T(tx, y + h / 2 + size * 0.34, label, { size, w: 700, fill: fg });
  return s;
}
const DEFS = `<defs>
  <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.coral}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>
  <linearGradient id="brandH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.coral}"/><stop offset="1" stop-color="${C.amber}"/></linearGradient>
  <linearGradient id="cmd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.command}"/><stop offset="0.55" stop-color="${C.navy}"/><stop offset="1" stop-color="${C.command}"/></linearGradient>
  <linearGradient id="heroBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.surface}"/></linearGradient>
</defs>`;
function svg(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * S}" height="${h * S}" viewBox="0 0 ${w} ${h}">${DEFS}<rect width="${w}" height="${h}" fill="${C.surface}"/>${inner}</svg>`;
}
function logo(x, y, size = 28, label = true) {
  let s = R(x, y, size, size, size * 0.3, "url(#brand)");
  if (label) s += T(x + size + 12, y + size * 0.72, "AdPilot OS", { size: 19, w: 800 });
  return s;
}

/* ───────────────────────── PAGE 1 — LANDING ───────────────────────── */
function landing() {
  const W = 1440, H = 1660; let s = "";
  // nav
  s += R(0, 0, W, 72, 0, C.white) + R(0, 71, W, 1, 0, C.border);
  s += logo(80, 22);
  s += chip(286, 28, 44, 22, "V6", { fill: C.coral50, fg: C.coral, size: 12 });
  s += T(1066, 46, "Pricing", { size: 15, w: 700, fill: C.muted });
  s += btn(1150, 18, 92, 38, "Sign in", { fill: C.white, fg: C.coral, stroke: C.coral200 });
  s += btn(1254, 18, 106, 38, "Open app", {});
  // hero
  s += R(0, 72, W, 556, 0, "url(#heroBg)");
  s += circle(720, 150, 270, { fill: C.coral50, op: 0.55 });
  s += chip(505, 132, 430, 36, "Meta & TikTok  ·  explainable  ·  safe by design", { fill: C.coral50, fg: C.coral, dotc: C.coral, stroke: C.coral200, size: 13.5 });
  s += T(720, 258, "Know exactly what your ads are", { size: 58, w: 800, anc: "middle", ls: -1 });
  s += T(720, 326, "doing to your money.", { size: 58, w: 800, anc: "middle", fill: "url(#brandH)", ls: -1 });
  s += T(720, 380, "An explainable Campaign Health Score, the findings leaking your budget,", { size: 20, fill: C.muted, anc: "middle" });
  s += T(720, 408, "and safe, numbers-first fixes — without ever touching a live ad.", { size: 20, fill: C.muted, anc: "middle" });
  s += btn(462, 452, 322, 56, "Open the Command Center  →", { size: 18 });
  s += btn(800, 452, 178, 56, "See pricing", { fill: C.white, fg: C.ink, stroke: C.border, size: 18 });
  s += dot(628, 556, 4, C.amber) + T(645, 561, "Read-only  ·  proposals only  ·  your data stays private", { size: 15, w: 600, fill: C.muted });
  // trust bar
  s += R(0, 628, W, 64, 0, C.white) + R(0, 627, W, 1, 0, C.border) + R(0, 691, W, 1, 0, C.border);
  const trust = ["Never touches a live ad", "AES-256 encrypted tokens", "Meta & TikTok read-only", "Numbers-first · no fluff"];
  let tx = 150; trust.forEach((t) => { s += dot(tx, 660, 4, C.amber); s += T(tx + 14, 665, t, { size: 14.5, w: 700, fill: C.muted }); tx += 300; });
  // feature band
  s += T(720, 770, "Built to find leaking budget — and tell you exactly what to do", { size: 30, w: 800, anc: "middle", ls: -0.5 });
  const feats = [
    ["13-factor Health Score", ["A 0–100 score you can explain.", "See the factors dragging you down,", "weighted and ranked."]],
    ["12 AI specialists, grounded", ["Mira, Travis, Dana & co answer", "only from your live numbers —", "proposals, never guesses."]],
    ["Read-only & reversible", ["We propose; you approve.", "Never edits, pauses, or spends.", "Every action is reversible."]],
  ];
  let fx = 90;
  feats.forEach(([title, lines], i) => {
    s += card(fx, 800, 400, 188, 18);
    s += R(fx + 28, 828, 44, 44, 12, C.coral50);
    s += (i === 0 ? arc(fx + 50, 850, 13, 0, 295, C.green, 4) : i === 1 ? dot(fx + 50, 850, 9, C.amber) : check(fx + 42, 846, C.coral));
    s += T(fx + 28, 916, title, { size: 19, w: 800 });
    lines.forEach((ln, j) => s += T(fx + 28, 944 + j * 19, ln, { size: 13.5, fill: C.muted }));
    fx += 430;
  });
  // pricing
  s += T(720, 1090, "Simple, honest pricing", { size: 38, w: 800, anc: "middle", ls: -0.5 });
  s += T(720, 1122, "Australian dollars · GST-inclusive · no earnings or results guarantees", { size: 16, fill: C.muted, anc: "middle" });
  const tiers = [
    ["FREE", "Free", "", ["CSV import", "Health Score"], "Start free", false, "Paste a CSV, get an explainable score."],
    ["STARTER", "$49/mo", "or $490/yr — save ~17%", ["Saved reports", "Content publishing", "Threshold alerts"], "See plan", false, "For the DIY operator running their own ads."],
    ["PRO", "$149/mo", "or $1,490/yr — save ~17%", ["Live Meta/TikTok sync", "AI specialist team", "Multi-client"], "See plan", true, "Live connect, auto-sync and the AI team."],
    ["EXPERT", "$399/mo", "or $3,990/yr — save ~17%", ["White-label reports", "Messenger automation", "Guarded ad actions"], "See plan", false, "For agencies reselling to clients."],
  ];
  let px = 80; const cw = 305, gap = 20;
  tiers.forEach(([label, price, annual, fl, cta, pop, blurb]) => {
    const cy = 1160, ch = 392;
    if (pop) { s += card(px, cy, cw, ch, 18, C.white, { stroke: C.coral, sw: 2 }); s += R(px + cw / 2 - 58, cy - 15, 116, 28, 14, C.coral) + T(px + cw / 2, cy + 4, "Most popular", { size: 12.5, w: 800, fill: C.white, anc: "middle" }); }
    else s += card(px, cy, cw, ch, 18);
    s += T(px + 26, cy + 44, label, { size: 13, w: 800, fill: C.muted, ls: 1.5 });
    s += T(px + 26, cy + 84, price, { size: 30, w: 800 });
    if (annual) s += T(px + 26, cy + 106, annual, { size: 12.5, fill: C.muted });
    s += T(px + 26, cy + 134, blurb, { size: 12.5, fill: C.muted });
    let ly = cy + 172; fl.forEach((f) => { s += check(px + 26, ly - 4, C.teal) + T(px + 46, ly, f, { size: 13.5, w: 600 }); ly += 26; });
    s += btn(px + 26, cy + ch - 56, cw - 52, 40, cta, pop ? {} : { fill: C.white, fg: C.ink, stroke: C.border });
    px += cw + gap;
  });
  s += T(720, 1592, "All plans billed monthly in AUD via Stripe · cancel anytime · no earnings or results guarantees.", { size: 13, fill: C.muted, anc: "middle" });
  // footer
  s += R(0, 1612, W, 48, 0, C.white) + R(0, 1611, W, 1, 0, C.border);
  s += R(80, 1628, 20, 20, 6, "url(#brand)") + T(108, 1642, "AdPilot OS V6", { size: 14, w: 800 });
  s += T(720, 1642, "Numbers-first · safe by design", { size: 13, fill: C.muted, anc: "middle" });
  s += T(1360, 1642, "Terms · Privacy · Limitations", { size: 13, fill: C.muted, anc: "end" });
  return svg(W, H, s);
}

/* ───────────────────────── shared app chrome ───────────────────────── */
function sidebar(H, active) {
  let s = R(0, 0, 240, H, 0, C.white) + R(239, 0, 1, H, 0, C.border);
  s += logo(24, 24, 26);
  const items = ["Command Center", "Proposals", "Ads Health", "Connect", "Reports", "AI Team", "Settings"];
  let y = 96;
  items.forEach((it) => {
    const on = it === active;
    if (on) s += R(16, y - 22, 208, 38, 10, C.coral50);
    s += dot(36, y - 3, 3.5, on ? C.coral : C.muted);
    s += T(52, y + 1, it, { size: 14.5, w: on ? 800 : 600, fill: on ? C.coral : C.muted });
    y += 46;
  });
  s += R(16, H - 70, 208, 40, 10, C.surface, {});
  s += T(32, H - 45, "Plan: Pro", { size: 12.5, w: 700, fill: C.muted });
  return s;
}
function modeToggle(x, y, advanced) {
  let s = R(x, y, 188, 34, 17, C.surface, { stroke: C.border, sw: 1 });
  s += R(x + 4 + (advanced ? 90 : 0), y + 4, 90, 26, 13, C.coral);
  s += T(x + 49, y + 22, "Simple", { size: 12.5, w: 800, fill: advanced ? C.muted : C.white, anc: "middle" });
  s += T(x + 139, y + 22, "Advanced", { size: 12.5, w: 800, fill: advanced ? C.white : C.muted, anc: "middle" });
  return s;
}
function gauge(cx, cy, r, val, band, bandColor) {
  let s = arc(cx, cy, r, 0, 359.9, "rgba(255,255,255,0.16)", 12);
  s += arc(cx, cy, r, 0, Math.max(2, val / 100 * 360), bandColor, 12);
  s += T(cx, cy + 6, String(val), { size: 46, w: 800, fill: C.white, anc: "middle" });
  s += T(cx, cy + 28, "/ 100", { size: 14, fill: "rgba(255,255,255,0.6)", anc: "middle" });
  return s;
}
function heroCard(x, y, w, h, name, sub, val = 82) {
  let s = card(x, y, w, h, 22, "url(#cmd)");
  s += circle(x + w - 60, y + 30, 90, { fill: C.coral, op: 0.18 });
  s += T(x + 34, y + 44, "COMMAND CENTER", { size: 12.5, w: 800, fill: "rgba(255,255,255,0.6)", ls: 2 });
  s += T(x + 34, y + 82, name, { size: 30, w: 800, fill: C.white, ls: -0.5 });
  s += T(x + 34, y + 110, sub, { size: 14, fill: "rgba(255,255,255,0.72)" });
  // money strip
  s += T(x + 34, y + 150, "Last audit:", { size: 14, fill: "rgba(255,255,255,0.6)" });
  s += T(x + 122, y + 150, "$24,800 spend", { size: 14, w: 800, fill: C.white });
  s += T(x + 240, y + 150, "·  CPA $58 vs break-even $72", { size: 14, fill: "rgba(255,255,255,0.85)" });
  s += chip(x + 470, y + 136, 196, 24, "CPA at / below break-even", { fill: "rgba(22,163,74,0.28)", fg: C.white, dotc: C.green, size: 11.5 });
  // gauge
  s += gauge(x + w - 96, y + 96, 56, val, "Green", C.green);
  s += T(x + w - 96, y + 178, "GREEN · Strong", { size: 12.5, w: 800, fill: C.white, anc: "middle" });
  s += T(x + w - 96, y + 198, "↑ rising · +6% WoW", { size: 12, fill: "rgba(255,255,255,0.7)", anc: "middle" });
  // verdict pills
  const pills = [["Fix tracking", 1, C.amber], ["Kill", 2, C.red], ["Reduce", 3, C.orange], ["Refresh", 1, C.amber], ["Scale", 2, C.green]];
  let vx = x + 34; const vy = y + h - 44;
  pills.forEach(([lab, n, col]) => {
    const wgt = 30 + String(lab).length * 7.6 + 16;
    s += R(vx, vy, wgt, 28, 14, "rgba(255,255,255,0.12)");
    s += dot(vx + 14, vy + 14, 3.4, col); s += T(vx + 24, vy + 18, `${lab}  ${n}`, { size: 12, w: 700, fill: C.white });
    vx += wgt + 10;
  });
  return s;
}
function attnRow(x, y, w, verdict, color, entity, reason) {
  let s = card(x, y, w, 76, 14);
  s += R(x, y, 5, 76, 0, color); s += R(x, y, 14, 76, 14, color); s += R(x + 10, y, 8, 76, 0, C.white);
  s += T(x + 26, y + 30, verdict, { size: 14.5, w: 800, fill: color });
  s += T(x + 26 + verdict.length * 9.4 + 14, y + 30, "· " + entity, { size: 14.5, w: 700 });
  s += T(x + 26, y + 54, reason, { size: 13, fill: C.muted });
  return s;
}

/* ───────────────────────── PAGE 2 — COMMAND (SIMPLE) ───────────────────────── */
function commandSimple() {
  const W = 1440, H = 820; let s = sidebar(H, "Command Center");
  s += R(272, 28, 360, 30, 0, C.surface); s += T(272, 50, "Command Center", { size: 22, w: 800 });
  s += modeToggle(960, 26, false);
  s += chip(680, 30, 234, 30, "Read-only · never edits your ads", { fill: "#e9f6f3", fg: C.teal, dotc: C.teal, size: 12.5 });
  s += heroCard(272, 84, 1136, 300, "Northwind Trading", "Auto-syncing daily · last pull 2h ago · then scored & queued for you.");
  s += T(272, 432, "Needs your attention", { size: 19, w: 800 });
  s += T(1408, 432, "All proposals →", { size: 14, w: 700, fill: C.coral, anc: "end" });
  s += attnRow(272, 452, 1136, "KILL", C.red, "Retargeting – Broad", "CPA $148 > 1.5× break-even $72, and the loss is statistically significant. Propose pause (reversible).");
  s += attnRow(272, 540, 1136, "REDUCE", C.orange, "Prospecting – Video 9:16", "CPA $96 above break-even but recoverable. Reduce budget; test a new angle as a paused duplicate.");
  s += attnRow(272, 628, 1136, "SCALE", C.green, "Lookalike 3% – UGC", "CPA $41 ≤ break-even, health 88, win is significant. Propose ≤20% budget increase (needs typed YES).");
  s += T(272, 740, "Simple view shows the 10-second answer. Switch to Advanced for connections, the AI team, exports and layouts.", { size: 13, fill: C.muted });
  return svg(W, H, s);
}

/* ───────────────────────── PAGE 3 — COMMAND (ADVANCED) ───────────────────────── */
function commandAdvanced() {
  const W = 1440, H = 860; let s = sidebar(H, "Command Center");
  s += T(272, 50, "Command Center", { size: 22, w: 800 });
  s += modeToggle(960, 26, true);
  s += chip(680, 30, 234, 30, "Read-only · never edits your ads", { fill: "#e9f6f3", fg: C.teal, dotc: C.teal, size: 12.5 });
  s += heroCard(272, 84, 1136, 250, "Northwind Trading", "Auto-syncing daily · last pull 2h ago · then scored & queued for you.");
  // left column attention
  s += T(272, 382, "Needs your attention", { size: 18, w: 800 });
  s += attnRow(272, 400, 752, "KILL", C.red, "Retargeting – Broad", "CPA $148 > 1.5× break-even. Loss is significant. Propose pause.");
  s += attnRow(272, 486, 752, "REDUCE", C.orange, "Prospecting – Video 9:16", "CPA $96 above break-even but recoverable. Reduce budget.");
  s += attnRow(272, 572, 752, "SCALE", C.green, "Lookalike 3% – UGC", "CPA $41 ≤ break-even, health 88. Propose ≤20% increase (typed YES).");
  s += attnRow(272, 658, 752, "FIX TRACKING", C.amber, "Conversions API – Web", "Spend with zero recorded results. Verify pixel/events before any change.");
  // right rail
  const rx = 1052, rw = 356;
  s += card(rx, 400, rw, 132, 16); s += T(rx + 20, 430, "Connections", { size: 15, w: 800 }); s += T(rx + rw - 20, 430, "Manage →", { size: 12.5, w: 700, fill: C.coral, anc: "end" });
  s += dot(rx + 22, 460, 4, C.teal) + T(rx + 36, 465, "Meta — Northwind", { size: 13.5, w: 600 }) + T(rx + rw - 20, 465, "live", { size: 12, w: 700, fill: C.teal, anc: "end" });
  s += dot(rx + 22, 490, 4, C.teal) + T(rx + 36, 495, "TikTok — Northwind", { size: 13.5, w: 600 }) + T(rx + rw - 20, 495, "live", { size: 12, w: 700, fill: C.teal, anc: "end" });
  s += T(rx + 20, 520, "Auto-sync: daily · change", { size: 12, fill: C.muted });
  s += card(rx, 548, rw, 96, 16); s += T(rx + 20, 578, "AI specialist team", { size: 15, w: 800 }); s += T(rx + rw - 20, 578, "Open →", { size: 12.5, w: 700, fill: C.coral, anc: "end" });
  s += T(rx + 20, 604, "Mira, Travis, Dana, Atlas, Paige & more —", { size: 12.5, fill: C.muted });
  s += T(rx + 20, 622, "grounded in your live numbers. Proposals only.", { size: 12.5, fill: C.muted });
  s += card(rx, 660, rw, 110, 16); s += T(rx + 20, 690, "Recent reports", { size: 15, w: 800 }); s += T(rx + rw - 20, 690, "All →", { size: 12.5, w: 700, fill: C.coral, anc: "end" });
  s += T(rx + 20, 718, "Weekly — health 82", { size: 13, w: 600 }) + T(rx + rw - 20, 718, "2h ago", { size: 12, fill: C.muted, anc: "end" });
  s += T(rx + 20, 744, "Monthly — health 78", { size: 13, w: 600 }) + T(rx + rw - 20, 744, "6d ago", { size: 12, fill: C.muted, anc: "end" });
  s += chip(272, 798, 470, 30, "Advanced view · checkpoints, layouts, exports & customisation", { fill: C.amber50, fg: C.coral700, dotc: C.amber, size: 12.5 });
  return svg(W, H, s);
}

/* ───────────────────────── PAGE 4 — PROPOSALS ───────────────────────── */
function proposals() {
  const W = 1440, H = 860; let s = sidebar(H, "Proposals");
  s += T(272, 50, "Proposals", { size: 22, w: 800 });
  s += chip(680, 30, 470, 30, "Read-only — every change is a proposal you approve. Budget moves need a typed YES.", { fill: C.amber50, fg: C.coral700, dotc: C.amber, size: 12 });
  // filter chips
  const filters = [["All", true], ["Kill", false], ["Reduce", false], ["Scale", false], ["Refresh", false], ["Fix tracking", false]];
  let fx = 272; filters.forEach(([f, on]) => { const w = 28 + f.length * 8.2; s += R(fx, 78, w, 32, 16, on ? C.coral : C.white, on ? {} : { stroke: C.border, sw: 1.2 }); s += T(fx + w / 2, 99, f, { size: 13, w: 700, fill: on ? C.white : C.muted, anc: "middle" }); fx += w + 10; });
  // table header
  const x = 272, w = 1136, ty = 134;
  s += card(x, ty, w, 626, 16);
  s += T(x + 24, ty + 34, "VERDICT", { size: 11.5, w: 800, fill: C.muted, ls: 1 });
  s += T(x + 190, ty + 34, "ENTITY", { size: 11.5, w: 800, fill: C.muted, ls: 1 });
  s += T(x + 470, ty + 34, "WHY", { size: 11.5, w: 800, fill: C.muted, ls: 1 });
  s += T(x + w - 24, ty + 34, "ACTION", { size: 11.5, w: 800, fill: C.muted, ls: 1, anc: "end" });
  s += R(x + 16, ty + 48, w - 32, 1, 0, C.border);
  const rows = [
    ["KILL", C.red, "Retargeting – Broad", "Meta", "CPA $148 > 1.5× break-even $72 · confident loss", "Pause"],
    ["SCALE", C.green, "Lookalike 3% – UGC", "Meta", "CPA $41 ≤ break-even · health 88 · significant win", "Review"],
    ["REDUCE", C.orange, "Prospecting – Video 9:16", "TikTok", "CPA $96 above break-even but recoverable", "Reduce"],
    ["REFRESH", C.amber, "UGC – Testimonial v2", "Meta", "Frequency 4.6 with falling CTR — creative fatigue", "New variants"],
    ["FIX TRACKING", C.amber, "Conversions API – Web", "Meta", "Spend, zero recorded results — verify pixel/events", "Audit"],
    ["KEEP", C.teal, "Search retarget – BAU", "TikTok", "CPL within modelled break-even · monitor", "—"],
  ];
  let ry = ty + 88;
  rows.forEach(([v, col, ent, plat, why, act]) => {
    s += dot(x + 30, ry - 4, 4, col) + T(x + 44, ry, v, { size: 13.5, w: 800, fill: col });
    s += T(x + 190, ry, ent, { size: 13.5, w: 700 }) + T(x + 190, ry + 18, plat, { size: 11.5, fill: C.muted });
    s += T(x + 470, ry, why, { size: 12.5, fill: C.muted });
    s += R(x + w - 116, ry - 18, 92, 30, 9, v === "KEEP" ? C.surface : C.coral50) + T(x + w - 70, ry + 1, act, { size: 12.5, w: 700, fill: v === "KEEP" ? C.muted : C.coral, anc: "middle" });
    s += R(x + 16, ry + 36, w - 32, 1, 0, C.border, { op: 0.7 });
    ry += 92;
  });
  s += T(272, 800, "Verdicts come straight from the engine (Wilson-gated). Nothing executes until you approve — and budget changes always need a typed YES.", { size: 13, fill: C.muted });
  return svg(W, H, s);
}

/* ───────────────────────── PAGE 5 — CONNECT ───────────────────────── */
function connect() {
  const W = 1440, H = 900; let s = sidebar(H, "Connect");
  s += T(272, 50, "Connect ad accounts", { size: 22, w: 800 });
  s += T(272, 78, "Connect read-only so AdPilot can pull your numbers automatically. We never edit, pause, or create ads.", { size: 14, fill: C.muted });
  // steps
  const steps = [["1 · Connect", "One click (read-only) — or paste a token."], ["2 · Auto-sync", "We pull your numbers on your schedule."], ["3 · Score & propose", "Health score + safe fixes. Never edits an ad."]];
  let sx = 272; steps.forEach(([h, d]) => { s += card(sx, 100, 366, 70, 14, C.white); s += T(sx + 20, 132, h, { size: 14.5, w: 800, fill: C.coral }); s += T(sx + 20, 154, d, { size: 12.5, fill: C.muted }); sx += 386; });
  // trust chips
  s += chip(272, 188, 234, 30, "Read-only · never edits your ads", { fill: "#e9f6f3", fg: C.teal, dotc: C.teal, size: 12.5 });
  s += chip(516, 188, 300, 30, "Auto-sync daily · last pull 2h ago", { fill: C.white, fg: C.muted, dotc: C.teal, size: 12.5, stroke: C.border });
  s += T(272, 244, "Tokens are encrypted at rest (AES-256-GCM) and never sent back to your browser.", { size: 12.5, fill: C.muted });
  // first-score onboarding
  s += card(272, 262, 1136, 76, 16, "#eafaf6", { stroke: "#bfe9dd", sw: 1.2 });
  s += check(296, 292, C.teal); s += T(318, 300, "Connected — run your first audit now", { size: 15, w: 800 });
  s += T(318, 322, "One click pulls your numbers and produces your first Campaign Health Score. (Also runs automatically every day.)", { size: 12.5, fill: C.muted });
  s += btn(1408 - 200, 282, 176, 40, "Run my first audit  →", { size: 13.5 });
  // connect cards
  s += T(272, 380, "Easiest — one click, read-only", { size: 12.5, w: 800, fill: C.muted, ls: 1 });
  s += card(272, 396, 558, 132, 16); s += R(296, 420, 40, 40, 11, "#e7f0ff"); s += dot(316, 440, 9, "#1877f2");
  s += T(352, 432, "Meta (Facebook / Instagram)", { size: 16, w: 800 }); s += T(352, 456, "Scope: ads_read, read_insights (read-only).", { size: 12.5, fill: C.muted });
  s += btn(296, 478, 150, 36, "Connect Meta", { size: 13 });
  s += card(850, 396, 558, 132, 16); s += R(874, 420, 40, 40, 11, "#efeff2"); s += dot(894, 440, 9, C.ink);
  s += T(930, 432, "TikTok Ads", { size: 16, w: 800 }); s += T(930, 456, "Scope: ads.read (read-only).", { size: 12.5, fill: C.muted });
  s += btn(874, 478, 150, 36, "Connect TikTok", { size: 13 });
  // token paste
  s += T(272, 562, "Or paste an access token — works without app review", { size: 12.5, w: 800, fill: C.muted, ls: 1 });
  s += card(272, 578, 1136, 96, 16);
  s += R(296, 606, 760, 44, 10, C.surface, { stroke: C.border, sw: 1 }); s += T(312, 633, "Paste a non-expiring Meta System User token…", { size: 13, fill: C.muted });
  s += btn(1072, 606, 200, 44, "Connect & sync", { size: 14 });
  s += T(296, 666, "We validate scopes before storing. A System User token can be set to never expire.", { size: 11.5, fill: C.muted });
  // connected accounts
  s += T(272, 716, "Connected accounts", { size: 17, w: 800 });
  s += card(272, 732, 1136, 60, 14); s += dot(300, 762, 4, C.teal); s += T(316, 767, "Northwind — Meta", { size: 14, w: 700 }); s += T(470, 767, "act_10293 · ok", { size: 12, fill: C.muted }); s += R(1408 - 24 - 96, 746, 96, 32, 9, C.white, { stroke: C.border, sw: 1.2 }) + T(1408 - 24 - 48, 766, "Sync now", { size: 12.5, w: 700, fill: C.coral, anc: "middle" });
  s += card(272, 800, 1136, 60, 14); s += dot(300, 830, 4, C.teal); s += T(316, 835, "Northwind — TikTok", { size: 14, w: 700 }); s += T(470, 835, "tt_55821 · ok", { size: 12, fill: C.muted }); s += R(1408 - 24 - 96, 814, 96, 32, 9, C.white, { stroke: C.border, sw: 1.2 }) + T(1408 - 24 - 48, 834, "Sync now", { size: 12.5, w: 700, fill: C.coral, anc: "middle" });
  return svg(W, H, s);
}

/* ───────────────────────── render all ───────────────────────── */
const pages = [
  ["01-landing.png", landing()],
  ["02-command-simple.png", commandSimple()],
  ["03-command-advanced.png", commandAdvanced()],
  ["04-proposals.png", proposals()],
  ["05-connect.png", connect()],
];
(async () => {
  for (const [name, markup] of pages) {
    await sharp(Buffer.from(markup)).png().toFile(path.join(OUT, name));
    console.log("wrote", name);
  }
  console.log("DONE ->", OUT);
})().catch((e) => { console.error("RENDER ERR", e.message); process.exit(1); });
