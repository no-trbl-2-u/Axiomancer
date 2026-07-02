/**
 * Loot-cache encounter ("The Reliquary") — Public API.
 *
 * Three layers, sealed trap fates, one probe, push-your-luck. The
 * engine deals in item REFS; the host maps kept uids back to real
 * items and settles the bite at claim time.
 *
 * Seeded-RNG helpers are aliased `lootCache*` because sibling modules
 * already export `seedRng`/`nextFloat`/… from the package root.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    CacheItemRef,
    LootCacheLayerIndex,
    LootCacheLayerLoot,
    LootCacheLayerState,
    LootCacheCard,
    LootCacheOutcomeTier,
    LootCacheOutcome,
    LootCachePhase,
    LootCacheSession,
} from './lootcache.types';

export { LOOT_CACHE_LAYER_COUNT } from './lootcache.types';

// ── Seeded RNG (aliased — see module note) ─────────────────────────────────
export type { LootCacheRngState } from './lootcache.rng';
export {
    seedRng as lootCacheSeedRng,
    nextFloat as lootCacheNextFloat,
    nextInt as lootCacheNextInt,
    shuffle as lootCacheShuffle,
} from './lootcache.rng';

// ── Tuning & chrome ────────────────────────────────────────────────────────
export { LOOT_CACHE_TUNING, LOOT_CACHE_KEEPSAKE } from './lootcache.engine';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    createLootCacheSession,
    beginLootCache,
    delveLootCache,
    probeLootCache,
    sealLootCache,
    continueLootCacheCard,
    claimLootCacheOutcome,
} from './lootcache.engine';

// ── Balance simulator (push-your-luck bots + bands) ────────────────────────
export type {
    LootCachePolicyId,
    LootCacheSimRunResult,
    LootCacheSimSummary,
    RunLootCacheSimOptions,
    LootCacheBalanceReport,
} from './lootcache.sim';
export {
    simulateLootCache,
    runLootCacheSim,
    generateLootCacheBalanceReport,
    DEFAULT_CACHE_ITEMS,
    DEFAULT_CACHE_CURRENCY,
    LOOT_CACHE_BITE_PENALTY,
} from './lootcache.sim';
