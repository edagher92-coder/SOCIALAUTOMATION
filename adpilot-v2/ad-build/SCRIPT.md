# AdPilot OS — Launch Ad (9:16, ~41s)

Reproducible vertical video ad for paid social (TikTok / Reels / Shorts).
All claims are drawn from the real product (read-only audits, 0–100 Health Score,
5 verdicts, 12 AI specialists, Meta & TikTok auto-sync, from $97).

## Build
```bash
cd ad-build
npm install                 # @napi-rs/canvas + ffmpeg-static
./fetch-fonts.sh            # OFL display fonts (Anton, Montserrat) -> fonts/
node render.js preview      # one frame per scene -> preview/
node render.js all          # all 1230 frames -> frames/
node_modules/ffmpeg-static/ffmpeg -y -framerate 30 -i frames/f%05d.png \
  -vf "fade=t=in:st=0:d=0.25,fade=t=out:st=40.75:d=0.25,format=yuv420p" \
  -c:v libx264 -profile:v high -preset medium -crf 19 -movflags +faststart \
  out/adpilot_ad_9x16.mp4
```
Output: `out/adpilot_ad_9x16.mp4` — 1080×1920, H.264, 30fps.

## Big idea
"The audit that snitches on your ads." Lead with the viewer's fear (money draining
into campaigns they can't read), then resolve it by watching the app work:
score lands → verdicts sort the chaos → one safe tap fixes it. The hero feature
is **trust** — read-only, proposals only, never touches a live ad.

## Storyboard (baked on-screen captions are mute-first)
| # | Time | Scene | Caption |
|---|------|-------|---------|
| 1 | 0.0–2.0 | Hook — burning ad-spend chart | "Your ads are spending your money… and you don't know why." |
| 2 | 2.0–5.0 | Command Center loads | "So I let THIS read them." |
| 3 | 5.0–11.0 | Health Score gauge → 61/100 | "It scores your account 0–100. Mine? At risk." |
| 4 | 11.0–16.5 | 5 verdict pills | "Then it tells you exactly what to do." |
| 5 | 16.5–23.0 | Proposal → tap Approve | "Tap APPROVE. That's it. Done." |
| 6 | 23.0–28.5 | Read-only safety lock | "READ-ONLY. It never touches your live ads." |
| 7 | 28.5–33.5 | 12 AI specialists grid | "12 AI specialists — reading YOUR real numbers." |
| 8 | 33.5–37.5 | Price card | "From $97 — pays for itself the first leak it catches." |
| 9 | 37.5–41.0 | Logo + CTA | "Run your free audit." |

## Optional voiceover (sound-on)
1. "Your ads are spending money right now — and you have no idea why."
2. "So I let AdPilot read every campaign for me."
3. "It gives your whole account a health score, zero to a hundred. Mine landed in the orange — at risk."
4. "Then it ranks exactly what to fix first — kill this, reduce that, scale the winner."
5. "Each one's a proposal — you just approve the safe fixes. Done."
6. "It's read-only. It proposes fixes — it never touches your live ads. Your data stays private."
7. "Plus twelve AI specialists — Meta, TikTok, tracking, creative — all reading your actual data."
8. "It starts at ninety-seven dollars — and pays for itself the first time it catches a budget leak."
9. "Know exactly what your ads are doing to your money. Run your free audit today."

## Music direction
Modern, confident "creator hustle" beat ~120–124 BPM. Tension riser under 1–2;
first drop on the SCORE landing (~6s) so the needle hits on the bass; percussive
hits on each verdict pill and the Approve tap; filter-sweep down on the read-only
scene so trust lands clean; re-energize for team + price; single resolved impact
on the end-card logo. (Video ships muted + captioned — drop a licensed track in
your editor over the cut.)

## Post copy (caption next to the upload)
**A — Fear/curiosity:** Your Meta & TikTok ads are spending money right now — do you actually know why? AdPilot OS audits your account, scores it 0–100, and tells you exactly what to kill, cut, and scale. Read-only — it never touches your live ads. Run your free audit. `#smallbusinesstips #metaads #tiktokads #adspend #marketingtips #contentcreator`

**B — Creator/relatable:** POV: you've been boosting posts for months with NO idea what's working. This reads every campaign for you, ranks your fixes, and you just tap approve. From $97 — pays for itself the first budget leak it catches. 🚀 `#creatortips #digitalmarketing #facebookads #tiktokmarketing #smallbiz #socialmediamarketing`

**C — Agency/authority:** We audit Meta & TikTok ad accounts in seconds: explainable 0–100 health score, prioritized fixes, 12 AI specialists grounded in your real numbers — and white-label reports you brand as your own. Read-only, proposals only. From $97. `#agencylife #marketingagency #ppc #mediabuying #facebookadsexpert #whitelabel`
