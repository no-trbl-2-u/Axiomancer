# Phase 137 — Full character update deltas for equip changes

## Outcome

Replace the narrow “updated stats” equip-change section with a complete character-update preview for **swap**, **equip**, and **unequip** actions.

The UI must still render only what changes, but the comparison should include every character-facing value affected by the equipment transition, not just the current stat-chip subset.

Visual rule:

- Increases/new values: **green text**.
- Decreases/removed values: **red text**.
- Passive effects:
  - old item / removed passive effects: **red text**
  - new item / gained passive effects: **green text**

## Source / user decision

T direct steering, 2026-06-17:

> Then In the next phase, update the "updated stats" section during swap, equip, and unequip step to show ALL updates to the character. Only render what will change though. Green text for increase, red text for decrease. In regards to passive effects, Red text is old item, green text for new item.

## Current state to start from

Phase 133 shipped the existing equip-change surface:

- `state/presenters/equipDelta.ts`
- `components/inventory/EquipDeltaPanel.tsx`
- tests around `EquipDeltaPanel`, `ItemCard`, and inventory e2e

Current behavior already suppresses unchanged values and splits gained/lost buckets, but the “updated stats” surface is too narrow and uses sulfur/gold for gained values. This phase changes the presentation doctrine to a broader character-update preview and green/red polarity.

## Decisions made upfront — DO NOT ASK

- Keep the invariant: render **only changed values**.
- Apply to all three modes:
  - equip
  - unequip
  - swap
- Use green for increases/gained/new item effects.
- Use red for decreases/lost/old item effects.
- Passive effects are not numeric; color by source side:
  - removed old-item passives = red
  - gained new-item passives = green
- Preserve tooltip behavior for stats/effects where it already exists.
- Do not dump the full character sheet.
- Do not show unchanged zero/empty sections.
- Do not change mechanics resolution; this is a presenter/component phase.
- Do not parse item names or affix labels as truth.

## Character-update scope

The worker should audit `Equipment` impact and include all changed character-facing values exposed by current mechanics/mobile types, including at minimum:

- Base/stat modifiers currently shown by `delta.stats`.
- Rolled modifiers and modifier values.
- Passive effects.
- On-hit effects.
- On-defend effects.
- Resource interactions / combat-start tokens.
- Keyword / affix labels that change.

If the engine/mobile state exposes additional equipment-driven character changes by the time this phase runs, include them rather than hard-coding the above list as exhaustive. The rule is: **all changes caused by the equipment transition, only changes rendered**.

## Implementation units

1. **Presenter audit and expansion**
   - File: `state/presenters/equipDelta.ts`
   - Audit every field on equipment that can alter character behavior or presentation.
   - Ensure equip, unequip, and swap produce a complete `EquipDelta` model.
   - If the current model lacks vocabulary for “all character updates,” extend it cleanly rather than overloading unrelated arrays.
   - Preserve deterministic ordering so tests and visual reading are stable.

2. **Rename / relabel the section**
   - File: `components/inventory/EquipDeltaPanel.tsx`
   - Replace narrow “updated stats” language with a broader label, likely:
     - `CHARACTER UPDATES`
     - or `UPDATES`
   - Do not imply the list is only stats if it now includes effects/resources/modifiers.

3. **Green/red styling**
   - Files likely involved:
     - `components/inventory/EquipDeltaPanel.tsx`
     - `theme/rarity.ts` or relevant theme helper if Phase 135 introduced reusable green tokens
   - Numeric increases: green.
   - Numeric decreases: red.
   - New/gained passive/effect tags: green.
   - Old/lost passive/effect tags: red.
   - Avoid sulfur/gold for positive deltas in this panel after this phase.

4. **Mode-specific behavior**
   - Equip from empty slot:
     - show gained/increased values only.
   - Unequip:
     - show removed/decreased values only.
   - Swap:
     - show both old item red values and new item green values.
   - If a stat exists on both old and new item, show only the net change if the numeric value changes; suppress if equal.
   - If an effect exists on both sides with identical id/source impact, suppress it as unchanged.

5. **Tests**
   - Extend:
     - `state/presenters/__tests__/equipDelta.engine.test.ts`
     - `components/inventory/EquipDeltaPanel.test.tsx`
     - `state/e2e/inventory.engine.test.ts` if needed for full equip/swap flow
   - Required assertions:
     - equip shows only gained/green changed values.
     - unequip shows only removed/red changed values.
     - swap shows old item passives red and new item passives green.
     - unchanged stats/effects do not render.
     - rolled modifiers, resource interactions, on-hit, and on-defend changes render when changed.
     - no sulfur/gold positive treatment remains in `EquipDeltaPanel` for character update deltas.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/presenters/__tests__/equipDelta.engine.test.ts components/inventory/EquipDeltaPanel.test.tsx state/e2e/inventory.engine.test.ts
npm run verify
```

If visual smoke is available, capture one equip, one unequip, and one swap state showing changed-only green/red deltas.

## Commit body template

```text
Phase 137 — Full character update deltas for equip changes

- expand equip delta presenter to cover all equipment-driven character updates
- relabel updated-stats surface as changed character updates
- render increases/new item effects in green and decreases/old item effects in red
- preserve changed-only suppression for equip, unequip, and swap
- cover stat, modifier, passive, proc, resource, and keyword delta cases

Verification:
- npm run typecheck
- npm test -- --runInBand state/presenters/__tests__/equipDelta.engine.test.ts components/inventory/EquipDeltaPanel.test.tsx state/e2e/inventory.engine.test.ts
- npm run verify
```

## Definition of Done

- Equip, unequip, and swap previews show all character updates caused by the equipment transition.
- Unchanged values are suppressed.
- Numeric increases are green; numeric decreases are red.
- New passive effects are green; old/removed passive effects are red.
- Existing tooltip affordances survive.
- Tests cover all changed-value categories.
- `npm run verify` is green.

## Follow-ups out of scope

- Mechanics stat calculation changes.
- Full character sheet redesign.
- Rarity shine / loot button work; those belong to Phase 135/136.
