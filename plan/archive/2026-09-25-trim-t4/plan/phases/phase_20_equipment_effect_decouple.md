# Phase 20 — Decouple equipment from effects (static stat bumps only)

> Agent-facing brief. Ship without asking; document judgment calls in
> the commit body. Depends on phase 18 (5-slot `EquipmentLoadout`) and
> phase 19 (relics + `grantsSignature` + `maxHp`).

## Outcome / Why

User-intent phase 2: equipment must stop being coupled to combat
effects and carry **only static stat bumps** (+ `grantsSignature` from
phase 19). Today equipment reaches combat through three effect channels
(mapped in planning):

1. `passiveEffects: string[]` — pushed onto `Character.effects` as
   permanent `ActiveEffect`s at equip-time
   (`src/Character/equipment.reducer.ts` `applyPassiveEffects` — `:127`
   pre-epic; phase 18 reshaped this file, re-locate at ship time —
   removed by `sourceId` on unequip).
2. `onHitEffects` / `onDefendEffects: EquipmentProcTrigger[]` — folded
   into the combat proc roll via `getEquipmentProcTriggers`
   (`src/Items/equipment.engine.ts:85`).
3. `resourceInteraction` (`combatStartTokens` + `generationBonus`) +
   `critStyle` — seeded/added by `aggregateCombatStartTokens`
   (`equipment.engine.ts:35`) and `applyEquipmentGenerationBonus`
   (`:63`).

This phase strips all three application paths so **no equipment ever
applies an effect, seeds a token, or rolls a proc**. After it,
`getEquipmentModifiers` → `statModifiers` (incl. the phase-19 `maxHp`)
is the sole channel from equipment to the character. The 8 relics
already carry no effects; this closes the door on the *old* library
items too (still present until phase 21) and on any future equipment.

**Success state:** Equipping any item (old library piece or relic) into
any of the 5 loadout positions changes only `derivedStats` /
`maxHealth`. `Character.effects` gains no entries from equipping;
combat proc rolls contain no equipment-sourced triggers;
`initializeCombat`/Hazard combat-init seeds no equipment tokens. All
gates green.

## Scope — what to remove/neuter

- `src/Character/equipment.reducer.ts` — delete `applyPassiveEffects` /
  `removePassiveEffects` calls from `equipItem` / `unequipItem`; equip no
  longer touches `Character.effects`. (Keep the reducers' stat/maxHp
  recompute path from phases 18-19 intact.)
- `src/Items/equipment.engine.ts` — remove `getEquipmentProcTriggers`,
  `aggregateCombatStartTokens`, `applyEquipmentGenerationBonus` from the
  live paths and their call sites in the combat resolver / init. Verify
  whether the live **Hazard-Pattern** combat even reads these (planning
  flagged the `resourceInteraction` token economy as legacy Spec-04
  skill-combat; if it's already orphaned relative to
  `simulateHazardPatternCombat`, removal is a pure dead-path delete —
  confirm before assuming).
- Type fields (`passiveEffects`, `onHitEffects`, `onDefendEffects`,
  `resourceInteraction`, `critStyle` on `Equipment`; `ResourceInteraction`
  / `EquipmentProcTrigger` / `ResourceGenerationBonus` types): **leave
  the type declarations for phase 23** to remove alongside the modifier
  catalogue that populates them — but ensure nothing *reads* them after
  this phase. (Neuter behavior now; delete types in the teardown to keep
  this phase's blast radius contained and its diff reviewable.)
- Consumables are **out of scope** (planning decision): `useConsumableEffect`
  and consumable effect references are untouched — this phase is
  equipment-only. Do not delete any effect *definitions* here (that's
  phase 23, and only the equipment-only ones).

## Reality-check before shipping

Confirm the live combat engine's actual equipment reads. Grep the
Hazard-Pattern init/resolver (`simulateHazardPatternCombat`,
`initializeCombatEncounter`, `combat.engine.ts`) for
`getEquipmentProcTriggers` / `aggregateCombatStartTokens` /
`applyEquipmentGenerationBonus` / `passiveEffects`. If a path is already
dead relative to live combat, note it in the commit body (removal is
free); if it's live, the removal is a deliberate balance change (equipment
no longer influences combat beyond stats) — which is exactly the intent.

## Decisions made upfront — DO NOT ASK

- **Neuter application now, delete types in phase 23.** Splitting the
  behavioral decouple (this phase) from the type/library teardown (22)
  keeps each diff reviewable and each phase independently green.
- **No fallback / compatibility shim for equipment effects.** The design
  decision is that equipment carries no effects, full stop.
- **Do not touch consumables' effect path.** Out of scope by decision.
- **Old library items becoming stat-only is acceptable mid-epic** — they
  are deleted entirely in phase 21; their now-ignored effect data is
  harmless dead data until then.

## Pages × tests matrix

| Surface | Tests |
|---|---|
| `equipItem`/`unequipItem` | equipping adds **no** `ActiveEffect` (any slot kind, incl. each accessory position); stat recompute + maxHp still correct; unequip removes no effects (none were added) |
| combat proc roll | no equipment-sourced triggers present with a proc-bearing old item equipped |
| combat init | no equipment-seeded `combatResources` tokens |
| relics (phase 19) | still stat-only; signature derivation regression-green |

Remove/adjust the existing tests that *asserted* equipment effects/procs/
tokens applied (`equipment-resource.engine.test.ts` scenarios, passive-
effect equip tests) — they now assert the *absence* of those paths.

## Verify gate

```bash
npm run verify --workspace axiomancer-mechanics
npm run verify --workspace axiomancer-mobile   # @mechanics surface touched
```

## Commit body template

```
refactor(mechanics): decouple equipment from effects — phase 20

- Equip no longer applies passiveEffects to Character.effects; combat no
  longer rolls equipment onHit/onDefend procs; combat init no longer
  seeds equipment resourceInteraction tokens or generationBonus.
- statModifiers (incl. maxHp from phase 19) is now the SOLE
  equipment→character channel. Type fields left in place for phase 23 to
  delete with the modifier catalogue that populated them.
- Consumables untouched (out of scope).

Decisions:
- Neuter application now, delete types/catalogue in phase 23 (reviewable diffs).
- <note here whether the removed combat paths were already dead vs live
  relative to simulateHazardPatternCombat, per the reality-check>

Closes #<phase-issue-number>
```

## DoD

Flip Phase 20 `[ ]` → `[x]`, append hash, Phase log. `npm run
deploy:check` green.

## Follow-ups

- Phase 21 removes the procedural library; phase 23 deletes the now-dead
  effect-channel types + equipment-only effect definitions.
