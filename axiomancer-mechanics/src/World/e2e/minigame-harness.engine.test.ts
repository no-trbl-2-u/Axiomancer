/**
 * Minigame Harness — hermetic e2e tests.
 *
 * Tests the composable harness that orchestrates balance testing across
 * the Hazard and Gathering minigames. Exercises single minigame execution,
 * multi-minigame orchestration, A/B testing scenarios, and pass/fail
 * evaluation logic. (Phase 61 — the Quest Board arm retired along with
 * the minigame itself.)
 */

import { describe, it, expect } from 'vitest';
import { runMinigameHarness, summarizeHarnessReport } from '../minigame-harness.resolver';
import { HAZARD_TUNING } from '../Hazard/hazard.tuning';
import type { MinigameHarnessConfig } from '../minigame-harness.types';
import type { GatheringTuning } from '../Gathering/gathering.sim';

describe('Minigame Harness', () => {
    const testSeed = 'test-harness-seed';
    const testRuns = 50; // Reduced runs for test performance

    it('runs single minigame harness - hazard', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        expect(report.totalMinigames).toBe(1);
        expect(report.results.hazard).toBeDefined();
        expect(report.results.gathering).toBeUndefined();
        expect(report.abTests?.hazard).toBeUndefined();
        expect(typeof report.passFail.hazard).toBe('boolean');
        expect(typeof report.passFail.overall).toBe('boolean');
        expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp format
    });

    it('runs single minigame harness - gathering', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['gathering'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        expect(report.totalMinigames).toBe(1);
        expect(report.results.gathering).toBeDefined();
        expect(report.results.hazard).toBeUndefined();
        expect(report.abTests?.gathering).toBeUndefined();
        expect(typeof report.passFail.gathering).toBe('boolean');
        expect(typeof report.passFail.overall).toBe('boolean');

        // Validate gathering report structure
        const gatheringReport = report.results.gathering!;
        expect(gatheringReport.policies).toBeDefined();
        expect(gatheringReport.balanceBands).toBeDefined();
        expect(gatheringReport.recommendations).toBeInstanceOf(Array);
    });

    it('orchestrates both minigames', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard', 'gathering'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        expect(report.totalMinigames).toBe(2);
        expect(report.results.hazard).toBeDefined();
        expect(report.results.gathering).toBeDefined();

        // All minigame pass/fail evaluations should exist
        expect(typeof report.passFail.hazard).toBe('boolean');
        expect(typeof report.passFail.gathering).toBe('boolean');
        expect(typeof report.passFail.overall).toBe('boolean');

        // Overall pass should depend on individual minigame passes
        const individualResults = [
            report.passFail.hazard,
            report.passFail.gathering,
        ];
        const expectedOverall = individualResults.every(result => result);
        expect(report.passFail.overall).toBe(expectedOverall);
    });

    it('performs A/B testing when variants provided', () => {
        const gatheringConfigA: GatheringTuning = {
            wrathThreshold: 6,
            eruptionPenalty: 0.3,
            communionBonus: 0.2,
            wrathMax: 8,
            duskAfterTurn: 12,
        };

        const gatheringConfigB: GatheringTuning = {
            wrathThreshold: 7,
            eruptionPenalty: 0.4,
            communionBonus: 0.15,
            wrathMax: 8,
            duskAfterTurn: 12,
        };

        const config: MinigameHarnessConfig = {
            minigames: ['hazard', 'gathering'],
            runs: testRuns,
            seed: testSeed,
            abTestVariants: {
                hazard: [HAZARD_TUNING, HAZARD_TUNING], // Same config for test
                gathering: [gatheringConfigA, gatheringConfigB],
            },
        };

        const report = runMinigameHarness(config);

        // A/B tests should be present when variants are provided
        expect(report.abTests?.hazard).toBeDefined();
        expect(report.abTests?.gathering).toBeDefined();

        // Validate A/B test structure
        const gatheringAB = report.abTests!.gathering!;
        expect(gatheringAB.configA).toBeDefined();
        expect(gatheringAB.configB).toBeDefined();
        expect(gatheringAB.runs).toBe(testRuns);
        expect(gatheringAB.comparison).toBeDefined();
    });

    it('produces deterministic results with same seed', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['gathering'], // Use gathering as it's deterministic
            runs: testRuns,
            seed: 'deterministic-test-seed',
        };

        const report1 = runMinigameHarness(config);
        const report2 = runMinigameHarness(config);

        // Results should be identical for same seed (excluding timestamp)
        expect(report1.totalMinigames).toBe(report2.totalMinigames);
        expect(report1.passFail).toEqual(report2.passFail);

        // Gathering policy results should be deterministic
        const gathering1 = report1.results.gathering!;
        const gathering2 = report2.results.gathering!;

        expect(gathering1.policies.greedy.eruptionRate).toBe(gathering2.policies.greedy.eruptionRate);
        expect(gathering1.policies.greedy.avgKeptRichness).toBe(gathering2.policies.greedy.avgKeptRichness);
    });

    it('correctly evaluates pass/fail criteria', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard', 'gathering'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        // Individual pass/fail should be boolean
        expect(typeof report.passFail.hazard).toBe('boolean');
        expect(typeof report.passFail.gathering).toBe('boolean');

        // Overall should be logical AND of enabled minigames
        const expectedOverall = report.passFail.hazard && report.passFail.gathering;
        expect(report.passFail.overall).toBe(expectedOverall);
    });

    it('generates valid summary report', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard', 'gathering'],
            runs: testRuns,
            seed: testSeed,
        };

        const fullReport = runMinigameHarness(config);
        const summary = summarizeHarnessReport(fullReport);

        expect(summary.minigamesRun).toHaveLength(2);
        expect(summary.minigamesRun).toEqual(['hazard', 'gathering']);
        expect(typeof summary.totalRuns).toBe('number');
        expect(typeof summary.overallPass).toBe('boolean');
        expect(Array.isArray(summary.recommendations)).toBe(true);

        // Summary overall pass should match full report
        expect(summary.overallPass).toBe(fullReport.passFail.overall);
    });

    it('handles empty minigames array', () => {
        const config: MinigameHarnessConfig = {
            minigames: [],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        expect(report.totalMinigames).toBe(0);
        expect(Object.keys(report.results)).toHaveLength(0);
        expect(report.passFail.overall).toBe(true); // Empty case should pass
    });

    it('validates report structure completeness', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['gathering'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        // Required top-level fields
        expect(report).toHaveProperty('timestamp');
        expect(report).toHaveProperty('totalMinigames');
        expect(report).toHaveProperty('results');
        expect(report).toHaveProperty('abTests');
        expect(report).toHaveProperty('passFail');

        // Pass/fail structure
        expect(report.passFail).toHaveProperty('hazard');
        expect(report.passFail).toHaveProperty('gathering');
        expect(report.passFail).toHaveProperty('overall');

        // Timestamp should be valid ISO string
        expect(() => new Date(report.timestamp)).not.toThrow();
    });
});
