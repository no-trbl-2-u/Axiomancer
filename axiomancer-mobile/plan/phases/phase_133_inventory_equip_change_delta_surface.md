# Phase 133 — Inventory equip-change delta surface

## Outcome

When a player equips, unequips, or swaps an item, the mobile UI should show only what actually changes.

The comparison surface must emphasize deltas: gained/lost stats, modifiers, passive effects, status-effect changes, keyword changes, and resource/economy changes caused by the equipment change. It should not dump the whole item or full character sheet when only a few values move.

## Source / user decision

T direct steering, 2026-06-17:

> make a mobile phase (above all else) in order to "only show effected stats, modifiers, keywords, that change when an item is equipped/changed. (ie. lost and gained stats, passive effects, and status effect changes when an item is equipped/swapped."

This phase is promoted above all else in Mobile so it can consume mechanics affix/provenance work as soon as the engine package exposes it.

## Decisions made upfront — DO NOT ASK

- Interpret “effected” as “affected/changed by the equip operation.”
- The UI should show **deltas only**, not all stats/modifiers/effects.
- Compare the currently equipped item in the same slot against the candidate item.
- If there is no currently equipped item, show gained values only.
- If unequipping, show lost values only.
- If swapping, show both gained and lost values.
- Do not simulate mechanics locally. Use engine item/equipment instance truth and mobile presenters to compute display deltas.
- Preserve canon terms: `VITAE` and `STANCE`; do not introduce `HEALTH` / `GUARD` language.
- If mechanics has not yet published `prefixId`/`suffixId`/`prefixName`/`suffixName`, build the mobile presenter to gracefully omit structured affix labels rather than inventing them locally.

## Implementation units

1. **Presenter delta model**
   - Likely files:
     - `state/presenters/inventory.engine.ts`
     - `state/e2e/inventory.engine.test.ts`
     - `components/inventory/*`
   - Add a pure helper/view-model for item equip comparison:
     - changed stats only
     - gained/lost modifiers only
     - gained/lost passive effect IDs/names where available
     - gained/lost on-hit/on-defend/status-effect hooks where available
     - gained/lost combat resource interactions
     - gained/lost keywords/affix labels when exposed by the engine item instance

2. **Inventory UI surface**
   - Render the delta model in the item detail/equip/swap surface.
   - Use separate visual treatment for gained vs lost.
   - Hide empty sections.
   - Do not render unchanged stats, unchanged passive effects, unchanged status hooks, or unchanged keywords.

3. **Affix / keyword handling**
   - If engine package exposes `prefixName` / `suffixName`, display changes to affix labels as item identity deltas.
   - If it only exposes `rolledMods`, show changed modifier names/IDs from available presenter data.
   - Never parse prefix/suffix out of the display name as authoritative truth.

4. **Tests**
   - Add/extend hermetic Jest coverage for:
     - no currently equipped item → gained-only display
     - candidate weaker in one stat, stronger in another → gained/lost split
     - same stat unchanged → hidden
     - passive effect gained/lost → visible
     - on-hit/on-defend/status-effect hook gained/lost → visible
     - resource interaction gained/lost → visible
     - prefix/suffix metadata present → shown as changed identity/modifier labels
     - prefix/suffix metadata absent → graceful omission, no crash

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand state/e2e/inventory.engine.test.ts components/inventory/__tests__/*.test.tsx
npm run verify
```

If the phase depends on a newly published mechanics version, first verify:

```bash
npm ls axiomancer-mechanics --depth=0
```

and record the installed version in the phase closeout.

## Commit body template

```text
Phase 133 — Inventory equip-change delta surface

- add pure inventory/equipment delta presenter
- show gained/lost stats, modifiers, passive effects, status hooks, keywords, and resources only when changed
- hide unchanged item data in equip/swap comparison
- handle mechanics affix provenance when available

Verification:
- npm ls axiomancer-mechanics --depth=0
- npm run typecheck
- npm test -- --runInBand state/e2e/inventory.engine.test.ts components/inventory/__tests__/*.test.tsx
- npm run verify
```

## Definition of Done

- Equip/swap item UI shows only changed values.
- Gained and lost values are visually distinguishable.
- Unchanged values are hidden.
- Passive effects, status-effect/proc hooks, resource interactions, and modifier/keyword changes are included when they change.
- The presenter is pure and hermetically tested.
- UI does not locally invent mechanics or parse affix truth from names.
- `npm run verify` is green.

## Follow-ups out of scope

- Mechanics affix-library implementation. That is Mechanics Phase 152.
- Inventory art overhaul.
- Equipment pricing/economy redesign.
- Full tooltip encyclopedia for every modifier/effect.
