/**
 * Rest balance guard — Monte-Carlo over the real engine with scripted
 * posture bots (see `rest.sim.ts`). Rest is the gentle minigame: a night
 * can be MEAGRE but never lethal, so the bands encode a heal-RICHNESS
 * gradient and the posture trades, not a risk-of-ruin axis —
 *
 *   watcher (leanest heal, safest, most finds)
 *     < deep-sleeper (lazy max-posture)
 *       < fire-tender (skilled warmth banking out-heals everyone)
 *
 *   watcher      — thinnest heal, never restored, finds the most keepsakes.
 *   deep-sleeper — richer baseHeal but pays for stirs unwatched.
 *   fire-tender  — banks warmth into heal AND the cleanse line; the skill take.
 *
 * If content changes break a band, this suite fails and the numbers need
 * re-tuning (or the band needs a deliberate, documented update). 400 seeded
 * runs per policy keeps the suite fast while holding rate noise to ~±5pp.
 */

import { describe, expect, it } from 'vitest';

import { generateRestBalanceReport, runRestSim } from '../rest.sim';

const RUNS = 400;

describe('rest balance bands', () => {
    const deep = runRestSim({ runs: RUNS, policy: 'deep-sleeper' });
    const watcher = runRestSim({ runs: RUNS, policy: 'watcher' });
    const tender = runRestSim({ runs: RUNS, policy: 'fire-tender' });

    it('rest is never lethal: every dawn heals a non-negative fraction', () => {
        for (const sum of [deep, watcher, tender]) {
            expect(sum.avgHealFraction).toBeGreaterThan(0);
            expect(sum.tiers.restored + sum.tiers.rested + sum.tiers.meagre).toBe(RUNS);
        }
    });

    it('the watcher takes the leanest heal but finds the most keepsakes', () => {
        expect(watcher.avgHealFraction).toBeLessThan(deep.avgHealFraction);
        expect(watcher.avgHealFraction).toBeLessThan(tender.avgHealFraction);
        expect(watcher.meagreRate).toBeGreaterThanOrEqual(0.5);
        expect(watcher.avgKeepsakes).toBeGreaterThan(tender.avgKeepsakes);
    });

    it('the fire-tender banks warmth into heal and the cleanse line', () => {
        expect(tender.avgHealFraction).toBeGreaterThan(deep.avgHealFraction);
        expect(tender.cleanseRate).toBeGreaterThanOrEqual(0.5);
        expect(tender.avgWarmth).toBeGreaterThanOrEqual(2.5);
        // Skilled tending never bottoms out into the meagre tier.
        expect(tender.meagreRate).toBeLessThanOrEqual(0.05);
    });

    it('the deep-sleeper trades a watched fire for a fat baseHeal', () => {
        expect(deep.avgHealFraction).toBeGreaterThan(watcher.avgHealFraction);
        // Sleeping deep leaves the fire untended, so warmth runs cold.
        expect(deep.avgWarmth).toBeLessThan(tender.avgWarmth);
        expect(deep.cleanseRate).toBeLessThan(tender.cleanseRate);
    });

    it('the heal-richness gradient holds: watcher < deep < fire-tender', () => {
        expect(watcher.avgHealFraction).toBeLessThan(deep.avgHealFraction);
        expect(deep.avgHealFraction).toBeLessThan(tender.avgHealFraction);
    });
});

describe('rest balance report', () => {
    it('reports the heal gradient and stays healthy at default content', () => {
        const report = generateRestBalanceReport(200);
        expect(report.totalRuns).toBe(600);
        expect(report.policies['deep-sleeper']).toBeDefined();
        expect(report.policies.watcher).toBeDefined();
        expect(report.policies['fire-tender']).toBeDefined();
        // healGradient = [fire-tender, deep-sleeper, watcher], descending.
        const [tender, deep, watcher] = report.healGradient;
        expect(tender).toBeGreaterThan(deep);
        expect(deep).toBeGreaterThan(watcher);
        expect(report.recommendations).toHaveLength(0);
    });
});
