# Phase 123 — Enemy off-budget "gear tier" counterweight

> Close late-game trivialization by giving enemies an off-budget power term that
> scales with level/region — the counterweight to the player's gear + skill
> library, which is the *actual* cause of L50 falling out of band.

## Outcome

Enemies gain a level-scaled "equipment tier" bonus, weighted toward HP and
defenses/resists, exposed as a new registry tunable so the `combat-tuning`
loop can A/B its magnitude. The bonus is ≈0 at level 1 (so the early game is
untouched) and large by level 50 (so the player's compounding gear+skill power
no longer trivializes endgame).

## Source

Promoted by owner direct order on 2026-06-07 from the merged `combat-tuning`
suggestions (PR #125), Q3 with its **corrected root cause**:

- Player and enemy stat budgets are BOTH linear in level — player `level × 5`,
  enemy `level × ENEMY_STAT_PER_LEVEL (3)` (`src/Game/game-mechanics.constants.ts`
  lines 108–117) — so a same-level enemy is a flat ~60% of the player's stat
  weight at *every* level (L50 enemy HP 750 vs player 1250 confirms it). The
  slope is therefore NOT the problem.
- What diverges is the player's **off-budget power that enemies lack**: gear
  tier (Iron Blade → Axiom Greatsword) and skill library (10 → 50 skills), both
  compounding with progression. That is why L1 is brutal (nothing extra) and L50
  trivial (everything extra), and why a global `enemy.statPerLevel` cut can't fix
  L50 without re-breaking L1.
- The player-side buff in Phase 124 *widens* this gap, so this counterweight is
  its necessary other half.

Evidence cells: `l50-aggressive-hard`, `l50-defensive-hard`, `l50-mixed-easy`
all 1.0 resolution; the whole L50 row resolves ~100% across easy/normal/hard.

## Implementation units

### Unit 1 — Define the gear-tier scaling term

**Files:**
- `src/Game/game-mechanics.constants.ts`

**Work:**
- Add a new constant (e.g. `ENEMY_GEAR_TIER_PER_LEVEL`) representing the
  off-budget multiplier the player accrues from gear+skills per level. Document
  it next to `ENEMY_STAT_PER_LEVEL` with the same care (it is a *value*, not a
  formula).
- Choose a curve that is near-0 at level 1 and grows with level — e.g. a
  per-level multiplier applied above a low-level threshold, or a banded table
  keyed to region/progression tier. Keep the shape simple and documented; the
  loop tunes the magnitude, not the shape.

### Unit 2 — Apply it in the enemy power computation

**Files:**
- `src/Enemy/index.ts` (`enemyStatBudget` — the canonical budget-based stat
  builder authored enemies opt into)
- `src/Tuning/enemy.scaler.ts` (so the bonus also flows through scaled matrix
  enemies for tuning)

**Work:**
- Apply the gear-tier bonus weighted toward **HP and defensive/resist stats**
  (the stats stronger player skills/effects must chew through), not flat across
  attack — the goal is durability that gives status play room, not an enemy
  damage spike that re-introduces defeats.
- Thread the value through `enemy.scaler.ts` the same way `perLevel` is threaded
  for `ENEMY_STAT_PER_LEVEL`, so the A/B harness can inject candidate values.
- Legacy hand-authored `baseStats` enemies that don't use `enemyStatBudget` are
  unaffected (document this, consistent with the existing budget note).

### Unit 3 — Register the tunable

**Files:**
- `src/Tuning/tunable.registry.ts`
- `src/Tuning/e2e/registry-applier.engine.test.ts`

**Work:**
- Add a `TUNABLE_REGISTRY` entry for the new constant: `category: 'enemy'`,
  `effect: { difficulty: 'raises' }`, conservative `min`/`max`/`step`, a
  `magnitudeCapPct` of 0.25, and tags `['enemy', 'scaling', 'difficulty',
  'late-game']`. This is the deliberate, reviewed act of widening the loop's
  authority — keep the bounds tight.
- Extend the applier test that pins registry locators to live constants.

### Unit 4 — Hermetic e2e + evidence

**Files:**
- `src/Enemy/e2e/*.engine.test.ts` (new hermetic test)
- generated reports under `automation/playtest/reports/`

**Work:**
- Hermetic e2e: assert the bonus is ~0 at level 1 and materially raises enemy
  HP/defense at level 50, for a budget-based enemy.
- Re-run the matrix (`npm run tune`) and record that the L50 row moves toward
  band while L1 is unchanged.

## Decisions made upfront — DO NOT ASK

- **D1 — New constant + tunable, not a re-slope.** Do not change
  `ENEMY_STAT_PER_LEVEL`; the divergence is off-budget, so the fix is a separate
  off-budget term.
- **D2 — Defensive weighting.** Bias the bonus to HP + defenses/resists, not
  attack, so it absorbs the Phase 124 buff without spiking defeats.
- **D3 — Level-shaped, ≈0 at L1.** The early game must be left to Phase 122/124;
  this term only bites at mid/high level.
- **D4 — Magnitude is the loop's job.** Ship a sane default + tight registry
  bounds; let `combat-tuning` dial it.

## Verify gate

- `npm run type-check`
- `npm test -- --run` (new enemy e2e + registry-applier test)
- `npm run tune -- --levels=50` slice (or full) to confirm L50 moves toward band
- `npm run verify` + `npm run deploy:check`
- `git diff --check`

## Definition of Done

- [ ] New `ENEMY_GEAR_TIER_*` constant with a documented, ≈0-at-L1 curve.
- [ ] Applied (HP/defense-weighted) in `enemyStatBudget` and threaded through
  `enemy.scaler.ts`.
- [ ] Registered as a tunable with tight bounds; applier test extended.
- [ ] Hermetic e2e pins ≈0 at L1 and a real bump at L50.
- [ ] Matrix evidence shows L50 trending into band, L1 unchanged.
- [ ] Verify + deploy gates pass.

## Follow-ups out of scope

- Per-enemy L1 outliers (Phase 122).
- Player skill/effect strength (Phase 124) — tune the two together afterward.
- Effects-to-resolution wiring (Phase 125).
