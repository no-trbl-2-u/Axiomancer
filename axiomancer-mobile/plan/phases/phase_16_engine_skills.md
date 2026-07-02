# Phase 16 — Drain `combat.skills.fixture.ts`: wire engine skill library

## ⚠ BLOCKED — engine package gap

Discovered during the 2026-05-15 ship attempt: `axiomancer-mechanics@0.6.0`
does **not** re-export `skillLibrary` or `getSkillById` from its top-level
`./dist/index.d.ts`. The Skills submodule exists in dist
(`./dist/Skills/skill.library.{js,d.ts}`) but is not surfaced through the
package `exports` map (only `.` and `./node`).

Attempted deep-import via `axiomancer-mechanics/dist/Skills` is rejected
by TypeScript because the engine's published dist is also missing several
internal `types.d.ts` files (`Skills/types.d.ts`, `Effects/types.d.ts`,
`Combat/types.d.ts`) that the Skills index transitively imports — i.e.
the dist is type-incomplete for that subpath.

**Engine prerequisite (one of):**

1. **Preferred — re-export from the top-level.** Add to
   `axiomancer-mechanics/src/index.ts` under the Skills section:
   `export { skillLibrary, getSkillById } from './Skills';`
   Bump 0.6.0 → 0.6.1, publish, then `npm install` here.
2. **Alternate — publish the Skills subpath.** Add a `./Skills` entry to
   the engine `package.json` `exports` map and ensure all `types.d.ts`
   files land in `dist/`.

Until either lands, Phase 16 cannot ship — the picker would have nothing
engine-backed to read. The build plan row stays `[ ]` (not `[skipped]`)
so the next `/march` tick revisits once the engine ships.

This brief's decisions below are still valid for the post-unblock attempt.

---

## Outcome

The combat presenter and action layer read skills from the engine
(`axiomancer-mechanics` — `skillLibrary` / `getSkillById`) instead of the
hard-coded mock at `state/mocks/combat.skills.fixture.ts`. The mock module
is deleted. The combat skill picker continues to render exactly the same
contract (`CombatViewModel.skillPicker` is unchanged); the data behind it
is now sourced from the engine.

This closes the last mobile/engine drift named in `plan/bearings.md` hard
rule §6 ("Engine logic stays in `axiomancer-mechanics`. No
reimplementation here.").

## Why this phase, why now

- Engine Spec 04 has shipped: `axiomancer-mechanics@0.6.0` exports a real
  `skillLibrary` (12 tier-1/2/3 skills) plus `getSkillById`, `executeSkill`,
  `Skill` type — confirmed in `node_modules/axiomancer-mechanics/dist/Skills/`.
- The mobile combat presenter still imports `COMBAT_SKILLS_FIXTURE` from a
  6-entry hand-rolled mock. The presenter contract `SkillOption` is engine
  -agnostic; only the data source needs replacing.
- Promoted from `plan/PHASE_CANDIDATES.md` via `/oversight` on 2026-05-15
  (score 5.5).

## Inputs

- `node_modules/axiomancer-mechanics/dist/Skills/index.d.ts` —
  `skillLibrary: Skill[]`, `getSkillById(id): Skill | undefined`.
- `node_modules/axiomancer-mechanics/dist/Skills/skill.library.js` — the
  12 canonical skills (data shape verified).
- `state/mocks/combat.skills.fixture.ts` — current 6-entry mock to drain.
- `state/presenters/combat.engine.ts` — consumer (skill picker).
- `state/actions.ts` — consumer (`findSkill` for mana deduction).
- `state/e2e/combat.engine.test.ts` — must move its imports off the mock.

## Decisions made upfront — DO NOT ASK

1. **Mapping `Skill → CombatSkill` (the presentation row):**
   - `id` = engine `id` (e.g. `'ad-hominem-strike'`).
   - `name` = engine `name`, uppercased for display (`'AD HOMINEM STRIKE'`).
     The screen previously got pre-uppercased names; preserve that.
   - `description` = engine `description` verbatim (longer prose; the chip
     UI already handles wrap).
   - `category` = engine `category` (`'fallacy' | 'paradox'`) — direct match.
   - `stance` = engine `philosophicalAspect` (`'body' | 'mind' | 'heart'`)
     — direct match.
   - `manaCost` = **sum of every resource in `resourceCost`** (`body + mind +
     heart + fallacy + paradox`, missing keys count as 0). Tier-1 skills
     come out at 3; tier-2 at 4; tier-3 at 3–4. This matches the placeholder
     mana model (single number) and keeps the picker's `'insufficient-mana'`
     gating semantically right.
2. **Skill universe shown in the picker:** the full engine library (all 12
   skills), not a filtered "known-to-player" subset. The engine does not
   yet expose per-player learned skills; surfacing the whole library
   preserves the mock's behaviour (everything visible, stance/mana gate the
   chips). When the engine ships a learned-skills slice, a follow-up phase
   will filter.
3. **Module placement:** new adapter at `state/selectors/combat-skills.ts`
   (sits beside the presenter family, not under `state/mocks/`). It exports
   `CombatSkill`, `SkillCategoryKey`, `COMBAT_SKILLS` (readonly, derived
   from `skillLibrary`), `getCombatSkillById(id)`. The old
   `state/mocks/combat.skills.fixture.ts` file is **deleted** in the same
   commit.
4. **Resolver behaviour is OUT of scope.** The action layer's
   `resolveRound` currently downgrades a `'skill'` action to a plain
   `'attack'` (the wrapped action is hard-coded to `'attack'`) and passes a
   stub `skillLookup` returning `null`. Wiring `executeSkill` end-to-end
   (so the engine actually applies skill damage/effects) is a separate,
   bigger phase. This phase only swaps the data source. Recorded in
   Follow-ups.
5. **Stance picker / action picker unchanged.** No screen-level changes,
   no `<screen>.copy.ts` touches, no theme tokens, no a11y changes.
6. **Skill identities change.** Five of the six mock ids overlap roughly
   with engine ids (`ship-of-theseus` matches exactly; `ad-hominem` →
   `ad-hominem-strike`; `sorites-heap` → `sorites-cascade`). Persisted
   `selectedSkillId` from a save file written under the mock will resolve
   to `null` after this phase. **Accepted** — `selectedSkillId` lives in
   ephemeral `CombatLocalUi`, not the engine save slice (verified in
   `state/presenters/combat.engine.ts` line 69). No migration needed.

## Routes / API surface

No new routes. No new exported actions. No new screens.

## Files touched

**Added:**
- `state/selectors/combat-skills.ts` — engine adapter (exports
  `CombatSkill`, `SkillCategoryKey`, `COMBAT_SKILLS`, `getCombatSkillById`).
- `state/selectors/__tests__/combat-skills.test.ts` — pure unit tests for
  the adapter (mapping, mana-cost sum, library coverage).

**Modified:**
- `state/presenters/combat.engine.ts` — import from
  `state/selectors/combat-skills` instead of `state/mocks/combat.skills.fixture`;
  `buildSkillPicker` iterates `COMBAT_SKILLS` instead of
  `COMBAT_SKILLS_FIXTURE`. JSDoc updated to drop the "until engine Spec 04
  ships" hedge.
- `state/actions.ts` — drop `COMBAT_SKILLS_FIXTURE` / `CombatSkillFixture`
  imports; `findSkill` becomes a one-liner over `getCombatSkillById`.
- `state/e2e/combat.engine.test.ts` — replace `COMBAT_SKILLS_FIXTURE`
  imports with `COMBAT_SKILLS`. Length assertions still hold (now `=== 12`).

**Deleted:**
- `state/mocks/combat.skills.fixture.ts`.

## Tests

**Unit (new, hermetic, colocated):**
- `state/selectors/__tests__/combat-skills.test.ts`
  - `COMBAT_SKILLS` length === `skillLibrary.length` (currently 12).
  - Every entry has a non-empty `id`, `name`, `description`.
  - `category` ∈ `{ 'fallacy', 'paradox' }`.
  - `stance` ∈ `{ 'heart', 'body', 'mind' }`.
  - `name` is uppercase.
  - `manaCost` matches the sum of the engine skill's `resourceCost` keys.
  - `getCombatSkillById('ship-of-theseus')` returns that skill.
  - `getCombatSkillById('not-a-real-skill')` returns `null`.

**E2E (updated, already hermetic):**
- `state/e2e/combat.engine.test.ts` — swap fixture import to
  `COMBAT_SKILLS`. The existing test "disables every skill that does not
  match the selected stance" continues to pass (more skills, same gating).
  The "drain mana to 0 ⇒ all heart-stance disabled with `'insufficient-mana'`"
  test continues to pass — engine library has 4 heart-stance skills
  (appeal-to-pity, ship-of-theseus, eternal-regress, bootstrap-paradox).

**Not added:**
- No new screen tests; `app/(tabs)/combat.tsx` does not change.
- No skill-execution test; resolver behaviour is out of scope (see
  Follow-ups).

## Cross-links

- **In:** none — Phase 16 is the consumer; nothing upstream needs to wait.
- **Out:** the action layer's resolver path now has a clean place to wire
  `getSkillById` from `axiomancer-mechanics` when skill-execution wiring
  ships (follow-up).

## Verify gate

```
npm run verify    # = npm run lint && npx tsc --noEmit && npm test
```

All three legs must be green. Hermetic-Jest standard preserved.

## Commit body template

```
feat(combat): drain combat.skills.fixture mock — phase 16

- Skill picker now reads from `axiomancer-mechanics`'s `skillLibrary`
  via a thin adapter at `state/selectors/combat-skills.ts`.
- `getCombatSkillById` replaces the local mock lookup used by the
  action layer's mana-deduction path.
- Engine library exposes 12 skills (4 per stance, 6 fallacy / 6
  paradox) vs the mock's 6 hand-rolled entries. The picker contract
  (`SkillOption`) is unchanged.
- `state/mocks/combat.skills.fixture.ts` deleted.
- Closes the last mobile/engine drift listed in bearings hard rule §6.

Decisions:
- manaCost is the sum of every entry in engine `resourceCost` (no
  per-stance breakdown today; placeholder mana model is a single
  number).
- Skill resolver wiring (`executeSkill`) is out of scope — the action
  layer still downgrades 'skill' actions to plain attacks. Follow-up
  phase to wire actual skill execution.
- Surfacing the full engine library, not a per-player learned-skills
  filter — engine has no learned-skills slice yet.

Closes #<phase-issue-number>
```

## DoD

- [ ] `state/selectors/combat-skills.ts` exists and is the sole source of
  truth for combat-skill display data.
- [ ] `state/selectors/__tests__/combat-skills.test.ts` exists; all
  assertions green.
- [ ] `state/mocks/combat.skills.fixture.ts` deleted.
- [ ] `state/presenters/combat.engine.ts` no longer imports from
  `state/mocks/`.
- [ ] `state/actions.ts` no longer imports `COMBAT_SKILLS_FIXTURE` or
  `CombatSkillFixture`.
- [ ] `state/e2e/combat.engine.test.ts` imports `COMBAT_SKILLS` from the
  new adapter; all tests green.
- [ ] `grep -rn "combat.skills.fixture\|COMBAT_SKILLS_FIXTURE\|CombatSkillFixture"`
  inside `state/`, `app/`, `components/` returns no hits.
- [ ] `npm run verify` is green.
- [ ] `plan/steps/01_build_plan.md` Phase 16 row flipped to `[x]`.
- [ ] `npm run deploy:check` is green (stub exit 0).

## Follow-ups (out of scope)

1. **Wire `executeSkill` into `resolveRound`.** Pass `getSkillById` from
   `axiomancer-mechanics` to the engine resolver so that selecting a skill
   actually applies damage / effects / resource costs through the engine.
   Today the action layer hard-codes `action: 'attack'` when a skill is
   chosen, which the engine resolves as a basic attack. Separate phase —
   touches the round-resolution event-summary loop in
   `state/actions.ts` and may add new log severities.
2. **Per-player learned-skills slice.** When the engine ships a
   `state.player.knownSkills` (or equivalent), update
   `state/selectors/combat-skills.ts` to filter `COMBAT_SKILLS` against it.
   Until then, the picker shows the whole library.
3. **Tier-aware mana display.** Today's single-number `manaCost` flattens
   tier-2/3 multi-resource costs. A richer chip showing per-resource cost
   would land alongside the engine-resource HUD work (deferred).
