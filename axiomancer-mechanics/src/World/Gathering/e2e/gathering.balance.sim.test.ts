/**
 * Gathering balance guard — Monte-Carlo over the real engine with
 * scripted bots (see `gathering.sim.ts`). The bands encode the Forage
 * doctrine: the game is about EXTRACTION vs RESTRAINT, so the incentive
 * gradient must hold —
 *
 *   blind greed < timid restraint < competent play < INFORMED play
 *
 *   greedy   — strips and never stops: the site always answers, and the
 *              eruption + bites leave it with the least.
 *   timid    — never erupts, communes often, takes a modest satchel.
 *   balanced — watches the omens and budgets worst-case, but has to leave
 *              slack for an eruption point it can only estimate.
 *   reader   — pays a turn to LEARN that point, then spends the slack.
 *
 * That last rung is what the 2026-08-08 redesign added and what this suite
 * now has to protect. Before it, the eruption point was a constant (12) and
 * every wrath cost was printed on its plot, so "push your luck" had no luck
 * in it: the whole session was a solved knapsack. With the point hidden
 * behind a rolled TEMPER and STRIP's cost carrying real variance, the
 * question "do I take one more?" finally has an answer nobody knows — and
 * INFORMATION becomes a resource worth spending a turn on.
 *
 * If content changes break a band, this suite fails and the numbers need
 * re-tuning (or the band needs a deliberate, documented update). 400 seeded
 * runs per policy keeps the suite fast while holding rate noise to roughly
 * +/-5pp.
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
    const reader = runGatheringSim({ runs: RUNS, policy: 'reader' });

    it('timid restraint is safe: no eruptions, frequent communion, modest take', () => {
        expect(timid.eruptionRate).toBeLessThanOrEqual(0.01);
        expect(timid.tiers.despoiled).toBe(0);
        expect(timid.communionRate).toBeGreaterThanOrEqual(0.35);
        expect(timid.avgKeptRichness).toBeGreaterThanOrEqual(6);
        expect(timid.avgKeptRichness).toBeLessThanOrEqual(10);
        expect(timid.avgBitten).toBeLessThanOrEqual(1);
    });

    it('competent play takes more than restraint without ever scarring', () => {
        expect(balanced.eruptionRate).toBeLessThanOrEqual(0.03);
        expect(balanced.tiers.despoiled / RUNS).toBeLessThanOrEqual(0.05);
        expect(balanced.avgKeptRichness).toBeGreaterThanOrEqual(9.5);
        expect(balanced.avgKeptRichness).toBeLessThanOrEqual(15);
    });

    it('blind greed always wakes the site and pays for it', () => {
        expect(greedy.eruptionRate).toBeGreaterThanOrEqual(0.9);
        expect(greedy.avgBitten).toBeGreaterThanOrEqual(3);
    });

    it('READING the site pays for itself — information is the top rung', () => {
        // The load-bearing assertion of the whole redesign. `reader` plays the
        // same stance as `balanced` and spends a turn it will never get back;
        // the only thing it has that `balanced` lacks is the number. If that
        // stops being worth a turn, the hidden temper is just noise and the
        // READ THE SITE action is a trap.
        expect(reader.avgKeptRichness).toBeGreaterThan(balanced.avgKeptRichness);
        // And it converts knowledge into precision, not recklessness: knowing
        // exactly where the line is means never crossing it.
        expect(reader.eruptionRate).toBeLessThanOrEqual(0.01);
        expect(reader.tiers.despoiled / RUNS).toBeLessThanOrEqual(0.05);
    });

    it('the incentive gradient holds: greed < restraint < competence < information', () => {
        expect(greedy.avgKeptRichness).toBeLessThan(timid.avgKeptRichness);
        expect(timid.avgKeptRichness).toBeLessThan(balanced.avgKeptRichness);
        expect(balanced.avgKeptRichness).toBeLessThan(reader.avgKeptRichness);
    });

    it('the stance fork is real: gleaning and stripping pay in different coin', () => {
        // Same discipline, opposite stance. GLEAN caps yields but takes exactly
        // what it means to; STRIP takes uncapped and pays plunder coin, at the
        // price of a cost it cannot predict. Neither may dominate — if one
        // does, the choice at the threshold is decoration. The guard is that
        // each wins its OWN axis, against the other and against the
        // uninformed line.
        const plunderer = runGatheringSim({ runs: RUNS, policy: 'plunderer' });
        expect(reader.avgKeptRichness).toBeGreaterThan(plunderer.avgKeptRichness);
        expect(plunderer.avgShillings).toBeGreaterThan(reader.avgShillings);
        expect(reader.avgKeptRichness).toBeGreaterThan(balanced.avgKeptRichness);
        expect(plunderer.avgShillings).toBeGreaterThan(balanced.avgShillings);
        // Discipline still keeps the site whole under either stance.
        expect(plunderer.eruptionRate).toBeLessThanOrEqual(0.05);
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

describe('gathering playstyle bots', () => {
    it('wrath-pusher trades a real chance of eruption for a real haul', () => {
        const wrathPusher = runGatheringSim({ runs: 200, policy: 'wrath-pusher' });
        const balanced = runGatheringSim({ runs: 200, policy: 'balanced' });

        // Rides the omen to SEETHING while stripping, so the unsteady hand
        // genuinely can tip it over — and usually does. That is the point: it
        // is the gamble line, not a strictly-better line. Pre-2026-08-08 this
        // bot could push to a KNOWN ceiling and take more with almost no risk,
        // which is exactly the tension the redesign restored. It pays out in
        // plunder coin when it survives, and it very often does not.
        expect(wrathPusher.avgShillings).toBeGreaterThan(balanced.avgShillings);
        expect(wrathPusher.eruptionRate).toBeGreaterThan(0.3);
        expect(wrathPusher.avgBitten).toBeGreaterThan(balanced.avgBitten);
    });

    it('communion-chaser buys the tier and forfeits the take', () => {
        const communionChaser = runGatheringSim({ runs: 200, policy: 'communion-chaser' });
        const timid = runGatheringSim({ runs: 200, policy: 'timid' });

        expect(communionChaser.communionRate).toBeGreaterThanOrEqual(0.9);
        expect(communionChaser.avgKeptRichness).toBeLessThan(timid.avgKeptRichness);
        expect(communionChaser.eruptionRate).toBe(0);
        expect(communionChaser.avgKeptRichness).toBeGreaterThan(1);
    });

    it('the policies stay distinguishable — no two bots play the same game', () => {
        const wrathPusher = runGatheringSim({ runs: 100, policy: 'wrath-pusher' });
        const communionChaser = runGatheringSim({ runs: 100, policy: 'communion-chaser' });

        expect(wrathPusher.avgKeptRichness).toBeGreaterThan(communionChaser.avgKeptRichness * 2);
        expect(communionChaser.communionRate).toBeGreaterThan(wrathPusher.communionRate);
        expect(wrathPusher.eruptionRate).toBeGreaterThan(communionChaser.eruptionRate);
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
