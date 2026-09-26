/**
 * Loot-cache reward roller (Phase 21).
 *
 * The procedural equipment library and its factory are retired — loot surfaces
 * no longer mint random equipment. This replaces the old `rollCacheLoot`
 * equipment generator: The Reliquary (and any other cache surface) now yields a
 * deterministic set of **consumables** scaled by tier. Currency is handled by
 * the caller (the cache session carries its own currency reward); relics are a
 * fixed starting kit, never loot.
 *
 * Determinism: same `seed` + inputs → same rewards (a caller-supplied cache
 * seed drives a self-contained PRNG).
 *
 * Balance note: this is a minimal-correct reward table. `loot-cache-tuning`
 * (the sim/CLI-driven harness that would have tuned the count/rarity mix)
 * retired in Phase 63 along with the Pick Pool minigame this table used to
 * feed — `LootCacheChoice`'s `item` offer is now this roller's only caller.
 * Re-tuning the mix, if ever needed, is a manual follow-up.
 */

import { obtainableConsumables } from './consumable.library';
import type { Item } from './types';

/** Reward depth. `modest` = early locales, `rich` = deeper locales. */
export type CacheLootTier = 'modest' | 'rich';

export interface RollCacheRewardOptions {
    /** Player level — reserved for future level-scaling; unused today. */
    playerLevel: number;
    /** Deterministic seed (cache seed). */
    seed: number;
    /** Reward depth: scales the consumable count. */
    tier: CacheLootTier;
}

interface TierTuning {
    /** Inclusive [min, max] consumable rewards. */
    count: readonly [number, number];
}

/** Tier tuning. `modest` leans 1–2 consumables; `rich` leans 2–3. */
export const CACHE_REWARD_TUNING: Readonly<Record<CacheLootTier, TierTuning>> = Object.freeze({
    modest: { count: [1, 2] },
    rich: { count: [2, 3] },
});

/** mulberry32 — small deterministic PRNG (same family as the minigame seeds). */
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function next(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Pick an integer in [min, max] inclusive from an rng. */
function rollInt(rng: () => number, min: number, max: number): number {
    if (max <= min) return min;
    return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Roll a deterministic set of consumable rewards for a loot cache. Draws a
 * tier-scaled count of consumables from `obtainableConsumables` — never one of
 * the no-op `UNOBTAINABLE_CONSUMABLE_IDS` — cloned at `quantity: 1` so the
 * shared library is never mutated. Never throws; returns `[]` only if the pool
 * is somehow empty.
 */
export function rollCacheReward(opts: RollCacheRewardOptions): Item[] {
    const rng = mulberry32(opts.seed);
    const pool = obtainableConsumables;
    if (pool.length === 0) return [];

    const count = rollInt(rng, ...CACHE_REWARD_TUNING[opts.tier].count);
    const out: Item[] = [];
    for (let i = 0; i < count; i++) {
        const pick = pool[Math.floor(rng() * pool.length)];
        out.push({ ...pick, quantity: 1 });
    }
    return out;
}
