/**
 * Loot-cache ("The Reliquary") engine — hermetic unit suite. Seeded
 * RNG only; no timers, no network, no Math.random.
 *
 * Covers the "Pick Pool" live dice-pool lockpicking mechanic: public
 * per-layer difficulty, push/retreat/insight during `'picking'`, jam
 * (closes only the current layer — does NOT end the session), resist
 * (max pushes exhausted), and outcome tiers.
 */

import { describe, expect, it } from 'vitest';

import {
    beginLootCache,
    channelLootCacheInsight,
    claimLootCacheOutcome,
    continueLootCacheCard,
    createLootCacheSession,
    delveLootCache,
    LOOT_CACHE_TUNING,
    pushLootCachePick,
    retreatLootCachePick,
    sealLootCache,
} from '../lootcache.engine';
import type { CacheItemRef, LootCacheSession } from '../lootcache.types';

const ITEMS: CacheItemRef[] = [
    { uid: 'i-1', name: 'Tarnished Compass' },
    { uid: 'i-2', name: 'Whale-Oil Lamp' },
];

function fresh(seed: number | string = 7, currency = 10): LootCacheSession {
    return createLootCacheSession(seed, ITEMS, currency);
}

function delving(seed: number | string = 7, currency = 10): LootCacheSession {
    return beginLootCache(fresh(seed, currency));
}

/** Enters `'picking'` on the current (next unopened) layer. */
function picking(s: LootCacheSession): LootCacheSession {
    return delveLootCache(s);
}

/** Pushes repeatedly (never retreats, never channels insight) until a card fires. */
function pushUntilCard(s: LootCacheSession): LootCacheSession {
    let cur = s;
    let guard = 0;
    while (cur.phase === 'picking' && guard++ < 20) cur = pushLootCachePick(cur);
    return cur;
}

/** Finds a seed whose FIRST push at layer 0 (no prior rng draws) matches a predicate. */
function findFirstPush(predicate: (pushed: LootCacheSession) => boolean, currency = 10): LootCacheSession {
    for (let seed = 1; seed < 20_000; seed++) {
        const atLayer0 = picking(delving(seed, currency));
        const pushed = pushLootCachePick(atLayer0);
        if (predicate(pushed)) return atLayer0;
    }
    throw new Error('no seed matches the first-push predicate');
}

describe('lifecycle', () => {
    it('builds three layers with public difficulty from tuning; no upfront RNG draw', () => {
        const s = fresh(11, 10);
        expect(s.phase).toBe('intro');
        expect(s.layers).toHaveLength(3);
        expect(s.layers.map(l => l.difficulty)).toEqual(LOOT_CACHE_TUNING.difficulty);
        expect(s.layers.map(l => l.trapBite)).toEqual(LOOT_CACHE_TUNING.trapBite);
        expect(s.layers[0].loot.items).toEqual(ITEMS);
        expect(s.layers[0].loot.currency).toBe(10);
        expect(s.layers[1].loot.currency).toBe(Math.ceil(10 * LOOT_CACHE_TUNING.falseBottomBonus));
        expect(s.layers[2].loot.keepsake.length).toBeGreaterThan(0);
        expect(s.insightUsed).toBe(false);
        expect(s.pick).toBeNull();
        expect(beginLootCache(s).phase).toBe('delving');
    });

    it('a zero-purse cache still floors the hidden layers', () => {
        const s = fresh(11, 0);
        expect(s.layers[1].loot.currency).toBe(LOOT_CACHE_TUNING.falseBottomFloor);
        expect(s.layers[2].loot.currency).toBe(LOOT_CACHE_TUNING.falseBottomFloor);
    });

    it('two sessions from the same seed produce identical layer content', () => {
        const a = fresh(42);
        const b = fresh(42);
        expect(a.layers).toEqual(b.layers);
    });
});

describe('delving → picking', () => {
    it('delve opens a live pick attempt on the next layer without rolling', () => {
        const s = delving(7);
        const p = picking(s);
        expect(p.phase).toBe('picking');
        expect(p.pick).toEqual({
            layerIndex: 0, progress: 0, pushes: 0, lastRoll: null, insightPending: false,
        });
        // No dice rolled yet: rng state is untouched.
        expect(p.rng).toEqual(s.rng);
    });

    it('is a no-op once all layers are exhausted', () => {
        const exhausted: LootCacheSession = { ...delving(7), depth: 3 };
        expect(delveLootCache(exhausted)).toBe(exhausted);
    });
});

describe('pushLootCachePick', () => {
    it('is deterministic: same state, same push, same roll', () => {
        const p = picking(delving(7));
        const a = pushLootCachePick(p);
        const b = pushLootCachePick(p);
        expect(a).toEqual(b);
    });

    it('a roll that clears the difficulty cracks the layer and cards the loot', () => {
        const p = findFirstPush(pushed => pushed.phase === 'card' && pushed.card?.slammed === false);
        const cracked = pushLootCachePick(p);
        expect(cracked.phase).toBe('card');
        expect(cracked.pick).toBeNull();
        expect(cracked.card!.slammed).toBe(false);
        expect(cracked.card!.items).toEqual(ITEMS);
        expect(cracked.card!.currency).toBe(10);
        expect(cracked.card!.pickRoll).not.toBeNull();
        expect(cracked.card!.pickRoll!.gained).toBeGreaterThanOrEqual(LOOT_CACHE_TUNING.difficulty[0]);
        expect(cracked.depth).toBe(1);
        expect(cracked.layers[0].opened).toBe(true);
        expect(cracked.layers[0].spoiled).toBe(false);

        const cont = continueLootCacheCard(cracked);
        expect(cont.phase).toBe('delving');
    });

    it('a roll under the difficulty (no jam) keeps picking and banks progress', () => {
        const p = findFirstPush(pushed => pushed.phase === 'picking');
        const pushed = pushLootCachePick(p);
        expect(pushed.phase).toBe('picking');
        expect(pushed.pick!.pushes).toBe(1);
        expect(pushed.pick!.progress).toBe(pushed.pick!.lastRoll!.gained);
        expect(pushed.pick!.progress).toBeLessThan(LOOT_CACHE_TUNING.difficulty[0]);
        expect(pushed.pick!.lastRoll!.jammed).toBe(false);
    });

    it('accumulates progress across multiple pushes to eventually crack', () => {
        const p = findFirstPush(pushed => pushed.phase === 'picking');
        const afterOne = pushLootCachePick(p);
        const progressAfterOne = afterOne.pick!.progress;
        const afterTwo = pushUntilCard(afterOne);
        expect(afterTwo.phase).toBe('card');
        if (!afterTwo.card!.slammed) {
            expect(afterTwo.card!.pickRoll!.gained + progressAfterOne)
                .toBeGreaterThanOrEqual(LOOT_CACHE_TUNING.difficulty[0]);
        }
    });

    it('a jam bites vitae, spoils and closes ONLY that layer, and does not end the session', () => {
        const p = findFirstPush(pushed => pushed.card?.slammed === true);
        const jammed = pushLootCachePick(p);
        expect(jammed.phase).toBe('card');
        expect(jammed.card!.slammed).toBe(true);
        expect(jammed.card!.bite).toBe(LOOT_CACHE_TUNING.trapBite[0]);
        expect(jammed.card!.pickRoll!.jammed).toBe(true);
        expect(jammed.card!.pickRoll!.slips).toBeGreaterThanOrEqual(LOOT_CACHE_TUNING.jamSlipThreshold);
        expect(jammed.bittenVitae).toBe(LOOT_CACHE_TUNING.trapBite[0]);
        expect(jammed.layers[0].opened).toBe(true);
        expect(jammed.layers[0].spoiled).toBe(true);
        expect(jammed.depth).toBe(1);
        expect(jammed.pick).toBeNull();

        // Session CONTINUES to the next layer decision — it is not over.
        const cont = continueLootCacheCard(jammed);
        expect(cont.phase).toBe('delving');
        expect(cont.outcome).toBeNull();
    });

    it('resisting: max pushes exhausted without a crack or jam leaves the layer closed, unspoiled', () => {
        // Hand-craft a picking session at the edge of maxPushesPerLayer with an
        // artificially high remaining difficulty so the outcome is deterministic
        // regardless of roll magnitude (only jam-vs-not is at stake).
        let base = picking(delving(7));
        for (let seed = 1; seed < 5000; seed++) {
            const candidate: LootCacheSession = {
                ...delving(seed),
                phase: 'picking',
                pick: {
                    layerIndex: 0, progress: 0,
                    pushes: LOOT_CACHE_TUNING.maxPushesPerLayer - 1,
                    lastRoll: null, insightPending: false,
                },
                layers: delving(seed).layers.map((l, i) => (i === 0 ? { ...l, difficulty: 9999 } : l)),
            };
            const pushed = pushLootCachePick(candidate);
            if (pushed.phase === 'card' && !pushed.card!.slammed) {
                base = candidate;
                break;
            }
        }
        const resisted = pushLootCachePick(base);
        expect(resisted.phase).toBe('card');
        expect(resisted.card!.slammed).toBe(false);
        expect(resisted.card!.bite).toBe(0);
        expect(resisted.card!.items).toEqual([]);
        expect(resisted.layers[0].opened).toBe(false);
        expect(resisted.layers[0].spoiled).toBe(false);
        expect(resisted.depth).toBe(1);
        expect(resisted.pick).toBeNull();
    });
});

describe('retreatLootCachePick', () => {
    it('abandons the current layer cleanly: not opened, not spoiled, no bite', () => {
        const p = picking(delving(7));
        const retreated = retreatLootCachePick(p);
        expect(retreated.phase).toBe('card');
        expect(retreated.card!.slammed).toBe(false);
        expect(retreated.card!.bite).toBe(0);
        expect(retreated.layers[0].opened).toBe(false);
        expect(retreated.layers[0].spoiled).toBe(false);
        expect(retreated.depth).toBe(1);
        expect(retreated.pick).toBeNull();
    });

    it('can retreat after one or more pushes, keeping banked progress out of the outcome', () => {
        const p = findFirstPush(pushed => pushed.phase === 'picking');
        const afterPush = pushLootCachePick(p);
        const retreated = retreatLootCachePick(afterPush);
        expect(retreated.phase).toBe('card');
        expect(retreated.layers[0].opened).toBe(false);
    });
});

describe('channelLootCacheInsight', () => {
    it('grants a bonus die on the next push and is spendable once per session', () => {
        const p = picking(delving(7));
        const channeled = channelLootCacheInsight(p);
        expect(channeled.insightUsed).toBe(true);
        expect(channeled.pick!.insightPending).toBe(true);

        const pushed = pushLootCachePick(channeled);
        const roll = pushed.phase === 'picking' ? pushed.pick!.lastRoll! : pushed.card!.pickRoll!;
        expect(roll.dice).toHaveLength(LOOT_CACHE_TUNING.pickPoolSize + LOOT_CACHE_TUNING.insightBonusDice);
        expect(roll.insightSpent).toBe(true);

        // Insight is consumed by that push; a later layer can't channel it again.
        expect(channelLootCacheInsight(p)).not.toBe(p); // still valid the first time
    });

    it('is only spendable before a layer\'s first roll', () => {
        const p = findFirstPush(pushed => pushed.phase === 'picking');
        const afterPush = pushLootCachePick(p);
        expect(channelLootCacheInsight(afterPush)).toBe(afterPush);
    });

    it('cannot be spent twice in one session', () => {
        const p = picking(delving(7));
        const channeled = channelLootCacheInsight(p);
        expect(channelLootCacheInsight(channeled)).toBe(channeled);
    });

    it('a channeled push that jams still counts as insightSpent on the roll', () => {
        for (let seed = 1; seed < 20_000; seed++) {
            const p = picking(delving(seed));
            const channeled = channelLootCacheInsight(p);
            const pushed = pushLootCachePick(channeled);
            if (pushed.phase === 'card' && pushed.card!.slammed) {
                expect(pushed.card!.pickRoll!.insightSpent).toBe(true);
                expect(pushed.card!.pickRoll!.dice).toHaveLength(
                    LOOT_CACHE_TUNING.pickPoolSize + LOOT_CACHE_TUNING.insightBonusDice,
                );
                return;
            }
        }
        throw new Error('no seed produced a channeled jam within budget');
    });
});

describe('sealLootCache', () => {
    it('delving → outcome, keeping only what was already cracked', () => {
        const p = findFirstPush(pushed => pushed.phase === 'card' && pushed.card?.slammed === false);
        const cracked = pushLootCachePick(p);
        const back = continueLootCacheCard(cracked);
        const sealed = sealLootCache(back);
        expect(sealed.phase).toBe('outcome');
        expect(sealed.outcome!.tier).toBe('prudent');
        expect(sealed.outcome!.itemsKept).toEqual(ITEMS);
        expect(sealed.outcome!.currencyKept).toBe(10);
        expect(sealed.outcome!.layersOpened).toBe(1);
    });

    it('is a no-op outside \'delving\'', () => {
        const p = picking(delving(7));
        expect(sealLootCache(p)).toBe(p);
    });
});

describe('full lifecycle — outcome tiers', () => {
    it('emptied: all three layers cracked clean earns the emptied tier', () => {
        outer: for (let seed = 1; seed < 5000; seed++) {
            let s = picking(delving(seed));
            for (let i = 0; i < 3; i++) {
                s = pushUntilCard(s);
                if (s.card!.slammed) continue outer;
                s = continueLootCacheCard(s);
                if (i < 2) s = picking(s);
            }
            expect(s.phase).toBe('outcome');
            const o = s.outcome!;
            expect(o.tier).toBe('emptied');
            expect(o.layersOpened).toBe(3);
            expect(o.itemsKept).toEqual(ITEMS);
            expect(o.currencyKept).toBe(
                10 + Math.ceil(10 * LOOT_CACHE_TUNING.falseBottomBonus) + Math.ceil(10 * LOOT_CACHE_TUNING.tithesBonus),
            );
            expect(o.keepsakes).toHaveLength(1);
            expect(o.bittenVitae).toBe(0);
            return;
        }
        throw new Error('no seed produced a clean emptied run within budget');
    });

    it('stung: a jam anywhere in the run marks the whole session stung at finish', () => {
        const p = findFirstPush(pushed => pushed.card?.slammed === true);
        const jammed = pushLootCachePick(p);
        const back = continueLootCacheCard(jammed);
        expect(back.phase).toBe('delving');
        const sealed = sealLootCache(back);
        expect(sealed.outcome!.tier).toBe('stung');
        expect(sealed.outcome!.bittenVitae).toBe(LOOT_CACHE_TUNING.trapBite[0]);
    });

    it('prudent: sealing with nothing cracked yet and nothing bitten', () => {
        const sealed = sealLootCache(delving(7));
        expect(sealed.outcome!.tier).toBe('prudent');
        expect(sealed.outcome!.layersOpened).toBe(0);
    });
});

describe('guards', () => {
    it('wrong-phase calls are no-ops', () => {
        const intro = fresh(7);
        expect(delveLootCache(intro)).toBe(intro);
        expect(sealLootCache(intro)).toBe(intro);
        expect(continueLootCacheCard(intro)).toBe(intro);
        expect(claimLootCacheOutcome(intro)).toBe(intro);

        const del = delving(7);
        expect(pushLootCachePick(del)).toBe(del);
        expect(retreatLootCachePick(del)).toBe(del);
        expect(channelLootCacheInsight(del)).toBe(del);
    });

    it('claim seals the find', () => {
        const sealed = sealLootCache(delving(7));
        expect(sealed.outcome!.tier).toBe('prudent');
        const claimed = claimLootCacheOutcome(sealed);
        expect(claimed.phase).toBe('done');
    });
});
