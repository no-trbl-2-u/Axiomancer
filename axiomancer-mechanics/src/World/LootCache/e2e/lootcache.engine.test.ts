/**
 * Loot-cache ("The Reliquary") engine — hermetic unit suite. Seeded
 * RNG only; no timers, no network, no Math.random.
 */

import { describe, expect, it } from 'vitest';

import {
    beginLootCache,
    claimLootCacheOutcome,
    continueLootCacheCard,
    createLootCacheSession,
    delveLootCache,
    LOOT_CACHE_TUNING,
    probeLootCache,
    sealLootCache,
} from '../lootcache.engine';
import type { CacheItemRef, LootCacheSession } from '../lootcache.types';

const ITEMS: CacheItemRef[] = [
    { uid: 'i-1', name: 'Tarnished Compass' },
    { uid: 'i-2', name: 'Whale-Oil Lamp' },
];

function fresh(seed = 7, currency = 10): LootCacheSession {
    return createLootCacheSession(seed, ITEMS, currency);
}

function delving(seed = 7, currency = 10): LootCacheSession {
    return beginLootCache(fresh(seed, currency));
}

/** Finds a seed whose layer fates match the given pattern (- = any). */
function withFates(lid: boolean | null, falseBottom: boolean | null, tithe: boolean | null): LootCacheSession {
    for (let seed = 1; seed < 2000; seed++) {
        const s = delving(seed);
        const [a, b, c] = s.layers.map(l => l.trapped);
        if (lid !== null && a !== lid) continue;
        if (falseBottom !== null && b !== falseBottom) continue;
        if (tithe !== null && c !== tithe) continue;
        return s;
    }
    throw new Error('no seed matches the fate pattern');
}

describe('lifecycle', () => {
    it('builds three layers from the payload; the lid is never trapped', () => {
        const s = fresh(11, 10);
        expect(s.phase).toBe('intro');
        expect(s.layers).toHaveLength(3);
        expect(s.layers[0].trapped).toBe(false);
        expect(s.layers[0].loot.items).toEqual(ITEMS);
        expect(s.layers[0].loot.currency).toBe(10);
        expect(s.layers[1].loot.currency).toBe(Math.ceil(10 * LOOT_CACHE_TUNING.falseBottomBonus));
        expect(s.layers[2].loot.keepsake.length).toBeGreaterThan(0);
        expect(beginLootCache(s).phase).toBe('delving');
    });

    it('a zero-purse cache still floors the hidden layers', () => {
        const s = fresh(11, 0);
        expect(s.layers[1].loot.currency).toBe(LOOT_CACHE_TUNING.falseBottomFloor);
        expect(s.layers[2].loot.currency).toBe(LOOT_CACHE_TUNING.falseBottomFloor);
    });

    it('is deterministic from its seed', () => {
        const fates = (s: LootCacheSession) => s.layers.map(l => l.trapped);
        expect(fates(fresh(42))).toEqual(fates(fresh(42)));
    });

    it('trap fates vary across seeds (both live and dud occur)', () => {
        const deepFates = new Set<boolean>();
        for (let seed = 1; seed < 100; seed++) {
            deepFates.add(fresh(seed).layers[2].trapped);
        }
        expect(deepFates.size).toBe(2);
    });
});

describe('delving', () => {
    it('a clean delve cards the loot and play continues', () => {
        const s = withFates(false, null, null);
        const delved = delveLootCache(s);
        expect(delved.phase).toBe('card');
        expect(delved.card!.slammed).toBe(false);
        expect(delved.card!.items).toEqual(ITEMS);
        expect(delved.depth).toBe(1);
        const cont = continueLootCacheCard(delved);
        expect(cont.phase).toBe('delving');
    });

    it('a sprung trap bites, spoils the layer, and slams to outcome', () => {
        const s = withFates(false, true, null);
        const one = continueLootCacheCard(delveLootCache(s)); // lid, clean
        const two = delveLootCache(one);                      // false bottom: live
        expect(two.card!.slammed).toBe(true);
        expect(two.card!.bite).toBe(LOOT_CACHE_TUNING.trapBite[1]);
        expect(two.bittenVitae).toBe(LOOT_CACHE_TUNING.trapBite[1]);
        expect(two.layers[1].spoiled).toBe(true);
        const out = continueLootCacheCard(two);
        expect(out.phase).toBe('outcome');
        expect(out.outcome!.tier).toBe('stung');
        // The spoiled layer's loot is gone; the lid's loot is kept.
        expect(out.outcome!.itemsKept).toEqual(ITEMS);
        expect(out.outcome!.currencyKept).toBe(10);
        expect(out.outcome!.bittenVitae).toBe(LOOT_CACHE_TUNING.trapBite[1]);
    });

    it('emptying all three layers clean earns the emptied tier', () => {
        const s = withFates(false, false, false);
        let play = s;
        for (let i = 0; i < 3; i++) {
            play = continueLootCacheCard(delveLootCache(play));
        }
        expect(play.phase).toBe('outcome');
        const o = play.outcome!;
        expect(o.tier).toBe('emptied');
        expect(o.layersOpened).toBe(3);
        expect(o.itemsKept).toEqual(ITEMS);
        expect(o.currencyKept).toBe(
            10 + Math.ceil(10 * LOOT_CACHE_TUNING.falseBottomBonus) + Math.ceil(10 * LOOT_CACHE_TUNING.tithesBonus),
        );
        expect(o.keepsakes).toHaveLength(1);
        expect(o.bittenVitae).toBe(0);
    });

    it('sealing early keeps what was lifted and earns prudent', () => {
        const s = withFates(false, null, null);
        const one = continueLootCacheCard(delveLootCache(s));
        const sealed = sealLootCache(one);
        expect(sealed.phase).toBe('outcome');
        expect(sealed.outcome!.tier).toBe('prudent');
        expect(sealed.outcome!.itemsKept).toEqual(ITEMS);
        expect(sealed.outcome!.currencyKept).toBe(10);
        expect(sealed.outcome!.layersOpened).toBe(1);
    });
});

describe('the probe', () => {
    it('reveals the next layer\'s fate once, without opening it', () => {
        const s = withFates(false, true, null);
        const one = continueLootCacheCard(delveLootCache(s));
        const probed = probeLootCache(one);
        expect(probed.phase).toBe('card');
        expect(probed.probeUsed).toBe(true);
        expect(probed.layers[1].revealed).toBe(true);
        expect(probed.layers[1].opened).toBe(false);
        expect(probed.card!.title).toBe('TEETH IN THE DARK');
        const back = continueLootCacheCard(probed);
        expect(back.phase).toBe('delving');
        // Second probe is a no-op.
        expect(probeLootCache(back)).toBe(back);
    });

    it('a dud reading is honest: the delve after it is clean', () => {
        const s = withFates(false, false, null);
        const one = continueLootCacheCard(delveLootCache(s));
        const probed = continueLootCacheCard(probeLootCache(one));
        const delved = delveLootCache(probed);
        expect(delved.card!.slammed).toBe(false);
    });
});

describe('guards', () => {
    it('wrong-phase calls are no-ops', () => {
        const intro = fresh(7);
        expect(delveLootCache(intro)).toBe(intro);
        expect(probeLootCache(intro)).toBe(intro);
        expect(sealLootCache(intro)).toBe(intro);
        expect(continueLootCacheCard(intro)).toBe(intro);
        expect(claimLootCacheOutcome(intro)).toBe(intro);
    });

    it('claim seals the find', () => {
        const sealed = sealLootCache(delving(7));
        expect(sealed.outcome!.tier).toBe('prudent');
        expect(sealed.outcome!.layersOpened).toBe(0);
        const claimed = claimLootCacheOutcome(sealed);
        expect(claimed.phase).toBe('done');
    });
});
