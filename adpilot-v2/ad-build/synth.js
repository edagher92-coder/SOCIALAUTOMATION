// AdPilot V3 ad — original royalty-free background music bed (procedural).
// ~120 BPM warm electronic. Maps energy to the cut: build on the hook, drop on
// the score, calm valley on the read-only beat, re-energize for the Maya flip,
// climax at the tiers, resolve on the end card. Outputs out/music.wav.
const fs = require("fs");
const path = require("path");

const SR = 44100, DUR = 60.6, N = Math.floor(SR * DUR);
const BPM = 120, SPB = 60 / BPM;            // 0.5s / beat
const TAU = Math.PI * 2;
const m2f = m => 440 * Math.pow(2, (m - 69) / 12);

// Am – F – C – G, 2s (4 beats) each
const CHORDS = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]];
const CHORD_LEN = 2.0;
const chordAt = t => CHORDS[Math.floor(t / CHORD_LEN) % CHORDS.length];

// deterministic noise
let _s = 12345; const noise = () => { _s = (_s * 1664525 + 1013904223) & 0xffffffff; return (_s / 0x80000000) - 1; };
const tri = x => 2 * Math.abs(2 * (x / TAU - Math.floor(x / TAU + 0.5))) - 1;
const clampf = v => v < -1 ? -1 : v > 1 ? 1 : v;

// section energy by time (matches the 11-scene board)
function sect(t) {
  if (t < 10) {                                                                                              // INTRO — catchy explainer groove
    if (t < 2) return { pad: 0.4 + 0.28 * (t / 2), bass: 0.2, kick: 0, hat: 0, arp: 0.25 * (t / 2), riser: 0 }; // title card
    const b = Math.min(1, (t - 2) / 1.4); return { pad: 0.7, bass: 0.7 * b, kick: 0.7 * b, hat: 0.5 * b, arp: 0.7 * b, riser: 0 };
  }
  const u = t - 10;                                                                                          // ad timeline (shifted by the 10s intro)
  if (u < 4.5) return { pad: 0.55 + 0.35 * (u / 4.5), bass: 0.5, kick: 0, hat: 0, arp: 0, riser: 0 };        // hook build
  if (u < 18) return { pad: 0.8, bass: 1, kick: 1, hat: 0.7, arp: 0.85, riser: 0 };                          // energy (Café→verdicts→approve)
  if (u < 23) { const k = u < 22.3 ? 0 : (u - 22.3) / 0.7; return { pad: 0.65 * (1 - 0.4 * k), bass: 0.25, kick: 0, hat: 0, arp: 0, riser: k }; } // read-only calm + riser
  if (u < 42) return { pad: 0.85, bass: 1, kick: 1, hat: 0.85, arp: 1, riser: 0 };                           // peak (Maya→money→specialists→tiers)
  if (u < 45) return { pad: 0.82, bass: 0.85, kick: 1, hat: 0.6, arp: 0.7, riser: 0 };                       // receipts
  return { pad: 0.8, bass: 0.6, kick: 0.45, hat: 0.25, arp: 0.35, riser: 0 };                                // end card
}

const buf = Buffer.alloc(44 + N * 2 * 2);
// WAV header
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8);
buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);

for (let i = 0; i < N; i++) {
  const t = i / SR, s = sect(t), ch = chordAt(t);
  const beatPos = t / SPB, beatInBar = Math.floor(beatPos) % 4;
  const tBeat = (beatPos - Math.floor(beatPos)) * SPB;          // time since last beat

  // PAD — upper chord tones (slight detune L/R for width)
  let padL = 0, padR = 0;
  for (let k = 1; k < ch.length; k++) { const f = m2f(ch[k]); padL += Math.sin(TAU * f * 0.999 * t); padR += Math.sin(TAU * f * 1.001 * t); }
  const padTrem = 0.92 + 0.08 * Math.sin(TAU * 0.5 * t);
  padL *= 0.05 * s.pad * padTrem; padR *= 0.05 * s.pad * padTrem;

  // BASS — root −1 octave on beats 1 & 3
  let bass = 0;
  if (beatInBar === 0 || beatInBar === 2) { const f = m2f(ch[0] - 12); bass = (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * Math.exp(-tBeat * 3.2) * 0.14 * s.bass; }

  // KICK — every beat, punchy pitch-drop
  const kf = 45 + 55 * Math.exp(-tBeat * 24);
  const kick = Math.sin(TAU * kf * tBeat) * Math.exp(-tBeat * 26) * 0.5 * s.kick;

  // HAT — offbeats
  const ob = ((beatPos - 0.5) % 1 + 1) % 1 * SPB;
  const hat = noise() * Math.exp(-ob * 70) * 0.10 * s.hat;

  // ARP — 8th-note pluck, upper chord tones +1 octave
  const ei = Math.floor(t / (SPB / 2)); const an = ch[1 + (ei % (ch.length - 1))] + 12;
  const tArp = t - ei * (SPB / 2);
  const arp = tri(TAU * m2f(an) * t) * Math.exp(-tArp * 10) * 0.06 * s.arp;

  // RISER — into the Maya flip
  const riser = s.riser > 0 ? (0.18 * s.riser * (0.5 * noise() + Math.sin(TAU * (200 + 1400 * s.riser) * t))) : 0;

  // IMPACTS — at the Maya flip (23.0s) and the end card (45.0s)
  let imp = 0;
  for (const it of [33.0, 55.0]) { if (t >= it && t < it + 0.6) { const td = t - it; imp += (Math.sin(TAU * 60 * td) * Math.exp(-td * 8) * 0.5 + noise() * Math.exp(-td * 14) * 0.25); } }

  // fades
  let env = 1;
  if (t < 0.4) env = t / 0.4;
  if (t > DUR - 1.4) env = Math.max(0, (DUR - t) / 1.4);

  let L = (padL + bass + kick + hat + arp + riser + imp) * env;
  let R = (padR + bass + kick + hat * 0.8 + arp * 0.9 + riser + imp) * env;
  L = Math.tanh(L * 1.1) * 0.82; R = Math.tanh(R * 1.1) * 0.82;   // soft limit
  const o = 44 + i * 4;
  buf.writeInt16LE((clampf(L) * 32767) | 0, o);
  buf.writeInt16LE((clampf(R) * 32767) | 0, o + 2);
}

const out = path.join(__dirname, "out"); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "music.wav"), buf);
console.log(`music.wav written: ${DUR}s @ ${SR}Hz stereo (${(buf.length / 1e6).toFixed(1)} MB)`);
