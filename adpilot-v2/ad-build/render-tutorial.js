// AdPilot OS — "Connect once, sync forever" token tutorial (1080x1920, 30fps).
// Animated step-by-step for Meta (System User, never-expiring, ads_read/read_insights) and
// TikTok (ads.read), then auto-sync. Light product world, mock vector UI, cursor + highlights.
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const FD = path.join(__dirname, "fonts");
try { GlobalFonts.registerFromPath(path.join(FD, "Anton.ttf"), "Anton"); } catch {}
const IW = path.join(__dirname, "node_modules", "inter-ui", "web");
const _rf = (f, fam) => { try { GlobalFonts.registerFromPath(path.join(IW, f), fam); } catch {} };
_rf("Inter-Regular.woff2", "InterReg"); _rf("Inter-Medium.woff2", "InterMed"); _rf("Inter-SemiBold.woff2", "InterSemi"); _rf("Inter-Bold.woff2", "InterBold"); _rf("Inter-ExtraBold.woff2", "InterX");
const DISP = "Anton", UI5 = "InterMed", UI6 = "InterSemi", UI7 = "InterBold", UI8 = "InterX";

const W = 1080, H = 1920, FPS = 30;
const canvas = createCanvas(W, H), ctx = canvas.getContext("2d");
const C = { surface: "#faf7f4", white: "#ffffff", ink: "#1c1726", coral: "#f9603f", amber: "#ffb224", mutedL: "#6b6478", border: "#ece5dc", green: "#16a34a", track: "#eef2f7", bgrey: "#f0e9e1" };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t, s = 1.6) => { const c3 = s + 1; return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
const seg = (lt, s, d) => clamp((lt - s) / d);

function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function shadow(c, b, dx = 0, dy = 0) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy; }
function noShadow() { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function gradH(x, y, w, h) { const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, C.coral); g.addColorStop(1, C.amber); return g; }
function fill(c) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
function meshStage(lt) {
  fill(C.surface); const dx = 8 * Math.sin(lt * 0.5), dy = 6 * Math.cos(lt * 0.42);
  const glow = (gx, gy, r, col) => { ctx.save(); const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); };
  glow(170 + dx, 300 + dy, 720, "rgba(249,96,63,0.10)"); glow(910 - dx, 360 - dy, 780, "rgba(255,178,36,0.12)"); glow(540, 1520 + dy, 820, "rgba(249,96,63,0.05)");
}
function shadowCard(x, y, w, h, r = 24) { shadow("rgba(28,23,38,0.10)", 34, 0, 14); ctx.fillStyle = C.white; rr(x, y, w, h, r); ctx.fill(); noShadow(); ctx.lineWidth = 1; ctx.strokeStyle = C.border; rr(x, y, w, h, r); ctx.stroke(); }
function text(t, x, y, font, color, align = "left", baseline = "alphabetic") { ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline; ctx.fillText(t, x, y); }
function chip(x, y, w, h, fc, txt, tc, fs, f = UI7) { ctx.fillStyle = fc; rr(x, y, w, h, h / 2); ctx.fill(); text(txt, x + w / 2, y + h / 2 + 1, `${fs}px ${f}`, tc, "center", "middle"); }
function caret(cx, cy, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 9, cy - 5); ctx.lineTo(cx + 9, cy - 5); ctx.lineTo(cx, cy + 7); ctx.closePath(); ctx.fill(); }
function lock(cx, cy, col) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy - 6, 8, Math.PI, 0); ctx.stroke(); ctx.fillStyle = col; rr(cx - 11, cy - 2, 22, 18, 4); ctx.fill(); ctx.restore(); }
// coral cursor with a click ripple (clickT in [0,1] when a click happens, else null)
function cursor(x, y, clickT) {
  ctx.save();
  if (clickT != null && clickT > 0 && clickT < 1) { ctx.globalAlpha = (1 - clickT) * 0.5; ctx.strokeStyle = C.coral; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, clickT * 60, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  const press = clickT != null && clickT < 0.3 ? 0.82 : 1; ctx.translate(x, y); ctx.scale(press, press);
  shadow("rgba(28,23,38,0.3)", 10, 0, 3); ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.fill(); noShadow();
  ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function urlBar(x, y, w, txt, prog) { ctx.save(); ctx.globalAlpha = clamp(prog * 2); ctx.fillStyle = C.bgrey; rr(x, y, w, 52, 26); ctx.fill(); ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(x + 30, y + 26, 7, 0, Math.PI * 2); ctx.fill(); text(txt, x + 54, y + 34, `24px ${UI6}`, C.mutedL, "left"); ctx.restore(); }
function caption(segs, prog) {
  if (prog <= 0) return; ctx.save(); const e = easeOutBack(clamp(prog)); ctx.globalAlpha = clamp(prog * 1.5);
  ctx.font = `42px ${UI8}`; let tot = 0; for (const s of segs) tot += ctx.measureText(s.t).width;
  const padX = 40, h = 86, w = tot + padX * 2, cy = 1700; ctx.translate(540, cy); ctx.scale(e, e); ctx.translate(-540, -cy);
  shadow("rgba(0,0,0,0.28)", 24, 0, 9); ctx.fillStyle = C.ink; rr(540 - w / 2, cy - h / 2, w, h, h / 2); ctx.fill(); noShadow();
  let cx = 540 - tot / 2; ctx.textAlign = "left"; ctx.textBaseline = "middle"; for (const s of segs) { ctx.fillStyle = s.c || C.white; ctx.font = `42px ${UI8}`; ctx.fillText(s.t, cx, cy + 2); cx += ctx.measureText(s.t).width; } ctx.restore();
}
function progressPill(label) { ctx.save(); const w = ctx.measureText ? 0 : 0; chip(540 - 150, 150, 300, 56, "rgba(249,96,63,0.10)", label, C.coral, 26, UI7); ctx.restore(); }
function titleZone(t, lt) { text(t, 540, 410, `58px ${DISP}`, C.ink, "center"); void lt; }
// the real AdPilot "connect with an access token" card
function connectCard(lt, platform, token, acct, connected) {
  const x = 96, y = 600, w = 888, h = 720; const p = easeOutCubic(seg(lt, 0.05, 0.4));
  ctx.save(); ctx.globalAlpha = p; shadowCard(x, y, w, h, 28);
  text("Advanced — connect with an access token", x + 40, y + 70, `30px ${UI7}`, C.ink, "left");
  // platform select
  ctx.fillStyle = C.bgrey; rr(x + 40, y + 100, w - 80, 80, 16); ctx.fill();
  text(platform, x + 64, y + 148, `30px ${UI6}`, C.ink, "left"); caret(x + w - 70, y + 140, C.mutedL);
  // token field
  ctx.fillStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeStyle = token ? C.coral : C.border; rr(x + 40, y + 210, w - 80, 80, 16); ctx.fill(); ctx.stroke();
  text(token || "Paste read-only token", x + 64, y + 258, `28px ${token ? UI6 : UI5}`, token ? C.ink : C.mutedL, "left");
  // account id field
  ctx.fillStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeStyle = C.border; rr(x + 40, y + 320, w - 80, 80, 16); ctx.fill(); ctx.stroke();
  text(acct || "Account ID — leave blank for all", x + 64, y + 368, `28px ${acct ? UI6 : UI5}`, acct ? C.ink : C.mutedL, "left");
  // connect button
  const bp = easeOutCubic(seg(lt, 0.5, 0.3));
  if (connected) { ctx.fillStyle = "rgba(22,163,74,0.12)"; rr(x + 40, y + 430, w - 80, 92, 46); ctx.fill(); text("✓ Connected · syncing…", x + w / 2, y + 478, `34px ${UI8}`, C.green, "center", "middle"); }
  else { shadow("rgba(249,96,63,0.4)", 20, 0, 8); ctx.fillStyle = gradH(x + 40, y + 430, w - 80, 92); rr(x + 40, y + 430, w - 80, 92, 46); ctx.fill(); noShadow(); text("Connect & sync", x + w / 2, y + 478, `36px ${UI8}`, C.white, "center", "middle"); void bp; }
  lock(x + 52, y + 575, C.mutedL); text("Read-only — we never edit, pause, or create ads.", x + 76, y + 580, `24px ${UI5}`, C.mutedL, "left");
  ctx.restore();
}

// ===================== SCENES =====================
function intro(lt) {
  meshStage(lt);
  const p = easeOutCubic(seg(lt, 0.1, 0.5));
  ctx.save(); ctx.globalAlpha = p; ctx.translate(540, 760); ctx.scale(lerp(0.9, 1, p), lerp(0.9, 1, p)); ctx.translate(-540, -760);
  shadow("rgba(249,96,63,0.28)", 36, 0, 8); ctx.fillStyle = gradH(540 - 60, 600, 120, 120); rr(540 - 60, 600, 120, 120, 28); ctx.fill(); noShadow();
  // key glyph
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(540 - 16, 648, 22, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(540, 660); ctx.lineTo(540 + 44, 700); ctx.moveTo(540 + 28, 686); ctx.lineTo(540 + 40, 700); ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.4, 0.4) * 2);
  text("CONNECT ONCE.", 540, 860, `72px ${DISP}`, C.ink, "center"); text("SYNC FOREVER.", 540, 936, `72px ${DISP}`, C.coral, "center");
  ctx.globalAlpha = clamp(seg(lt, 0.7, 0.4) * 2); text("One read-only key. Set it to never expire.", 540, 1010, `32px ${UI6}`, C.mutedL, "center"); ctx.globalAlpha = 1;
  caption([{ t: "Get a token that " }, { t: "never expires.", c: C.amber }], seg(lt, 1.0, 0.4));
}

// generic step scaffold: progress pill, title, a mock panel drawn by fn, caption
function step(lt, pill, title, capSegs, fn) {
  meshStage(lt);
  chip(540 - 170, 150, 340, 56, "rgba(249,96,63,0.10)", pill, C.coral, 26, UI7);
  ctx.globalAlpha = clamp(seg(lt, 0.04, 0.3) * 2); titleZone(title, lt); ctx.globalAlpha = 1;
  fn(lt);
  caption(capSegs, seg(lt, 1.0, 0.4));
}

const m1 = (lt) => step(lt, "Meta · Step 1 of 6", "OPEN SYSTEM USERS", [{ t: "Business Settings → " }, { t: "System Users", c: C.amber }], (lt) => {
  const x = 96, y = 520, w = 888, h = 760, p = easeOutCubic(seg(lt, 0.1, 0.4));
  ctx.save(); ctx.globalAlpha = p; shadowCard(x, y, w, h, 28);
  urlBar(x + 40, y + 36, w - 80, "business.facebook.com/settings/system-users", seg(lt, 0.2, 0.3));
  const rows = ["People", "System Users", "Partners", "Accounts"]; const hi = seg(lt, 0.55, 0.4);
  for (let i = 0; i < rows.length; i++) { const ry = y + 150 + i * 110; const on = i === 1 && hi > 0.2; if (on) { ctx.fillStyle = "rgba(249,96,63,0.10)"; rr(x + 40, ry - 6, w - 80, 92, 16); ctx.fill(); } text(rows[i], x + 70, ry + 50, `34px ${on ? UI7 : UI6}`, on ? C.coral : C.ink, "left"); }
  ctx.restore();
  const cl = seg(lt, 0.6, 0.5); if (cl > 0) cursor(x + 360, y + 150 + 1 * 110 + 44, cl < 0.5 ? cl * 2 : null);
});

const m2 = (lt) => step(lt, "Meta · Step 2 of 6", "ADD A SYSTEM USER", [{ t: "Add → name it → " }, { t: "Admin", c: C.amber }], (lt) => {
  const x = 200, y = 620, w = 680, h = 540, p = easeOutBack(clamp(seg(lt, 0.1, 0.45)));
  ctx.save(); ctx.globalAlpha = clamp(seg(lt, 0.1, 0.3) * 2); ctx.translate(540, y + h / 2); ctx.scale(p, p); ctx.translate(-540, -(y + h / 2)); shadowCard(x, y, w, h, 28);
  text("New system user", x + 40, y + 70, `30px ${UI7}`, C.ink, "left");
  ctx.fillStyle = C.bgrey; rr(x + 40, y + 110, w - 80, 76, 14); ctx.fill(); text("AdPilot Sync", x + 64, y + 156, `28px ${UI6}`, C.ink, "left");
  ctx.fillStyle = C.bgrey; rr(x + 40, y + 210, w - 80, 76, 14); ctx.fill(); text("Role:  Admin", x + 64, y + 256, `28px ${UI6}`, C.ink, "left"); caret(x + w - 70, y + 248, C.mutedL);
  shadow("rgba(249,96,63,0.4)", 18, 0, 7); ctx.fillStyle = gradH(x + 40, y + 330, w - 80, 86); rr(x + 40, y + 330, w - 80, 86, 43); ctx.fill(); noShadow(); text("Add", x + w / 2, y + 376, `34px ${UI8}`, C.white, "center", "middle");
  ctx.restore();
  const cl = seg(lt, 0.6, 0.5); if (cl > 0) cursor(540, y + 373, cl < 0.5 ? cl * 2 : null);
});

const m3 = (lt) => step(lt, "Meta · Step 3 of 6", "ASSIGN YOUR AD ACCOUNT", [{ t: "Add your ad account → " }, { t: "full control", c: C.amber }], (lt) => {
  const x = 96, y = 560, w = 888, h = 680; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  text("Assign assets · Ad accounts", x + 40, y + 66, `28px ${UI7}`, C.ink, "left");
  const tick = seg(lt, 0.45, 0.35); ctx.fillStyle = "rgba(255,178,36,0.12)"; rr(x + 40, y + 100, w - 80, 100, 16); ctx.fill();
  text("Bean & Bloom · act_••1234", x + 70, y + 156, `30px ${UI6}`, C.ink, "left");
  if (tick > 0.3) { ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.lineCap = "round"; const ix = x + w - 110, iy = y + 150; ctx.beginPath(); ctx.moveTo(ix - 14, iy); ctx.lineTo(ix - 4, iy + 12); ctx.lineTo(ix + 16, iy - 14); ctx.stroke(); }
  // full control toggle
  const on = seg(lt, 0.6, 0.3); text("Manage (full control)", x + 70, y + 300, `28px ${UI6}`, C.ink, "left");
  const tx = x + w - 170, ty = y + 270; ctx.fillStyle = on > 0.4 ? C.coral : "#cfc8d0"; rr(tx, ty, 96, 52, 26); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(tx + (on > 0.4 ? 70 : 26), ty + 26, 20, 0, Math.PI * 2); ctx.fill();
  text("Read-only — AdPilot never edits your ads.", x + 40, y + 430, `24px ${UI5}`, C.mutedL, "left"); ctx.restore();
  const cl = seg(lt, 0.62, 0.5); if (cl > 0) cursor(x + w - 122, y + 296, cl < 0.5 ? cl * 2 : null);
});

const m4 = (lt) => step(lt, "Meta · Step 4 of 6", "TICK READ-ONLY SCOPES", [{ t: "ads_read + read_insights " }, { t: "only", c: C.amber }], (lt) => {
  const x = 96, y = 540, w = 888, h = 720; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  text("Generate token · App: My App", x + 40, y + 64, `28px ${UI7}`, C.ink, "left");
  const scopes = [["ads_read", true], ["read_insights", true], ["ads_management", false], ["business_management", false]];
  for (let i = 0; i < scopes.length; i++) { const ry = y + 120 + i * 116; const [name, on] = scopes[i]; const tp = on ? seg(lt, 0.4 + i * 0.12, 0.3) : 0;
    ctx.fillStyle = on ? "rgba(255,178,36,0.12)" : C.bgrey; rr(x + 40, ry, w - 80, 96, 16); ctx.fill();
    // checkbox
    ctx.lineWidth = 3; ctx.strokeStyle = on ? C.amber : "#c9c2cc"; rr(x + 70, ry + 28, 40, 40, 10); ctx.stroke();
    if (tp > 0.3) { ctx.fillStyle = C.amber; rr(x + 70, ry + 28, 40, 40, 10); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + 80, ry + 48); ctx.lineTo(x + 88, ry + 56); ctx.lineTo(x + 102, ry + 38); ctx.stroke(); }
    text(name, x + 132, ry + 60, `30px ${on ? UI7 : UI5}`, on ? C.ink : C.mutedL, "left");
    if (on) chip(x + w - 200, ry + 26, 150, 44, "rgba(22,163,74,0.12)", "read-only", C.green, 22, UI6);
    else lock(x + w - 90, ry + 56, "#c9c2cc");
  }
  ctx.restore();
});

const m5 = (lt) => step(lt, "Meta · Step 5 of 6", "SET EXPIRY TO: NEVER", [{ t: "Token expiration → " }, { t: "Never", c: C.amber }], (lt) => {
  const x = 160, y = 600, w = 760, h = 560; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  text("Token expiration", x + 40, y + 70, `30px ${UI7}`, C.ink, "left");
  const opts = ["60 days", "90 days", "Never"]; const sel = seg(lt, 0.45, 0.3);
  for (let i = 0; i < opts.length; i++) { const ry = y + 110 + i * 96; const on = i === 2 && sel > 0.3; if (on) { ctx.fillStyle = "rgba(255,178,36,0.14)"; rr(x + 40, ry, w - 80, 80, 14); ctx.fill(); } text(opts[i], x + 70, ry + 52, `32px ${on ? UI8 : UI6}`, on ? C.amber : C.ink, "left"); if (on) chip(x + w - 200, ry + 18, 150, 46, "rgba(255,178,36,0.18)", "selected", C.amber, 22, UI7); }
  // generated token chip
  if (seg(lt, 0.7, 0.2) > 0) { ctx.fillStyle = C.bgrey; rr(x + 40, y + 410, w - 80, 80, 16); ctx.fill(); text("EAAB••••••••••••", x + 64, y + 458, `28px ${UI6}`, C.ink, "left"); chip(x + w - 170, y + 426, 120, 48, C.coral, "Copy", C.white, 24, UI7); }
  ctx.restore();
  const cl = seg(lt, 0.48, 0.5); if (cl > 0) cursor(x + 200, y + 110 + 2 * 96 + 40, cl < 0.5 ? cl * 2 : null);
});

const m6 = (lt) => step(lt, "Meta · Step 6 of 6", "PASTE INTO ADPILOT", [{ t: "Paste · leave ID blank · " }, { t: "Connect", c: C.amber }], (lt) => {
  connectCard(lt, "Meta (Facebook / Instagram)", seg(lt, 0.3, 0.2) > 0 ? "EAAB••••••••••••" : "", "", seg(lt, 0.7, 0.2) > 0);
});

const tt1 = (lt) => step(lt, "TikTok · Step 1 of 4", "OPEN THE DEV PORTAL", [{ t: "TikTok for Business → " }, { t: "My Apps", c: C.amber }], (lt) => {
  const x = 96, y = 560, w = 888, h = 640; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  urlBar(x + 40, y + 36, w - 80, "business-api.tiktok.com", seg(lt, 0.2, 0.3));
  const rows = ["My Apps", "Marketing API", "Reports"]; const hi = seg(lt, 0.5, 0.4);
  for (let i = 0; i < rows.length; i++) { const ry = y + 150 + i * 120; const on = i === 0 && hi > 0.2; if (on) { ctx.fillStyle = "rgba(249,96,63,0.10)"; rr(x + 40, ry - 6, w - 80, 96, 16); ctx.fill(); } text(rows[i], x + 70, ry + 52, `34px ${on ? UI7 : UI6}`, on ? C.coral : C.ink, "left"); }
  ctx.restore(); const cl = seg(lt, 0.55, 0.5); if (cl > 0) cursor(x + 300, y + 194, cl < 0.5 ? cl * 2 : null);
});

const tt2 = (lt) => step(lt, "TikTok · Step 2 of 4", "ENABLE MARKETING API", [{ t: "Permission: " }, { t: "ads.read", c: C.amber }, { t: " (read-only)" }], (lt) => {
  const x = 96, y = 560, w = 888, h = 620; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  text("App permissions", x + 40, y + 64, `28px ${UI7}`, C.ink, "left");
  const tp = seg(lt, 0.4, 0.3); ctx.fillStyle = "rgba(255,178,36,0.12)"; rr(x + 40, y + 110, w - 80, 100, 16); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = C.amber; rr(x + 70, y + 140, 40, 40, 10); ctx.stroke(); if (tp > 0.3) { ctx.fillStyle = C.amber; rr(x + 70, y + 140, 40, 40, 10); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x + 80, y + 160); ctx.lineTo(x + 88, y + 168); ctx.lineTo(x + 102, y + 150); ctx.stroke(); }
  text("ads.read", x + 132, y + 172, `30px ${UI7}`, C.ink, "left"); chip(x + w - 200, y + 136, 150, 44, "rgba(22,163,74,0.12)", "read-only", C.green, 22, UI6);
  const ap = seg(lt, 0.6, 0.3); if (ap > 0) { shadow("rgba(249,96,63,0.4)", 18, 0, 7); ctx.fillStyle = gradH(x + 40, y + 260, w - 80, 86); rr(x + 40, y + 260, w - 80, 86, 43); ctx.fill(); noShadow(); text("Submit for approval", x + w / 2, y + 306, `32px ${UI8}`, C.white, "center", "middle"); }
  if (seg(lt, 0.8, 0.2) > 0) chip(x + 40, y + 390, 260, 56, "rgba(22,163,74,0.12)", "✓ Approved", C.green, 26, UI7);
  ctx.restore();
});

const tt3 = (lt) => step(lt, "TikTok · Step 3 of 4", "GET A LONG-LIVED TOKEN", [{ t: "Authorise → " }, { t: "generate token", c: C.amber }], (lt) => {
  const x = 160, y = 600, w = 760, h = 540; ctx.save(); ctx.globalAlpha = easeOutCubic(seg(lt, 0.1, 0.4)); shadowCard(x, y, w, h, 28);
  text("Authorise advertiser", x + 40, y + 66, `28px ${UI7}`, C.ink, "left");
  const tp = seg(lt, 0.4, 0.3); ctx.fillStyle = "rgba(255,178,36,0.12)"; rr(x + 40, y + 100, w - 80, 96, 16); ctx.fill(); text("Advertiser · ••5678", x + 70, y + 156, `30px ${UI6}`, C.ink, "left");
  if (tp > 0.3) { ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.lineCap = "round"; const ix = x + w - 100, iy = y + 148; ctx.beginPath(); ctx.moveTo(ix - 14, iy); ctx.lineTo(ix - 4, iy + 12); ctx.lineTo(ix + 16, iy - 14); ctx.stroke(); }
  if (seg(lt, 0.6, 0.2) > 0) { ctx.fillStyle = C.bgrey; rr(x + 40, y + 250, w - 80, 80, 16); ctx.fill(); text("act.••••••••", x + 64, y + 298, `28px ${UI6}`, C.ink, "left"); chip(x + w - 170, y + 266, 120, 48, C.coral, "Copy", C.white, 24, UI7); text("advertiser_id: 5678", x + 64, y + 396, `26px ${UI5}`, C.mutedL, "left"); }
  ctx.restore();
});

const tt4 = (lt) => step(lt, "TikTok · Step 4 of 4", "PASTE INTO ADPILOT", [{ t: "Token + advertiser id → " }, { t: "Connect", c: C.amber }], (lt) => {
  connectCard(lt, "TikTok Ads", seg(lt, 0.3, 0.2) > 0 ? "act.••••••••" : "", seg(lt, 0.45, 0.2) > 0 ? "5678" : "", seg(lt, 0.7, 0.2) > 0);
});

function outro(lt) {
  meshStage(lt);
  ctx.globalAlpha = clamp(seg(lt, 0.05, 0.3) * 2); text("NOW IT SYNCS", 540, 360, `64px ${DISP}`, C.ink, "center"); text("ON YOUR SCHEDULE.", 540, 432, `64px ${DISP}`, C.coral, "center"); ctx.globalAlpha = 1;
  const x = 96, y = 560, w = 888, h = 620, p = easeOutCubic(seg(lt, 0.1, 0.4));
  ctx.save(); ctx.globalAlpha = p; shadowCard(x, y, w, h, 28);
  // data pipe: meta + tiktok -> adpilot
  const flow = (lt * 1.4) % 1;
  ctx.fillStyle = "#1877f2"; ctx.beginPath(); ctx.arc(x + 84, y + 100, 14, 0, Math.PI * 2); ctx.fill(); text("Meta", x + 112, y + 110, `30px ${UI7}`, C.ink, "left");
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x + 84, y + 190, 14, 0, Math.PI * 2); ctx.fill(); text("TikTok", x + 112, y + 200, `30px ${UI7}`, C.ink, "left");
  ctx.strokeStyle = C.border; ctx.lineWidth = 4; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(x + 300, y + 100); ctx.lineTo(x + 560, y + 155); ctx.moveTo(x + 320, y + 190); ctx.lineTo(x + 560, y + 160); ctx.stroke(); ctx.setLineDash([]);
  const dotx = lerp(x + 300, x + 560, flow); ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(dotx, lerp(y + 100, y + 158, flow), 8, 0, Math.PI * 2); ctx.fill();
  shadow("rgba(249,96,63,0.3)", 20, 0, 6); ctx.fillStyle = gradH(x + 560, y + 110, 120, 120); rr(x + 560, y + 100, 120, 120, 26); ctx.fill(); noShadow(); text("AdPilot", x + 620, y + 250, `24px ${UI7}`, C.ink, "center");
  // health dial sweeping up
  const fr = 0.84 * easeOutCubic(seg(lt, 0.4, 0.5)); const cx2 = x + w - 180, cy2 = y + 400, R = 110;
  ctx.lineWidth = 22; ctx.lineCap = "round"; ctx.strokeStyle = C.track; ctx.beginPath(); ctx.arc(cx2, cy2, R, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = C.green; ctx.beginPath(); ctx.arc(cx2, cy2, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fr); ctx.stroke();
  text(String(Math.round(fr * 100)), cx2, cy2 + 18, `66px ${DISP}`, C.green, "center");
  chip(x + 70, y + 360, 320, 64, "rgba(249,96,63,0.10)", "Auto-sync · Daily", C.coral, 26, UI7);
  ctx.restore();
  ctx.globalAlpha = clamp(seg(lt, 0.7, 0.3) * 2); shadow("rgba(0,0,0,0.2)", 20, 0, 8); ctx.fillStyle = gradH(290, 1380, 500, 110); rr(290, 1380, 500, 110, 55); ctx.fill(); noShadow(); text("Run your free audit", 540, 1437, `40px ${UI8}`, C.white, "center", "middle");
  ctx.globalAlpha = clamp(seg(lt, 0.85, 0.3) * 2); text("Read-only · free to start · you approve every fix", 540, 1560, `26px ${UI6}`, C.mutedL, "center"); ctx.globalAlpha = 1;
}

const SCENES = [[intro, 4.5], [m1, 4.6], [m2, 4.4], [m3, 4.8], [m4, 5.0], [m5, 5.2], [m6, 4.8], [tt1, 4.4], [tt2, 4.8], [tt3, 4.6], [tt4, 4.8], [outro, 5.5]];
const TOTAL = SCENES.reduce((a, s) => a + s[1], 0);
function renderAt(gt) {
  ctx.clearRect(0, 0, W, H); let acc = 0;
  for (let i = 0; i < SCENES.length; i++) { const [fn, d] = SCENES[i]; if (gt < acc + d || i === SCENES.length - 1) { fn(gt - acc); break; } acc += d; }
  ctx.fillStyle = "rgba(140,140,150,0.16)"; ctx.fillRect(0, H - 8, W, 8); ctx.fillStyle = gradH(0, H - 8, W * clamp(gt / TOTAL), 8); ctx.fillRect(0, H - 8, W * clamp(gt / TOTAL), 8);
}

const mode = process.argv[2] || "preview";
if (mode === "preview") { const dir = path.join(__dirname, "preview-tut"); fs.mkdirSync(dir, { recursive: true }); let acc = 0, i = 1; for (const [, d] of SCENES) { renderAt(acc + d * 0.62); fs.writeFileSync(path.join(dir, `s${i}.png`), canvas.toBuffer("image/png")); acc += d; i++; } console.log(`preview-tut: ${i - 1} scenes (${TOTAL}s)`); }
else if (mode === "frame") { renderAt(parseFloat(process.argv[3] || "0")); fs.writeFileSync(path.join(__dirname, "frame-tut.png"), canvas.toBuffer("image/png")); console.log("frame-tut @", process.argv[3]); }
else if (mode === "all") { const dir = path.join(__dirname, "frames-tut"); fs.mkdirSync(dir, { recursive: true }); const n = Math.round(TOTAL * FPS); for (let f = 0; f < n; f++) { renderAt(f / FPS); fs.writeFileSync(path.join(dir, `f${String(f + 1).padStart(5, "0")}.png`), canvas.toBuffer("image/png")); if (f % 90 === 0) process.stdout.write(`\r  ${f}/${n}`); } console.log(`\nrendered ${n} frames (${TOTAL}s)`); }
