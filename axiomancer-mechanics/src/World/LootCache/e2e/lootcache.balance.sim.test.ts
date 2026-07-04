/**
 * Loot-cache balance guard — Monte-Carlo over the real engine with
 * scripted push-your-luck bots (see `lootcache.sim.ts`). The Reliquary is
 * now a LIVE dice-pool "Pick Pool" gamble: every layer's difficulty is
 * public, and the player rolls to crack it, choosing after every roll
 * whether to push, retreat, or (once per session) channel Insight for a
 * bonus die. The bands encode the skill expression — INFORMED risk
 * management beats blind greed, which beats early restraint —
 *
 *   prudent (retreat after one push, stop once bitten: safest, poorest)
 *     < greedy (always push: richest raw take, most bitten)
 *       < informed (spends its one Insight charge on the deepest layer:
 *                 matches or beats greedy's raw take at a real reduction
 *                 in bites/stings)
 *
 * If content changes break a band, this suite fails and the numbers need
 * re-tuning (or the band needs a deliberate, documented update). 400 seeded
 * runs per policy keeps the suite fast while holding rate noise to ~±5pp.
 */

import { describe, expect, it } from 'vitest';

import {
    generateLootCacheBalanceReport,
    LOOT_CACHE_BITE_PENALTY,
    runLootCacheSim,
} from '../lootcache.sim';

const RUNS = 400;

describe('loot-cache balance bands', () => {
    const greedy = runLootCacheSim({ runs: RUNS, policy: 'greedy' });
    const prudent = runLootCacheSim({ runs: RUNS, policy: 'prudent' });
    const informed = runLootCacheSim({ runs: RUNS, policy: 'informed' });

    it('blind greed opens every layer and takes real jam risk', () => {
        expect(greedy.avgLayersOpened).toBeCloseTo(3, 0);
        expect(greedy.avgBitten).toBeGreaterThan(0);
        expect(greedy.stungRate).toBeGreaterThan(0.15);
        expect(greedy.stungRate).toBeLessThan(0.5);
    });

    it('the prudent retreat-early walk is the safer, poorer floor', () => {
        expect(prudent.avgLayersOpened).toBeLessThan(greedy.avgLayersOpened);
        expect(prudent.avgCurrency).toBeLessThan(greedy.avgCurrency);
        expect(prudent.avgBitten).toBeLessThanOrEqual(greedy.avgBitten);
    });

    it('informed Insight play matches or beats greedy loot at fewer bites', () => {
        // Same or better raw take as blind greed (it still reaches the tithe)...
        expect(informed.avgCurrency).toBeGreaterThanOrEqual(prudent.avgCurrency);
        expect(informed.avgCurrency).toBeGreaterThanOrEqual(greedy.avgCurrency * 0.95);
        // ...for fewer bites and fewer stings.
        expect(informed.avgBitten).toBeLessThan(greedy.avgBitten);
        expect(informed.stungRate).toBeLessThan(greedy.stungRate);
    });

    it('the risk-adjusted gradient holds: informed beats both blind greed and pure restraint', () => {
        const value = (s: typeof greedy) => s.avgCurrency - LOOT_CACHE_BITE_PENALTY * s.avgBitten;
        expect(value(informed)).toBeGreaterThan(value(greedy));
        expect(value(informed)).toBeGreaterThan(value(prudent));
    });
});

describe('loot-cache balance report', () => {
    it('reports both gradients and stays healthy at default content', () => {
        const report = generateLootCacheBalanceReport(200);
        expect(report.totalRuns).toBe(600);
        expect(report.policies.greedy).toBeDefined();
        expect(report.policies.prudent).toBeDefined();
        expect(report.policies.informed).toBeDefined();
        // riskAdjusted = [informed, greedy, prudent]; informed leads.
        const [informedVal, greedyVal, prudentVal] = report.riskAdjusted;
        expect(informedVal).toBeGreaterThan(greedyVal);
        expect(informedVal).toBeGreaterThan(prudentVal);
        expect(report.recommendations).toHaveLength(0);
    });
});
