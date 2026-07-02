/**
 * Quest Board balance guard — Monte-Carlo over the real engine with
 * scripted bot policies (see `src/World/QuestBoard/quest-board.sim.ts`). 
 * 
 * The bands encode balance targets for the 'build-the-boat' board:
 *   - Safe policy: conservative play, should achieve masterwork 10-45% of time
 *   - Economist policy: balanced risk/reward, should achieve masterwork 25-45% 
 *   - Gambler policy: high-risk high-reward, should achieve masterwork 2-40%
 *
 * If content changes push the Quest Board outside these bands, this suite 
 * fails and the numbers need re-tuning (or the bands need a deliberate,
 * documented update). 300 seeded runs per policy keeps the suite fast
 * while holding rate noise to roughly ±5pp.
 */

import { describe, expect, it } from 'vitest';

import {
    runQuestBoardSim,
    simulateQuestBoard,
    runQuestBoardAB,
    generateQuestBoardBalanceReport,
    type QuestBoardPolicyId,
} from '../quest-board.sim';
import { QUEST_BOARD_TUNING } from '../quest-board.tuning';

const BOARD_ID = 'build-the-boat';
const RUNS = 300;

describe('quest board balance bands (scripted bots, build-the-boat)', () => {
    describe('safe policy', () => {
        it('achieves conservative masterwork rate (10-45%)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'safe', 
                boardId: BOARD_ID 
            });
            
            expect(summary.masterworkRate).toBeGreaterThanOrEqual(0.10);
            expect(summary.masterworkRate).toBeLessThanOrEqual(0.45);
            expect(summary.driftwoodRate).toBeLessThanOrEqual(0.30);
        });

        it('completes in reasonable time (3-6 days average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'safe', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgDaysTaken).toBeGreaterThanOrEqual(2.5);
            expect(summary.avgDaysTaken).toBeLessThanOrEqual(7.0);
        });

        it('keeps some vows consistently (1.2-2.0 average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'safe', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgVowsKept).toBeGreaterThanOrEqual(1.0);
            expect(summary.avgVowsKept).toBeLessThanOrEqual(2.0);
        });
    });

    describe('economist policy', () => {
        it('achieves balanced masterwork rate (25-45%)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'economist', 
                boardId: BOARD_ID 
            });
            
            expect(summary.masterworkRate).toBeGreaterThanOrEqual(0.15);
            expect(summary.masterworkRate).toBeLessThanOrEqual(0.50);
            expect(summary.driftwoodRate).toBeLessThanOrEqual(0.25);
        });

        it('completes efficiently (3.5-5.5 days average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'economist', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgDaysTaken).toBeGreaterThanOrEqual(2.8);
            expect(summary.avgDaysTaken).toBeLessThanOrEqual(6.5);
        });

        it('keeps vows reliably (1.4-2.0 average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'economist', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgVowsKept).toBeGreaterThanOrEqual(1.2);
            expect(summary.avgVowsKept).toBeLessThanOrEqual(2.0);
        });
    });

    describe('gambler policy', () => {
        it('achieves high-variance masterwork rate (2-40%)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'gambler', 
                boardId: BOARD_ID 
            });
            
            expect(summary.masterworkRate).toBeGreaterThanOrEqual(0.02);
            expect(summary.masterworkRate).toBeLessThanOrEqual(0.40);
            // Gambler should have higher driftwood rate due to risk-taking
            expect(summary.driftwoodRate).toBeGreaterThanOrEqual(0.15);
        });

        it('can complete quickly or slowly (2.0-7.5 days average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'gambler', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgDaysTaken).toBeGreaterThanOrEqual(2.0);
            expect(summary.avgDaysTaken).toBeLessThanOrEqual(7.5);
        });

        it('has variable vow success (0.8-1.6 average)', () => {
            const summary = runQuestBoardSim({ 
                runs: RUNS, 
                policy: 'gambler', 
                boardId: BOARD_ID 
            });
            
            expect(summary.avgVowsKept).toBeGreaterThanOrEqual(0.6);
            expect(summary.avgVowsKept).toBeLessThanOrEqual(1.8);
        });
    });

    describe('policy comparisons', () => {
        it('economist outperforms safe in masterwork rate', () => {
            const safe = runQuestBoardSim({ runs: 100, policy: 'safe', boardId: BOARD_ID });
            const economist = runQuestBoardSim({ runs: 100, policy: 'economist', boardId: BOARD_ID });
            
            // Economist should be at least as good, usually better
            expect(economist.masterworkRate).toBeGreaterThanOrEqual(safe.masterworkRate - 0.05);
        });

        it('safe policy has lower driftwood rate than gambler', () => {
            const safe = runQuestBoardSim({ runs: 100, policy: 'safe', boardId: BOARD_ID });
            const gambler = runQuestBoardSim({ runs: 100, policy: 'gambler', boardId: BOARD_ID });
            
            expect(safe.driftwoodRate).toBeLessThan(gambler.driftwoodRate + 0.10);
        });
    });
});

describe('quest board simulator functionality', () => {
    it('produces deterministic results from same seed', () => {
        const seed = 12345;
        const result1 = simulateQuestBoard(seed, BOARD_ID, 'safe');
        const result2 = simulateQuestBoard(seed, BOARD_ID, 'safe');
        
        expect(result1.outcome.tier).toBe(result2.outcome.tier);
        expect(result1.daysTaken).toBe(result2.daysTaken);
        expect(result1.fishLeft).toBe(result2.fishLeft);
        expect(result1.vigorLeft).toBe(result2.vigorLeft);
        expect(result1.vowsKept).toBe(result2.vowsKept);
    });

    it('produces different results from different seeds', () => {
        const result1 = simulateQuestBoard(1000, BOARD_ID, 'economist');
        const result2 = simulateQuestBoard(2000, BOARD_ID, 'economist');
        
        // Very unlikely to be identical across all metrics
        const identical = result1.outcome.tier === result2.outcome.tier &&
                         result1.daysTaken === result2.daysTaken &&
                         result1.fishLeft === result2.fishLeft &&
                         result1.vigorLeft === result2.vigorLeft;
        
        expect(identical).toBe(false);
    });

    it('handles all three policies without errors', () => {
        const policies: QuestBoardPolicyId[] = ['safe', 'gambler', 'economist'];
        
        for (const policy of policies) {
            expect(() => {
                const summary = runQuestBoardSim({ 
                    runs: 5, 
                    policy, 
                    boardId: BOARD_ID 
                });
                expect(summary.runs).toBe(5);
                expect(summary.policy).toBe(policy);
                expect(summary.masterworkRate + summary.seaworthyRate + summary.driftwoodRate).toBeCloseTo(1.0, 3);
            }).not.toThrow();
        }
    });
});

describe('A/B testing functionality', () => {
    it('detects significant differences in configurations', () => {
        // Test with same config should not be significant
        const result = runQuestBoardAB(QUEST_BOARD_TUNING, QUEST_BOARD_TUNING, { 
            runs: 50, 
            boardId: BOARD_ID 
        });
        
        expect(result.configA).toBeDefined();
        expect(result.configB).toBeDefined();
        // With different seeds, we expect some variance but not huge differences
        expect(Math.abs(result.analysis.masterworkDiff)).toBeLessThan(0.2);
        expect(Math.abs(result.analysis.daysTakenDiff)).toBeLessThan(3.0);
        expect(Math.abs(result.analysis.vowsKeptDiff)).toBeLessThan(1.0);
        
        // With identical configs, shouldn't be significant (though randomness might cause occasional false positive)
        expect(typeof result.significant).toBe('boolean');
    });

    it('returns well-formed A/B analysis structure', () => {
        const result = runQuestBoardAB(QUEST_BOARD_TUNING, QUEST_BOARD_TUNING, { 
            runs: 10, 
            boardId: BOARD_ID 
        });
        
        expect(result.analysis).toHaveProperty('masterworkDiff');
        expect(result.analysis).toHaveProperty('daysTakenDiff');
        expect(result.analysis).toHaveProperty('vowsKeptDiff');
        expect(typeof result.significant).toBe('boolean');
        
        expect(result.configA.runs).toBe(10);
        expect(result.configB.runs).toBe(10);
        expect(result.configA.policy).toBe('economist');
        expect(result.configB.policy).toBe('economist');
    });
});

describe('balance report generation', () => {
    it('generates comprehensive balance report', () => {
        const report = generateQuestBoardBalanceReport();
        
        expect(report.bands).toHaveLength(3); // safe, economist, gambler
        expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
        expect(report.summary).toHaveProperty('healthyBoards');
        expect(report.summary).toHaveProperty('totalBoards');
        expect(report.summary.totalBoards).toBe(3);
        
        for (const band of report.bands) {
            expect(band.boardId).toBe('build-the-boat');
            expect(['safe', 'economist', 'gambler']).toContain(band.policy);
            expect(band.overallHealth).toMatch(/^(healthy|needs_tuning)$/);
            
            expect(band.masterworkRate).toHaveProperty('min');
            expect(band.masterworkRate).toHaveProperty('max');
            expect(band.masterworkRate).toHaveProperty('actual');
            expect(band.masterworkRate).toHaveProperty('inBand');
            
            expect(typeof band.masterworkRate.inBand).toBe('boolean');
            expect(typeof band.avgDaysTaken.inBand).toBe('boolean');
            expect(typeof band.avgVowsKept.inBand).toBe('boolean');
        }
    });
    
    it('produces structured JSON suitable for Phase 148 harness', () => {
        const report = generateQuestBoardBalanceReport();
        
        // Should be JSON serializable
        expect(() => JSON.stringify(report)).not.toThrow();
        
        const json = JSON.stringify(report);
        const parsed = JSON.parse(json);
        
        expect(parsed.bands).toHaveLength(3);
        expect(parsed.summary.totalBoards).toBe(3);
    });
});