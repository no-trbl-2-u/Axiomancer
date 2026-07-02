/**
 * Loot-cache balance guard — Monte-Carlo over the real engine with
 * scripted push-your-luck bots (see `lootcache.sim.ts`). The Reliquary is
 * a hidden-information gamble: deeper layers are richer AND likelier
 * trapped, and one probe buys perfect information. The bands encode the
 * skill expression — INFORMED greed beats blind greed —
 *
 *   prudent (lid only: never rich, never bitten)
 *     ~= greedy on risk-adjusted value (blind greed pays its winnings back in bites)
 *       < prober (same raw loot as greedy, a fraction of the pain)
 *
 *   greedy  — always delve: the richest raw take, but the most bitten and
 *             stung two times in three.
 *   prudent — lid then seal: the floor. Never bitten, never stung.
 *   prober  — saves the probe for the deadliest (deepest) layer: matches
 *             greedy's raw currency at half the bites and half the slams.
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
    const prober = runLootCacheSim({ runs: RUNS, policy: 'prober' });

    it('blind greed wakes the traps: most bitten, stung the majority of caches', () => {
        expect(greedy.avgBitten).toBeGreaterThanOrEqual(1);
        expect(greedy.stungRate).toBeGreaterThanOrEqual(0.5);
        // It does open the most layers, so its raw currency is high.
        expect(greedy.avgLayersOpened).toBeGreaterThanOrEqual(2.3);
    });

    it('the prudent lid-only walk is the unbitten floor', () => {
        expect(prudent.avgBitten).toBe(0);
        expect(prudent.stungRate).toBe(0);
        expect(prudent.prudentRate).toBe(1);
        expect(prudent.avgLayersOpened).toBe(1);
    });

    it('informed probing matches greedy loot at a fraction of the pain', () => {
        // Same raw take as blind greed (it still reaches the tithe)...
        expect(prober.avgCurrency).toBeGreaterThanOrEqual(prudent.avgCurrency);
        expect(prober.avgCurrency).toBeCloseTo(greedy.avgCurrency, 0);
        // ...for far fewer bites and far fewer slams.
        expect(prober.avgBitten).toBeLessThan(greedy.avgBitten);
        expect(prober.stungRate).toBeLessThan(greedy.stungRate);
    });

    it('the risk-adjusted gradient holds: prober beats both blind greed and pure restraint', () => {
        const value = (s: typeof greedy) => s.avgCurrency - LOOT_CACHE_BITE_PENALTY * s.avgBitten;
        expect(value(prober)).toBeGreaterThan(value(greedy));
        expect(value(prober)).toBeGreaterThan(value(prudent));
        // Blind greed gambles its winnings away: no better than walking early.
        expect(value(greedy)).toBeLessThanOrEqual(value(prudent) + 1);
    });
});

describe('loot-cache balance report', () => {
    it('reports both gradients and stays healthy at default content', () => {
        const report = generateLootCacheBalanceReport(200);
        expect(report.totalRuns).toBe(600);
        expect(report.policies.greedy).toBeDefined();
        expect(report.policies.prudent).toBeDefined();
        expect(report.policies.prober).toBeDefined();
        // riskAdjusted = [prober, greedy, prudent]; prober leads.
        const [proberVal, greedyVal, prudentVal] = report.riskAdjusted;
        expect(proberVal).toBeGreaterThan(greedyVal);
        expect(proberVal).toBeGreaterThan(prudentVal);
        expect(report.recommendations).toHaveLength(0);
    });
});
