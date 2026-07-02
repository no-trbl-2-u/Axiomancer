# Spec 05d — Modifier Catalogue

## Goal

Define the modifier type system and populate a minimum viable catalogue of mods
organized into slot-specific pools. When `dropItem` (Spec 05c) creates an
Uncommon (1 mod), Rare (2 mods), or Unique (3 fixed mods) item, it calls
`rollModifiers` from this spec to select mods and `resolveModifiers` to merge
their payloads into the `Equipment` instance's existing fields (`statModifiers`,
`passiveEffects`, `onHitEffects`, `onDefendEffects`, `resourceInteraction`). No
new top-level field is added to `Equipment`; mods are a data-layer convention.

**Success state:** An Uncommon `iron-blade` has exactly 1 mod drawn from
`weaponModPool`. The mod's value falls within the range defined for the item's
`requiredLevel`. `resolveModifiers` merges the mod payload into the Equipment's
`statModifiers` so the existing `equipItem` / `getEquipmentModifiers` pipeline
picks it up transparently. A `rare_mod` weapon mod is measurably harder to roll
than a `common_mod` weapon mod across 1000 simulated drops.

## Why now / dependencies

- **Depends on:** Spec 05c — `EquipmentTemplate`, `UniqueItemTemplate`,
  `RolledModifier`, and `dropItem` are all defined there. Spec 05d fills in the
  catalogue that `dropItem` calls into.
- **Unblocks:** Spec 05c (Unique template `fixedModIds` reference mod IDs from
  this spec), Spec 05e (set items may cross-reference mod IDs for display),
  Spec 07 (enemy loot flavoring may weight toward specific mod pools).

## Current state (after Spec 05c)

- `dropItem` calls `rollModifiers(template, rarity, playerLevel, rng)` but the
  function is a stub returning `[]`.
- `resolveModifiers(template, rolledMods)` is a stub returning base stats only.
- No mod types, pools, or catalogue exist yet.

## Open questions

1. **`Modifier.resolve` shape.** Should `resolve` be a function on the
   `Modifier` object, or a plain data field (a partial Equipment payload)?
   > Plain data — `payload: ModifierPayload` where `ModifierPayload` is a
   > `Partial<Pick<Equipment, 'statModifiers' | 'passiveEffects' | 'onHitEffects'
   > | 'onDefendEffects' | 'resourceInteraction'>>` that is **merged** by
   > `resolveModifiers`. This keeps `Modifier` serialisable (no functions),
   > which matters for save-file and Spec 11 seeding.

2. **Value scaling model.** Two approaches:
   - (A) `levelTiers: { levelReq: number; range: [number, number] }[]` — look up
     the highest eligible tier.
   - (B) A scaling formula `range = [base + floor(level/5) * scale, …]`.
   > Option A — level tiers. More designer control; easier to balance and tweak
   > individual tiers without changing a formula. Three tiers per mod (lvl 1,
   > lvl 10, lvl 20) maps to the three template progression tiers from Spec 05c.

3. **Payload templating.** A mod's `payload` has value-shaped holes (e.g.,
   `statModifiers: [{ stat: 'physicalAttack', value: ROLLED_VALUE }]`). How is
   the rolled value substituted?
   > The `payload` is a template using `value: 0` as a sentinel. `resolveModifiers`
   > iterates `rolledMods`, finds the matching `Modifier`, and replaces `value: 0`
   > entries in `payload.statModifiers` with the actual rolled value. For mods that
   > contribute to `resourceInteraction.combatStartTokens`, the rolled value maps
   > to the token count directly.

4. **Unique-only pool accessibility.** Can an Uncommon or Rare item ever access
   `uniqueModPool` mods?
   > No — `uniqueModPool` mods are drawn only when `rarity === 'unique'` and only
   > for the mod IDs listed in `UniqueItemTemplate.fixedModIds`. They are never
   > available in the procedural roll path.

5. **Duplicate mod prevention.** If a Rare item rolls 2 mods from the same pool,
   can it roll the same mod twice?
   > No — `rollModifiers` samples without replacement from the filtered pool.

## Proposed approach

1. **New `HiddenModRarity` type** in `src/Items/modifier.types.ts`:
   ```typescript
   export type HiddenModRarity = 'common_mod' | 'uncommon_mod' | 'rare_mod';
   ```
   Weight table (used in `rollModifiers`):
   | HiddenModRarity | Weight |
   |---|---|
   | `common_mod`   | 10 |
   | `uncommon_mod` | 3  |
   | `rare_mod`     | 1  |

2. **`ModValueTier` and `ModifierPayload` types** in `src/Items/modifier.types.ts`:
   ```typescript
   export interface ModValueTier {
     levelReq: number;
     range: [number, number]; // [min, max] inclusive, uniform roll
   }

   export type ModifierPayload = Partial<Pick<Equipment,
     | 'statModifiers'
     | 'passiveEffects'
     | 'onHitEffects'
     | 'onDefendEffects'
     | 'resourceInteraction'
   >>;
   ```

3. **`Modifier` interface** in `src/Items/modifier.types.ts`:
   ```typescript
   export interface Modifier {
     id: string;
     name: string; // shown to player on item tooltip
     hiddenRarity: HiddenModRarity;
     validSlots: EquipmentSlot[];
     levelTiers: ModValueTier[]; // ascending by levelReq; at least one entry
     payload: ModifierPayload;   // value: 0 is a sentinel replaced at resolve time
   }
   ```

4. **Slot-specific mod pools** in `src/Items/modifier.catalogue.ts`:
   One exported `const` per slot, each a `Modifier[]`:
   - `weaponModPool`
   - `headModPool`
   - `bodyModPool`
   - `handsModPool`
   - `feetModPool`
   - `accessoryModPool`
   - `armorModPool`
   - `uniqueModPool` — separate; not mixed into slot pools

   A helper map `MOD_POOLS: Record<EquipmentSlot, Modifier[]>` maps slots to
   their pool for use in `rollModifiers`.

5. **`rollModifiers` function** in `src/Items/item.factory.ts` (alongside
   `dropItem` from Spec 05c):
   ```
   rollModifiers(template, rarity, playerLevel, rng) -> RolledModifier[]
   ```
   Logic:
   1. If `rarity === 'common'` → return `[]`.
   2. If `rarity === 'unique'` → iterate `template.fixedModIds`; for each, find
      the mod in `uniqueModPool`, pick the highest eligible `levelTier`, roll
      value, return `RolledModifier[]` of length 3.
   3. Otherwise (`uncommon` = 1 mod, `rare` = 2 mods):
      a. Get pool for `template.slot` from `MOD_POOLS`.
      b. Filter to mods where any `levelTier.levelReq <= playerLevel`.
      c. Weighted-random sample without replacement (N = mod count for rarity)
         using `hiddenRarity` weights.
      d. For each selected mod, pick the highest eligible `levelTier`, roll
         `value` uniformly within `range` using `rng`.
      e. Return `RolledModifier[]`.

6. **`resolveModifiers` function** in `src/Items/item.factory.ts`:
   ```
   resolveModifiers(template, rolledMods) -> Partial<Equipment>
   ```
   Logic:
   1. Start with base: `{ statModifiers: [...template.baseStatModifiers ?? []] }`.
   2. For each `RolledModifier`, look up the `Modifier` by `modId` in all pools.
   3. Deep-merge the mod's `payload` into the accumulator, substituting the
      rolled `value` for any `value: 0` sentinel in `statModifiers` entries.
   4. Array fields (`statModifiers`, `passiveEffects`, `onHitEffects`,
      `onDefendEffects`, `generationBonus`) are concatenated, not replaced.
   5. `combatStartTokens` entries are summed (additive, matching Spec 05b Q2).
   6. Return the merged partial — `dropItem` spreads this onto the base Equipment.

7. **Minimum viable mod catalogue** (shipped with this spec):

   ### `weaponModPool` (4 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `wm-flat-damage` | Keen Edge | `common_mod` | `statModifiers: physicalAttack +N` | lvl1: [1,3], lvl10: [4,8], lvl20: [9,15] |
   | `wm-lifesteal` | Vampiric Strike | `uncommon_mod` | `onHitEffects: regen proc` | lvl1: [1,2], lvl10: [2,3], lvl20: [3,5] (intensity override) |
   | `wm-body-gen` | Body Resonance | `uncommon_mod` | `resourceInteraction.generationBonus: body/hit/+N` | lvl1: [1,1], lvl10: [1,2], lvl20: [2,3] |
   | `wm-exploit` | Exploit Weakness | `rare_mod` | `statModifiers: physicalAttack +N` and `onHitEffects: expose proc chance +N%` | lvl10: [2,4], lvl20: [5,8] (lvl req 10) |

   ### `headModPool` (3 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `hm-max-hp` | Resilient Mind | `common_mod` | `statModifiers: maxHp +N` | lvl1: [5,15], lvl10: [16,35], lvl20: [36,60] |
   | `hm-mind-gen` | Clear Thought | `uncommon_mod` | `resourceInteraction.generationBonus: mind/any/+N` | lvl1: [1,1], lvl10: [1,2], lvl20: [2,3] |
   | `hm-effect-dur` | Focused Channel | `rare_mod` | `passiveEffects: [duration-extend-buff-id]` | lvl10: [1,1] (presence; no numeric roll) |

   ### `bodyModPool` (3 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `bm-armor` | Fortified | `common_mod` | `statModifiers: physicalDefense +N` | lvl1: [2,5], lvl10: [6,12], lvl20: [13,22] |
   | `bm-heart-gen` | Steady Heart | `uncommon_mod` | `resourceInteraction.generationBonus: heart/defend/+N` | lvl1: [1,1], lvl10: [1,2], lvl20: [2,3] |
   | `bm-reflect` | Thorned | `rare_mod` | `statModifiers: reflectDamage +N` | lvl10: [1,3], lvl20: [4,7] |

   ### `handsModPool` (3 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `hndm-body-gen` | Iron Grip | `common_mod` | `resourceInteraction.generationBonus: body/hit/+N` | lvl1: [1,1], lvl10: [1,2], lvl20: [2,2] |
   | `hndm-crit` | Precise Hands | `uncommon_mod` | `statModifiers: physicalSkill +N` | lvl1: [1,2], lvl10: [3,5], lvl20: [6,9] |
   | `hndm-block` | Shield Training | `rare_mod` | `onDefendEffects: block proc` | lvl5: [1,1] (presence; lvl req 5) |

   ### `feetModPool` (3 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `fm-evasion` | Swift Feet | `common_mod` | `statModifiers: physicalSave +N` | lvl1: [1,3], lvl10: [4,7], lvl20: [8,12] |
   | `fm-cs-tokens` | Ready Stride | `uncommon_mod` | `resourceInteraction.combatStartTokens: heart/body/mind +N` (one resource type, designer's choice per template) | lvl1: [1,1], lvl10: [1,2], lvl20: [2,3] |
   | `fm-initiative` | First Step | `rare_mod` | `statModifiers: luck +N` | lvl5: [1,3], lvl20: [4,7] |

   ### `accessoryModPool` (3 mods)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `am-cross-stat` | Balanced Focus | `common_mod` | `statModifiers: two different stats +N each` | lvl1: [1,2], lvl10: [2,4], lvl20: [4,7] |
   | `am-stance-res` | Resonant Stone | `uncommon_mod` | `resourceInteraction.combatStartTokens: one stance resource +N` | lvl1: [1,2], lvl10: [2,3], lvl20: [3,4] |
   | `am-proc-boost` | Catalyst Charm | `rare_mod` | Increases `baseChance` of existing `onHitEffects` by N% | lvl10: [5,10], lvl20: [11,20] (lvl req 10) |

   ### `armorModPool` (3 mods — armor slot)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `armm-defense` | Hardened | `common_mod` | `statModifiers: physicalDefense +N` | lvl1: [3,7], lvl10: [8,16], lvl20: [17,28] |
   | `armm-heart-start` | Brave Bearing | `uncommon_mod` | `resourceInteraction.combatStartTokens: heart +N` | lvl1: [1,2], lvl10: [2,3], lvl20: [3,5] |
   | `armm-regen` | Enduring | `rare_mod` | `passiveEffects: [slow-regen-buff-id]` | lvl5: [1,1] (presence) |

   ### `uniqueModPool` (3 mods — Unique items only)
   | ID | Name | hiddenRarity | Payload shape | Level tiers |
   |----|------|---|---|---|
   | `um-stance-echo` | Stance Echo | `rare_mod` | `resourceInteraction.generationBonus: all three stances/any/+N` | lvl5: [1,1], lvl15: [1,2] |
   | `um-paradox-edge` | Paradox Edge | `rare_mod` | `onHitEffects: proc that applies two effects simultaneously` | lvl10: [1,1] (presence) |
   | `um-resonance-prime` | Resonance Prime | `rare_mod` | `resourceInteraction.combatStartTokens: all three stances +N` | lvl15: [1,2], lvl20: [2,3] |

8. **Fill in Unique template `fixedModIds`** in `src/Items/unique.templates.ts`
   (referenced from Spec 05c stubs):
   - `axioms-edge`: `['wm-flat-damage', 'wm-body-gen', 'um-paradox-edge']`
   - `paradox-loop`: `['am-stance-res', 'am-proc-boost', 'um-resonance-prime']`

9. **Tests:**
   - `rollModifiers(ironBlade, 'uncommon', 8, seededRng)` returns 1 mod from
     `weaponModPool` with value within the lvl1 range.
   - `rollModifiers(ironBlade, 'rare', 8, seededRng)` returns 2 distinct mods.
   - `rollModifiers(ironBlade, 'rare', 15, seededRng)` can return `wm-exploit`
     (lvl req 10); cannot return it at playerLevel 8.
   - `rollModifiers(axiomsEdge, 'unique', 8, seededRng)` returns exactly
     `['wm-flat-damage', 'wm-body-gen', 'um-paradox-edge']` with rolled values.
   - Unique mods never appear on non-Unique items across 500 simulated drops.
   - `resolveModifiers` merged output passes through `equipItem` with no type errors.
   - Distribution test: over 1000 rolls, `rare_mod` mods appear at weight ratio
     1:3:10 relative to `uncommon_mod` and `common_mod`.

## Acceptance checklist

- [x] `HiddenModRarity`, `ModValueTier`, `ModifierPayload`, `Modifier` types
      exported from `src/Items/`.
- [x] All 7 slot pools + `uniqueModPool` defined in `src/Items/modifier.catalogue.ts`.
- [x] `rollModifiers` and `resolveModifiers` functions implemented in
      `src/Items/item.factory.ts`.
- [x] Unique template `fixedModIds` in `src/Items/unique.templates.ts` filled in.
- [x] Hermetic tests covering roll count, level gating, unique exclusion,
      determinism, and weight distribution.
- [x] `docs/equipment.md` updated with a "Modifiers" section describing
      the pool structure and resolve pipeline.

## Implementation notes (post-implementation)

- New module `src/Items/modifier.types.ts` carries `HiddenModRarity`,
  `ModValueTier`, `ModifierPayload`, and `Modifier`. `HIDDEN_MOD_RARITY_WEIGHTS`
  encodes the documented 10/3/1 weights as a `Record<HiddenModRarity, number>`.
- `src/Items/modifier.catalogue.ts` ships 22 procedural mods (4/3/3/3/3/3/3
  across the 7 slot pools) and 3 unique-only signature mods. `MOD_POOLS`
  keys procedural pools by slot; `getModifierById` is the unified O(1)
  registry across every pool.
- `item.factory.ts` was rewritten to drive everything through the catalogue.
  `rollModifiers` now filters the slot pool by level eligibility, samples
  without replacement using `HIDDEN_MOD_RARITY_WEIGHTS`, and reads the
  rolled value from the highest eligible `levelTier`. `resolveModifiers` now
  returns a `Pick<Equipment, ...>` instead of just `StatModifier[]` so the
  factory can spread it onto the instance.
- Substitution rules (Q3): `value: 0` in `payload.statModifiers`, `bonus: 0`
  in `generationBonus`, and `0` token entries in `combatStartTokens` all get
  the rolled value; same `combatStartTokens` keys sum across mods (Spec 05b
  Q2). `passiveEffects` / `onHitEffects` / `onDefendEffects` are
  presence-only and concatenated as authored.
- A few spec-suggested payloads have no direct engine primitive yet — see
  `docs/equipment.md` "Where the catalogue compromises with existing
  primitives" for `hm-max-hp` (passive `buff_max_hp_up`), `bm-reflect`
  (passive `buff_reflect`), and `am-proc-boost` (`+luck` until a meta-mod
  resolver lands).
- Unique templates now reference canonical catalogue IDs:
  `axioms-edge → ['wm-flat-damage', 'wm-body-gen', 'um-paradox-edge']`,
  `paradox-loop → ['am-stance-res', 'am-proc-boost', 'um-resonance-prime']`.
- New hermetic suite at
  [`src/Items/e2e/modifier.catalogue.engine.test.ts`](../src/Items/e2e/modifier.catalogue.engine.test.ts)
  covers catalogue inventory invariants, per-rarity roll counts, level
  gating (wm-exploit excluded at lvl 8, present at lvl 15), unique-pool
  exclusion across 500 procedural drops, hidden-rarity weight distribution
  across 1000 rolls, sentinel substitution, multi-mod payload merging, and
  an `equipItem` round-trip. The pre-existing `item.factory.engine.test.ts`
  was migrated to the new mod IDs and still passes (24 tests).

## Out of scope

- More than the minimum viable catalogue — extend post-playtesting.
- Stance-aligned mod pools — deferred until Spec 10's morality/difficulty work
  surfaces a need.
- Mod display in the CLI — deferred to Spec 08 (shop/UI work).
- Crafting / rerolling mods.
