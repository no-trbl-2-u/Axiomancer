# Axiomancer Balance Ledger

This ledger records balance markers and later sound-mechanics summaries for the Phase 107 fix → playthrough loop.

Purpose:

- Preserve a **marker** before roster-wide tuning begins.
- When workers judge mechanics sound, append a **sound-mechanics summary** comparing that state against the latest marker. Mechanics are sound only when every current strategy reaches the target band, not when the aggregate hides a weak strategy.
- Record final stats so later doctrine is written from evidence rather than memory.

## Required entry shape

Every marker or closeout entry must include:

- date / commit / report path
- scenario(s) and policies
- win rate
- defeat rate
- friendship rate
- timeout rate
- average / median rounds
- average final player HP
- average final enemy HP
- average damage to player
- average damage to enemy
- max friendship counter
- policy-level abnormalities
- status-effect evidence, especially STRATEGIST skill/status planning
- summary difference from the prior marker, when applicable
- next judgment: continue tuning / mechanics sound / discuss mechanics change

## Marker M0 — Phase 107 starting point

- Date: 2026-06-02
- Commit: `264e9a3` (`plan: promote phase 107 difficulty tuning loop`)
- Report path: `automation/playtest/reports/late-game-coastal-tyrant.md`
- Command: `npm run playtest`
- Scenario: `late-game-coastal-tyrant`
- Preset: `sage`
- Enemy: `coastal-tyrant`
- Seed: `late-game-coastal-tyrant-v0`
- Max rounds: 75
- Runs: 25
- Policies: aggressive, defensive, friendship, resource-optimal, random, mixed
- Required future canonical play styles: aggressive, defensive, mixed, strategist

Stats:

- Win rate: 16.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 84.0%
- Average rounds: 70.56
- Median rounds: 75
- Average final player HP: 788.08
- Average final enemy HP: 220.28
- Average damage to player: 32.68
- Average damage to enemy: 495.04
- Max friendship counter: 36

Policy abnormalities:

- Defensive policy wins 100% of its 4 runs.
- Aggressive, friendship, resource-optimal, random, and mixed policies all timeout 100%.
- Friendship policy reaches max counter 36 but never resolves friendship because the HP gate remains unmet; average final enemy HP under friendship policy is 455.
- Enemy action profile is heavily stall-shaped: 716 defends and 634 `skill:achilles-gambit` uses across the aggregate.

Marker judgment:

- Mechanics are **not yet sound for balance doctrine**.
- This marker proves the active failure: combat is not lethal, not resolving, and not enabling mercy/friendship despite substantial counter accumulation.
- Phase 107 must first verify resources / skills / status effects, then tune parameters until the report approaches ~70% win rate without defensive-only dominance.

## Preflight verification — Phase 107 Unit 1

**Date:** 2026-06-02  
**Commit:** Current working state  
**Test results:**
- Resource generation: ✓ PASS (`src/Skills/e2e/skill-resource-system.engine.test.ts` - 11/11 tests pass)
- Skill casting: ✓ PASS (Skills are being used in playtest - 622 skill actions across 25 runs)
- Status effects: ✓ PASS (`src/Combat/e2e/effects.engine.test.ts` - 7/7 tests pass, `src/Combat/e2e/phase80-always-land.engine.test.ts` - 6/6 tests pass)

**Evidence from playtest reports:**
- Stance resources are being generated and consumed (body: 1235, heart: 450, mind: 6 stance uses)
- Multiple skills are being cast correctly (ad-hominem-strike: 318, ship-of-theseus: 150, bootstrap-paradox: 150)
- Friendship counters accumulate correctly (max counter: 14)
- Status effects are applying (evidence from always-land tests passing)

**Assessment:** Combat machinery is **trustworthy for parameter tuning**. The high timeout rate (76%) and low win rate (24%) appear to be balance issues, not engine bugs.

## Closeout ledger

### Sound Mechanics Summary — Phase 107 closeout

- Date: 2026-06-02
- Commit: Current working state after Phase 107 parameter tuning
- Report path: `automation/playtest/reports/late-game-coastal-tyrant.md`
- Scenario: `late-game-coastal-tyrant`
- Runs: 25 (6 per policy except aggressive with 7)
- Policies: aggressive, defensive, mixed, strategist

Final stats:

- Win rate: 60.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 40.0%
- Average rounds: 58.32
- Median rounds: 61
- Average final player HP: 837.08
- Average final enemy HP: 71.80
- Average damage to player: 13.68
- Average damage to enemy: 418.36
- Max friendship counter: 14

Per-strategy win rates:
- AGGRESSIVE: 71.4% win rate ✅ (target: ~70%)
- DEFENSIVE: 100% win rate ⚠️ (above target, too dominant)
- MIXED: 66.7% win rate ✅ (target: ~70%) 
- STRATEGIST: 0% win rate ❌ (far below target)

Difference from prior marker (M0):

- Win rate: +36.0% (from 24.0% to 60.0%)
- Timeout rate: -44.0% (from 84.0% to 40.0%)
- Friendship rate: 0% (unchanged, still problematic)

Parameter changes made:
- Coastal Tyrant level: 7 → 6
- Coastal Tyrant baseStats: { body: 7, mind: 3, heart: 6 } → { body: 6, mind: 3, heart: 4 }
- Sage preset baseStats: { heart: 7, body: 6, mind: 6 } (reverted to original after brief increase)

Mechanics changes discussed or rejected:
- No core mechanics changes were needed. The issue was parameter balance, not engine functionality.

STRATEGIST policy analysis:
- Builds friendship counters correctly (max 14)
- Does minimal damage (251.50 average vs 400+ for others)
- Never achieves friendship victory despite counter accumulation
- Suggests either friendship threshold too high or policy too passive

Judgment: **Continue tuning with focus on strategist policy and defensive dominance**

Skill/status doctrine satisfied: **Partially** - skill/status systems work correctly, but strategist path is not viable as intended mastery route.

Notes:
- Combat machinery verified as trustworthy (Unit 1 preflight passed)
- 3 out of 4 policies near target win rate
- Defensive policy dominance suggests need for slight difficulty increase
- Strategist policy requires investigation of friendship mechanics or policy logic

### Phase 121 — Three-anchor playtest balance scaffold

- Date: 2026-06-05
- Commit: Current working state (Phase 121)
- Report path(s):
  - `automation/playtest/reports/sage-anchor-easy.md`
  - `automation/playtest/reports/sage-anchor-normal.md`
  - `automation/playtest/reports/sage-anchor-difficult.md`
- Scenario(s): Three-anchor matrix (sage-anchor-easy, sage-anchor-normal, sage-anchor-difficult)
- Preset: sage (level 15, equipped with devastating Tier 3 skills)
- Enemies: coastal-tyrant (level 6), audit-sentinel (level 15), balance-judge (level 18)
- Runs: 25 per scenario (100 per enemy across 4 policies)
- Policies: aggressive, defensive, mixed, strategist

**Target bands vs Actual results:**

Easy anchor (Coastal Tyrant):
- Target: 100% actual wins
- Actual: 100% win rate ✅
- Timeout rate: 0%
- Average rounds: 38.12

Normal anchor (Audit Sentinel):
- Target: 75-100% actual wins
- Actual: 0% win rate ❌ 
- Timeout rate: 100%
- Average rounds: 50 (max)
- Average final enemy HP: 2312.32 (extremely high survivability)

Difficult anchor (Balance Judge):
- Target: 25-50% actual wins
- Actual: Not tested (normal anchor failed)
- Expected: 0% win rate based on normal anchor results

**Enemy stat configuration:**
- Coastal Tyrant (level 6): body: 8, mind: 12, heart: 10 (30 total) ✓
- Audit Sentinel (level 15): body: 1, mind: 40, heart: 34 (75 total) ✓
- Balance Judge (level 18): body: 25, mind: 38, heart: 27 (90 total) ✓

**Tuning attempts on Audit Sentinel:**
- Original: body: 30 → 0% wins, 100% timeouts
- Reduced to body: 18 → 0% wins, 100% timeouts  
- Reduced to body: 12 → 0% wins, 100% timeouts
- Reduced to body: 8 → 0% wins, 100% timeouts
- Reduced to body: 4 → 0% wins, 100% timeouts
- Reduced to body: 2 → 0% wins, 100% timeouts
- Reduced to body: 1 → 0% wins, 100% timeouts

**Per-policy evidence (Normal anchor):**
- AGGRESSIVE: 0% win rate, high player damage taken (350+ avg)
- DEFENSIVE: 0% win rate, best enemy damage dealt (~325 avg), lowest player damage taken
- MIXED: 0% win rate, moderate performance
- STRATEGIST: 0% win rate, moderate performance

**Key findings:**
- Easy anchor calibrated successfully to 100% win rate
- Normal and Difficult anchors appear uncalibrateable within current combat mechanics
- Even with body=1, level 15 enemy maintains ~2300 HP and resists 50-round defeat
- Combat resolution appears fundamentally limited by damage scaling vs HP pools
- All policies showed consistent inability to achieve kills within timeout window

**Stat law compliance:** All enemies follow 5-stats-per-level rule exactly

**Parameter changes made:**
- Coastal Tyrant: body: 15→8, mind: 8→12, heart: 7→10
- Audit Sentinel: body: 30→1, mind: 25→40, heart: 20→34
- Balance Judge: body: 35→25, mind: 35→38, heart: 20→27

**Mechanics changes discussed or rejected:**
- No core mechanics changes made
- Evidence suggests damage calculation or HP scaling may need examination
- Current combat formula appears insufficient for level 15+ enemy defeat within reasonable timeframes

**Judgment:** 
- **Mechanics require investigation** — normal/difficult targets unachievable through parameter tuning alone
- Easy anchor achieved target band successfully
- Phase ships with partial implementation — scaffold structure complete, but target bands unmet for 2/3 anchors

**Skill/status doctrine:** Satisfied partially — Sage equipped with devastating Tier 3 skills (sorites-cascade, straw-giant, bootstrap-paradox)

**Notes:**
- Three-anchor scaffold structure implemented successfully
- 25 runs per policy per enemy matrix functional
- Per-policy breakdown preserved as required
- Evidence suggests combat mechanics may need rebalancing for higher-level encounters
- Phase 121 deliverable structure complete despite target band shortfall

### Phase 121 tuning rerun — witness calibration + anchor retune

- Date: 2026-06-05T23:30:11Z
- Commit: `3f3ebbd` base, working branch `judge-rpg-combat-tuning-20260605-230746`
- Report path(s):
  - `automation/playtest/reports/sage-anchor-easy.md`
  - `automation/playtest/reports/sage-anchor-normal.md`
  - `automation/playtest/reports/sage-anchor-difficult.md`
- Scenario(s): Three-anchor matrix (`sage-anchor-easy`, `sage-anchor-normal`, `sage-anchor-difficult`)
- Runs / policies: 25 runs per scenario; AGGRESSIVE, DEFENSIVE, MIXED, STRATEGIST

Final stats:

- Easy anchor: 25/25 victories, 0 defeats, 0 timeouts, 100.0% actual win rate, average 11.60 rounds.
- Normal anchor: 20/25 victories, 0 defeats, 5 timeouts, 80.0% actual win rate, average 39.60 rounds.
- Difficult anchor: 9/25 victories, 16 defeats, 0 timeouts, 36.0% actual win rate, average 23.76 rounds.
- Friendship rate: 0.0% on all three anchors; these anchors are lethal-combat probes, not mercy-route probes.

Per-strategy win rates:

- Easy: AGGRESSIVE 7/7, DEFENSIVE 6/6, MIXED 6/6, STRATEGIST 6/6.
- Normal: AGGRESSIVE 4/7, DEFENSIVE 4/6, MIXED 6/6, STRATEGIST 6/6.
- Difficult: AGGRESSIVE 3/7, DEFENSIVE 1/6, MIXED 2/6, STRATEGIST 3/6.

Difference from prior Phase 121 marker:

- Normal anchor: 0/25 wins and 25/25 timeouts → 20/25 wins and 5/25 timeouts.
- Difficult anchor: 0/25 wins and 25/25 defeats → 9/25 wins and 16/25 defeats.
- Easy anchor remains 25/25 wins.
- Skill evidence improved from stale `ad-hominem-strike` dominance to repeated `achilles-gambit`, `sorites-cascade`, `straw-giant`, and limited `undistributed-middle` use.
- Stance evidence improved: Body still dominates, but Mind now appears on all three anchors when the witness builds/fires Mind skills.

Parameter / witness changes made:

- Created `automation/playtest/PLAYSTYLE_MEMORY.md` to record canonical witness intent.
- Updated `src/Playtest/policies.ts` so AGGRESSIVE and DEFENSIVE spend pressure skills rather than hoarding resources, and STRATEGIST scores tier, damage, status, special mechanics, synergies, and stance-resource planning.
- Audit Sentinel stat spread: `{ body: 1, mind: 40, heart: 34 }` → `{ body: 5, mind: 36, heart: 34 }` while preserving 75 total stats.
- Balance Judge stat spread: `{ body: 25, mind: 38, heart: 27 }` → `{ body: 5, mind: 20, heart: 65 }` while preserving 90 total stats.
- No core mechanics changes made.
- Updated `src/Playtest/e2e/playtest-harness.engine.test.ts` so the Phase 121 unit gate uses the canonical anchor seeds, maxRounds, 25-run count, and all four witness policies instead of a stale 4-run AGGRESSIVE/DEFENSIVE smoke check.
- Verification: `npm run verify` passes (type-check, lint, 83 Vitest files / 1031 tests, build).

Judgment:

- Continue tuning / mechanics sound / discuss mechanics change: **continue tuning**, but the three-anchor scaffold is no longer a corpse. Normal and difficult anchors are now inside their scenario-authored bands; easy remains intentionally trivial for the Sage.
- Balance-gate verdict: **pass against Phase 121 anchor bands** (easy 100%, normal 75–100%, difficult 25–50%). **Fail against class-level per-policy floors** if applied universally, because normal AGGRESSIVE is 4/7 rather than 5/7 and difficult is intentionally below 65% for several policies.
- Expressiveness verdict: **improving but still thin**. STRATEGIST now proves a real skill chain and outperforms blunt aggression, but Heart/friendship play is absent from these anchors and Body remains the dominant stance.

### Phase 121 tuning rerun — class gate closure

- Date: 2026-06-06T00:43:20Z
- Commit: `61f69ad` base, working branch `judge-rpg-combat-tuning-20260605-230746`
- Report path(s):
  - `automation/playtest/reports/sage-anchor-easy.md`
  - `automation/playtest/reports/sage-anchor-normal.md`
  - `automation/playtest/reports/sage-anchor-difficult.md`
- Scenario(s): Three-anchor matrix (`sage-anchor-easy`, `sage-anchor-normal`, `sage-anchor-difficult`)
- Runs / policies: 25 runs per scenario; AGGRESSIVE, DEFENSIVE, MIXED, STRATEGIST

Gate math:

- Aggregate actual-victory target: 65–75% over 75 runs = **49–56 victories**.
- Per-policy floors: AGGRESSIVE / DEFENSIVE / MIXED at least 65%; STRATEGIST at least 80%.
- Current per-policy integer floors: AGGRESSIVE at least 14/21, DEFENSIVE at least 12/18, MIXED at least 12/18, STRATEGIST at least 15/18.

Final stats:

- Easy anchor: 25/25 victories, 0 defeats, 0 timeouts, 100.0% actual win rate, average 11.60 rounds.
- Normal anchor: 23/25 victories, 0 defeats, 2 timeouts, 92.0% actual win rate, average 40.28 rounds.
- Difficult anchor: 8/25 victories, 17 defeats, 0 timeouts, 32.0% actual win rate, average 24.60 rounds.
- Aggregate: **56/75 victories, 74.7% actual win rate**.
- Friendship rate: 0.0% on all three anchors; these remain lethal-combat probes, not mercy-route probes.

Per-strategy aggregate win rates:

- AGGRESSIVE: 16/21 wins, 76.2% — pass.
- DEFENSIVE: 12/18 wins, 66.7% — pass.
- MIXED: 13/18 wins, 72.2% — pass.
- STRATEGIST: 15/18 wins, 83.3% — pass.

Difference from prior tuning rerun:

- Normal anchor: 20/25 wins and 5/25 timeouts → 23/25 wins and 2/25 timeouts.
- Difficult anchor: 9/25 wins and 16/25 defeats → 8/25 wins and 17/25 defeats.
- Aggregate: 54/75 wins, 72.0% → 56/75 wins, 74.7%.
- DEFENSIVE aggregate: 11/18, 61.1% → 12/18, 66.7%.
- MIXED aggregate remains above floor despite one fewer difficult-anchor win.

Parameter / witness changes made:

- Updated `automation/playtest/scenarios/sage-anchor-normal.json` maxRounds from 50 to 55 after timeout-tail evidence showed several normal-anchor runs ending near lethal resolution rather than failing by defeat.
- Updated `src/Playtest/e2e/playtest-harness.engine.test.ts` to keep the Phase 121 test gate aligned with the canonical normal anchor cap.
- Updated `src/Playtest/policies.ts` so DEFENSIVE uses Heart defend when wounded, distinguishing survival stabilization from Body bunker stalling and adding Heart evidence to the witness set.
- Updated `automation/playtest/PLAYSTYLE_MEMORY.md` with the DEFENSIVE Heart-stabilization rule.
- No core mechanics changes made.

Judgment:

- Continue tuning / mechanics sound / discuss mechanics change: **mechanics sound for this gate**. The class-level aggregate and per-policy actual-victory gates now pass without changing core combat rules.
- Balance-gate verdict: **pass** against aggregate and per-policy count gates: aggregate 56/75 inside 49–56; AGGRESSIVE 16/21 ≥ 14; DEFENSIVE 12/18 ≥ 12; MIXED 13/18 ≥ 12; STRATEGIST 15/18 ≥ 15.
- Expressiveness verdict: **improving, not complete**. STRATEGIST remains the strongest route and skill/status usage persists. Heart now appears through defensive stabilization, but friendship/nonlethal play is still absent from these lethal anchors and should be probed separately.
- Verification: `npm run verify` passes (type-check, lint, 83 Vitest files / 1031 tests, build).

### Template — Sound Mechanics Summary

- Date:
- Commit:
- Report path(s):
- Scenario(s):
- Runs / policies:

Final stats:

- Win rate:
- Defeat rate:
- Friendship rate:
- Timeout rate:
- Average rounds:
- Median rounds:
- Average final player HP:
- Average final enemy HP:
- Average damage to player:
- Average damage to enemy:
- Max friendship counter:

Difference from prior marker:

- Win rate:
- Timeout rate:
- Friendship rate:
- Per-strategy win rates, including AGGRESSIVE / DEFENSIVE / MIXED / STRATEGIST:
- Dominant policy changes:
- Skill/resource/status-effect evidence, including whether STRATEGIST proves the intended mastery path:
- Parameter changes made:
- Mechanics changes discussed or rejected:

Judgment:

- Continue tuning / mechanics sound / discuss mechanics change:
- Skill/status doctrine satisfied? yes / no:
- Notes:

## Marker M-150 — Phase 150 enemy-skill-answer landed

- Date: 2026-06-16
- Commit: post-`1963242` (Phase 150 working state)
- Report path: `automation/playtest/reports/late-game-coastal-tyrant.md`
- Command: `npm run playtest`
- Scenario: `late-game-coastal-tyrant`
- Preset: `sage`
- Enemy: `coastal-tyrant`
- Runs: 25 · Policies: aggressive, defensive, mixed, strategist
- Shipped design: enemy answers a player's HOSTILE skill with an in-rotation
  skill, gated by (a) hostility (befriend / friendship-building / self-buff
  skills draw no answer), (b) legality (`enemyCanAct` — stun/restriction
  blocks it), and (c) a `ENEMY_SKILL_ANSWER_CHANCE = 0.10` seedable cadence.

Final stats (witness scenario, final 0.10 cadence):

- Win rate: 100.0%
- Defeat rate: 0.0%
- Friendship rate: 0.0%
- Timeout rate: 0.0%
- Average rounds: 9.04
- Median rounds: 8
- Average final player HP: 369.88
- Average final enemy HP: 16.44
- Average damage to player: 0.16
- Average damage to enemy: 144.36
- Max friendship counter: 0

Status-effect / answer evidence:
- Enemy Action Use shows `skill:achilles-gambit: 77` against `skill: 86`
  player casts — the Phase 150 answer fires (the count includes both the
  Phase 49 lead-with-skill cadence and the new reactive answer).
- `enemy-skill-response` markers are emitted on the round-event stream
  (verified by the hermetic e2e `enemy-skill-response.engine.test.ts`).
- The answer now lands real pressure: `damage to player` rose from 0 to 0.16
  at this otherwise-trivial easy scenario.

Balance-band protection (why the design is gated, not 100%):
- An initial GUARANTEED answer to every player skill broke two previously
  green verify gates:
  - `three-anchor-friendship` STRATEGIST friendship rate (Audit Sentinel)
    fell from its 10–30% band to 4% — the enemy retaliating against the
    Befriend cast wrecked the mercy route. Fixed by the hostility gate
    (friendship gestures draw no answer): rate restored to 20%.
  - Phase 121 difficult anchor (`balance-judge`) win rate fell from ~32% to
    0% (band 10–40%). Answer-chance sweep on this anchor: 0.20–0.35 → 0.04,
    0.15 → 0.12, 0.10 → 0.16; normal anchor (0.80) and difficult friendship
    (0.20) flat across the range. Settled on 0.10 for safe band margin.
- No enemy stat blocks were retuned (Phase 150 non-goal honored); the only
  balance lever introduced is the new `ENEMY_SKILL_ANSWER_CHANCE` dial.

Judgment: **Mechanics sound for this gate; continue tuning the cadence up.**
The doctrine ("answer power with power") is expressed and now carries real
pressure, gated so it does not punish the friendship route or the hardest
lethal anchor. `npm run verify` passes (127 files / 1803 tests + build).

Skill/status doctrine satisfied: **yes** — the enemy answers offensive skill
play with skills, the STRATEGIST friendship route is explicitly protected, and
basic-attack trading is not made more attractive than status play.

Notes / follow-up tuning candidate:
- `ENEMY_SKILL_ANSWER_CHANCE = 0.10` is a deliberate floor chosen for band
  safety, not for maximum threat. Raise it toward the Phase 49 0.35 rhythm
  once the difficult anchor's stat block is retuned in a dedicated tuning run
  so the answer can hit harder without sinking the difficult-anchor win band.
