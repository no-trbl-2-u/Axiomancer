# Spec 05c — Item Rarity & Instance Model

## Goal

Replace the 50-item named library (Spec 05b) with a short `EquipmentTemplate`
list and a runtime instance-creation system. Rarity is an instance-level property
(like PoE2), not baked into the item definition. The `Equipment.tier` field is
removed and replaced by two new fields: `rarity: ItemRarity` (Common/Uncommon/
Rare/Unique) and `requiredLevel: number` (controls when the item can drop and
scales mod value ranges).

**Success state:** `dropItem('iron-blade', 8)` returns a `Common` Equipment
with no mods and base stats only. `dropItem('iron-blade', 8, 'uncommon')` returns
an `Uncommon` instance with exactly 1 rolled weapon mod whose value falls within
the range defined for player level 8. A `Unique` item instance always has exactly
3 mods whose types match the `UniqueItemTemplate` definition but whose values are
rolled. All 50 items from Spec 05b's library are removed; the 21 new templates
replace them. Existing tests that reference `equipment.tier` are updated.

## Why now / dependencies

- **Depends on:** Spec 05 (Equipment type, `equipItem`/`unequipItem` reducers,
  combat-start seeding) and Spec 05b (the library this spec supersedes). Spec 05d
  (modifier catalogue) must be written concurrently — the `dropItem` factory in
  this spec calls `rollModifiers` defined there.
- **Unblocks:** Spec 05d (modifier catalogue references template IDs), Spec 05e
  (set items reference template IDs), Spec 07 (enemy loot drops call `dropItem`),
  Spec 08 (shops stock templates, not pre-built items), Spec 11 (RNG seeding for
  `dropItem`).

## Current state (after Spec 05b)

- `Equipment` has `tier: EffectTier` (1|2|3). This field is **removed** by
  this spec.
- `src/Items/equipment.library.json` contains 50 named Equipment objects with
  `tier` and hardcoded `statModifiers`. This file is **archived** (moved to
  `src/Items/_archive/equipment.library.json`) and replaced by
  `src/Items/equipment.templates.ts`.
- No `rarity`, `requiredLevel`, or `rolledMods` fields exist yet.
- The `EffectTier` (1|2|3) type is NOT removed — it remains on `Effect`,
  `EquipmentProcTrigger`, and `ActiveEffect`. Only `Equipment.tier` is removed.

## Open questions

1. **`EquipmentTemplate` naming.** `BaseItem` is already a shared interface in
   `src/Items/types.ts` (id/name/description/category). Should the new base item
   concept be called `EquipmentTemplate` to avoid confusion?
   > Yes — `EquipmentTemplate` for the definition shape; `Equipment` (with the
   > new `rarity`/`requiredLevel`/`rolledMods` additions) remains the instance shape.

2. **RNG seeding.** Should `dropItem` accept a seeded random function (tying into
   Spec 11's deterministic RNG harness)?
   > Yes — `dropItem` accepts an optional `rng: () => number` parameter
   > (defaults to `Math.random`). This keeps Spec 05c hermetically testable and
   > aligns with Spec 11's design intent.

3. **Unique item source.** Where do `UniqueItemTemplate` definitions live — in
   the same file as base templates, or a separate `unique.templates.ts`?
   > Separate file `src/Items/unique.templates.ts` for clarity. Unique items are
   > conceptually distinct (curated, not procedural); keeping them separate makes
   > the distinction explicit.

4. **Backward-compat shim for `tier`.** Test fixtures and CLI display code in
   Specs 05 and 05b reference `item.tier`. Should a temporary shim be provided?
   > No shim — update all references in the same PR. The affected files are
   > small in scope (test fixtures and display helpers). A shim would mask the
   > migration and rot in place.

5. **Stat floor.** Can a Common (0-mod) template have meaningful base stats, or
   should Common items be intentionally weak (encouraging Uncommon+ drops)?
   > Common items should have meaningful but modest base stats — a Common weapon
   > is a valid starting choice, not vendor fodder. Progression comes from
   > `requiredLevel`-gating the higher-power templates, not from making Commons
   > useless.

## Proposed approach

1. **New `ItemRarity` type** in `src/Items/types.ts`:
   ```typescript
   export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'unique';
   ```

2. **New `RolledModifier` type** in `src/Items/types.ts`:
   ```typescript
   export interface RolledModifier {
     modId: string;
     value: number; // rolled once at drop, stored on instance
   }
   ```

3. **Update `Equipment` interface** in `src/Items/types.ts`:
   - Remove `tier: EffectTier`
   - Add `rarity: ItemRarity`
   - Add `requiredLevel: number`
   - Add `rolledMods?: RolledModifier[]` (absent on manually-constructed items
     and Common drops; present on Uncommon/Rare/Unique instances)

4. **New `EquipmentTemplate` interface** in `src/Items/types.ts`:
   ```typescript
   export interface EquipmentTemplate {
     id: string;
     name: string;
     description: string;
     slot: EquipmentSlot;
     requiredLevel: number;
     baseStatModifiers?: StatModifier[]; // stats on a 0-mod Common instance
   }
   ```

5. **New `UniqueItemTemplate` interface** in `src/Items/types.ts`:
   ```typescript
   export interface UniqueItemTemplate extends EquipmentTemplate {
     fixedModIds: [string, string, string]; // exactly 3 mod IDs
     setMembership?: string; // set ID — reserved for late-game (Spec 05e+)
   }
   ```

6. **Base template library** — `src/Items/equipment.templates.ts`:
   21 templates across 7 slots × 3 progression tiers (by `requiredLevel`):

   | Slot      | lvl 1 ID          | lvl 10 ID          | lvl 20 ID           |
   |-----------|-------------------|--------------------|---------------------|
   | weapon    | `iron-blade`      | `steel-blade`      | `mithril-blade`     |
   | armor     | `hide-vest`       | `chain-mail`       | `plate-mail`        |
   | head      | `leather-cap`     | `chain-coif`       | `full-helm`         |
   | body      | `cloth-wrap`      | `leather-coat`     | `scaled-coat`       |
   | hands     | `cloth-gloves`    | `chain-gauntlets`  | `plate-gauntlets`   |
   | feet      | `sandals`         | `leather-boots`    | `iron-greaves`      |
   | accessory | `copper-ring`     | `silver-ring`      | `gold-ring`         |

   Each template defines `baseStatModifiers` for its Common instance.
   The spec defines the exact base stats at implementation time; the table is
   the authoritative list of IDs.

7. **Unique template library** — `src/Items/unique.templates.ts`:
   Ship with 2 named Uniques for initial playtesting:
   - `axioms-edge` (weapon, lvl 5, fixedModIds: 3 weapon mods incl. 1 unique-only)
   - `paradox-loop` (accessory, lvl 15, fixedModIds: 3 accessory mods incl. 1 unique-only)

   Exact mod IDs filled in by Spec 05d once the catalogue is defined.

8. **`dropItem` factory** — `src/Items/item.factory.ts`:
   ```typescript
   function dropItem(
     templateId: string,
     playerLevel: number,
     rarity?: ItemRarity,    // if omitted, drawn from rarityWeightTable
     rng?: () => number,     // defaults to Math.random
   ): Equipment
   ```
   Logic:
   1. Look up `EquipmentTemplate` (or `UniqueItemTemplate`) by ID.
   2. Assert `playerLevel >= template.requiredLevel`.
   3. If `rarity` is not provided, draw from the weighted table below.
   4. Call `rollModifiers(template, rarity, playerLevel, rng)` (Spec 05d) to get
      `RolledModifier[]`.
   5. Call `resolveModifiers(template, rolledMods)` (Spec 05d) to merge base stats
      and mod payloads into Equipment fields.
   6. Return the complete `Equipment` instance.

9. **Rarity weight table** (used when `rarity` is not forced):

   | Rarity   | Weight | Notes                               |
   |----------|--------|-------------------------------------|
   | common   | 60     | Majority of drops                   |
   | uncommon | 30     | Reliable mid-tier drops             |
   | rare     | 9      | Chase drops in normal play          |
   | unique   | 1      | Rare; specific templates only       |

   Implementation: weighted random using the `rng` parameter for determinism.

10. **Archive Spec 05b library** — move `src/Items/equipment.library.json` to
    `src/Items/_archive/equipment.library.json`. Update all imports.

11. **Update `tier` references** — the following files reference `equipment.tier`
    and must be updated in the same PR:
    - `src/Items/types.ts` (type definition)
    - `src/Items/equipment.engine.ts` (any tier-gated logic)
    - `src/Items/e2e/equipment.engine.test.ts` (test fixtures)
    - `src/CLI/combat.display.ts` (display helpers that show tier)
    - `docs/equipment.md` (update type shape section)

12. **Tests:**
    - `dropItem(template, playerLevel)` returns Common with no `rolledMods`.
    - `dropItem(template, playerLevel, 'uncommon')` returns exactly 1 rolled mod.
    - `dropItem(template, playerLevel, 'rare')` returns exactly 2 non-duplicate mods.
    - `dropItem(uniqueTemplate, playerLevel, 'unique')` returns exactly 3 mods
      matching `fixedModIds` with values within declared ranges.
    - Deterministic: `dropItem(t, 5, 'uncommon', seededRng)` returns the same
      result across calls.
    - Equipping a `dropItem` result passes through `equipItem` unchanged (no
      regressions from removing `tier`).

## Acceptance checklist

- [x] `ItemRarity` and `RolledModifier` types exported from `src/Items/`.
- [x] `Equipment.tier` removed; `rarity` and `requiredLevel` added.
- [x] `EquipmentTemplate` and `UniqueItemTemplate` interfaces defined and exported.
- [x] 21 base templates in `src/Items/equipment.templates.ts`.
- [x] 2 Unique templates in `src/Items/unique.templates.ts` (stubs; mod IDs filled
      in when Spec 05d is complete).
- [x] `dropItem` factory in `src/Items/item.factory.ts` with seeded-RNG support.
- [x] `src/Items/equipment.library.ts` archived to `src/Items/_archive/`; no
      remaining imports. (The Spec text references `.json` — the actual archived
      file is the `.ts` library that replaced it earlier in the project.)
- [x] All `equipment.tier` references updated across codebase.
- [x] Hermetic drop tests covering all four rarity levels.
- [x] `docs/equipment.md` reflects the updated type shape.

## Implementation notes (post-implementation)

- `Equipment.tier: 1 | 2 | 3` is removed. The instance now carries
  `rarity: ItemRarity` and `requiredLevel: number`, plus an optional
  `rolledMods: RolledModifier[]` populated by the factory.
- The 50-item Spec 05b library is archived at
  `src/Items/_archive/equipment.library.ts` together with its e2e suite
  (`equipment-resource.engine.test.ts`). Both `tsconfig.json` and
  `vitest.config.ts` exclude `src/**/_archive/**` so the archived code is
  neither type-checked nor run; it lives on as a migration reference.
- `equipment.templates.ts` lists exactly 21 `EquipmentTemplate`s across the
  documented 7-slot × 3-progression-tier grid (lvl 1 / 10 / 20). Common drops
  carry the template's `baseStatModifiers` and no `rolledMods`.
- `unique.templates.ts` lists the 2 ship-with Uniques (`axioms-edge`,
  `paradox-loop`). Their `fixedModIds` reference placeholder catalogue entries
  that Spec 05d will canonicalise; the factory tolerates the placeholders
  today by rolling a value of 0 for unknown IDs (intent: stable shape, neutral
  mechanics, until the catalogue lands).
- `item.factory.ts` ships a *minimal* inline modifier catalogue — enough to
  drop Commons / Uncommons / Rares / Uniques with the right shape, slot-scoped
  procedural pool, level-banded value ranges, and deterministic RNG. Spec 05d
  replaces this catalogue with a richer one (proc triggers, multiplier mods,
  themed pools) without changing the `dropItem` signature.
- The rarity weight table (`rarityWeightTable`) follows the documented
  60/30/9/1 distribution. For regular templates the random draw excludes the
  `unique` row — uniqueness is template-gated. Passing `rarity: 'unique'`
  with a regular template throws.
- Hermetic e2e suite at `src/Items/e2e/item.factory.engine.test.ts` (24 tests)
  covers Common / Uncommon / Rare / Unique drop shapes, determinism, validation
  errors, the weighted-draw distribution, and an `equipItem` round-trip that
  proves the Spec 05 equip pipeline is unaffected by removing `Equipment.tier`.

## Out of scope

- Modifier catalogue content — Spec 05d.
- Set item definitions and bonuses — Spec 05e.
- Drop table integration with enemy loot — Spec 07.
- Shop stock drawing from templates — Spec 08.
- Seeded RNG harness for the full game loop — Spec 11.
- Crafting or item upgrading.
