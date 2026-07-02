# Spec 06 — Inventory Screen Wiring

[DONE on 2026-05-13]

## Goal

Replace `app/(tabs)/inventory.tsx`'s hard-coded item list with engine-
driven inventory data via `selectInventoryViewModel`. Using a
consumable dispatches through the engine's item reducer.

**Success state:** Items render from `state.player.inventory`. Tapping
a consumable calls `actions.useConsumable(itemId)`. Equipping a
weapon dispatches `actions.equipItem`. Stack counts, item categories,
and rarity tints all come from the engine.

## Why now / dependencies

- **Unblocks:** combat-time item use (out of scope here, but the
  inventory screen is the gateway to it).
- **Depends on:** Spec 01, 02, 03.

## Current state

- The inventory screen exists (`app/(tabs)/inventory.tsx`) with a
  literal item list — no engine integration.
- Engine exports `addItem`, `removeItem`, `useConsumable`,
  `stackItem`, `Item` and its variants, type guards (per README's
  `Items` group).

## Open questions

1. **Categories.** The engine's `Item` is a discriminated union
   (consumable / weapon / armor / etc.). The screen should:
   - (A) **(default)** Group by category in the VM (one section per
     kind).
   - (B) Flat list, sorted by `lastAcquired`.
   - (C) Filter chips (All / Consumables / Gear / Misc).
   > Your answer: A

2. **Use confirmation.** Tapping "Use Potion of Heart" — should it:
   - (A) **(default)** Confirm via a modal first.
   - (B) Apply immediately with an undo toast.
   - (C) Apply immediately without undo.
   > Your answer: A (And show potential results in the modal)

3. **Stacking display.** `stackItem` exists in the engine. Render:
   - (A) **(default)** `Item × 3` as a single row with the count.
   - (B) Three separate rows.
   > Your answer:A

4. **Empty state.** Engine starts with no items. Show:
   - (A) **(default)** "Thy sack is empty." with a sketch.
   - (B) A pre-filled tutorial inventory.
   > Your answer: A

5. **Equipping.** Tapping a weapon — does it auto-equip, prompt for
   slot, or open the character screen?
   > Your answer: Same as consumable, show a modal with updated stats shown

## Proposed approach

1. **Move `inventory.tsx` into a folder** — `app/(tabs)/inventory/index.tsx`
   plus `inventory.engine.ts`, `e2e/inventory.engine.test.ts`.
2. **Implement `selectInventoryViewModel`** consuming
   `state.player.inventory` and `state.player.equipped`.
3. **Action layer** — `inventoryActions.useItem`, `equipItem`,
   `dropItem`.
4. **Refactor the screen.**
5. **Hermetic e2e**:
   - Empty inventory → empty-state VM.
   - Stacking: 3 of same id → single VM row with `count: 3`.
   - Use consumable → engine state reflects HP delta; presenter
     reflects updated player HP.
   - Lifecycle: `createGameStore(memoryAdapter, …)` →
     `addItem(potion)` → `useConsumable(potionId)` →
     `memoryAdapter.save` invocation pattern matches Spec 09's
     contract (or "not yet wired" if Spec 09 isn't merged).

## Acceptance checklist

- [x] All 5 questions answered.
- [x] `app/(tabs)/inventory/` folder exists.
- [x] No literal item list in the screen.
- [x] Hermetic e2e green; component render test exists.
- [x] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Combat-time item use (mid-fight inventory) — future spec.
- Item shop / merchant UI — engine Spec 08.
