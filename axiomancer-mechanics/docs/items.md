# Items

## Overview

The `Items` module spans four item kinds, a four-tier rarity system, a
modifier catalogue, and the loot factory. Items live on
`Character.inventory` and `Character.equipment`; the engine never holds
loose item state outside those fields. Equipment has its own deep
chapter — see [`equipment.md`](./equipment.md). This page is the
top-level index.

## Item kinds

| Kind | Type guard | Behaviour |
|---|---|---|
| `Equipment` | `isEquipment(item)` | Sits in an `EquipmentSlot`; folded into `derivedStats` by `equipItem` at equip-time (Spec 05 Q3 option A). Carries `RolledModifier[]` and a `rarity`. See [`equipment.md`](./equipment.md). |
| `Consumable` | `isConsumable(item)` | Stackable, single-use. Resolved by `useConsumable` (inventory) or `useConsumableEffect` (combat). Library: `consumableLibrary` / `getConsumableById`. |
| `Material` | `isMaterial(item)` | Stackable crafting / quest ingredient. No engine behaviour beyond inventory residency. |
| `QuestItem` | `isQuestItem(item)` | Non-stackable, non-droppable narrative beat. Quest reducers check for presence by `id`. |

All four share the `BaseItem` shape (`id`, `name`, `description`,
`category`, plus item-kind-specific fields). The union type `Item` is
exported from `src/Items/index.ts`.

## Rarity

`ItemRarity = 'common' | 'uncommon' | 'rare' | 'unique'`. Rarity gates
how many modifier rolls an Equipment piece receives — common returns an
empty `rolledModifiers` array, the higher tiers roll progressively more
slots from the appropriate mod pool. See Spec 05c for the curve.

`rarityWeightTable` is the weighted table the loot factory samples when
no rarity is named explicitly. The weights live next to `dropItem` in
`src/Items/item.factory.ts`.

## Modifier catalogue

Six per-slot mod pools (`weaponModPool`, `headModPool`, `bodyModPool`,
`handsModPool`, `feetModPool`, `accessoryModPool`) plus
`armorModPool` (the union of head + body + hands + feet) and
`uniqueModPool` (reserved for hand-tuned unique items). `MOD_POOLS`
exposes the slot → pool mapping; `getModifierById` looks up a single
modifier; `pickValueTier` resolves a `HiddenModRarity` into a value
band; `allModifiers` is the flat union for tooling. See Spec 05d for
the design.

### Previewing rolled mods (library / catalog views — Phase 75)

`previewTemplateAtRarity(templateId, rarity, playerLevel, rng?):
Equipment | undefined` is the consumer-facing read surface for
UI tiers that render `equipmentTemplates × ItemRarity` cells.
Mobile item-library / inventory-detail / loot-preview / vendor-stock
views call it per (template, rarity, playerLevel) cell to render
the player-visible mod stack — `equipmentTemplates` itself carries
only `baseStatModifiers` by design (rolled mods only exist on
runtime `Equipment` instances from `dropItem`).

The helper wraps `dropItem` with the rng + rarity pinned. Default
`rng` is `() => 0.5` (Phase 70 Coastal Tyrant deterministic-drop
pattern) so previews are reproducible per tuple — same cell across
re-renders returns identical Equipment. Pass a custom rng for
randomised previews.

**UI-tier soft-error semantics:** returns `undefined` instead of
throwing for any failure mode — unknown `templateId`, `playerLevel <
template.requiredLevel`, or `rarity === 'unique'` against a
non-unique template. UI code looping templates × rarities cannot
wrap every call in try/catch; the soft-error shape lets the caller
render an empty cell + move on. Unique templates soft-coerce
their rarity to `'unique'` regardless of caller input (caller may
not know the template is unique; the preview should still be
useful).

Hermetic pin at
[`src/Items/e2e/preview-template.engine.test.ts`](../src/Items/e2e/preview-template.engine.test.ts).
Closes the user-jot at `b5c8165` (refined at oversight-15
2026-05-23) about mobile item-library mod-visibility.

**Batch helper — Phase 76.** `previewTemplateAtAllRarities(templateId,
playerLevel, rng?): Record<ItemRarity, Equipment | undefined>` is
the convenience wrapper around the single-cell helper for UI
surfaces that render every-rarity-for-this-template comparison
strips (item-detail tooltips, "Common / Uncommon / Rare / Unique"
stat-ladder views). Calls `previewTemplateAtRarity` four times
internally and zips into a record; each rarity-cell uses the same
`rng` so mod values across the rarity strip are stable per seed.
Same soft-error semantics as the single-cell helper — `undefined`
cells signal "this template can't roll at that rarity at this
level". Unique templates return the unique-rolled Equipment in
every cell (Phase 75 D4 soft-coerce).

## Loot factory

The factory is the only sanctioned way to produce a rolled Equipment
instance:

```ts
dropItem(template, rarity?, rng?)        // template + rarity → Equipment
rollModifiers(template, rarity, rng?)    // → RolledModifier[]
resolveModifiers(modifiers)              // collapse to AggregatedEquipmentModifiers
rarityWeightTable                        // weighted sample table
```

`dropItem` honors `EquipmentGenerationBonus` from the player's existing
equipment via `applyEquipmentGenerationBonus` — that's how the "lucky
amulet" pattern is implemented.

## Inventory

Pure reducers; never mutate `character.inventory` directly.

```ts
addItem(character, item)
removeItem(character, itemId, quantity?)
stackItem(character, item)
addItemToInventory(inventory, item)        // operates on the array, not character
removeItemFromInventory(inventory, itemId, quantity?)
useConsumable(character, consumableId)     // out-of-combat use
```

In combat, consumable use goes through `useConsumableEffect` (returns
the new combat state + the resolved effect) rather than the inventory
reducer.

## Templates and libraries

| Library | Contents |
|---|---|
| `equipmentTemplates` / `getEquipmentTemplate` / `getTemplatesBySlot` | Stable-rarity equipment templates the factory rolls against. |
| `uniqueTemplates` / `getUniqueTemplate` | Hand-tuned unique-tier templates that bypass the modifier rolls. |
| `consumableLibrary` / `getConsumableById` | Shipped consumables (healing potions, philosophical reagents, etc.). |

## API

| Function | Description |
|----------|-------------|
| `dropItem(template, rarity?, rng?)` | Roll a fresh Equipment from a template + rarity. |
| `previewTemplateAtRarity(templateId, rarity, playerLevel, rng?)` | Phase 75 — UI-tier preview wrapper around `dropItem`. Returns `Equipment \| undefined` (soft-errors instead of throwing). Default `rng = () => 0.5` for deterministic per-tuple previews. See § "Previewing rolled mods" above. |
| `previewTemplateAtAllRarities(templateId, playerLevel, rng?)` | Phase 76 — batch wrapper around `previewTemplateAtRarity`. Returns `Record<ItemRarity, Equipment \| undefined>` so UI tooltip / detail views can render the full rarity strip in one call. Same soft-error + deterministic-rng convention as the single-cell helper. |
| `rollModifiers(template, rarity, rng?)` | Roll the modifier slots a rarity tier allows. |
| `resolveModifiers(modifiers)` | Collapse a `RolledModifier[]` into the aggregated stat payload. |
| `addItem` / `removeItem` / `stackItem` / `useConsumable` | Inventory reducers on a `Character`. |
| `addItemToInventory` / `removeItemFromInventory` | Lower-level reducers operating on the array. |
| `useConsumableEffect(state, consumableId)` | Combat-tier consumable use (resolves effects + emits events). |
| `aggregateCombatStartTokens(equipment)` | Combat-start token aggregation (e.g. `lock-aim`). |
| `getEquipmentProcTriggers(equipment)` | List the proc-trigger metadata on an Equipment. |
| `buyItem(character, item, price)` / `sellItem(character, itemId, price)` | Phase 37 shop reducers — pure `Character → Character`. |
| `isEquipment` / `isConsumable` / `isMaterial` / `isQuestItem` | Type guards on `Item`. |

## Shop economy (Phase 37)

`Character.currency` (Spec 08 Q8) is spent and earned through two pure
reducers in `src/Items/shop.reducer.ts`:

- `buyItem(character, item, price)` — deep-clones `item`, appends it to
  the inventory, decrements `currency` by `price`. Returns the input
  character unchanged on negative price or insufficient funds (no
  exceptions across the library boundary).
- `sellItem(character, itemId, price)` — removes the first matching
  inventory entry and increments `currency` by `price`. Returns the
  input character unchanged on negative price or missing item.

Both reducers ride on the `village` MapEventKind. A `VillagePayload`
declares a `shop?: ShopInventory` field carrying `wares: { itemId,
price }[]`; `resolveVillage` forwards it onto the resolved event so a
UI consumer (or the CLI Map tab) can render a buy / sell loop. The
engine does not enforce a "shops buy at half" policy — that's an
authoring / UI concern. The CLI affordance lives in `src/CLI/game.cli.ts`
(`shopLoop`); it quotes a default sell price of `floor(ware.price / 2)`
when the player offers something the shop also sells.

Two authored starter shops ship in `src/World/MapEvents/content.ts`:

| Node | Name | Wares (itemId → price) |
|---|---|---|
| `fv-3` | Fishing Village Stalls | `healing-potion` (25), `minor-healing-potion` (12), `antidote` (30), `heart-draught` (22) |
| `nf-8` | Glen Market | `minor-healing-potion` (12), `philosopher-tea` (35), `void-essence` (40), `clarity-serum` (28) |

Types live alongside the reducer (`src/Items/shop.types.ts`):

```ts
interface ShopWare { readonly itemId: string; readonly price: number }
interface ShopInventory { readonly wares: ReadonlyArray<ShopWare> }
```

## Pending

- Crafting recipes — `Material` ships the shape but no
  `craftItem(materials, recipe)` reducer exists yet. Recipe authoring
  + a `recipes.library.ts` would unlock the crafting CLI surface
  sketched in Spec 05.
- Per-ware stock + refresh policy (Phase 37 follow-up).

The agent-graded shop walkthrough at
`automation/scripts/walkthroughs/shop.{json,goal.md}` shipped at Phase 37
unit 5 (`729e705`) — covers a buy → sell round-trip on
`minor-healing-potion` (25 → 13 → 19 currency, inventory empty again).
See [`automation/scripts/walkthroughs/README.md`](../automation/scripts/walkthroughs/README.md)
for the inventory.
