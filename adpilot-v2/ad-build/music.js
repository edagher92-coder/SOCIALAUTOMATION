// Procedural music bed for the AdPilot ad — a warm, modern, build-up groove (no samples, no
// licences). Writes a 16-bit stereo WAV. Arrangement matches the cut: sparse intro → groove on
// the score reveal → lift into the CTA. Usage: node music.js out.wav 53.8
const fs = require("fs");
const OUT = process.argv[2] || "out/music.wav";
const DUR = parseFloat(process.argv[3] || "53.8");
const SR = 44100, BPM = 122, beat = 60 / BPM;
const N = Math.ceil(DUR * SR) + SR;
const L = new Float32Array(N), R = new Float32Array(N);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// equal-power pan
function pan(p) { const a = (p + 1) / 2 * (Math.PI / 2); return [Math.cos(a), Math.sin(a)]; }
function tone(t0, freq, dur, gain, p, type, env) {
  const [lg, rg] = pan(p); const start = Math.floor(t0 * SR); const tail = (env.pluck ? env.d * 5 : (env.r || 0.06));
  const len = Math.floor((dur + tail) * SR);
  for (let i = 0; i < len; i++) { const idx = start + i; if (idx < 0 || idx >= N) continue; const tt = i / SR;
    let e;
    if (env.pluck) e = Math.exp(-tt / env.d) * (tt < env.a ? tt / env.a : 1);
    else if (tt < env.a) e = tt / env.a;
    else if (tt < env.a + env.d) e = 1 - (1 - env.s) * ((tt - env.a) / env.d);
    else if (tt < dur) e = env.s;
    else e = env.s * Math.max(0, 1 - (tt - dur) / (env.r || 0.06));
    const ph = 2 * Math.PI * freq * tt; let o;
    if (type === "sine") o = Math.sin(ph);
    else if (type === "tri") o = (2 / Math.PI) * Math.asin(Math.sin(ph));
    else if (type === "saw") o = 2 * ((freq * tt) % 1) - 1;
    else o = Math.sin(ph);
    const s = o * e * gain; L[idx] += s * lg; R[idx] += s * rg;
  }
}
function kick(t0, gain) { const start = Math.floor(t0 * SR), len = Math.floor(0.26 * SR);
  for (let i = 0; i < len; i++) { const idx = start + i; if (idx >= N) break; const tt = i / SR;
    const f = 48 + (140 - 48) * Math.exp(-tt / 0.03); const e = Math.exp(-tt / 0.13);
    const s = Math.sin(2 * Math.PI * f * tt) * e * gain; L[idx] += s; R[idx] += s; } }
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
function hat(t0, gain, p) { const [lg, rg] = pan(p); const start = Math.floor(t0 * SR), len = Math.floor(0.06 * SR);
  for (let i = 0; i < len; i++) { const idx = start + i; if (idx >= N) break; const tt = i / SR; const e = Math.exp(-tt / 0.018);
    const s = rnd() * e * gain; L[idx] += s * lg; R[idx] += s * rg; } }

// C major "pop" progression, one bar each: C  G  Am  F
const CH = [
  { bass: 36, triad: [60, 64, 67] }, // C
  { bass: 43, triad: [67, 71, 74] }, // G
  { bass: 45, triad: [69, 72, 76] }, // Am
  { bass: 41, triad: [65, 69, 72] }, // F
];
const ARP = [0, 1, 2, 1]; // triad index pattern per 8th note (root, 3rd, 5th, 3rd)

// section gains over time (build energy)
const ramp = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const gKick = (t) => 0.9 * ramp(t, 6, 10) * (t > 46 ? 1.05 : 1);
const gHat = (t) => 0.16 * ramp(t, 15, 18);
const gLead = (t) => 0.10 + 0.10 * ramp(t, 9, 14);
const gPad = (t) => 0.06 + 0.03 * ramp(t, 9, 14);
const gBass = (t) => 0.16 * ramp(t, 2, 7);

const totalBeats = Math.ceil(DUR / beat);
for (let b = 0; b < totalBeats; b++) {
  const t = b * beat; const bar = Math.floor(b / 4) % CH.length; const ch = CH[bar];
  // drums
  kick(t, gKick(t));
  if (b % 4 === 2) kick(t, gKick(t) * 0.7); // light backbeat kick
  hat(t + beat / 2, gHat(t), 0.3);
  hat(t + beat / 4, gHat(t) * 0.5, 0.3); hat(t + 3 * beat / 4, gHat(t) * 0.6, 0.3);
  // bass (root, octave bounce)
  tone(t, midi(ch.bass), beat * 0.9, gBass(t), 0, "tri", { a: 0.006, d: 0.05, s: 0.8, r: 0.06 });
  tone(t + beat / 2, midi(ch.bass + 12), beat * 0.4, gBass(t) * 0.5, 0, "tri", { a: 0.006, d: 0.05, s: 0.6, r: 0.05 });
  // pad (sustained triad across the bar, only at bar start)
  if (b % 4 === 0) for (const n of ch.triad) tone(t, midi(n), beat * 4, gPad(t), 0, "sine", { a: 0.4, d: 0.3, s: 0.85, r: 0.4 });
  // lead arpeggio — the hook (two 8th notes per beat)
  for (let e = 0; e < 2; e++) { const et = t + e * (beat / 2); const step = (b * 2 + e); const idx = ARP[step % ARP.length];
    const note = ch.triad[idx] + 12; const p = (step % 2 === 0 ? -0.35 : 0.35);
    tone(et, midi(note), beat / 2, gLead(et), p, "tri", { pluck: true, a: 0.004, d: 0.16 }); }
}

// master: gentle soft-clip + global fade in/out
function softclip(x) { return Math.tanh(x * 1.1); }
const fade = (i) => { const t = i / SR; const fi = Math.min(1, t / 1.0); const fo = Math.min(1, (DUR - t) / 1.8); return Math.max(0, Math.min(fi, fo)); };
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const f = fade(i) * 0.82; const l = Math.max(-1, Math.min(1, softclip(L[i]) * f)); const r = Math.max(-1, Math.min(1, softclip(R[i]) * f));
  buf.writeInt16LE((l * 32767) | 0, 44 + i * 4); buf.writeInt16LE((r * 32767) | 0, 44 + i * 4 + 2); }
fs.writeFileSync(OUT, buf); console.log(`wrote ${OUT} (${DUR}s, ${BPM} BPM)`);
