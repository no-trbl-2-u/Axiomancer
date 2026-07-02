/**
 * Gathering balance guard — Monte-Carlo over the real engine with
 * scripted bots (see `state/gathering/sim.ts`). The bands encode the
 * Forage doctrine: the game is about EXTRACTION vs RESTRAINT, so the
 * incentive gradient must hold —
 *
 *   blind greed  < timid restraint < skilled push-your-luck
 *
 *   timid    — never erupts, communes often, takes a modest satchel.
 *   balanced — reads the wrath costs, never despoils, takes the most.
 *   greedy   — strips and never stops: the site always answers, and the
 *              eruption + bites leave it with the LEAST.
 *
 * If content changes break a band, this suite fails and the numbers
 * need re-tuning (or the band needs a deliberate, documented update).
 * 400 seeded runs per policy keeps the suite fast while holding rate
 * noise to roughly ±5pp.
 */

import { describe, expect, it } from 'vitest';

import { GATHERING_SITES } from '../gathering.content';
import { 
    runGatheringSim, 
    runGatheringABTest,
    generateGatheringBalanceReport,
    type GatheringTuning
} from '../gathering.sim';
import { GATHERING_TUNING } from '../gathering.tuning';

const RUNS = 400;
const PER_SITE_RUNS = 120;

describe('gathering balance bands', () => {
    const timid = runGatheringSim({ runs: RUNS, policy: 'timid' });
    const balanced = runGatheringSim({ runs: RUNS, policy: 'balanced' });
    const greedy = runGatheringSim({ runs: RUNS, policy: 'greedy' });

    it('timid restraint is safe: no eruptions, frequent communion, modest take', () => {
        expect(timid.eruptionRate).toBeLessThanOrEqual(0.01);
        expect(timid.tiers.despoiled).toBe(0);
        expect(timid.communionRate).toBeGreaterThanOrEqual(0.35);
        expect(timid.avgKeptRichness).toBeGreaterThanOrEqual(6);
        expect(timid.avgKeptRichness).toBeLessThanOrEqual(10);
        expect(timid.avgBitten).toBeLessThanOrEqual(1);
    });

    it('skilled push-your-luck takes the most without scarring', () => {
        expect(balanced.eruptionRate).toBeLessThanOrEqual(0.03);
        expect(balanced.tiers.despoiled / RUNS).toBeLessThanOrEqual(0.05);
        expect(balanced.communionRate).toBeGreaterThanOrEqual(0.12);
        expect(balanced.avgKeptRichness).toBeGreaterThanOrEqual(10.5);
        expect(balanced.avgKeptRichness).toBeLessThanOrEqual(15);
    });

    it('blind greed always wakes the site and pays for it', () => {
        expect(greedy.eruptionRate).toBeGreaterThanOrEqual(0.9);
        expect(greedy.avgBitten).toBeGreaterThanOrEqual(3);
    });

    it('the incentive gradient holds: greed < restraint < skill', () => {
        expect(greedy.avgKeptRichness).toBeLessThan(timid.avgKeptRichness);
        expect(timid.avgKeptRichness).toBeLessThan(balanced.avgKeptRichness);
    });

    for (const site of GATHERING_SITES) {
        it(`${site.title}: the wrath economy holds per-site`, () => {
            const t = runGatheringSim({ runs: PER_SITE_RUNS, policy: 'timid', siteId: site.id });
            const g = runGatheringSim({ runs: PER_SITE_RUNS, policy: 'greedy', siteId: site.id });
            expect(t.eruptionRate).toBeLessThanOrEqual(0.02);
            expect(g.eruptionRate).toBeGreaterThanOrEqual(0.8);
        });
    }
});

describe('gathering new playstyle bots', () => {
    it('wrath-pusher seeks controlled high wrath for maximum extraction', () => {
        const wrathPusher = runGatheringSim({ runs: 200, policy: 'wrath-pusher' });
        const balanced = runGatheringSim({ runs: 200, policy: 'balanced' });
        
        // Should extract more richness through controlled wrath management
        expect(wrathPusher.avgKeptRichness).toBeGreaterThan(balanced.avgKeptRichness);
        // Should maintain reasonable communion rate (not zero)
        expect(wrathPusher.communionRate).toBeGreaterThan(0.1);
        // Should keep eruption rate low through careful management
        expect(wrathPusher.eruptionRate).toBeLessThan(0.1);
    });

    it('communion-chaser prioritizes early withdrawal over material gain', () => {
        const communionChaser = runGatheringSim({ runs: 200, policy: 'communion-chaser' });
        const timid = runGatheringSim({ runs: 200, policy: 'timid' });
        
        // Should be very conservative - withdraws early with much lower richness
        expect(communionChaser.avgKeptRichness).toBeLessThan(timid.avgKeptRichness);
        // Should have zero eruptions due to extreme caution
        expect(communionChaser.eruptionRate).toBe(0);
        // Should achieve some balance between safety and yield
        expect(communionChaser.avgKeptRichness).toBeGreaterThan(1);
    });

    it('new policies show distinct behavior patterns', () => {
        const wrathPusher = runGatheringSim({ runs: 100, policy: 'wrath-pusher' });
        const communionChaser = runGatheringSim({ runs: 100, policy: 'communion-chaser' });
        
        // Wrath-pusher should extract much more richness through aggressive play
        expect(wrathPusher.avgKeptRichness).toBeGreaterThan(communionChaser.avgKeptRichness * 2);
        // Both should avoid eruptions
        expect(wrathPusher.eruptionRate).toBeLessThan(0.1);
        expect(communionChaser.eruptionRate).toBe(0);
    });
});

describe('gathering A/B testing infrastructure', () => {
    it('A/B test runner executes without errors', () => {
        const configA: GatheringTuning = {
            wrathThreshold: GATHERING_TUNING.wrath.thresholds[0],
            eruptionPenalty: 0.5,
            communionBonus: 5,
            wrathMax: GATHERING_TUNING.wrath.max,
            duskAfterTurn: GATHERING_TUNING.dusk.afterTurn,
        };
        
        const configB: GatheringTuning = {
            wrathThreshold: GATHERING_TUNING.wrath.thresholds[0],
            eruptionPenalty: 0.3,
            communionBonus: 7,
            wrathMax: GATHERING_TUNING.wrath.max,
            duskAfterTurn: GATHERING_TUNING.dusk.afterTurn,
        };
        
        const result = runGatheringABTest(configA, configB, 100);
        
        expect(result.runs).toBe(100);
        expect(result.configA).toBeDefined();
        expect(result.configB).toBeDefined();
        expect(result.comparison).toBeDefined();
        expect(typeof result.significant).toBe('boolean');
    });

    it('generates structured balance report', () => {
        const report = generateGatheringBalanceReport(50);
        
        expect(report.timestamp).toBeDefined();
        expect(report.totalRuns).toBe(250); // 50 runs × 5 policies
        expect(report.policies).toBeDefined();
        expect(report.balanceBands).toBeDefined();
        expect(Array.isArray(report.recommendations)).toBe(true);
        
        // Check all new policies are included
        expect(report.policies['wrath-pusher']).toBeDefined();
        expect(report.policies['communion-chaser']).toBeDefined();
        
        // Check balance bands structure
        expect(report.balanceBands.eruptionRateMax).toBeGreaterThan(0);
        expect(report.balanceBands.communionRateMin).toBeGreaterThan(0);
        expect(Array.isArray(report.balanceBands.richnessGradient)).toBe(true);
        expect(report.balanceBands.richnessGradient).toHaveLength(3);
    });
});
