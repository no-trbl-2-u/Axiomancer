export {
    type Item, type ItemCategory, type Equipment, type Consumable, type Material, type QuestItem,
    type EquipmentSlot, type AccessoryKind, type BaseItem,
    SLOT_CAPACITY,
    isEquipment, isConsumable, isMaterial, isQuestItem,
} from './types';
export {
    addItem, removeItem, useConsumable, stackItem,
    addItemToInventory, removeItemFromInventory,
} from './item.reducer';
export { useConsumableEffect } from './equipment.engine';
export type { ConsumableUseResult } from './equipment.engine';
// Phase 21 — the procedural equipment library + factory are retired; loot
// caches yield consumables via `rollCacheReward`. Phase 23 — the modifier
// catalogue, affix library, item sets, and rarity model are torn down (the
// signet relics are the whole equipment surface).
export { rollCacheReward, CACHE_REWARD_TUNING } from './cache-reward';
export type { CacheLootTier, RollCacheRewardOptions } from './cache-reward';
export {
    wornPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
} from './equipped';
export { consumableLibrary, getConsumableById } from './consumable.library';
export { buyItem, sellItem, defaultSellPrice } from './shop.reducer';
export type { ShopWare, ShopInventory } from './shop.types';
// Phase 19 — the 8 signet relics + worn-loadout signature derivation.
export {
    relicLibrary, getRelicById, getSignaturesForLoadout, cloneStartingRelics,
    DEFAULT_WORN_RELIC_IDS, BENCHED_RELIC_IDS,
} from './relic.library';
