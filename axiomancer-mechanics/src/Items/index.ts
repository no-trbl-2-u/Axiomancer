export {
    type Item, type ItemCategory, type Equipment, type Consumable, type Material, type QuestItem,
    type EquipmentSlot, type AccessoryKind, type BaseItem,
    SLOT_CAPACITY,
    isEquipment, isConsumable, isMaterial, isQuestItem,
} from './types';
export {
    addItem, removeItem, useConsumable, stackItem, addItemStacking,
    addItemToInventory, removeItemFromInventory,
} from './item.reducer';
// The shared grant/equip/swap path — the one door every "the player now has
// this item" transition walks through, plus the D5 reward-screen predicate.
export {
    grantItem, qualifiesForItemRewardScreen, partitionGrantsForReward, displacedBy,
} from './item-grant';
export type { GrantItemOptions, ItemGrantResult, GrantOutcome } from './item-grant';
export { useConsumableEffect } from './equipment.engine';
export type { ConsumableUseResult } from './equipment.engine';
// Phase 96 — the desperation band. `resolveConsumableHeal` is the ONE resolver
// for the two-band heal; presenters import it rather than re-deriving the
// threshold, which is what keeps the shop line, the drink preview and the
// actual heal from disagreeing.
export {
    DESPERATION_HP_FRACTION, isDesperate, resolveConsumableHeal,
} from './equipment.engine';
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
