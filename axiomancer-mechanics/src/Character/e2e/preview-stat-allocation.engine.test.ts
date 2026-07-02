import { describe, it, expect } from 'vitest';
import { previewStatAllocation, allocateStatPoint } from '../index';
import { apprenticePreset, buildCharacterFromPreset } from '../presets';
import { BaseStats } from '../types';

describe('previewStatAllocation', () => {
    const baseStats: BaseStats = { heart: 3, body: 4, mind: 5 };
    const level = 2;

    it('should preview single stat allocation effects', () => {
        const allocation = { heart: 1, body: 0, mind: 0 };
        const preview = previewStatAllocation(baseStats, level, allocation);

        expect(preview.derivedStats.emotionalAttack).toBeGreaterThan(0);
        expect(preview.derivedStats.emotionalSkill).toBeGreaterThan(0);
        expect(preview.derivedStats.emotionalDefense).toBeGreaterThan(0);
        expect(preview.nonCombatStats.emotionalSave).toBeGreaterThan(0);
        expect(preview.nonCombatStats.emotionalTest).toBeGreaterThan(0);
        expect(preview.maxHealth).toBeGreaterThan(0);
    });

    it('should match allocateStatPoint results without character mutation', () => {
        // Start with apprentice preset
        let character = buildCharacterFromPreset(apprenticePreset);
        character.availableStatPoints = 1;

        const originalBaseStats = character.baseStats;
        const allocation = { heart: 1, body: 0, mind: 0 };

        // Preview the allocation
        const preview = previewStatAllocation(originalBaseStats, character.level, allocation);

        // Apply real allocation
        const afterAllocation = allocateStatPoint(character, 'heart');

        // Preview should match the real allocation results
        expect(preview.derivedStats).toEqual(afterAllocation.derivedStats);
        expect(preview.nonCombatStats).toEqual(afterAllocation.nonCombatStats);
        expect(preview.maxHealth).toEqual(afterAllocation.maxHealth);

        // Original character should be unchanged
        expect(character.baseStats).toEqual(originalBaseStats);
    });

    it('should handle multi-stat allocation', () => {
        const allocation = { heart: 1, body: 2, mind: 1 };
        const preview = previewStatAllocation(baseStats, level, allocation);

        // Should compute stats for combined allocation
        expect(preview.derivedStats.luck).toBeGreaterThan(0);
        expect(preview.maxHealth).toBeGreaterThan(0);

        // Verify the preview stats reflect the combined base stats
        const expectedStats: BaseStats = {
            heart: baseStats.heart + allocation.heart,
            body: baseStats.body + allocation.body,
            mind: baseStats.mind + allocation.mind,
        };

        // We can't directly check the computed values match expectedStats,
        // but we can ensure cross-stat effects are included
        expect(preview.derivedStats.luck).toEqual(
            (expectedStats.heart + expectedStats.body + expectedStats.mind) / 3
        );
    });

    it('should handle zero allocation (no-op preview)', () => {
        const allocation = { heart: 0, body: 0, mind: 0 };
        const preview = previewStatAllocation(baseStats, level, allocation);

        // Should return stats for unchanged base stats
        expect(preview.derivedStats.luck).toEqual(
            (baseStats.heart + baseStats.body + baseStats.mind) / 3
        );
    });

    it('should handle negative allocation (stat reduction)', () => {
        const allocation = { heart: -1, body: 0, mind: 0 };
        const preview = previewStatAllocation(baseStats, level, allocation);

        // Should compute stats for reduced base stats
        const reducedStats = { ...baseStats, heart: baseStats.heart - 1 };
        expect(preview.derivedStats.luck).toEqual(
            (reducedStats.heart + reducedStats.body + reducedStats.mind) / 3
        );
    });

    it('should compute maxHealth from allocated stat sum, not level multiplier', () => {
        const allocation = { heart: 1, body: 1, mind: 0 };
        
        const level1Preview = previewStatAllocation(baseStats, 1, allocation);
        const level3Preview = previewStatAllocation(baseStats, 3, allocation);

        expect(level3Preview.maxHealth).toBe(level1Preview.maxHealth);
    });
});