# Phase 83 — Post-Phase-80 effect-application test sweep

> Drains Phase 78 + Phase 79 audit-filed CRITIQUE Pending rows by
> authoring direct hermetic coverage on the Phase 80 always-land
> contract. Closes the regression-coverage window the Phase 80
> mechanic shift opened.

## Outcome

Two new hermetic test files ship under `src/Skills/e2e/` and
`src/Combat/e2e/` covering:

- **Per-skill always-land cases** for the 8 zero-coverage skills
  Phase 78 surfaced (folds the per-skill LOW rows that ride the
  primitive MEDs).
- **Engine-primitive cases** for the 3 zero-coverage primitives
  (`convert_enemy_buff_to_self`, `secondary_heal_self`, two-effect
  compound application).
- **Tier 2 debuff always-land sweep** drawing representative effects
  from each Phase 79 coverage-gap category (stat / defense /
  advantage / control / damage), asserting the post-Phase-80
  always-land contract on the `resolveEffectApplication` path.

11 Pending CRITIQUE rows (Phase 78 audit) + 1 Pending CRITIQUE row
(Phase 79 MED Tier 2 debuff resolution path) move to Done with this
ship.

## Source

`plan/PHASE_CANDIDATES.md` Promoted section, Phase 83 row — promoted
at oversight-20 2026-05-24 (commit `960d3a8`). Original candidate
filed at expand-23 (`8400ecc`) framing the post-Phase-80
regression-coverage requirement.

## Sibling brief

`plan/phases/phase_80_skills_always_land_pure_split.md` (commit
`7f7b9c0`) — the mechanic shift this phase covers tests for.
`src/Combat/e2e/phase80-always-land.engine.test.ts` (Phase 80
hermetic pin) is the test-file precedent for direct
`resolveEffectApplication` testing under the new contract.

## Implementation units

### Unit 1 — Per-skill always-land + primitive hermetic file

`src/Skills/e2e/phase83-skill-coverage.engine.test.ts`. One
`describe` block per skill / primitive:

- **`false-dilemma`** (Tier 1, basePower 4 mind +
  `debuff_confusion` duration 2) — one `it()` asserting the cast
  applies `debuff_confusion` to the enemy at duration 2.
- **`appeal-to-pity`** (Tier 1, self-heal `heart × 2`) — one
  `it()` asserting the cast restores `heart × scalingMultiplier × 0.5
  = heart × 2` HP on the caster.
- **`liars-echo`** (Tier 1, basePower 3 mind + `tier1_mind_mark`
  intensity 2 duration 2) — one `it()`.
- **`ship-of-theseus` + `convert_enemy_buff_to_self`** (Tier 1,
  basePower 0 heart, primitive) — two `it()`s: (a) target has 1
  buff → buff transfers to caster's effects + leaves target's
  effects; (b) target has 0 buffs → no-op (skill still consumes
  resources, no error).
- **`mob-appeal` + `secondary_heal_self`** (Tier 2, basePower 10
  body + heart-stat secondary heal) — one `it()`: caster takes
  damage from a baseline state + secondary_heal_self applies
  `heart × multiplier` healing to the caster (multiplier = 1 per
  the skill payload).
- **`undistributed-middle`** (Tier 2, basePower 8 mind +
  `tier1_mind_mark` intensity 3 duration 3) — one `it()`.
- **`eternal-regress`** (Tier 2, basePower 6 heart +
  two-effect compound: `debuff_confusion` + `debuff_slow`) — two
  `it()`s: (a) both effects land on the target after one cast; (b)
  cost (heart 2 + mind 2) debits correctly.
- **`bootstrap-paradox`** (Tier 3, self-heal `heart × 2`) — one
  `it()` asserting the cast restores `heart × scalingMultiplier ×
  0.5 = heart × 2` HP on the caster.

~10 `it()`s total. Each uses `getSkillById` for the canonical
library lookup; fixtures mirror `skill.engine.test.ts` (baseStats
heart 4 body 6 mind 4 player; baseStats 3/3/3 enemy).

### Unit 2 — Tier 2 debuff always-land category sweep

`src/Combat/e2e/phase83-tier2-debuff-categories.engine.test.ts`.
One parameterized `describe.each` block walking representative
Tier 2 debuffs across the 5 Phase 79 coverage-gap categories:

- **stat** — `debuff_body_attack_down` (a stat-band debuff)
- **defense** — `debuff_defense_down`
- **advantage** — `debuff_evasion_down`
- **control** — `debuff_sleep`
- **damage** — `debuff_burn`

Each row asserts: (a) calling `resolveEffectApplication(target,
effect, 'debuff')` under any d20 roll (Nat 1, Nat 20, mid) returns
`{ success: true, activeEffect: effect, message: 'Effect lands.' }`;
(b) `result.rebounded` is `undefined`; (c) `result.roll` is
`undefined` (Phase 80 contract — no roll on Tier 2 debuffs).

~5 parameterized cases. Covers a representative slice of the 28
uncovered Tier 2 debuffs that Phase 79 surfaced.

### Unit 3 — Drain CRITIQUE Pending rows + CHANGELOG + plan-row flip

Move the 11 Phase 78 audit rows + 1 Phase 79 MED Tier 2 debuff row
from `plan/CRITIQUE.md` Pending → Done with the resolved-at note
pointing at this commit. The 5 Phase 79 LOW aggregate rows STAY in
Pending — they cover the broader category sweep that this phase
doesn't fully drain (stat-band / advantage / control / damage-variant
/ fallacy-thread per-effect cases). `/iterate` drains them
category-by-category in subsequent ticks.

CHANGELOG.md `[unreleased] ### Added` entry for the new test files.
`plan/steps/01_build_plan.md` Phase 83 row flipped `[ ]` → `[x]`.

## Decisions made upfront — DO NOT ASK

- **D1 — Two new test files (not extension of existing files).** The
  existing `skill.engine.test.ts` uses synthetic Skills (sk_strike,
  sk_resolve, sk_doubt) for its scaffolding; extending it with 10+
  library-lookup cases would mix two test-paradigms (synthetic +
  library). A dedicated `phase83-skill-coverage.engine.test.ts`
  keeps the library-lookup pattern isolated. Same for the Combat
  Tier 2 debuff sweep — dedicated file.

- **D2 — `getSkillById` for library lookup; no synthetic
  re-authoring.** Per the candidate body's "every case asserts the
  new contract" — the audit value is asserting the **real authored
  skills** behave under always-land, not synthetic stubs. Use
  `getSkillById(...)` as the lookup function passed to `executeSkill`.

- **D3 — Hermetic fixtures match `skill.engine.test.ts` shape.**
  fixturePlayer with baseStats heart 4 body 6 mind 4; fixtureEnemy
  with 3/3/3. Initialize combat resources to whatever the skill's
  cost requires (e.g. `{ heart: 3 }` for appeal-to-pity).

- **D4 — `mockSequentialRng(0.99)` (legacy-Nat-20) used as the
  always-land regression-stress value.** Pre-Phase-80, Nat-20 on a
  Tier 2 debuff resolveEffectApplication would have triggered the
  rebound branch. Post-Phase-80, the effect lands cleanly. Each
  per-skill case stubs `0.99` to assert no legacy-rebound side-effect.

- **D5 — Two-effect compound assertion structure.** For
  `eternal-regress`, assert BOTH effect ids appear in
  `next.enemy.effects` after one cast (NOT just one). The bug shape
  the Phase 78 MED row pre-empts is "only one of the two lands."

- **D6 — `convert_enemy_buff_to_self` semantic clarification:
  buff transfers ONE buff (the random pick), not all.** The
  primitive payload kind is `'convert_enemy_buff_to_self'` per
  `src/Skills/types.ts`; per the engine implementation pattern at
  `src/Skills/skill.engine.ts:applySpecialMechanic` switch, the
  primitive randomly picks one enemy buff and transfers it. The
  hermetic case (a) seeds the enemy with one buff → assert it
  transfers; case (b) seeds zero buffs → no-op (the primitive's
  early-return path).

- **D7 — `secondary_heal_self` is a self-heal addition, not a
  replacement.** The skill's `basePower 10 body` damages the enemy;
  the `secondary_heal_self` mechanic applies an ADDITIONAL self-heal
  of `heart × multiplier` HP. The test asserts the caster's HP
  increases by `heart × 1 = 4` from a baseline.

- **D8 — Parameterized `describe.each` for the Tier 2 debuff
  sweep.** 5 representative effects × 1 case each (always-land)
  via a single parameterized harness keeps the file tight.

- **D9 — Single-commit ship for all 4 units.** Test files +
  CRITIQUE drain + CHANGELOG + plan-row flip in one commit per
  ship-a-phase Step 10's "one summary commit" guidance. Brief itself
  ships separately per §3.

- **D10 — Phase 79 LOW aggregate rows stay in Pending.** Phase 83
  covers the MED Tier 2 debuff row (representative sweep) and all
  Phase 78 rows. The 5 Phase 79 LOWs (stat-band / advantage /
  control / damage-variant / fallacy-thread per-effect cases) need
  ~30 individual per-effect cases combined — too much scope for
  one phase. `/iterate` drains them category-by-category in
  subsequent ticks.

## Verify gate

`npm run verify`. Expected: tests grow by ~15 (713 → ~728). No
existing test breaks (Phase 80 D7 verified). tsc + tsc-alias
clean.

## Commit body template

```
feat(test): Phase 83 shipped — post-Phase-80 effect-application test sweep

- src/Skills/e2e/phase83-skill-coverage.engine.test.ts: 10+ direct
  per-skill hermetic cases for the 8 zero-coverage skills (Phase 78
  audit) + 3 zero-coverage primitives (convert_enemy_buff_to_self,
  secondary_heal_self, two-effect compound)
- src/Combat/e2e/phase83-tier2-debuff-categories.engine.test.ts:
  parameterized always-land sweep across 5 representative Tier 2
  debuffs (one per Phase 79 category-gap: stat / defense / advantage
  / control / damage)
- 11 Phase 78 audit rows + 1 Phase 79 MED row drained from
  plan/CRITIQUE.md Pending → Done
- 5 Phase 79 LOW aggregate rows STAY in Pending per D10 (iterate
  drains them category-by-category)
- CHANGELOG.md [unreleased] ### Added entry
- plan/steps/01_build_plan.md Phase 83 row flipped [ ] → [x]

Decisions:
- D1: two new test files (no extension of existing synthetic-fixture file)
- D2: getSkillById lookup for real authored skills (not synthetic stubs)
- D3: hermetic fixtures match skill.engine.test.ts shape
- D4: mockSequentialRng(0.99) — legacy-Nat-20 regression stress
- D5: two-effect compound asserts BOTH effects land
- D6: convert_enemy_buff_to_self transfers ONE random buff
- D7: secondary_heal_self is additive (basePower + self-heal)
- D8: parameterized describe.each for Tier 2 debuff sweep
- D9: single-commit ship for all 4 units
- D10: Phase 79 LOW aggregate rows stay in Pending (iterate drains)

Closes 12 of 17 CRITIQUE Pending rows. Verify + deploy:check clean.
Brief committed at <this-commit>.
```

## Definition of Done

- [ ] `src/Skills/e2e/phase83-skill-coverage.engine.test.ts` ships.
- [ ] `src/Combat/e2e/phase83-tier2-debuff-categories.engine.test.ts`
      ships.
- [ ] 11 Phase 78 audit rows + 1 Phase 79 MED row moved Pending → Done.
- [ ] `CHANGELOG.md [unreleased] ### Added` entry.
- [ ] `plan/steps/01_build_plan.md` Phase 83 row flipped.
- [ ] `npm run verify` passes (test count grows by ~15).
- [ ] `npm run deploy:check` passes.

## Follow-ups (out of scope)

- 5 Phase 79 LOW aggregate rows (per-category per-effect cases)
  drain via /iterate ticks across the next few cycles.
- Phase 84 (fizzle UX scrub) prunes the now-dead
  `effect-resisted` / `effect-rebounded` SkillEvent variants.
- Phase 85 (combat-tuning audit) revisits broader combat math.
- The damage-resist primitive candidate (filed at Phase 80 D1)
  completes direction (a)'s damage-side.
