export {
    type Item, type ItemCategory, type Equipment, type Consumable, type Material, type QuestItem,
    type EquipmentSlot, type AccessoryKind, type BaseItem,
    type EquipmentProcTrigger, type ResourceInteraction, type ResourceGenerationBonus,
    type ItemRarity, type RolledModifier, type EquipmentTemplate, type UniqueItemTemplate,
    SLOT_CAPACITY,
    isEquipment, isConsumable, isMaterial, isQuestItem,
} from './types';
export {
    type HiddenModRarity, type ModValueTier, type ModifierPayload, type Modifier,
    HIDDEN_MOD_RARITY_WEIGHTS,
} from './modifier.types';
export {
    addItem, removeItem, useConsumable, stackItem,
    addItemToInventory, removeItemFromInventory,
} from './item.reducer';
export {
    aggregateCombatStartTokens, applyEquipmentGenerationBonus,
    getEquipmentProcTriggers, useConsumableEffect,
} from './equipment.engine';
export type { ConsumableUseResult } from './equipment.engine';
export {
    weaponModPool, headModPool, bodyModPool, handsModPool, feetModPool,
    accessoryModPool, armorModPool, uniqueModPool,
    MOD_POOLS, getModifierById, pickValueTier, allModifiers,
} from './modifier.catalogue';
// Phase 21 — the procedural equipment library + factory are retired. Loot
// caches yield consumables via `rollCacheReward` (relics are a fixed kit, not
// loot). Modifier catalogue / affix library / item sets stay for phase 23.
export { rollCacheReward, CACHE_REWARD_TUNING } from './cache-reward';
export type { CacheLootTier, RollCacheRewardOptions } from './cache-reward';
export {
    wornPerSlot, firstEquippedPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
} from './equipped';
export {
    prefixes, suffixes, allAffixes, getAffixById,
    composeItemName, affixesForSlot, AFFIX_RARITY_WEIGHTS,
    isOffensiveStatusAffix,
} from './affix.library';
export type { Affix, AffixRole } from './modifier.types';
export { consumableLibrary, getConsumableById } from './consumable.library';
export { buyItem, sellItem, defaultSellPrice } from './shop.reducer';
export type { SetBonus, ItemSet } from './set.types';
export {
    getActiveSetBonuses,
    getActiveSetBonusesForCharacter,
    aggregateSetStartTokens,
    applySetGenerationBonus,
    getActiveSetPassiveEffectIds,
    getEquippedItemSets,
} from './set.engine';
export { itemSetLibrary, getItemSetById } from './set.library';
export type { ShopWare, ShopInventory } from './shop.types';
// Phase 19 — the 8 signet relics + worn-loadout signature derivation.
export {
    relicLibrary, getRelicById, getSignaturesForLoadout, cloneStartingRelics,
    DEFAULT_WORN_RELIC_IDS, BENCHED_RELIC_IDS,
} from './relic.library';
