/**
 * Preview derived stats calculation for LevelUpModal
 * 
 * Approximates engine's derived stats formula locally for real-time preview.
 * The engine reconciles on actual allocation commit. Based on analysis of
 * shipped characters' derived stats patterns.
 */

import type { BaseStats, DerivedStats } from 'axiomancer-mechanics';

export interface PreviewAllocation {
    heart: number;
    body: number;
    mind: number;
}

export interface DerivedStatsPreview {
    /** Preview of physical attack/skill/defense values */
    physical: { attack: number; skill: number; defense: number };
    /** Preview of mental attack/skill/defense values */
    mental: { attack: number; skill: number; defense: number };
    /** Preview of emotional attack/skill/defense values */
    emotional: { attack: number; skill: number; defense: number };
}

/**
 * Preview what derived stats would be with the given base stats allocation.
 * 
 * @param baseStats Current base stats from character
 * @param allocation Additional points to allocate per stance
 * @returns Preview of derived stats with allocation applied
 */
export function previewAllocation(
    baseStats: BaseStats,
    allocation: PreviewAllocation
): DerivedStatsPreview {
    // Apply allocation to base stats
    const projectedStats = {
        heart: baseStats.heart + allocation.heart,
        body: baseStats.body + allocation.body,
        mind: baseStats.mind + allocation.mind,
    };

    // Approximate derived stats formula based on engine patterns
    // Physical stats are primarily influenced by body
    const physical = {
        attack: Math.floor(projectedStats.body * 1.2 + projectedStats.heart * 0.5),
        skill: Math.floor(projectedStats.body * 0.8 + projectedStats.mind * 0.7),
        defense: Math.floor(projectedStats.body * 1.0 + projectedStats.heart * 0.3),
    };

    // Mental stats are primarily influenced by mind
    const mental = {
        attack: Math.floor(projectedStats.mind * 1.2 + projectedStats.body * 0.5),
        skill: Math.floor(projectedStats.mind * 1.0 + projectedStats.heart * 0.6),
        defense: Math.floor(projectedStats.mind * 0.9 + projectedStats.body * 0.4),
    };

    // Emotional stats are primarily influenced by heart
    const emotional = {
        attack: Math.floor(projectedStats.heart * 1.2 + projectedStats.mind * 0.5),
        skill: Math.floor(projectedStats.heart * 0.9 + projectedStats.body * 0.6),
        defense: Math.floor(projectedStats.heart * 1.1 + projectedStats.mind * 0.3),
    };

    return { physical, mental, emotional };
}

/**
 * Simplified preview for the ribbon UI - maps stance to ATK/SKL/DEF
 * using the primary stat type for each stance.
 */
export function previewStanceStats(
    baseStats: BaseStats,
    allocation: PreviewAllocation
): Record<'heart' | 'body' | 'mind', { attack: number; skill: number; defense: number }> {
    const preview = previewAllocation(baseStats, allocation);
    
    return {
        heart: preview.emotional,  // Heart -> Emotional stats
        body: preview.physical,    // Body -> Physical stats  
        mind: preview.mental,      // Mind -> Mental stats
    };
}