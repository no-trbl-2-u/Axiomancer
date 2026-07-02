# Phase 124 — Stronger skills/effects player lever

> Make skills and status effects stronger — the single doctrine-aligned
> player-side lever that addresses the L1, strategist, and engagement clusters at
> once. Paired with Phase 123 so it doesn't deepen late-game trivialization.

## Outcome

Skills and status effects hit harder / matter more, lifting the status-effect
engagement floor and giving the level-1 player and the STRATEGIST a way to
convert status play into resolution — without making basic-attack trading more
attractive (which would violate the doctrine).

## Source

Promoted by owner direct order on 2026-06-07 from the merged `combat-tuning`
suggestions (PR #125). This is the owner-chosen direction: **lean on stronger
skills/effects, keep combat streamlined.** It addresses three clusters:

- **L1 over-tuned (Q2):** stronger early skills give the level-1 player a way to
  fight back before dying in ~5 rounds (`l1-defensive-hard` 94% defeat, 1.5 skill
  uses/run).
- **Strategist underperforms (Q4):** the doctrine's witness lands the most status
  play (20.7 skill uses/run) but only 44% objective engagement and owns the worst
  off-band cells (`l15-strategist-normal` 3% resolution); stronger effects make
  that play decisive.
- **Engagement floor:** 17/48 cells sit below the 0.35 status-effect engagement
  floor in `src/Tuning/health.metrics.ts`.

The A/B already showed a single ±25% bump to `combat.skillStatMultiplier`
(0.5→0.6) is health-positive but too diffuse to win alone — so the real change is
structural (base effect intensity/duration, not just the cap), which the loop can
fine-tune afterward.

## Implementation units

### Unit 1 — Locate the strength levers

**Files:**
- `src/Game/game-mechanics.constants.ts` (`SKILL_STAT_MULTIPLIER`,
  `MAX_EFFECT_INTENSITY`, `MAX_EFFECT_DURATION`)
- `src/Effects/buffs.library.json` and the debuff/effect content (base intensity
  + base duration per effect)
- `src/Skills/library/*.ts` (skill effect payloads)

**Work:**
- Distinguish the **ceiling** knobs (max intensity/duration — already tunable but
  only bind when base values are high) from the **base** values on the core
  status kit, which is where the real strength lives.
- Identify the primary debuffs/effects the witness playstyles actually use
  (the report's top skills: `arrow-paradox`, `peaceful-gesture`,
  `appeal-to-consequences`, `gamblers-fallacy`, etc.) and check whether their
  base intensity/duration is the binding constraint.

### Unit 2 — Strengthen the core status kit

**Files:**
- `src/Effects/buffs.library.json` / effect content files
- `src/Skills/library/*.ts` as needed
- `src/Game/game-mechanics.constants.ts` if the multiplier/ceiling defaults move

**Work:**
- Raise base intensity and/or duration on the core debuffs so applying and
  exploiting status effects out-trades basic attacks — the doctrine test.
- Keep changes as *values*, not formula rewrites, where possible, so the
  `combat-tuning` loop can continue to fine-tune them.
- Where a value should be loop-tunable but isn't yet, add it to the registry
  (see Unit 3) rather than hard-coding a one-off.

### Unit 3 — Expose new base-strength tunables (as needed)

**Files:**
- `src/Tuning/tunable.registry.ts`
- `src/Tuning/e2e/registry-applier.engine.test.ts`

**Work:**
- For any base intensity/duration the loop should own, add a registry entry with
  `category: 'effect'`, `effect: { engagement: 'raises' }`, tight bounds, and
  `status-effect` tags — mirroring the existing `effect.buff_regeneration.duration`
  JSON-data tunable pattern.
- Extend the applier locator test.

### Unit 4 — Hermetic e2e + doctrine check

**Files:**
- `src/Effects/e2e/*.engine.test.ts` / `src/Skills/e2e/*.engine.test.ts`
- generated reports under `automation/playtest/reports/`

**Work:**
- Hermetic e2e: a stronger effect produces the expected larger intensity/duration
  on application (deterministic, RNG stubbed).
- Re-run the matrix and confirm: engagement floor breaches drop, L1/strategist
  cells improve, and the **engagement term does not regress** (the A/B's
  `engagementRegression` guard — basic-attack collapse must not increase).

## Decisions made upfront — DO NOT ASK

- **D1 — Doctrine first.** A change that makes basic-attack trading more
  attractive than status play is wrong even if win rates look fine.
- **D2 — Values, not formulas.** Prefer tunable values; keep core combat formulas
  and `src/index.ts` contract untouched.
- **D3 — Pair with Phase 123.** This buff widens the late-game gap on purpose;
  Phase 123 is the counterweight. Tune the two together via `combat-tuning`
  after both land.
- **D4 — Streamlined.** No new round-cap / timeout machinery here (that is
  Phase 125's effects-to-resolution path).

## Verify gate

- `npm run type-check`
- `npm test -- --run` (new effect/skill e2e + registry-applier test)
- `npm run tune` slice to confirm engagement floor breaches drop with no
  engagement regression
- `npm run verify` + `npm run deploy:check`
- `git diff --check`

## Definition of Done

- [x] Core status-kit base intensity/duration strengthened (values, not formula
  rewrites).
- [x] Any new loop-owned base-strength value registered as a tunable with tight
  bounds; applier test extended.
- [x] Hermetic e2e pins the stronger effect output.
- [ ] Matrix evidence: fewer cells below the engagement floor; L1 + strategist
  cells improve; no engagement regression.
- [ ] Verify + deploy gates pass.

## Follow-ups out of scope

- The enemy counterweight (Phase 123) — required companion, separate phase.
- Effects-to-resolution wiring (Phase 125).
- Per-enemy L1 outliers (Phase 122).
