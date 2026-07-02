/**
 * Phase 92 — Difficulty scaling hermetic e2e test.
 * 
 * Tests that moral meter correctly scales enemy stats during combat initialization.
 * Covers the scaling mechanics at moral meter extremes and ensures combat
 * resolution integrity is maintained.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockSequentialRng } from '../../test-utils/rng';
import { createEnemy } from '../../Enemy';
import { createNewGameState, gameReducer } from '../../Game/game.reducer';
import { calculateEnemyStatMultiplier, applyMoralMeterScaling } from '../difficulty';

describe('Phase 92 — Difficulty scaling engine', () => {
    beforeEach(() => {
        mockSequentialRng(0.5);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('calculateEnemyStatMultiplier', () => {
        it('returns 2.0x multiplier for ruthless path (-100 morality)', () => {
            const multiplier = calculateEnemyStatMultiplier(-100);
            expect(multiplier).toBe(2.0);
        });

        it('returns 1.0x multiplier for neutral morality (0)', () => {
            const multiplier = calculateEnemyStatMultiplier(0);
            expect(multiplier).toBe(1.0);
        });

        it('returns 0.5x multiplier for compassionate path (+100 morality)', () => {
            const multiplier = calculateEnemyStatMultiplier(100);
            expect(multiplier).toBe(0.5);
        });

        it('interpolates linearly between thresholds', () => {
            // Test midpoint between 0 and +50: should be (1.0 + 0.75) / 2 = 0.875
            const multiplier = calculateEnemyStatMultiplier(25);
            expect(multiplier).toBe(0.875);
        });

        it('clamps values beyond range', () => {
            expect(calculateEnemyStatMultiplier(-150)).toBe(2.0);
            expect(calculateEnemyStatMultiplier(150)).toBe(0.5);
        });
    });

    describe('applyMoralMeterScaling', () => {
        const baseStats = { heart: 10, body: 8, mind: 6 };

        it('doubles stats for ruthless path (-100)', () => {
            const scaled = applyMoralMeterScaling(baseStats, -100);
            expect(scaled).toEqual({ heart: 20, body: 16, mind: 12 });
        });

        it('keeps stats unchanged for neutral (0)', () => {
            const scaled = applyMoralMeterScaling(baseStats, 0);
            expect(scaled).toEqual({ heart: 10, body: 8, mind: 6 });
        });

        it('halves stats for compassionate path (+100)', () => {
            const scaled = applyMoralMeterScaling(baseStats, 100);
            expect(scaled).toEqual({ heart: 5, body: 4, mind: 3 });
        });

        it('rounds scaled values to nearest integer', () => {
            // Test with stats that would produce fractional results
            const oddStats = { heart: 3, body: 3, mind: 3 };
            const scaled = applyMoralMeterScaling(oddStats, 100); // 0.5x multiplier
            expect(scaled).toEqual({ heart: 2, body: 2, mind: 2 }); // 1.5 rounds to 2
        });
    });

    describe('Integration with game state', () => {
        it('START_COMBAT applies scaling to enemy stats based on moral meter', () => {
            // Test enemy with known stats
            const testEnemy = createEnemy({
                id: 'scaling-test',
                name: 'Scaling Test Enemy',
                description: 'Enemy for scaling test',
                level: 5,
                baseStats: { heart: 10, body: 10, mind: 10 },
                mapName: 'fishing-village',
                logic: 'balanced',
            });

            // Test ruthless path (-100 morality) — should double enemy stats
            let gameState = createNewGameState();
            gameState.moralMeter = -100;
            
            const ruthlessResult = gameReducer(gameState, {
                type: 'START_COMBAT',
                payload: { target: testEnemy },
            });

            expect(ruthlessResult.currentEncounter).toBeTruthy();
            expect(ruthlessResult.currentEncounter!.enemies[0]!.baseStats).toEqual({
                heart: 20, // 10 * 2.0
                body: 20,  // 10 * 2.0
                mind: 20,  // 10 * 2.0
            });

            // Test compassionate path (+100 morality) — should halve enemy stats
            gameState = createNewGameState();
            gameState.moralMeter = 100;
            
            const compassionateResult = gameReducer(gameState, {
                type: 'START_COMBAT',
                payload: { target: testEnemy },
            });

            expect(compassionateResult.currentEncounter).toBeTruthy();
            expect(compassionateResult.currentEncounter!.enemies[0]!.baseStats).toEqual({
                heart: 5,  // 10 * 0.5
                body: 5,   // 10 * 0.5
                mind: 5,   // 10 * 0.5
            });

            // Test neutral path (0 morality) — should keep enemy stats unchanged
            gameState = createNewGameState();
            gameState.moralMeter = 0;
            
            const neutralResult = gameReducer(gameState, {
                type: 'START_COMBAT',
                payload: { target: testEnemy },
            });

            expect(neutralResult.currentEncounter).toBeTruthy();
            expect(neutralResult.currentEncounter!.enemies[0]!.baseStats).toEqual({
                heart: 10, // 10 * 1.0
                body: 10,  // 10 * 1.0
                mind: 10,  // 10 * 1.0
            });
        });

        it('maintains combat resolution integrity with scaled enemies', () => {
            const testEnemy = createEnemy({
                id: 'integrity-test',
                name: 'Integrity Test Enemy',
                description: 'Enemy for integrity test',
                level: 1,
                baseStats: { heart: 2, body: 2, mind: 2 },
                mapName: 'fishing-village',
                logic: 'balanced',
            });

            // Test that combat can resolve normally with scaled enemy
            let gameState = createNewGameState();
            gameState.moralMeter = -50; // 1.5x multiplier
            
            const combatStarted = gameReducer(gameState, {
                type: 'START_COMBAT',
                payload: { target: testEnemy },
            });

            expect(combatStarted.currentEncounter).toBeTruthy();
            const stagedEnemy = combatStarted.currentEncounter!.enemies[0]!;
            expect(stagedEnemy.baseStats).toEqual({
                heart: 3, // 2 * 1.5
                body: 3,  // 2 * 1.5
                mind: 3,  // 2 * 1.5
            });

            // Verify the staged enemy is combat-ready (positive HP) so the
            // Hazard-Pattern engine can resolve against the scaled enemy.
            expect(stagedEnemy.health).toBeGreaterThan(0);
            expect(stagedEnemy.maxHealth).toBeGreaterThan(0);
        });
    });
});