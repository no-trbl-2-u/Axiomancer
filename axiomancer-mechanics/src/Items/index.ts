export {
    type Item, type Equipment, type Consumable, type Material, type QuestItem,
    type EquipmentSlot,
    SLOT_CAPACITY,
    isEquipment, isConsumable, isMaterial, isQuestItem,
} from './types';
// The shared grant/equip/swap path — the one door every "the player now has
// this item" transition walks through, plus the D5 reward-screen predicate.
export {
    grantItem, qualifiesForItemRewardScreen, partitionGrantsForReward, displacedBy,
} from './item-grant';
export type { GrantOutcome } from './item-grant';
// Phase 96 — the desperation band. `resolveConsumableHeal` is the ONE resolver
// for the two-band heal; presenters import it rather than re-deriving the
// threshold, which is what keeps the shop line, the drink preview and the
// actual heal from disagreeing.
export {
    resolveConsumableHeal,
} from './equipment.engine';
// Phase 21 — the procedural equipment library + factory are retired; loot
// caches yield consumables via `rollCacheReward`. Phase 23 — the modifier
// catalogue, affix library, item sets, and rarity model are torn down (the
// signet relics are the whole equipment surface).
export { rollCacheReward } from './cache-reward';
export type { CacheLootTier } from './cache-reward';
export {
    wornPerSlot, isEquippedFirstOfSlot, findEquippedInSlot,
} from './equipped';
export { consumableLibrary, getConsumableById } from './consumable.library';
export { buyItem, sellItem, defaultSellPrice } from './shop.reducer';
export type { ShopWare } from './shop.types';
// Phase 19 — the 11 signet relics (Phase 85 added 3) + worn-loadout signature derivation.
export {
    relicLibrary, getRelicById,
} from './relic.library';
