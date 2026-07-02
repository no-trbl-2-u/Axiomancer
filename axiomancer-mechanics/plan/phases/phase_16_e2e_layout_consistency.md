# Phase 16 — Migrate sibling tests into `src/<Module>/e2e/` for layout consistency

> Brief for `/ship-a-phase`. All decisions pre-resolved.
> DO NOT ASK the user during implementation — decide and ship.

## Outcome

Every `src/<Module>/` with significant logic has at least one
hermetic engine test at `src/<Module>/e2e/<feature>.engine.test.ts`
exercising the module's public entry point. The three modules currently
missing an `e2e/` dir (`Effects`, `Enemy`, `World`) gain one by
relocating + renaming their most engine-style sibling test. `plan/bearings.md`
documents the convention explicitly: each module owns one `e2e/`
engine test plus optional sibling `*.test.ts` files for narrower unit
tests of internal helpers. The CRITIQUE-1 LOW finding "Hermetic e2e
layout is half-adopted across modules" is closed.

## Source spec

No dedicated `specs/16-*.md` file — this is a structural-debt phase
tracked by `plan/CRITIQUE.md` LOW finding "Hermetic e2e layout is
half-adopted across modules" (critique-1, commit `dd26ef0`).

Resolved questions:

1. **Migrate ALL sibling tests, or only the engine-style ones?**
   Only the engine-style ones. Many sibling tests (e.g.
   `src/Combat/effect-modifiers.test.ts`,
   `src/Items/item.reducer.test.ts`) exercise internal helpers, not the
   module's public entry. Renaming them to `*.engine.test.ts` would
   mis-label them. The CRITIQUE finding's pain is "is module X covered
   by a top-level e2e test?" — that pain is fully resolved by ensuring
   every module has at least one `e2e/*.engine.test.ts`, not by moving
   every internal test.
2. **Which file gets moved per module?**
   - `Effects`: `src/Effects/index.test.ts` →
     `src/Effects/e2e/effects.engine.test.ts`. It drives `applyEffect`,
     `clearTier1EffectsForStance`, `removeEffect` — the public entry
     for the Effects engine.
   - `Enemy`: `src/Enemy/enemy.logic.test.ts` →
     `src/Enemy/e2e/enemy.engine.test.ts`. It drives `decideEnemyAction`
     plus all six strategy functions — the public entry for enemy AI.
   - `World`: `src/World/spec08.test.ts` →
     `src/World/e2e/world.engine.test.ts`. It's the Spec 08 end-to-end
     pass: `createStartingWorld` → `moveToNode` → `processNode` →
     dialogue → quest → boss-kill. Clearly an engine test.
3. **Bearings update — bless both layouts or single source?**
   Bless both. Bearings should explicitly say: "Every module ships one
   `e2e/<feature>.engine.test.ts` covering the public entry. Additional
   sibling `*.test.ts` files are permitted for unit-level coverage of
   internal helpers." This matches the post-Phase-16 state of the
   codebase and avoids forcing migrations that would harm clarity.
4. **Other sibling tests left in place?**
   Yes. Specifically left as sibling unit tests:
   - `src/Combat/{combat.reducer,combat-effects,effect-modifiers,index}.test.ts`
   - `src/Enemy/loot.test.ts` (loot table; not a public-entry pass)
   - `src/Game/{spec08.e2e,store.encounter}.test.ts`
   - `src/Items/item.reducer.test.ts`
   - `src/Skills/skill.engine.test.ts` (this one is engine-named but
     sibling; it's the existing convention exception — leave alone and
     let critique flag it if needed in a future pass)
   - `src/Utils/index.test.ts`
   - `src/World/{world.reducer,encounter}.test.ts`
5. **Update import paths?**
   The moved files import from `'./index'`, `'./types'`, `'./loot'`,
   etc. After the move into `e2e/` the relative imports break — update
   each to `'../index'`, `'../types'`, etc.
6. **Update CRITIQUE.md?**
   Yes: close the LOW finding "Hermetic e2e layout is half-adopted
   across modules" with a Done entry.

## Implementation units (commit per unit)

### Unit 1 — Migrate `Effects/index.test.ts` → `Effects/e2e/effects.engine.test.ts`

```bash
mkdir -p src/Effects/e2e
git mv src/Effects/index.test.ts src/Effects/e2e/effects.engine.test.ts
```

Patch relative imports: `from './index'` → `from '../index'`,
`from './types'` → `from '../types'`,
`from './effects.library'` → `from '../effects.library'` (and any
others that surface).

Run `npm run type-check && npm test` — must be green.

Commit: `test(effects): move Effects engine test into e2e/`

### Unit 2 — Migrate `Enemy/enemy.logic.test.ts` → `Enemy/e2e/enemy.engine.test.ts`

```bash
mkdir -p src/Enemy/e2e
git mv src/Enemy/enemy.logic.test.ts src/Enemy/e2e/enemy.engine.test.ts
```

Patch relative imports: `from './enemy.logic'` → `from '../enemy.logic'`,
`from './types'` → `from '../types'`.

Run `npm run type-check && npm test` — must be green.

Commit: `test(enemy): move Enemy AI engine test into e2e/`

### Unit 3 — Migrate `World/spec08.test.ts` → `World/e2e/world.engine.test.ts`

```bash
mkdir -p src/World/e2e
git mv src/World/spec08.test.ts src/World/e2e/world.engine.test.ts
```

Patch relative imports: `from './index'` → `from '../index'`,
`from '../Effects'` stays (already relative-grandparent),
`from '../Character'` stays, `from '../Game/game.reducer'` stays.
(Walk through the imports — each `from './X'` becomes `from '../X'`.)

Run `npm run type-check && npm test` — must be green.

Commit: `test(world): move Spec 08 engine test into e2e/`

### Unit 4 — Update bearings to bless both layouts

File: `plan/bearings.md`

Edit the "Hermetic e2e tests" bullet around line 142–143:

```
Before:
- **Hermetic e2e tests:** located at `src/<Module>/e2e/<feature>.engine.test.ts`.
  They run as part of `npm test`. No Playwright; e2e is vitest-based.

After:
- **Hermetic e2e tests:** located at `src/<Module>/e2e/<feature>.engine.test.ts`.
  They run as part of `npm test`. No Playwright; e2e is vitest-based.
  Every module with public engine logic ships one. Additional sibling
  `src/<Module>/*.test.ts` files are permitted for unit-level coverage
  of internal helpers — they run in the same vitest pass.
```

Commit: `docs(bearings): formalize the e2e + sibling-unit test convention`

### Unit 5 — Close the CRITIQUE finding + tick the DoD

Move the LOW finding "Hermetic e2e layout is half-adopted across modules"
from Pending to Done in `plan/CRITIQUE.md`.

Flip Phase 16 in `plan/steps/01_build_plan.md` to `[x]` with the final
commit hash.

Commit: `plan: phase 16 shipped — e2e layout consistency`

## Decisions made upfront — DO NOT ASK

- **Move only three files.** §Q1 / §Q2 / §Q4.
- **No renames of remaining sibling tests.** The convention going
  forward blesses both layouts.
- **No new tests are written in this phase.** Moves only.
- **The exception `src/Skills/skill.engine.test.ts`** (engine-named but
  at module root, with an `e2e/` peer holding the resource-system test)
  is left alone. Bearings now allows this. A follow-up phase can
  consolidate if a future critique pass surfaces the inconsistency.
- **`git mv` is used** so blame history follows the file.

## Verify gate

```bash
npm run type-check      # after each unit
npm test                # after each unit
npm run verify          # at the end of Unit 4
npm run deploy:check    # at the end of Unit 5
```

## Commit body template (summary if units coalesce)

```
test(layout): phase 16 — every module has an e2e/<feature>.engine.test.ts

- Move Effects/index.test.ts → Effects/e2e/effects.engine.test.ts
- Move Enemy/enemy.logic.test.ts → Enemy/e2e/enemy.engine.test.ts
- Move World/spec08.test.ts → World/e2e/world.engine.test.ts
- Update bearings to formalize e2e + sibling-unit convention
- Close CRITIQUE-1 LOW "Hermetic e2e layout is half-adopted across modules"

Decisions:
- Migrate only engine-style tests; leave sibling unit tests in place.
  Renaming non-engine tests to *.engine.test.ts would mis-label them.

Closes #<phase-issue if captured>
```

## Definition of Done

- [ ] `src/Effects/e2e/effects.engine.test.ts` exists; `src/Effects/index.test.ts` removed
- [ ] `src/Enemy/e2e/enemy.engine.test.ts` exists; `src/Enemy/enemy.logic.test.ts` removed
- [ ] `src/World/e2e/world.engine.test.ts` exists; `src/World/spec08.test.ts` removed
- [ ] `plan/bearings.md` blesses both layouts
- [ ] `plan/CRITIQUE.md` LOW finding moved to Done
- [ ] `plan/steps/01_build_plan.md` Phase 16 row flipped to `[x]` with hash
- [ ] `npm run verify` exits 0
- [ ] `npm run deploy:check` exits 0

## Follow-ups (out of scope)

- Rename `src/Skills/skill.engine.test.ts` and consolidate with
  `src/Skills/e2e/skill-resource-system.engine.test.ts` — strictly
  out of scope; bearings now blesses the current shape.
- Add fresh `*.engine.test.ts` coverage for any module whose moved
  test doesn't actually cover the public entry top-to-bottom — none
  flagged today; reassess at the next critique pass.
