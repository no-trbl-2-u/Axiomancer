# Phase 135 — Item rarity shine affordances

## Outcome

Make item rarity legible at a glance across the mobile inventory/reward item surfaces:

- **Uncommon** items — green shine, representing **1 affix**.
- **Rare** items — blue shine, representing **2 affixes**.
- **Unique** items — red outline, representing **3 set-in-stone modifiers**.

The shine/outline is a visual affordance layered on top of the already-shipped item/equip-delta surfaces. It should make loot quality readable before the player expands a card.

## Source / user decision

T direct steering, 2026-06-17:

> create a mobile phase (top of queue) to add a green shine to uncommon items (1 affix), a blue shine to rare items (2 affixes), and a red outline to "Unique items" (which would have 3, set in stone modifiers).

Promote this above all else.

## Mechanics truth to respect

Mobile now consumes `axiomancer-mechanics@0.22.0`:

- `uncommon` equipment carries exactly one procedural affix: prefix **or** suffix.
- `rare` equipment carries two procedural affixes: prefix **and** suffix.
- `unique` equipment remains fixed/non-procedural. For mobile presentation doctrine, treat uniques as carrying **3 set-in-stone modifiers** and mark them with a red outline rather than a green/blue procedural shine.

## Decisions made upfront — DO NOT ASK

- Drive the visual state from `item.rarity`, not from parsing `item.name` and not from counting `prefixName` / `suffixName` at render time.
- Use structured affix fields only for supporting labels/tooltips, never for deciding rarity color.
- Do not introduce a new rarity taxonomy.
- Common items keep the existing plain treatment.
- Uncommon and rare get a **shine/glow** treatment, not a hard outline.
- Unique gets a **red outline**, and it should visually win over equipped/worn border styling without hiding the WORN badge.
- Prefer theme-tokenized colors and derived alpha helpers over raw hex literals. If the current palette lacks explicit green/blue rarity colors, add a small rarity-token helper/module rather than scattering hex values through components.
- Apply the treatment to the main inventory `ItemCard` first, then mirror it on reward/loot tiles where the same item-rarity card affordance exists.
- Preserve accessibility: collapsed card labels should continue to identify the item; add rarity/affix-count wording where useful, e.g. “rare, two affixes” or “unique, three fixed modifiers.”

## Implementation units

1. **Rarity visual token helper**
   - Add a pure helper, likely one of:
     - `components/inventory/rarityAffordance.ts`
     - `theme/rarity.ts`
   - Input: item rarity (`common | uncommon | rare | unique`).
   - Output:
     - visual kind: `plain | green-shine | blue-shine | red-outline`
     - accessible label phrase:
       - common: `common`
       - uncommon: `uncommon, one affix`
       - rare: `rare, two affixes`
       - unique: `unique, three fixed modifiers`

2. **Inventory card rendering**
   - File: `components/inventory/ItemCard.tsx`
   - Add the green shine / blue shine / red outline to item cards.
   - Ensure unique red outline composes with existing equipped border logic.
   - Ensure expanded and collapsed cards both preserve the treatment.
   - Add stable `testID`s or inspectable style handles for tests, e.g. `rarity-shine-${item.id}` / `rarity-outline-${item.id}`.

3. **Equipment dock / worn slots**
   - File: `components/inventory/EquipmentSlot.tsx`
   - If worn equipment slots render item frames separately from `ItemCard`, mirror the same rarity treatment there or explicitly document why `ItemCard` is the only player-facing rarity card surface.

4. **Reward / aftermath surfaces**
   - File likely involved: `components/event/aftermath/CombatVictoryPanel.tsx`
   - Existing `RarityRail` uses muted/common rail colors. Upgrade or align it so reward loot tiles communicate the same rule:
     - uncommon = green shine/rail
     - rare = blue shine/rail
     - unique = red outline
   - Do not redesign the aftermath modal; this is a focused rarity affordance pass.

5. **Tests**
   - Extend:
     - `components/inventory/__tests__/ItemCard.test.tsx`
     - `components/event/aftermath/__tests__/CombatVictoryPanel.test.tsx`
     - any new helper test if a pure helper is added
   - Required assertions:
     - uncommon item renders green shine and accessible “one affix” language.
     - rare item renders blue shine and accessible “two affixes” language.
     - unique item renders red outline and accessible “three fixed modifiers” language.
     - common item does not render shine/outline.
     - equipped unique still shows WORN and keeps unique outline.
     - expanded item cards preserve rarity treatment.

## Verification gate

Run:

```bash
npm run typecheck
npm test -- --runInBand components/inventory/__tests__/ItemCard.test.tsx components/event/aftermath/__tests__/CombatVictoryPanel.test.tsx
npm run verify
```

If visual smoke is available, capture the inventory/reward surface with one uncommon, one rare, and one unique item. If `verify:visual` is blocked by the known Metro/Node `configs.toReversed` config-load issue, report that exact blocker and do not mask it.

## Commit body template

```text
Phase 135 — Item rarity shine affordances

- add rarity affordance helper for common/uncommon/rare/unique item frames
- render green shine for uncommon, blue shine for rare, red outline for unique
- preserve equipped/WORN styling and expanded-card treatment
- mirror rarity treatment on reward loot tiles
- add accessibility phrases for affix/fixed-modifier count

Verification:
- npm run typecheck
- npm test -- --runInBand components/inventory/__tests__/ItemCard.test.tsx components/event/aftermath/__tests__/CombatVictoryPanel.test.tsx
- npm run verify
```

## Definition of Done

- Uncommon items visibly shine green.
- Rare items visibly shine blue.
- Unique items have a visible red outline.
- Common items remain plain.
- Item cards and reward tiles agree on the rarity language.
- Accessibility labels include rarity and affix/fixed-modifier count where appropriate.
- Tests cover all four rarities and equipped unique composition.
- `npm run verify` is green.

## Follow-ups out of scope

- Changing mechanics rarity rules.
- Changing unique modifier counts in mechanics.
- Full inventory redesign.
- Tooltip encyclopedia for every affix/modifier.
