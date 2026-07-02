# Phase 49 — Enemy-skill caster path (combat depth)

> Promoted via `/oversight` 2026-05-19 from the expand-pass-7 candidate
> "Enemy-skill caster path (combat depth)" (`5b37528`). Brief authored
> 2026-05-19 at commit `e300b8d`.

## Source spec / candidate

- `plan/PHASE_CANDIDATES.md` Promoted entry "Phase 49 — Enemy-skill caster path".
- Phase 38 brief explicitly named this as the next direction.
- Spec 07 acceptance: enemy AI dispatches `attack`/`defend`; today's
  `decideEnemyAction` does exactly that and ignores any `skills?: Skill[]`
  on Enemy.

## Goal — one-line outcome

Make the combat skill engine caster-agnostic, then extend `decideEnemyAction`
to pick a skill from `Enemy.skills?` when conditions are met. Authored
elite/boss enemies fire real skill rotations through `resolveCombatRound`.

## Current state (pre-Phase-49)

- `executeSkill(state, skillId, lookupSkill)` is hardcoded to `state.player`
  as caster + `state.enemy` as target (`src/Skills/skill.engine.ts:324-405`).
- `Enemy` type has `skills?: Skill[]` (`src/Enemy/types.d.ts:101`) but no
  authored enemy in `src/Enemy/enemy.library.ts` populates it.
- `decideEnemyAction` dispatches `attack` / `defend` only
  (`src/Enemy/enemy.logic.ts:203-241`); the Phase 45 `applyOutlookBias`
  only nudges between those two.
- `scenario.ts` handles `playerActionFinal === 'skill'`
  (`:108-138`) but has no parallel branch for the enemy.
- `Combat/types.d.ts` already permits `Action = 'attack' | 'defend' | 'skill'
  | 'item' | 'flee'` and `CombatAction.skillId?: string` — the action type
  already admits enemy skills; nothing else does.

## Decisions (made upfront — Hard Rule 9 + minimum-viable scoping)

### D1 — `executeSkill` signature: `casterSide: 'player' | 'enemy'`, NOT positional Combatants

Picked `executeSkill(state, skillId, casterSide, lookupSkill)` over the
candidate's literal "`caster: Combatant + target: Combatant`" framing.
Reason: `CombatState` already holds both sides as concretely-typed
`Character` (player) + `Enemy` (enemy) fields. Threading raw `Combatant`
positions plus tracking which CombatState field to update afterwards is
strictly less ergonomic than a side-tag the function uses to route reads
+ writes. The candidate's literal signature would require recovering
"is this Combatant the player or the enemy" inside the helper — exactly
the information `casterSide` carries cheaply.

The side-tag also keeps the existing player call site at
`scenario.ts:132` a 1-line change (`executeSkill(skillState, skillId,
'player', skillLookup)`) instead of `executeSkill(skillState, skillId,
skillState.player, skillState.enemy, skillLookup)`. Default-arg form
`casterSide: 'player' | 'enemy' = 'player'` keeps it strictly additive
for back-compat with any deep-import caller (there are none in-repo,
but the candidate has no in-flight phase that depends on the old shape).

### D2 — Enemy-cast skills BYPASS resource costs in this phase

The most consequential design call. Skills currently spend `state.combatResources`
(per Spec 04 — a SHARED pool that's really the player's). Three options:
- (A) Enemies share the same pool (game-design absurdity — player attacks
  fund the enemy's spells).
- (B) Add `Enemy.combatResources?` and route enemy skill costs through it
  + generation rules — full economy duplication, big refactor.
- (C) Enemies bypass `canUseSkill` / `spendResources` entirely; the AI
  is responsible for not over-using.

Picked **(C)** for this phase. Reason: scope discipline. The resource
economy is a Spec-04-locked design (`docs/skills.md` "Resource economy"
subsection) tuned for player-side play; cloning it for enemies without
playtest signal would be speculative. Enemies bypassing resource costs
matches how they bypass spell-prep / cooldowns in classic JRPGs —
their fight-balance comes from HP, attack stats, and turn count, not
resource availability.

The bypass is enforced ONLY at the enemy execution path in scenario.ts —
`executeSkill` itself still calls `canUseSkill` / `spendResources` /
`generatePhilosophicalResource` on `state.combatResources` whether the
caster is player or enemy. The convention: when `casterSide === 'enemy'`
the caller (scenario.ts) sets up a stub `combatResources` such that
the skill always affords + the post-skill pool state is discarded. This
keeps the in-engine math symmetric while making enemy-cast skills feel
free to the player. Future Phase: revisit if combat balance shows
enemy-skill use feels over- or under-tuned.

Documented as a Follow-up: "Enemy combat-resource economy (Phase NN)".

### D3 — Targeting semantics: `skill.targetType` is relative to caster

When `casterSide === 'enemy'`:
- `skill.targetType === 'self'` → applies to enemy (the caster)
- `skill.targetType === 'enemy'` → applies to player (the target, i.e.,
  "the other combatant")

The literal field name `targetType: 'enemy'` is now slightly misleading
when the enemy is the caster ("target = enemy" reads circular). The
authored library skills all use `targetType: 'enemy'` to mean
"opponent", which is correct semantics; renaming the field is out of
scope (locked barrel + 12 skills + tests). Document the relative-to-
caster semantics in `docs/skills.md`.

### D4 — Authored enemies: pick **Coastal Tyrant** + **Argumentative Crow** for the first skill rotation

Both already carry a `philosophicalAlignment` cell (Phase 45). Coastal
Tyrant is a boss; Argumentative Crow is an elite. Skills authored:
- Coastal Tyrant → `argument-from-authority` (Tier 2 mind, matches
  faith-pessimistic-transcendent / Grand Inquisitor archetype).
- Argumentative Crow → `appeal-to-pity` (Tier 1 heart, matches
  logic-optimistic-individual / Nietzsche archetype — debatable but
  the existing `appeal-to-consequences` is closer; defer to unit 2
  for the final pick. Argumentative Crow's logic-optimistic side
  could also fit `nirvana-fallacy`).

Final selection deferred to unit 2 — both choices need to verify the
skill ID exists in `skillLibrary` and the skill's `targetType` makes
sense for an enemy caster.

### D5 — `Enemy.skills?` stays `Skill[]` (full objects, not IDs)

Existing field shape stays. Changing to `string[]` (mirror of Character's
`equippedSkills`) would be more consistent but is out of scope — it
would require backfilling 16 enemies + every test fixture, and the
field is currently empty across the entire library. Defer to a follow-up
phase if cross-character/enemy harmonization becomes valuable.

## Scope — three units

### Unit 1 — `executeSkill` becomes caster-agnostic via `casterSide` parameter

**Files touched:**
- `src/Skills/skill.engine.ts` — `executeSkill` gains
  `casterSide: 'player' | 'enemy' = 'player'`. Internal `player` /
  `enemy` references re-routed via `casterSide`: caster = state[casterSide];
  target = state[casterSide === 'player' ? 'enemy' : 'player']. All
  reads/writes that updated `state.player` or `state.enemy` switch to
  caster/target pointers, then re-assemble the result CombatState by
  routing back to the correct field (`{ ...state, [casterSide]: nextCaster,
  [targetSide]: nextTarget }`).
- `applySkillEffect` + `applySpecialMechanic` — internal helpers gain
  `casterSide` so the `targetIsSelf` branch routes effects to
  caster.effects vs target.effects correctly. `payload.appliedTo === 'self'`
  always means "caster's effects"; `appliedTo === 'enemy'` always means
  "target's effects" (the opposite side).
- Existing player-side call site at `src/Combat/phases/scenario.ts:132`
  → add `'player'` as the 3rd arg, otherwise unchanged.

**Hermetic coverage:**
- 2-3 new cases in `src/Skills/e2e/skill.engine.test.ts` driving a
  player-cast skill with the new `'player'` arg (regression — must
  match pre-refactor behavior) AND an enemy-cast skill with `'enemy'`
  (new — asserts targets resolve symmetrically).

**Commit:** `feat(skills): Phase 49 unit 1 — executeSkill takes casterSide`.

### Unit 2 — `decideEnemyAction` picks a skill from `Enemy.skills` when conditions are met + author 2 enemy skill rotations

**Files touched:**
- `src/Enemy/enemy.logic.ts` — new helper `pickEnemySkill(enemy):
  CombatAction | null` returns `{ action: 'skill', skillId, stance }`
  when `enemy.skills?.length > 0` AND a probabilistic gate fires
  (rate constant in `src/Enemy/enemy.constants.ts` — start at 0.35;
  tune later if needed). Tied to the existing `getRng().random()`
  pattern from `applyOutlookBias`. `decideEnemyAction` calls
  `pickEnemySkill` AFTER the per-strategy decision but BEFORE
  `applyOutlookBias` — if a skill is picked, outlook bias is skipped
  (per the existing guard at `:179` — `applyOutlookBias` already returns
  the action unchanged for `skill`).
- `src/Enemy/enemy.library.ts` — Coastal Tyrant + Argumentative Crow
  get a `skills: [<one Skill object>]` field. Pulled from
  `skillLibrary` by ID at construction time. Final skill IDs picked
  in this unit after grep-confirming each skill's `targetType: 'enemy'`
  + Tier compatibility.

**Hermetic coverage:**
- 4-5 new cases in `src/Enemy/e2e/enemy.engine.test.ts`:
  - `pickEnemySkill` returns `null` when `enemy.skills` is unset.
  - `pickEnemySkill` returns `null` under the gate (low rng roll).
  - `pickEnemySkill` returns the first skill on a high rng roll.
  - `decideEnemyAction` dispatches the skill when the gate fires.
  - `decideEnemyAction` falls back to the strategy's basic action
    when the gate doesn't fire.

**Commit:** `feat(enemy): Phase 49 unit 2 — decideEnemyAction picks skills + 2 enemy rotations`.

### Unit 3 — Wire scenario.ts to handle enemy `action === 'skill'`, hermetic e2e through `resolveCombatRound`, docs

**Files touched:**
- `src/Combat/phases/scenario.ts` — new branch parallel to the
  existing `playerActionFinal === 'skill'` block (`:108-138`). When
  `enemyActionFinal === 'skill'` AND `enemyAction.skillId` is set,
  call `executeSkill(state, skillId, 'enemy', skillLookup)`. Bypass
  `canUseSkill` for enemies per D2 — call signature: `executeSkill`
  still calls it internally; the bypass is handled by ALWAYS passing
  enough resources in for the enemy path (a sentinel combatResources
  with `{ heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 }`).
  Post-skill `combatResources` returned by the function gets discarded
  (the player's pool is the only one tracked across rounds).
- `docs/skills.md` — "Enemy caster path (Phase 49)" subsection
  describing the casterSide parameter + D2 + D3.
- `docs/enemy.md` — "Skill use (Phase 49)" subsection covering
  the rotation pick + the bypass-resources design call.

**Hermetic coverage:**
- 2-3 new cases in `src/Combat/e2e/combat.resolver.test.ts`:
  - Drive a full round where the enemy's `equippedSkills` (or
    `skills`) fires through `pickEnemySkill`; assert a
    `SkillPhaseEvent` (or equivalent kind in `combatEvents`) is
    emitted for the enemy actor.
  - Assert player's `combatResources` is unchanged by an enemy-cast
    skill (D2 bypass works end-to-end).
  - Optional: assert that an enemy targeting `'enemy'` from its POV
    actually lands its effect on the player.

**Commit:** `feat(combat): Phase 49 unit 3 — enemy-skill wiring + hermetic e2e + docs`.

## Acceptance checklist

- [ ] `executeSkill` accepts `casterSide: 'player' | 'enemy'` (default `'player'`).
- [ ] `decideEnemyAction` returns `{ action: 'skill', skillId, ... }`
      when `Enemy.skills` is non-empty AND the probabilistic gate fires.
- [ ] At least 2 enemies in `src/Enemy/enemy.library.ts` carry a
      non-empty `skills` field with skills from `skillLibrary`.
- [ ] `scenario.ts` routes enemy `action === 'skill'` through
      `executeSkill(..., 'enemy', ...)` and bypasses player-resource
      consumption per D2.
- [ ] Hermetic e2e drives an enemy-skill round through
      `resolveCombatRound` and the `combatEvents` payload carries the
      enemy actor's skill event.
- [ ] `npm run verify` green.
- [ ] `npm run deploy:check` green.
- [ ] `docs/skills.md` + `docs/enemy.md` updated.
- [ ] Plan plan/steps/01_build_plan.md Phase 49 row flipped to `[x]`
      with the final commit hash.

## Out of scope (deferred to follow-ups)

- Enemy combat-resource economy (D2 → follow-up phase).
- Renaming `skill.targetType: 'enemy'` to `'opponent'` (D3 → out of
  scope).
- Migrating `Enemy.skills?: Skill[]` to `string[]` ID-form (D5 → out
  of scope).
- Per-enemy skill libraries by tier (mentioned in the candidate as a
  future feature; covered partially by D4 but the broader tiering
  pattern is its own phase).

## Verify gate

`npm run verify` must be green after each unit.

## Definition of done

- All three units shipped as separate commits.
- Acceptance checklist 100% ticked.
- `plan/steps/01_build_plan.md` Phase 49 row flipped to `[x]` with
  the final commit hash.
