# Phase 155 — Status-effect system cleanup + combat re-centering

> **DOCTRINE-CENTRAL.** Status effects are the MAIN fun (CLAUDE.md / VISION.md).
> Basic-attack trading being more attractive than status play is a balance
> failure. This phase closes the witness gap structurally where registry-only
> tuning has plateaued. Cleanup/refocus, not merely additive.

## Outcome

Applying and exploiting status effects becomes strictly more attractive than
basic-attack trading on the dimension the doctrine measures: the **witness
edge** (STRATEGIST resolution − AGGRESSIVE resolution). The latest tuning run
(`automation/playtest/reports/tuning-2026-06-20T13-48-24-416Z.md`) records the
failure verbatim:

> strategist 81% vs aggressive 92% resolution → edge **−11%** — basic attacks
> out-resolve status play (doctrine failure).

Status *engagement* is already healthy (strategist leverage 65%, above the 35%
floor) — status play happens and converts, it just resolves fights **less often
/ slower** than basic-attack trading. The A/B loop kept **0 of 6** candidate
tunables this tick: the effect-potency / duration / threshold knobs no longer
move the witness gap. The gap is **structural**, not numeric.

## Source

T oversight 2026-06-20 (Q1 write-in + Q3: "focus on having combat be centered
around status effects"). Build-plan row: `plan/steps/01_build_plan.md` Phase 155.
Follow-on to Phases 125/126/130 (effects-resolution routes) and 142 (interaction
engine).

## Root cause (confirmed in code)

Combat is **action-exclusive per round** (`src/Combat/phases/scenario.ts`): a
player either does a basic attack/defend OR uses a skill — never both. Using a
status skill forgoes that round's basic-attack damage while the enemy's basic
attack still lands (only a 10% `ENEMY_SKILL_ANSWER_CHANCE` answer exists for the
player; aggressive play is not punished). Status play therefore carries a
**per-round tempo deficit** vs aggressive play.

The DoT-erosion resolution route (`src/Combat/effect-resolution.ts`,
`analyzeDotErosion`) computes `roundsToKill = enemyHp / totalDotDamagePerRound`
and compares it to a flat horizon — but it **never credits the DoT already
locked in over each active effect's remaining duration**. A strategist who has
stacked a lethal-in-flight DoT package has *already won the fight*, yet the
route makes them keep trading turns until the round cap, so the run records a
timeout instead of a status-driven victory. That lost resolution is exactly the
witness gap.

## Implementation units

### Unit 1 — Credit guaranteed pending status damage in the erosion route

**File:** `src/Combat/effect-resolution.ts` (`analyzeDotErosion`).

- Compute `pendingDotDamage = Σ over DoT effects of
  damagePerRound × intensity × max(remainingDuration, 0)` (permanent DoT,
  `remainingDuration === -1`, contributes via the per-round rate only — it is
  already covered by the `roundsToKill` path; treat it as not adding a finite
  pending bonus).
- Use `effectiveEnemyHp = max(enemyHp − pendingDotDamage, 0)` when computing
  `roundsToKill = ceil(effectiveEnemyHp / totalDotDamagePerRound)`.
- Keep the existing `totalDotDamagePerRound >= EFFECTS_RESOLUTION_DOT_DAMAGE_THRESHOLD`
  gate AND the `roundsToKill <= EFFECTS_RESOLUTION_DOT_MAX_ROUNDS_TO_KILL` gate.
  If the already-locked-in DoT alone is lethal (`pendingDotDamage >= enemyHp`),
  `effectiveEnemyHp` is 0 → `roundsToKill` is 0 → the route fires now.
- This only raises STRATEGIST resolution (status investment finally pays out);
  it does NOT change basic-attack math, so AGGRESSIVE resolution is unchanged
  and the witness edge moves toward status play.

### Unit 2 — Saturation route reads remaining duration as decisiveness

**File:** `src/Combat/effect-resolution.ts` (`analyzeDebuffSaturation`).

- The friendship-yield route already sums control/debuff intensity vs
  `EFFECTS_RESOLUTION_DEBUFF_INTENSITY_THRESHOLD`. Refine so an enemy that is
  control-locked for several rounds (high remaining duration) is recognised as
  saturated even when raw intensity is at the per-proc base — count a control
  effect's contribution weighted by whether it currently restricts the enemy's
  action (forcedStance / blockedStances / skipTurn). This rewards *exploiting*
  control, not merely stacking it, and is doctrine-positive.
- Smallest-change-first: additive to the existing sum, never lowers the existing
  threshold semantics; an enemy that was already saturated stays saturated.

### Unit 3 — Hermetic e2e proving the structural route now fires

**File:** `src/Combat/e2e/effect-resolution.engine.test.ts` (extend; do not
rewrite the Phase 125 cases).

- Golden path: an enemy with HP above `dotPerRound × MAX_ROUNDS_TO_KILL` but
  with a DoT stack whose `Σ damagePerRound × intensity × remainingDuration`
  exceeds current HP → `analyzeEffectsForResolution` returns
  `{ shouldResolve: true, outcomeType: 'victory' }` where the pre-Phase-155
  logic returned `shouldResolve: false`.
- Boundary: the same enemy with one fewer round of remaining duration (pending
  DoT just under HP, and `roundsToKill` over the horizon) does NOT resolve —
  proving the credit is bounded and weak DoT still can't force a premature win.
- Control-saturation: an action-restricting control effect with long remaining
  duration routes to `friendship` per Unit 2.
- RNG stubbed via `mockAlternatingRng`.

### Unit 4 — Docs

**File:** `docs/combat.md` — note the erosion route now credits guaranteed
pending DoT (status investment resolves the fight it has already won).

## Decisions made upfront — DO NOT ASK

- **D1 — Structural, not numeric.** Registry tuning plateaued (0/6 kept this
  tick); the witness gap is a tempo/resolution structural issue. Phase 155 is
  explicitly "cleanup/refocus, not merely additive," so a logic change in
  `effect-resolution.ts` is in scope.
- **D2 — Smallest change that flips the witness sign.** Credit already-locked-in
  DoT against effective HP; do not touch basic-attack damage, the resource
  economy, or the public API (`src/index.ts`).
- **D3 — Don't trivialize combat.** Keep both existing gates (per-round damage
  threshold AND rounds-to-kill horizon); the credit can only resolve a fight the
  DoT will *demonstrably* win from already-applied effects.
- **D4 — Don't punish friendship.** The saturation route is untouched in its
  threshold; Unit 2 only adds decisiveness recognition for control that is
  actively restricting the enemy.
- **D5 — Witness re-measurement is the follow-up tuning run.** Per Phase 126
  precedent ("mechanics-tuning run happens after this ships"), the in-phase proof
  is the hermetic e2e; a full `npm run tune` witness pass is the next
  `/combat-tuning` tick.

## Verify gate

- `npm run type-check`
- `npm run lint`
- `npm test` (hermetic e2e for the pending-DoT credit + control saturation)
- `npm run build`
- `npm run deploy:check`

## Commit body template

```
feat(combat): phase 155 — status play resolves the fight it has already won

- effect-resolution erosion route credits guaranteed pending DoT
  (damagePerRound × intensity × remainingDuration) against effective enemy HP,
  so a lethal-in-flight DoT stack resolves to victory instead of timing out
- saturation route recognises actively-restricting control as decisive
- closes the structural witness gap (strategist 81% < aggressive 92%) that
  registry tuning plateaued on (0/6 kept 2026-06-20)

Decisions:
- Structural change in effect-resolution.ts; registry tuning had plateaued
- Both erosion gates retained so weak DoT can't force premature wins
- Basic-attack math, resource economy, and src/index.ts untouched
```

## Definition of Done

- [x] `analyzeDotErosion` credits guaranteed pending DoT against effective HP
- [x] `analyzeDebuffSaturation` recognises actively-restricting control as decisive
- [x] Hermetic e2e: previously-timeout DoT stack now resolves; boundary case still does not
- [x] `docs/combat.md` updated
- [x] `npm run verify` + `npm run deploy:check` green
- [x] No `src/index.ts` / public-API change

## Follow-ups out of scope

- Full `npm run tune` witness re-measurement (next `/combat-tuning` tick)
- Status-effect depth expansion (Phase 156)
- Affix→status interplay (Phase 157)
