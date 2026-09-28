# Phase T6 — Remove alignment, philosophy and GRACE (D39)

> Row: `plan/steps/01_build_plan.md` → THE MAP REVAMP block, row T6. Ruling:
> D39 in `plan/2026-09-25-refactor-strategy.decisions.md`.

## Outcome

The philosophical-alignment grid and the GRACE meter are gone from the
engine, the app, the CLI and the living docs. A card's colour survives under
a neutral name, `color`, with no behaviour change. Old saves load.

## Why

T, 2026-09-27: "remove everything that has to do with alignment and
philosophy. That includes grace." S3 (stat scaling) is built on the stats
alone, so the grid and the meter have to go first.

## Inventory (what is removed)

Engine (`axiomancer-mechanics`):
- `src/Ledger/` whole: the three-axis cube (epistemology, outlook, scope),
  the 27 cells with exemplars, tales and besetting sins, `bucketAxis`,
  `getAlignmentCell`, `applyAlignmentDelta`, `defaultAlignment`, and their
  public exports.
- `GameState.philosophicalAlignment`, `GameState.lastSeenAlignmentCells` (the
  per-tree observer cache) and `GameState.moralMeter` (GRACE).
- Actions `SHIFT_MORAL_METER` and `SHIFT_PHILOSOPHICAL_ALIGNMENT`, store
  verbs `shiftMoralMeter` and `shiftPhilosophicalAlignment`, selector
  `selectMoralMeter`. Befriending no longer adds +1 GRACE.
- Dialogue gates `requires.requiresAlignment` and
  `requires.playerAlignmentCellChangedSince`; effects `effect.alignmentDelta`
  and `effect.moralDelta`; result fields `moralShift` and
  `philosophicalShift`.
- `alignmentDelta` on map-event pool entries and on `FriendshipReward`;
  `philosophicalAlignment` on enemies; `alignmentShift` on the combat-end
  report; `sourcedFromCell` on effects.
- State fixtures: `moralMeter` and `alignment`.
- CLI: the Oaths block and the Grace line on the character sheet, the
  Journal's alignment stub, and the dev menu's set-moral / set-alignment.

App (`axiomancer-mobile`): the GRACE track on the exploration HUD and the
SELF sheet, the grace balance copy, the memoir's GRACE band, the alignment
read-backs, the debug alignment shifter, and the WITHDRAW cost (grace -2).

Content: every authored `alignmentDelta`, `moralDelta`, alignment gate and
observer gate, and the per-enemy alignment pins. Choices an alignment gate
hid are ungated, not deleted: they are always offered now.

Kept: card colour (renamed `philosophicalAspect` -> `color` in the engine,
the app and the card editor), the dice colours and the colour-match bonus.

## Save migration

`GAME_STATE_VERSION` 25 -> 26. The v25 -> v26 hop strips the three state
fields and renames `philosophicalAspect` to `color` anywhere in the save (a
staged encounter carries its enemies' cards whole).

## Tests

- New: `Game/e2e/alignment-grace-removal-migration.engine.test.ts` pins the
  hop.
- Tests whose whole subject was the removed systems are deleted
  (`moral.meter`, `old-marrow-observer`, `Ledger/e2e/*`, the app's GRACE and
  alignment screen tests). Mixed tests lose only those assertions; tests that
  asserted a gated choice was hidden now assert it is offered.
- `npm run verify` green in all three workspaces.

## Out of scope

- Any balance change. Card colour behaviour is unchanged.
- S3's stat scaling (next row).
