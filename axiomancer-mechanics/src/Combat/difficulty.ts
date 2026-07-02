/**
 * Difficulty scaling system — moral meter controls combat difficulty.
 * 
 * Phase 92: implements the originally-intended scaling behavior from
 * BRAINDUMP, resolving the braindump-vs-Spec-10 divergence by making
 * moral choices affect enemy strength.
 */

import { BaseStats } from '../Character/types';

/**
 * Difficulty scaling configuration — threshold and multiplier pairs
 * for piecewise linear interpolation.
 */
export interface DifficultyScaling {
    moralMeterThreshold: number;
    statMultiplier: number;
}

/**
 * Scaling configuration: lower morality = harder enemies.
 * Ruthless choices make combat more challenging; compassionate choices ease it.
 */
const DIFFICULTY_SCALING: DifficultyScaling[] = [
    { moralMeterThreshold: -100, statMultiplier: 2.0 },  // ruthless path = 2x enemy stats
    { moralMeterThreshold: -50, statMultiplier: 1.5 },
    { moralMeterThreshold: 0, statMultiplier: 1.0 },    // neutral = baseline
    { moralMeterThreshold: 50, statMultiplier: 0.75 },
    { moralMeterThreshold: 100, statMultiplier: 0.5 }   // compassionate path = 0.5x enemy stats
];

/**
 * Calculate the enemy stat multiplier based on the player's moral meter.
 * Uses linear interpolation between configured thresholds.
 * 
 * @param moralMeter - Player's current moral meter (-100 to +100)
 * @returns Stat multiplier to apply to enemy base stats
 */
export function calculateEnemyStatMultiplier(moralMeter: number): number {
    // Clamp moral meter to expected range
    const clampedMeter = Math.max(-100, Math.min(100, moralMeter));
    
    // Find the two thresholds to interpolate between
    for (let i = 0; i < DIFFICULTY_SCALING.length - 1; i++) {
        const current = DIFFICULTY_SCALING[i]!;
        const next = DIFFICULTY_SCALING[i + 1]!;
        
        if (clampedMeter >= current.moralMeterThreshold && clampedMeter <= next.moralMeterThreshold) {
            // Linear interpolation between current and next
            const t = (clampedMeter - current.moralMeterThreshold) / 
                     (next.moralMeterThreshold - current.moralMeterThreshold);
            return current.statMultiplier + t * (next.statMultiplier - current.statMultiplier);
        }
    }
    
    // Edge cases: below lowest threshold or above highest threshold
    if (clampedMeter <= DIFFICULTY_SCALING[0]!.moralMeterThreshold) {
        return DIFFICULTY_SCALING[0]!.statMultiplier;
    }
    if (clampedMeter >= DIFFICULTY_SCALING[DIFFICULTY_SCALING.length - 1]!.moralMeterThreshold) {
        return DIFFICULTY_SCALING[DIFFICULTY_SCALING.length - 1]!.statMultiplier;
    }
    
    // Fallback (should never reach here)
    return 1.0;
}

/**
 * Apply moral meter scaling to enemy base stats.
 * Scales all stat values by the multiplier and rounds to nearest integer.
 * 
 * @param baseStats - Original enemy base stats
 * @param moralMeter - Player's current moral meter
 * @returns Scaled base stats with multiplier applied
 */
export function applyMoralMeterScaling(baseStats: BaseStats, moralMeter: number): BaseStats {
    const multiplier = calculateEnemyStatMultiplier(moralMeter);
    
    return {
        heart: Math.round(baseStats.heart * multiplier),
        body: Math.round(baseStats.body * multiplier),
        mind: Math.round(baseStats.mind * multiplier),
    };
}