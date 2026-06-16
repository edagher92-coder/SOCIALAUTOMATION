# v6 Audit — 03 · AI Cost-Efficiency (Claude/Anthropic spend)

**Scope:** every Claude API call path in `adpilot-v2/`. Read-only analysis.
**Author:** AI cost-efficiency lead. **Date:** 2026-06-16.
**Pricing used (per 1M tok, from claude-api skill, cached 2026-06-04):** Opus 4.8 `$5 / $25` · Sonnet 4.6 `$3 / $15` · Haiku 4.5 `$1 / $5`. Cache **read ≈ 0.1×** input; cache **write ≈ 1.25×** (5-min TTL). Min cacheable prefix: **Opus/Haiku 4096 tok, Sonnet 2048 tok** — prefixes shorter than this silently do NOT cache.

---

## 1. Current state (the call inventory)

| Path | Fn | Model | maxTok | Static repeated content | Where it sits |
|---|---|---|---|---|---|
| `app/api/agents/run/route.ts` | `callClaude` | sonnet-4-6 | 1200 | GUARDRAILS+persona (`system`); knowledge docs + context-pack (`user`) | **user** = volatile (knowledge is static but glued to volatile grounding) |
| `app/api/policy/check/route.ts` | `callClaude` | sonnet-4-6 | 1200 | GUARDRAILS+persona; `policy` knowledge doc (in `user`) | system + user |
| `app/api/content/draft/route.ts` | `callClaude` | sonnet-4-6 | 1100 | Stella persona+GUARDRAILS | system |
| `app/api/ai/generate/route.ts` (canva/bobby/aria) | `callClaude` | sonnet-4-6 | 1100 | tiny 1-line system | system (small) |
| `lib/messenger/bot.ts` | `callClaude` | **haiku-4-5** | 320 | dynamic facts/voice block | system |
| `app/api/cron/refresh-knowledge/route.ts` | `researchWithWebSearch` | **opus-4-8** | 2000, maxUses 5 | — | web-search, 4 domains/run, weekly `0 8 * * 1` |

**No `cache_control` anywhere in the tree.** The GUARDRAILS block (~450 tok) is byte-identical across all 12 personas and every agents/content/policy call; the knowledge docs (~600–900 tok each) are static per-domain and re-sent every call. All of it pays full input price today.

---

## 2. Prioritised punch-list

### P1 — Prompt caching on the static knowledge + system prefix · **NEEDS-REVIEW**
The `callClaude` client sends `system` as a bare string and the knowledge docs inside the **user** message glued in front of volatile grounding. To cache, two changes are needed:
(a) change `system` to a content-block array and add `cache_control:{type:"ephemeral"}`;
(b) **move the static knowledge/policy docs from the `user` message into a cached `system` block** (they currently can't cache because they precede per-request grounding).
- Caveat: GUARDRAILS+persona alone (~450–600 tok) is **below Sonnet's 2048-tok min** — a system-only breakpoint won't cache. The win only materialises once the **knowledge docs join the cached prefix** (GUARDRAILS+persona+knowledge ≈ 1.2–1.7k tok for agents/policy → still near/under the Sonnet floor; combine all of system+knowledge to clear 2048). **This is the single biggest lever but needs a small refactor of `claude.ts` + the route assembly, hence NEEDS-REVIEW.**
- **Est. saving:** on agents/policy calls the cacheable prefix is ~50–65% of input tokens; at ~0.1× read cost that's a **~45–58% input-token reduction on repeat calls within the 5-min TTL** (e.g. a user iterating with one specialist, or batch policy checks). Realistic blended input saving across cached-eligible paths: **~30–40% of input tokens** assuming moderate repeat traffic.

### P2 — Route simple tasks to Haiku · **NEEDS-REVIEW (quality)**
`canva/bobby/aria` (`/api/ai/generate`) and `content/draft` are short, templated generation tasks on Sonnet ($3/$15). Haiku ($1/$5) is **~3× cheaper input, 3× cheaper output** and is already trusted for the messenger bot. Policy/agents/Dana (unit-economics, compliance) should stay on Sonnet+.
- **Est. saving:** for the canva/bobby/aria + draft paths, **~67% token-cost reduction** on those calls (Sonnet→Haiku). Tag NEEDS-REVIEW because output quality on creative copy should be spot-checked before switching.

### P3 — Right-size `maxTokens` · **SAFE-AUTOMATIC**
`maxTokens` is an output **ceiling**, not a target — but oversized ceilings invite longer completions and raise tail cost/latency. 1100–1200 is generous for the structured "What I found / Why / Proposal / Risk" answers. Trimming agents/policy to ~900 and canva/draft to ~800 is low-risk (answers rarely approach the cap). The messenger bot's 320 is already tight — leave it.
- **Est. saving:** modest, **~5–10% of output tokens** (mostly tail trimming); safe because it only caps, never truncates typical answers.

### P4 — Cron model + cadence for `refresh-knowledge` · **NEEDS-REVIEW**
4 `researchWithWebSearch` calls/week on **Opus 4.8** (`$5/$25`), 2000 maxTok + up to 5 web searches each. Web-search results dominate input here, so Opus is expensive for what is essentially summarise-the-web. Two levers: (a) **route the cron to Sonnet** (knowledge docs are guidance ranges, not deep reasoning) → ~40% cheaper per call; (b) cadence is already weekly — fine; do NOT increase frequency. Benchmarks change slowly, so weekly is already conservative.
- **Est. saving:** **~40% on the cron's per-run cost** if moved to Sonnet. Low absolute volume (4 calls/wk) so small in dollars, but free to apply. NEEDS-REVIEW only because the cron output feeds the knowledge base — validate Sonnet's research summaries once.

### P5 — De-duplicate GUARDRAILS via caching, not duplication · **SAFE-AUTOMATIC (after P1)**
Once P1 lands, GUARDRAILS automatically rides the cached prefix. No separate action — folded into P1.

### Not recommended
- **Streaming/early-stop:** these are short, non-interactive JSON responses; streaming adds complexity with no token saving (same tokens billed). Skip — only relevant if maxTokens were raised to 16k+.
- **Increasing cron frequency:** would raise recurring cost for no quality gain.

---

## 3. Aggregate estimate

Weighting by likely call volume (interactive specialist/policy/content calls dominate; cron is negligible):

| Lever | Applies to | Token/credit saving (on its slice) |
|---|---|---|
| P1 caching | agents, policy, content, generate (repeat traffic) | ~30–40% blended input |
| P2 Haiku routing | canva/bobby/aria + draft | ~67% on those calls |
| P3 maxTokens | all | ~5–10% output |
| P4 cron→Sonnet | refresh-knowledge | ~40% (tiny absolute) |

**Estimated aggregate token/credit reduction: ~30–40%** across the AI spend, dominated by P1 (caching) and P2 (Haiku routing). P1 alone is ~25–30% if P2 is deferred. Assumptions: moderate repeat traffic within the 5-min cache TTL; creative/draft volume is a meaningful share of calls; output ≪ input on most paths (cached input is the big lever).

**Sequencing:** P3 (safe, now) → P1 (biggest win, needs `claude.ts` refactor + route assembly change) → P2/P4 (quality spot-check first).
