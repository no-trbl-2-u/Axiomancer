/**
 * Minigame Harness — hermetic e2e tests.
 *
 * Tests the composable harness that orchestrates balance testing across
 * the Hazard minigame. Exercises single minigame execution, A/B testing
 * scenarios, and pass/fail evaluation logic. (Phase 61 — the Quest Board
 * arm retired along with the minigame itself. Phase 76 — the Gathering
 * arm retired the same way.)
 */

import { describe, it, expect } from 'vitest';
import { runMinigameHarness, summarizeHarnessReport } from '../minigame-harness.resolver';
import { HAZARD_TUNING } from '../Hazard/hazard.tuning';
import type { MinigameHarnessConfig } from '../minigame-harness.types';

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
        expect(report.abTests?.hazard).toBeUndefined();
        expect(typeof report.passFail.hazard).toBe('boolean');
        expect(typeof report.passFail.overall).toBe('boolean');
        expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp format
    });

    it('performs A/B testing when variants provided', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard'],
            runs: testRuns,
            seed: testSeed,
            abTestVariants: {
                hazard: [HAZARD_TUNING, HAZARD_TUNING], // Same config for test
            },
        };

        const report = runMinigameHarness(config);

        // A/B tests should be present when variants are provided
        expect(report.abTests?.hazard).toBeDefined();
    });

    it('correctly evaluates pass/fail criteria', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard'],
            runs: testRuns,
            seed: testSeed,
        };

        const report = runMinigameHarness(config);

        // Individual pass/fail should be boolean
        expect(typeof report.passFail.hazard).toBe('boolean');

        // Overall should be logical AND of enabled minigames
        expect(report.passFail.overall).toBe(report.passFail.hazard);
    });

    it('generates valid summary report', () => {
        const config: MinigameHarnessConfig = {
            minigames: ['hazard'],
            runs: testRuns,
            seed: testSeed,
        };

        const fullReport = runMinigameHarness(config);
        const summary = summarizeHarnessReport(fullReport);

        expect(summary.minigamesRun).toHaveLength(1);
        expect(summary.minigamesRun).toEqual(['hazard']);
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
            minigames: ['hazard'],
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
        expect(report.passFail).toHaveProperty('overall');

        // Timestamp should be valid ISO string
        expect(() => new Date(report.timestamp)).not.toThrow();
    });
});
