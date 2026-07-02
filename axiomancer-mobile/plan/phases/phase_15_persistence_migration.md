# Phase 15 — Persistence migration: backfill missing engine state fields

> Generated from the build plan scope for Phase 15. Ships a migration
> from schema version 1 to 2 that populates missing `derivedStats` and
> `nonCombatStats` fields in saved player data. Removes the temporary
> null-guard workarounds added in Phase 14.

## Scope

Extend the existing `schemaVersion` migration runner (shipped in Phase 7)
with a step from version 1 to 2 that backfills missing `derivedStats` 
and `nonCombatStats` fields on old saves. Use engine helpers 
`deriveStats(baseStats)` and `deriveNonCombatStats(baseStats)` when 
available. Once the migration is guaranteed to run, remove the 
`(player as any)` casts and `?? 0` / `?? {}` fallbacks introduced 
in Phase 14.

See Phase 14 brief and the persistence layer shipped in Phase 7.

## Routes / API endpoints / CLI surface

N/A — persistence migration, no user-facing surface.

## Content / data reads

N/A — operates on stored `GameState` data structure.

## Components / handlers

**Reused:**
- `state/persistence/migrations.ts` — bump `CURRENT_SCHEMA_VERSION` to 2, add migration function
- `state/persistence/asyncStorageAdapter.ts` — uses existing migration runner

**Modified:**
- `state/presenters/character.engine.ts` — remove null-guards after migration ships
- `state/presenters/inventory.modal.engine.ts` — remove fallback in equipment comparison

## Cross-links

**In (verify):** Phase 7 migration infrastructure must exist.
**Out (ship):** Clean character presenter without temporary workarounds.
**Retro-fit:** N/A — internal migration.

## SEO / metadata / output schema

N/A — backend migration.

## Hero / body / sub-section composition

N/A — no UI surface.

## Empty / loading / error states

**Migration failure:** If the v1 → v2 migration encounters malformed 
data, throw with descriptive error. The existing adapter error handling 
in `app/_layout.tsx` will catch and start fresh.

## Decisions made upfront — DO NOT ASK

1. **Schema version bump to 2.** Follows the existing contract from 
   Phase 7's migration runner.
2. **Use engine helpers `deriveStats` and `deriveNonCombatStats`.** 
   These exist in the engine's public API and are the canonical 
   derivation functions.
3. **Preserve existing baseStats.** The migration reads `player.baseStats` 
   and generates the derived fields; it does not modify base stats.
4. **Remove all Phase 14 workarounds.** The `(player as any)` casts 
   and `?? 0` / `?? {}` fallbacks in character.engine.ts are replaced 
   with direct field access once the migration guarantees backfill.
5. **Atomic migration.** The v1 → v2 migration either completes 
   successfully or throws; no partial state.

## Mobile reflow / responsive / paginate / output limits

N/A — backend migration.

## Files to ship

```
state/persistence/migrations.ts               # bump CURRENT_SCHEMA_VERSION to 2; add v1→v2 migration
state/persistence/e2e/migrations.engine.test.ts  # hermetic tests for v1→v2 migration path
state/presenters/character.engine.ts          # remove null-guards; direct derivedStats / nonCombatStats access
state/presenters/inventory.modal.engine.ts    # remove fallback in equipment comparison (if any)
```

## Tests

**Hermetic e2e:** `state/persistence/e2e/migrations.engine.test.ts`:
- `v1 → v2 migration adds missing derivedStats` — mock v1 save with only baseStats, verify derived fields populated
- `v1 → v2 migration adds missing nonCombatStats` — verify save/test modifiers populated
- `v1 → v2 migration preserves existing fields` — saves that already have derivedStats/nonCombatStats unchanged
- `v1 → v2 migration on malformed player throws` — corrupt player data triggers descriptive error

**Presenter tests:** Extend existing `character.engine.test.ts` and `inventory.modal.engine.test.ts`:
- Remove tests for null-guard paths (they should no longer be reachable)
- Verify presenters work with properly migrated state structure

## Verify gate

```bash
npm run verify
```

All existing tests must pass. The character screen presenter tests in particular should continue working with the cleaned-up field access.

## Commit body template

```
feat: persistence migration v1→v2 backfill engine state fields (Phase 15)

- Schema version bumped to 2 with v1→v2 migration step
- Missing derivedStats/nonCombatStats backfilled using engine helpers
- Character presenter null-guards removed (derivedStats guaranteed present)
- Inventory modal equipment comparison cleaned up

Decisions:
- Used engine deriveStats/deriveNonCombatStats for canonical derivation
- Atomic migration: either completes successfully or throws
- Preserves all existing baseStats, only adds missing derived fields
```

## DoD

1. `state/persistence/migrations.ts`: `CURRENT_SCHEMA_VERSION = 2` with working v1→v2 migration function.
2. Migration properly backfills `derivedStats` and `nonCombatStats` using engine helpers.
3. `state/presenters/character.engine.ts`: All `(player as any)` casts and `?? 0`/`?? {}` fallbacks removed.
4. `state/presenters/inventory.modal.engine.ts`: Equipment comparison uses guaranteed `derivedStats`.
5. Hermetic tests cover v1→v2 migration success and failure paths.
6. All existing character and inventory presenter tests pass.
7. `npm run verify` green.

## Follow-ups (out of scope)

- **Physical device migration verification** — test v1→v2 migration on actual saved game state from TestFlight users (pending Phase 13 distribution).
- **Migration UI feedback** — if migration takes significant time, surface progress to user (low priority for single-player local saves).