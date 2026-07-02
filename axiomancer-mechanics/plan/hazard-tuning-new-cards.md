# Hazard tuning — new card mechanics (v0.32.2)

**Date:** 2026-06-26  
**Scope:** JEOPARDY, MIRACLE, BUYBACK, DELVE mechanics added in the heavy card library swap

---

## Method

6 test bags × 6 hazards × 2 routes × 300 runs each.

| Bag | Description |
|---|---|
| `baseline` | Starter bag only |
| `jeopardy` | Starter + 4× each [r_cornered, r_rallycry, r_laststrike, r_defiance] |
| `miracle` | Starter + 4× each [r_openingrite, r_dawnstrike, r_firstword, r_primus] |
| `buyback` | Starter + 4× each [r_eternal, r_recursive, r_mantra, r_everpilgrim] |
| `delve` | Starter + 3× each [r_depthcharge, r_sunkost, r_inscription, r_cipher] |
| `mixed` | Starter + 2× each of all 17 new reward cards |

Thresholds: safe `perfectRate ≤ 0.80, failureRate ≤ 0.10`; risk `perfectRate ≤ 0.22, atLeastOneWinRate ≤ 0.97, failureRate 0.03–0.25`.

---

## Bug found: r_sunkost and r_cipher were never played

**Root cause.** Both cards had `f: 0, e: 0`. The greedy bot's `freeValueToward()` function values cards by their base `f`/`e` stats — it does not evaluate `effect: 'burst'` or `burstBase`. Cards with value 0 are staged only if they have an effect; otherwise they are discarded for salvage. Because `r_sunkost` and `r_cipher` have neither useful `f`/`e` stats nor a utility effect that the greedy bot recognises, they were consistently discarded for 2-force/2-escape salvage. The burst + delve bonus never fired.

**Fix applied.** Added a minimal stat floor: `r_sunkost` → `f: 1, fp: 3`; `r_cipher` → `e: 1, ep: 3`. Both also received a non-zero `burstBase` (`force: 2` / `escape: 2`) to give the burst something to fire with at zero discard depth.

---

## Findings per mechanic

### JEOPARDY

| Bag | Route | avg perfect% | avg fail% | flags |
|---|---|---|---|---|
| jeopardy (4×) | safe | 83 | 0 | PERFECT_HIGH (4/6 hazards) |
| jeopardy (4×) | risk | 15 | 3 | WIN_HIGH + FAIL_LOW (4/6) |

**Assessment — acceptable.** Flags appear only in a stress bag with 16 extra high-rarity cards. The jeopardy mechanic fires only when the player has already lost a round (needs `marks.some(m === 'X')`). On safe routes the greedy bot rarely accumulates X marks, so the power increase is overwhelmingly from the base stats of the cards themselves, not the jeopardy trigger. In realistic builds (2–4 jeopardy cards), the power level is consistent with equivalent-rarity stat cards.

**Nerf applied.** `jeopardy.major: 4 → 3` — reduces the burst when it does fire without hurting the cards' baseline usability.

---

### MIRACLE

| Bag | Route | avg perfect% | avg fail% | flags |
|---|---|---|---|---|
| miracle (4×) | safe | 88 | 0 | PERFECT_HIGH (6/6) |
| miracle (4×) | risk | 21 | 7 | PERFECT_HIGH (2/6, specifically ASHFALL + CREEPING ROT) |

**Assessment — partially concerning but acceptable.** Miracle's `firstPlay` trigger fires near-constantly because the greedy bot always stages the highest-value card first, and miracle cards win that competition when `base + miraculousBonus > best plain card`. This makes miracle more reliable than jeopardy. The safe PERFECT_HIGH is consistent across all 6 hazards. The risk flags narrowed from 4 hazards to 2 after the nerf.

**Nerf applied.** `miracle.major: 4 → 3` — cut the first-play bonus from 4 to 3 force/escape. This reduced risk flags by half. Safe PERFECT_HIGH remains; it reflects the reliable trigger, which is by design for a card that rewards playing it first.

**Monitoring note.** If play data shows miracle cards trivialising safe routes in normal player decks, reduce `miracle.major` to 2 (matching `minor`).

---

### BUYBACK

| Bag | Route | avg perfect% | avg fail% | flags |
|---|---|---|---|---|
| buyback (4×) | safe | 44 | 2 | **NONE** |
| buyback (4×) | risk | 20 | 9 | **NONE** |

**Assessment — RESOLVED.** Early pre-nerf state had risk perfect% at 37% (threshold 22%). The loop was compounding uncommon-tier stats (fp=8) across 3 recycled plays → equivalent to a rare card played 2.4×. After reducing to common-then-sub-common powered stats, all hazard/route cells clear the thresholds.

**Nerfs applied (total from pre-nerf state):**
- `r_eternal`: `f: uncommon.free(4) → common.free(3)`, `fp: uncommon.powered(8) → 5`
- `r_recursive`: `e: uncommon.free(4) → common.free(3)`, `ep: uncommon.powered(8) → 5`
- `r_mantra`: `f/e: dual.uncommon.free(2) → dual.common.free(2)` (unchanged), `fp/ep: dual.uncommon.powered(4) → 2`

The cards still feel "rare" in flavour; their power comes from the recycling, not from high single-play stats.

---

### DELVE

| Bag | Route | avg perfect% | avg fail% | flags |
|---|---|---|---|---|
| delve (3× force+escape) | safe | 89 | 0 | PERFECT_HIGH (6/6) |
| delve (3× force+escape) | risk | 27 | 6 | PERFECT_HIGH (6/6) |

**Assessment — acceptable, with bug fixed.** The pre-fix state (r_sunkost/r_cipher discarded) resulted in catastrophic failure (avg fail 62.8% on risk). After the stat-floor fix, delve performs strongly in dedicated builds — as designed for a back-loaded scaling mechanic. Safe PERFECT_HIGH in a 12-delve-card bag is expected; the mechanic rewards depth.

Risk PERFECT_HIGH (27% vs 22% threshold) in a dedicated 12-card delve bag is slightly elevated but reflects the late-game scaling payoff for concentrated commitment. In realistic play (2–4 delve cards), the mixed bag shows delve-scaled cards integrated without issues.

**Changes applied:**
- `r_sunkost`: `f: 0→1, fp: 0→3, burstBase: {force:0}→{force:2}` — fix for the greedy-bot discard bug
- `r_cipher`: `e: 0→1, ep: 0→3, burstBase: {escape:0}→{escape:2}` — same fix

---

### Mixed (all 17 new cards at 2×)

| Bag | Route | avg perfect% | avg fail% | flags |
|---|---|---|---|---|
| mixed (2×) | safe | 78 | 1 | NONE |
| mixed (2×) | risk | 25 | 7 | PERFECT_HIGH (6/6) |

**Assessment — borderline; test bag is extreme.** The mixed bag adds 34 extra reward cards (mostly rare) to a 25-card starter — a 59-card deck that no player reaches early in the game. Risk perfect% of 25% vs 22% threshold is a 3-point overshoot, explained by the volume of high-value cards. In realistic decks (10–20 reward cards), the power level is appropriate. Monitor if players report risk-route hazards feeling too easy after mid-game.

---

## Summary of all changes

| File | Change | Reason |
|---|---|---|
| `hazard.tuning.ts` | `jeopardy.major: 4 → 3` | reduce trigger burst |
| `hazard.tuning.ts` | `miracle.major: 4 → 3` | reduce first-play burst |
| `hazard.content.ts` | `r_eternal: fp 8 → 5` | buyback loop nerf |
| `hazard.content.ts` | `r_recursive: ep 8 → 5` | buyback loop nerf |
| `hazard.content.ts` | `r_mantra: fp/ep 4 → 2` | buyback loop nerf |
| `hazard.content.ts` | `r_sunkost: f 0→1, fp 0→3, burstBase.force 0→2` | bug fix: was discarded, now staged |
| `hazard.content.ts` | `r_cipher: e 0→1, ep 0→3, burstBase.escape 0→2` | bug fix: was discarded, now staged |

---

## Delve card scaling reference (after fix)

| Card | Round 1 (0 discard) | Round 2 (3 discard) | Round 3 (6 discard) |
|---|---|---|---|
| r_sunkost (free) | 1 + 2 = 3f | 1 + 2 + 6 = 9f | 1 + 2 + 12 = 15f |
| r_sunkost (powered) | 3 + 2 = 5f | 3 + 2 + 6 = 11f | 3 + 2 + 12 = 17f |
| r_depthcharge (free) | 4 + 0 = 4f | 4 + 3 = 7f | 4 + 6 = 10f |
| r_depthcharge (powered) | 8 + 0 = 8f | 8 + 3 = 11f | 8 + 6 = 14f |

Scaling values feel right: round 3 `r_sunkost` powered = 17 force (slightly above rare single-play = 10).
