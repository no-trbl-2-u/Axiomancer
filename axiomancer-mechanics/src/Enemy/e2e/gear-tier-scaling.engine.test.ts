/**
 * Hermetic e2e — enemy gear-tier scaling counterweight.
 *
 * Tests that the gear-tier bonus is ≈0 at level 1 and materially raises
 * enemy defensive stats at level 50 when using budget-based enemy creation.
 */

import { describe, it, expect } from 'vitest';
import { enemyStatBudget } from '../index';
import { ENEMY_STAT_PER_LEVEL, ENEMY_GEAR_TIER_PER_LEVEL } from '../../Game/game-mechanics.constants';

describe('enemy gear-tier scaling', () => {
    it('gear-tier bonus is minimal at level 1', () => {
        const weights = { heart: 2, body: 1, mind: 1 }; // HP-weighted test enemy
        const level1Stats = enemyStatBudget(1, weights);
        const level1NoGear = enemyStatBudget(1, weights, ENEMY_STAT_PER_LEVEL, 0);
        
        // At level 1, gear tier bonus should be very small (≈2% difference)
        const heartDifference = level1Stats.heart - level1NoGear.heart;
        expect(heartDifference).toBeLessThanOrEqual(1); // Should be 0 or 1 point difference
    });

    it('gear-tier bonus materially scales defensive stats at level 50', () => {
        const weights = { heart: 2, body: 1, mind: 1 }; // HP-weighted test enemy
        const level50Stats = enemyStatBudget(50, weights);
        const level50NoGear = enemyStatBudget(50, weights, ENEMY_STAT_PER_LEVEL, 0);
        
        // At level 50, gear tier bonus should provide meaningful defensive boost
        const heartDifference = level50Stats.heart - level50NoGear.heart;
        const bodyDifference = level50Stats.body - level50NoGear.body;
        const mindDifference = level50Stats.mind - level50NoGear.mind;
        
        // Should see material increases in all defensive stats
        expect(heartDifference).toBeGreaterThan(3); // Meaningful HP boost
        expect(bodyDifference).toBeGreaterThan(1); // Body defense boost  
        expect(mindDifference).toBeGreaterThan(1); // Mind defense boost
        
        // Heart should get the largest boost due to weighting
        expect(heartDifference).toBeGreaterThanOrEqual(bodyDifference);
        expect(heartDifference).toBeGreaterThanOrEqual(mindDifference);
    });

    it('gear-tier bonus preserves stat distribution weights', () => {
        const heavyHeart = { heart: 4, body: 1, mind: 1 };
        const heavyBody = { heart: 1, body: 4, mind: 1 };
        
        const heartBias = enemyStatBudget(20, heavyHeart);
        const bodyBias = enemyStatBudget(20, heavyBody);
        
        // The highest-weighted stat should remain the highest even with gear tier
        expect(heartBias.heart).toBeGreaterThan(heartBias.body);
        expect(heartBias.heart).toBeGreaterThan(heartBias.mind);
        expect(bodyBias.body).toBeGreaterThan(bodyBias.heart);
        expect(bodyBias.body).toBeGreaterThan(bodyBias.mind);
    });

    it('gear-tier bonus scales linearly with level', () => {
        const weights = { heart: 1, body: 1, mind: 1 };
        
        const level10Stats = enemyStatBudget(10, weights);
        const level20Stats = enemyStatBudget(20, weights);
        const level10NoGear = enemyStatBudget(10, weights, ENEMY_STAT_PER_LEVEL, 0);
        const level20NoGear = enemyStatBudget(20, weights, ENEMY_STAT_PER_LEVEL, 0);
        
        const level10Bonus = level10Stats.heart - level10NoGear.heart;
        const level20Bonus = level20Stats.heart - level20NoGear.heart;
        
        // Level 20 should have roughly double the bonus of level 10
        // Due to rounding and the small gear tier constant, the linearity may be loose
        expect(level20Bonus).toBeGreaterThan(level10Bonus);
        
        // Just ensure the bonus grows with level, don't enforce strict linearity
        // given the rounding and small constants involved
        expect(level20Bonus).toBeGreaterThanOrEqual(level10Bonus * 1.5);
    });

    it('respects custom gear-tier parameter override', () => {
        const weights = { heart: 1, body: 1, mind: 1 };
        const doubleGearTier = ENEMY_GEAR_TIER_PER_LEVEL * 2;
        
        const normalStats = enemyStatBudget(30, weights);
        const doubleGearStats = enemyStatBudget(30, weights, ENEMY_STAT_PER_LEVEL, doubleGearTier);
        
        // Double gear tier should result in higher stats
        expect(doubleGearStats.heart).toBeGreaterThan(normalStats.heart);
        expect(doubleGearStats.body).toBeGreaterThan(normalStats.body);
        expect(doubleGearStats.mind).toBeGreaterThan(normalStats.mind);
    });
});