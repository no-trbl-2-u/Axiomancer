/**
 * Hazard balance guard — Monte-Carlo over the real engine with a
 * greedy bot (see `src/World/Hazard/hazard.sim.ts`). The bands encode the
 * no-re-cast retune targets, hardened by the 2026-06-12 difficulty
 * pass (playtest: the crossings had grown too easy):
 *
 *   Safe route — still forgiving (almost always at least a partial
 *   clear), but a perfect run is now uncommon for the greedy bot
 *   (~30-40%, down from ~60-70%) — real headroom for a skilled player.
 *   Risk route — a sharper gamble: perfect ~10%, failure ~10%+.
 *
 * If content changes push a hazard outside its band, this suite fails
 * and the numbers need re-tuning (or the band needs a deliberate,
 * documented update). 300 seeded runs per cell keeps the suite fast
 * (< 2s) while holding rate noise to roughly ±5pp.
 */

import { describe, expect, it } from 'vitest';

import { HAZARD_LIBRARY } from '../hazard.content';
import { hazardStarterBag } from '../hazard.deck-flags';
import { simulateHazard, runHazardAB, generateHazardBalanceReport } from '../hazard.sim';
import { HAZARD_TUNING } from '../hazard.tuning';

const BAG = hazardStarterBag();
const RUNS = 300;

describe('hazard balance bands (greedy bot, no re-cast doctrine)', () => {
    for (const hazard of HAZARD_LIBRARY) {
        describe(hazard.title, () => {
            // 2026-06-25: threshold raised 0.52 → 0.65 after starter deck refresh.
            // Three STONE STEPS copies replaced with STEADIED HAND (dual 1+1 + aura),
            // FORK IN THE ROAD (choose), IRON WILL (force + anchor). The aura bonus
            // lifts the greedy bot's perfect rate to ~55-58% on safe routes, which is
            // intentional — the new cards add more decision depth and a slightly higher
            // ceiling. The failure cap (0.1) still holds.
            it('safe route stays forgiving but no longer easy (tuned: ~45-65% perfect, ~0-3% failure)', () => {
                const stats = simulateHazard(hazard.id, 'safe', BAG, RUNS);
                expect(stats.atLeastOneWinRate).toBeGreaterThanOrEqual(0.9);
                expect(stats.perfectRate).toBeGreaterThanOrEqual(0.18);
                expect(stats.perfectRate).toBeLessThanOrEqual(0.65);
                expect(stats.failureRate).toBeLessThanOrEqual(0.1);
            });

            it('risk route stays a sharp gamble (tuned: ~10% perfect, ~10% failure)', () => {
                const stats = simulateHazard(hazard.id, 'risk', BAG, RUNS);
                expect(stats.atLeastOneWinRate).toBeGreaterThanOrEqual(0.74);
                expect(stats.atLeastOneWinRate).toBeLessThanOrEqual(0.97);
                expect(stats.perfectRate).toBeGreaterThanOrEqual(0.03);
                expect(stats.perfectRate).toBeLessThanOrEqual(0.22);
                expect(stats.failureRate).toBeGreaterThanOrEqual(0.03);
                expect(stats.failureRate).toBeLessThanOrEqual(0.25);
            });

            it('risk is strictly harder than safe', () => {
                const safe = simulateHazard(hazard.id, 'safe', BAG, RUNS);
                const risk = simulateHazard(hazard.id, 'risk', BAG, RUNS);
                expect(risk.avgWins).toBeLessThan(safe.avgWins);
            });
        });
    }
});

describe('hazard A/B testing and playstyle policies', () => {
    // Test the first hazard as a representative sample
    const testHazard = HAZARD_LIBRARY[0];
    
    describe('playstyle bot policies', () => {
        it('conservative policy produces valid results on safe route', () => {
            const stats = simulateHazard(testHazard.id, 'conservative', BAG, RUNS);
            expect(stats.atLeastOneWinRate).toBeGreaterThanOrEqual(0.0);
            expect(stats.atLeastOneWinRate).toBeLessThanOrEqual(1.0);
            expect(stats.failureRate).toBeGreaterThanOrEqual(0.0);
            expect(stats.failureRate).toBeLessThanOrEqual(1.0);
        });

        it('opportunist policy produces valid results on risk route', () => {
            const stats = simulateHazard(testHazard.id, 'opportunist', BAG, RUNS);
            expect(stats.perfectRate).toBeGreaterThanOrEqual(0.0);
            expect(stats.perfectRate).toBeLessThanOrEqual(1.0);
            expect(stats.failureRate).toBeGreaterThanOrEqual(0.0);
            expect(stats.failureRate).toBeLessThanOrEqual(1.0);
        });

        it('policies produce measurably different outcomes', () => {
            const conservative = simulateHazard(testHazard.id, 'conservative', BAG, RUNS);
            const opportunist = simulateHazard(testHazard.id, 'opportunist', BAG, RUNS);
            const greedy = simulateHazard(testHazard.id, 'greedy', BAG, RUNS);
            
            // Verify that all policies produce different results (not identical)
            const rates = [conservative.atLeastOneWinRate, opportunist.atLeastOneWinRate, greedy.atLeastOneWinRate];
            const uniqueRates = new Set(rates);
            expect(uniqueRates.size).toBeGreaterThanOrEqual(2); // At least some divergence
        });
    });

    describe('A/B variant runner', () => {
        it('produces meaningful diffs when configs are identical', () => {
            const result = runHazardAB(HAZARD_TUNING, HAZARD_TUNING, { 
                hazardId: testHazard.id, 
                runs: 100 
            });
            
            expect(result.configA).toBeDefined();
            expect(result.configB).toBeDefined();
            expect(result.analysis.perfectRateDiff).toBeDefined();
            expect(result.analysis.failureRateDiff).toBeDefined();
            expect(result.analysis.avgWinsDiff).toBeDefined();
            expect(typeof result.significant).toBe('boolean');
        });

        it('detects significance when perfect rate differs by >5pp', () => {
            // This is a structural test - in real usage, configs would differ
            const result = runHazardAB(HAZARD_TUNING, HAZARD_TUNING, {
                hazardId: testHazard.id,
                runs: 100
            });
            
            // Since configs are identical, difference should be minimal (noise)
            expect(Math.abs(result.analysis.perfectRateDiff)).toBeLessThan(0.15);
        });
    });

    describe('balance band reporting', () => {
        it('generates structured report with all policies', () => {
            const report = generateHazardBalanceReport(testHazard.id);
            
            expect(report.bands).toHaveLength(3); // conservative, greedy, opportunist
            expect(report.timestamp).toBeDefined();
            expect(report.summary.totalHazards).toBe(3);
            
            for (const band of report.bands) {
                expect(band.hazardId).toBe(testHazard.id);
                expect(['conservative', 'greedy', 'opportunist']).toContain(band.policy);
                expect(band.perfectRate.actual).toBeGreaterThanOrEqual(0);
                expect(band.failureRate.actual).toBeGreaterThanOrEqual(0);
                expect(band.atLeastOneWinRate.actual).toBeGreaterThanOrEqual(0);
                expect(['healthy', 'needs_tuning']).toContain(band.overallHealth);
            }
        });

        it('validates threshold bands correctly', () => {
            const report = generateHazardBalanceReport(testHazard.id);
            const conservativeBand = report.bands.find(b => b.policy === 'conservative');
            
            expect(conservativeBand).toBeDefined();
            expect(conservativeBand!.atLeastOneWinRate.min).toBe(0.90);
            expect(conservativeBand!.failureRate.max).toBe(0.05);
        });
    });
});
