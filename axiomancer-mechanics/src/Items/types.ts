/**
 * Item System Types
 * Discriminated union of all item types with type guards.
 *
 * Equipment (Spec 05) carries persistent stat modifiers, passive effect IDs,
 * optional onHit / onDefend proc triggers that share Spec 03's proc machinery,
 * and an optional `resourceInteraction` payload the combat resolver reads to
 * seed token counters at battle start and amplify per-action generation.
 *
 * Per Spec 05c, `Equipment` is an *instance* shape — every drop carries an
 * instance-level `rarity` and `requiredLevel`, optionally with a list of
 * rolled modifiers in `rolledMods`. The definition shape lives in
 * `EquipmentTemplate` (procedural) and `UniqueItemTemplate` (curated).
 *
 * Consumables (Spec 05) reference real effects from the effects library —
 * either by ID, by inline `Effect`, and/or with an immediate `healAmount` —
 * with optional `intensityOverride` / `durationOverride` per-instance tuning.
 */

import { Effect, EffectTier, StatModifier } from '../Effects/types';
import { Stance } from '../Combat/types';
import { CombatResources } from '../Cards/types';

/** Item categories */
export type ItemCategory = 'equipment' | 'consumable' | 'material' | 'quest-item';

/**
 * Base properties shared by all items
 * @property id - Unique identifier for this item
 * @property name - Display name of the item
 * @property description - Flavor text or lore description
 * @property category - Discriminator for the item union type
 */
export interface BaseItem {
    id: string;
    name: string;
    description: string;
    category: ItemCategory;
}

/** Equipment slots available on a character. Per Spec 05 Q1 every slot may be
 * occupied simultaneously. */
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory' | 'head' | 'body' | 'hands' | 'feet';

/**
 * Per-instance rarity grade (Spec 05c). Drives modifier count and value bands.
 *  - `common`    — 0 rolled modifiers; base stats only.
 *  - `uncommon`  — 1 rolled modifier.
 *  - `rare`      — 2 non-duplicate rolled modifiers.
 *  - `unique`    — exactly 3 fixed modifiers (whose values are still rolled),
 *                  drawn from a `UniqueItemTemplate.fixedModIds` triple.
 */
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'unique';

/**
 * A modifier rolled once at drop time and stored on the resulting `Equipment`
 * instance. `modId` keys into the Spec 05d modifier catalogue; `value` is the
 * concrete rolled magnitude (within the catalogue's range for the wearer's
 * level at drop time).
 */
export interface RolledModifier {
    modId: string;
    value: number;
}

/**
 * Trigger that fires when the wearer lands a hit (`onHitEffects`) or
 * successfully defends (`onDefendEffects`). Per Spec 05 Q6 these entries
 * are folded into the Spec 03 proc roll the resolver already runs, so they
 * use the same `tier` / `baseChance` / `intensityOverride` / `durationOverride`
 * shape as a `CombatEffectTrigger` minus the `stance` / `action` fields
 * (those are implicit — `onHit` always fires on an attack, `onDefend` always
 * fires on a defend, regardless of the wearer's stance).
 */
export interface EquipmentProcTrigger {
    effectId: string;
    target: 'self' | 'opponent';
    baseChance: number;
    tier: EffectTier;
    intensityOverride?: number;
    durationOverride?: number;
    fumbleEffectId?: string;
}

/**
 * Per-equipment bonus to `generateBasicActionResources`. Stacks additively
 * on top of the base resource-generation table from Spec 04.
 *
 * - `trigger`: which basic-action outcome the bonus applies to. `'any'`
 *   adds the bonus to every basic action the wearer takes.
 * - `resourceType`: which `CombatResources` counter the bonus tops up.
 * - `bonus`: flat token delta added (negative values are allowed but
 *   clamped to zero by the engine).
 */
export interface ResourceGenerationBonus {
    trigger: 'hit' | 'miss' | 'defend' | 'any';
    resourceType: keyof CombatResources;
    bonus: number;
}

/**
 * Equipment-driven contribution to the combat resource economy (Spec 05 Q10,
 * option C — wrapped sub-object so the top-level `Equipment` shape stays
 * flat and items without resource interactions can omit the field entirely).
 *
 * - `combatStartTokens`: tokens granted to the wearer at the start of every
 *   combat. Summed across all equipped items in `initializeCombat`.
 * - `generationBonus`: per-action bonuses applied on top of the base
 *   generation table from `generateBasicActionResources`.
 */
export interface ResourceInteraction {
    combatStartTokens?: Partial<CombatResources>;
    generationBonus?: ResourceGenerationBonus[];
}

/**
 * Equipment instance — what a player actually carries, equips, and drops.
 *
 * Per Spec 05c the legacy `tier: 1 | 2 | 3` field is gone; rarity is the
 * instance-level grade and `requiredLevel` controls when the item can drop
 * (and scales rolled-modifier value bands). Procedural drops carry a
 * `rolledMods` list; manually-constructed items and `common`-rarity drops
 * may omit it.
 *
 * @property category         - Always `'equipment'`.
 * @property slot             - The equipment slot this item occupies.
 * @property rarity           - Instance-level rarity grade (Spec 05c).
 * @property requiredLevel    - Level required to equip / for the item to drop.
 * @property rolledMods       - Modifiers rolled at drop time. Absent on Common
 *                              drops and manually-constructed items; present
 *                              on Uncommon / Rare / Unique instances.
 * @property statModifiers    - Persistent stat modifiers folded into the
 *                              wearer's `derivedStats` at equip-time (Spec 05
 *                              Q3 option A). On a procedural drop this is the
 *                              resolved sum of base stats + rolled-mod payloads.
 * @property passiveEffects   - Effect library IDs applied as permanent
 *                              ActiveEffects while equipped. Removed on
 *                              unequip (Spec 05 Q5).
 * @property onHitEffects     - Equipment-provided proc entries added to the
 *                              wearer's `attack` proc roll (Spec 05 Q6 / Spec
 *                              03 machinery).
 * @property onDefendEffects  - Equipment-provided proc entries added to the
 *                              wearer's `defend` proc roll.
 * @property critStyle        - Default critical-hit resolution style. Spec 05
 *                              Q7: weapon-set default which can be overridden
 *                              by a skill's per-skill `critStyle` (Spec 04+).
 * @property resourceInteraction - Optional combat-start token grants and per-
 *                                 action generation bonuses (Spec 05 Q10C).
 * @property prefixId         - Affix provenance (Phase 152). When the instance
 *                              was decorated with a prefix affix, this is the
 *                              source `Affix.id`. Provenance only — the affix's
 *                              mechanical payload already lives in `rolledMods`
 *                              and the resolved `statModifiers` / proc fields.
 * @property suffixId         - As `prefixId`, for a trailing suffix affix.
 * @property prefixName       - The prefix affix's display `word` (Phase 152),
 *                              cached so consumers can render the affix label
 *                              without re-resolving the affix library.
 * @property suffixName       - As `prefixName`, for the suffix affix.
 */
export interface Equipment extends BaseItem {
    category: 'equipment';
    slot: EquipmentSlot;
    rarity: ItemRarity;
    requiredLevel: number;
    rolledMods?: RolledModifier[];
    statModifiers?: StatModifier[];
    passiveEffects?: string[];
    onHitEffects?: EquipmentProcTrigger[];
    onDefendEffects?: EquipmentProcTrigger[];
    critStyle?: 'double' | 'pierce';
    resourceInteraction?: ResourceInteraction;
    prefixId?: string;
    suffixId?: string;
    prefixName?: string;
    suffixName?: string;
}

/**
 * Definition shape for a procedural equipment item (Spec 05c).
 *
 * A template is the authored data that the `dropItem` factory turns into an
 * `Equipment` instance: base stats + an ID/name/slot identity. Rarity, rolled
 * mods, and the rest of the instance shape are decided at drop time.
 *
 * @property id                 - Stable identifier (matches the dropped instance's `id`).
 * @property name               - Display name.
 * @property description        - Flavor / lore text.
 * @property slot               - The equipment slot this template fills.
 * @property requiredLevel      - Minimum player level required to drop this item.
 *                                Also scales rolled-modifier value bands.
 * @property baseStatModifiers  - Stat modifiers on a 0-mod (Common) instance.
 *                                Higher rarities add rolled mods on top.
 */
export interface EquipmentTemplate {
    id: string;
    name: string;
    description: string;
    slot: EquipmentSlot;
    requiredLevel: number;
    baseStatModifiers?: StatModifier[];
    /**
     * Content-provenance metadata used by the tuning workflow's `--focus`
     * filter (`src/Tuning/focus.parser.ts`). `addedIn` is an ISO date
     * (`YYYY-MM-DD`) or phase tag marking when the entry was authored;
     * `tags` are freeform labels (e.g. `'early-game'`, `'weapon'`). Both
     * optional and ignored by the core engine.
     */
    addedIn?: string;
    tags?: string[];
    /**
     * Curated affix provenance (Phase 152). When a library entry is an
     * authored prefixed/suffixed variant of a base item, these name the
     * source affixes in `affix.library`. `dropItem` applies them
     * deterministically on top of the rarity-default affix roll, folding
     * the affix `modIds` into `rolledMods` and stamping `prefixId` /
     * `suffixId` / `prefixName` / `suffixName` onto the dropped instance.
     * A curated affix overrides the rarity-default affix for that role.
     */
    prefixId?: string;
    suffixId?: string;
}

/**
 * Curated unique-item definition (Spec 05c). Uniques are conceptually distinct
 * from procedural drops: their modifier identities are *fixed* (the values are
 * still rolled within band), and they may belong to a thematic set.
 *
 * @property fixedModIds   - Exactly three modifier IDs the dropped instance carries.
 * @property setMembership - Optional set ID (Spec 05e). Reserved for late-game.
 */
export interface UniqueItemTemplate extends EquipmentTemplate {
    fixedModIds: [string, string, string];
    setMembership?: string;
}

/**
 * Consumable item that can be used once (quantity decrements).
 *
 * Per Spec 05 Q8 (option C) and Q9 (option C), a consumable may carry any
 * combination of:
 *   - `effectId`     — reference into the global effects library.
 *   - `inlineEffect` — bespoke one-off `Effect` definition not in the library.
 *   - `healAmount`   — immediate flat HP heal (no effect entry).
 * At least one of these must be present.
 *
 * `intensityOverride` / `durationOverride` retune the referenced or inline
 * effect on a per-instance basis.
 *
 * Per Spec 05b Q6 (option A) a consumable may additionally carry a
 * `resourceGrant: Partial<CombatResources>` payload which the combat resolver
 * adds to the active `combatResources` snapshot when the item is used via
 * the `'item'` action. Using the item still costs the player's turn, so the
 * grant is a strategic option rather than free tempo. Per Spec 05b Q3
 * philosophical tokens (`fallacy` / `paradox`) remain skill-only — library
 * authors should restrict `resourceGrant` to `heart` / `body` / `mind` keys
 * even though the type permits the full union.
 *
 * @property category         - Always `'consumable'`.
 * @property quantity         - Number of this item in the stack.
 * @property effectId         - Optional effect-library lookup key applied on use.
 * @property inlineEffect     - Optional bespoke `Effect` applied on use.
 * @property healAmount       - Optional immediate flat HP heal applied on use.
 * @property resourceGrant    - Optional combat-resource token delta applied
 *                              when the item is used inside combat (Spec 05b Q6).
 * @property intensityOverride - Optional intensity override for the applied effect.
 * @property durationOverride  - Optional duration override for the applied effect.
 */
export interface Consumable extends BaseItem {
    category: 'consumable';
    quantity: number;
    effectId?: string;
    inlineEffect?: Effect;
    healAmount?: number;
    resourceGrant?: Partial<CombatResources>;
    intensityOverride?: number;
    durationOverride?: number;
    /** Content-provenance metadata (see `EquipmentTemplate.addedIn`). */
    addedIn?: string;
    tags?: string[];
}

/**
 * Material item used for crafting
 * @property category - Always 'material'
 * @property quantity - Number of this material in the stack
 */
export interface Material extends BaseItem {
    category: 'material';
    quantity: number;
}

/**
 * Quest item that is used in quests
 * @property category - Always 'quest-item'
 * @property questId - The quest this item is associated with
 */
export interface QuestItem extends BaseItem {
    category: 'quest-item';
    questId: string;
}

/** Discriminated union of all item types */
export type Item = Equipment | Consumable | Material | QuestItem;

/** Re-export `Stance` so downstream consumers of `EquipmentSlot` don't need
 *  a separate import path; some library authors key generation bonuses to
 *  stance-aligned items (Spec 05 Q10b is OFF for now but keep the surface).
 */
export type { Stance };

// ============================================================================
// ITEM TYPE GUARDS
// ============================================================================

/** Type guard to check if an item is Equipment */
export function isEquipment(item: Item): item is Equipment {
    return item.category === 'equipment';
}

/** Type guard to check if an item is Consumable */
export function isConsumable(item: Item): item is Consumable {
    return item.category === 'consumable';
}

/** Type guard to check if an item is Material */
export function isMaterial(item: Item): item is Material {
    return item.category === 'material';
}

/** Type guard to check if an item is a Quest Item */
export function isQuestItem(item: Item): item is QuestItem {
    return item.category === 'quest-item';
}
