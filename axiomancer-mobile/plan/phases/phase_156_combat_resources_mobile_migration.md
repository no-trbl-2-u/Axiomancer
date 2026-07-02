# Phase 156 — Combat resources mobile migration

## Outcome

Delete the deprecated mobile-only `combatMana` slice as a load-bearing gameplay surface. Mobile combat UI and dev tools must read and mutate the engine-owned `CombatState.combatResources` truth instead.

## Source / user decision

- Source: `NEEDS_ATTENTION.md` §1, promoted by T direct steering on 2026-06-20.
- Current debt: `state/store.ts` still carries `combatMana`, and `StatusCard`, `DebugManaControl`, `DebugHudOverrides`, `DebugPlaythroughPresets`, combat HUD presenters, `state/actions.ts`, and related tests still read/write it.
- Doctrine: engine mechanics own combat resource truth. Mobile is presentation and control glue.

## Decisions made upfront — do not ask

- Do not preserve `combatMana` as compatibility doctrine.
- Do not simulate resource truth locally.
- Use `CombatState.combatResources` as the canonical source for combat affordances, HUD values, skill affordability, and dev resource controls.
- If a dev affordance needs to grant/drain/fill tokens, route it through a typed mobile action that updates the active engine combat state shape and emits/logs enough evidence for tests.
- If legacy persisted saves contain `combatMana`, ignore or strip it during migration; do not let it override engine combat resources.

## Implementation units

1. **State model cleanup**
   - Remove `combatMana` from `state/store.ts` and initial store state.
   - Remove seeding/cleanup code from `state/actions.ts` that initializes or maintains the local slice.
   - Search for every `combatMana` read/write and either delete it or map it to `state.combat.combatResources`.

2. **Presenter/HUD migration**
   - Update `state/presenters/combat-hud.engine.ts` and combat presenter selectors to read engine combat resources only.
   - Preserve canon copy: `VITAE`, `STANCE`, and resource-token labels already in use.
   - `StatusCard` must not display stale mobile mana values.

3. **Dev controls**
   - Replace `DebugManaControl` semantics with engine resource controls, or rename/scope the control if the current label is misleading.
   - Update `DebugHudOverrides` and `DebugPlaythroughPresets` so they prepare engine combat resource fixtures, not `combatMana` fixtures.

4. **Tests**
   - Rewrite tests that assert `combatMana.current` / `.max` to assert engine resource shape and visible HUD behavior.
   - Add or update at least one hermetic e2e test proving a skill-affordability/HUD path reads `combat.combatResources` after a dev resource adjustment.

5. **Docs / ledgers**
   - Tick or remove `NEEDS_ATTENTION.md` §1 when the phase ships.
   - If route/control names change, update any dev-menu documentation or screenshot evidence notes that mention mana controls.

## Verification gate

Run, at minimum:

```bash
npm run typecheck
npm test -- --runInBand
npm run verify
```

If visual surfaces change, also run:

```bash
npm run verify:visual
```

Classify visual-smoke diffs as baseline-vs-regression only after checking console/runtime output.

## Definition of Done

- `git grep combatMana -- app components state` returns no production load-bearing references.
- Combat HUD/resource affordances read engine `combatResources`.
- Dev resource controls operate on engine combat state.
- Tests prove the migrated path.
- `NEEDS_ATTENTION.md` §1 is closed or rewritten as resolved.

## Commit body template

```text
feat(combat): migrate mobile resource state to engine combatResources

- remove deprecated combatMana slice as load-bearing state
- repoint HUD/dev controls/presenters to CombatState.combatResources
- update hermetic tests for engine-owned resource truth
- close NEEDS_ATTENTION.md §1

Verification:
- npm run typecheck
- npm test -- --runInBand
- npm run verify
```

## Follow-ups out of scope

- Broader combat UI redesign.
- Mechanics engine resource-rule changes.
- Status-effect balance tuning.
- Visual baseline approval unless the migration intentionally changes visible resource rendering.
