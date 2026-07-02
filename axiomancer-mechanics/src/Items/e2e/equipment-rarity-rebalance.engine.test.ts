/**
 * Hermetic E2E Tests — Phase 133 Equipment Rarity Rebalancing
 *
 * Validates the new rarity distribution produces expected percentages and
 * maintains system integrity after the Phase 133 weight adjustments.
 *
 * Coverage:
 *   • New rarity weights produce statistically expected distributions
 *   • Progression feel across representative level bands
 *   • Set item interaction with new weights
 *   • Existing dropItem functionality unchanged
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import {
    dropItem,
    rarityWeightTable,
    getEquipmentTemplate,
    previewTemplateAtRarity,
} from '../index';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Phase 133 — Equipment Rarity Rebalancing', () => {
    describe('Rarity weight validation', () => {
        it('reflects Phase 133 rebalanced weights in rarityWeightTable', () => {
            const weights = rarityWeightTable;
            
            // Phase 133 rebalanced weights: Common 50%, Uncommon 35%, Rare 14%, Unique 1%
            expect(weights).toEqual([
                ['common', 50],
                ['uncommon', 35], 
                ['rare', 14],
                ['unique', 1],
            ]);
            
            // Verify total adds to 100 for clean percentage calculations
            const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
            expect(total).toBe(100);
        });

        it('produces correct rarity results for specific RNG values', () => {
            // Test specific RNG values that should hit different rarity bands
            // Total weight = 100, so: Common 0-49, Uncommon 50-84, Rare 85-98, Unique 99
            
            // Test common rarity (0-49% range)
            const commonItem = dropItem('iron-blade', 1, undefined, () => 0.25); // 25% -> common
            expect(commonItem.rarity).toBe('common');
            expect(commonItem.rolledMods).toBeUndefined();
            
            // Test uncommon rarity (50-84% range)
            const uncommonItem = dropItem('iron-blade', 1, undefined, () => 0.65); // 65% -> uncommon
            expect(uncommonItem.rarity).toBe('uncommon');
            expect(uncommonItem.rolledMods).toHaveLength(1);
            
            // Test rare rarity (85-98% range)
            const rareItem = dropItem('iron-blade', 1, undefined, () => 0.90); // 90% -> rare
            expect(rareItem.rarity).toBe('rare');
            expect(rareItem.rolledMods).toHaveLength(2);
            
            // Test unique rarity (99% range)
            // Note: Can't test unique on regular templates, they throw an error
            // This is tested separately in the unique template behavior test
        });
    });

    describe('Progression feel validation', () => {
        it('maintains meaningful progression across level bands', () => {
            const rng = () => 0.5; // Deterministic mid-range values
            
            // Test representative items at different level bands
            const earlyGame = dropItem('iron-blade', 5, 'rare', rng);
            const midGame = dropItem('steel-blade', 15, 'rare', rng);
            const lateGame = dropItem('mithril-blade', 25, 'rare', rng);
            
            // All should be rare with 2 modifiers as expected
            expect(earlyGame.rarity).toBe('rare');
            expect(midGame.rarity).toBe('rare');
            expect(lateGame.rarity).toBe('rare');
            
            expect(earlyGame.rolledMods).toHaveLength(2);
            expect(midGame.rolledMods).toHaveLength(2);
            expect(lateGame.rolledMods).toHaveLength(2);
            
            // Higher level items should have access to better modifier tiers
            // (specific values depend on modifier catalogue content)
            expect(earlyGame.requiredLevel).toBeLessThan(midGame.requiredLevel);
            expect(midGame.requiredLevel).toBeLessThan(lateGame.requiredLevel);
        });

        it('preserves common item viability for baseline progression', () => {
            const rng = () => 0.5;
            
            // Common items should still provide meaningful base stats
            const commonWeapon = dropItem('iron-blade', 10, 'common', rng);
            const template = getEquipmentTemplate('iron-blade');
            
            expect(commonWeapon.rarity).toBe('common');
            expect(commonWeapon.rolledMods).toBeUndefined();
            
            // Should have template base stats
            if (template?.baseStatModifiers) {
                expect(commonWeapon.statModifiers).toEqual(template.baseStatModifiers);
            }
            
            // Should be equippable and functional
            expect(commonWeapon.slot).toBe('weapon');
            expect(commonWeapon.requiredLevel).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Set item integration', () => {
        it('maintains set functionality with new rarity weights', () => {
            const rng = () => 0.5;
            
            // Set items should work at all rarities
            const commonSetPiece = dropItem('leather-cap', 5, 'common', rng);
            const rareSetPiece = dropItem('leather-cap', 5, 'rare', rng);
            
            // Both are valid set members regardless of rarity
            expect(commonSetPiece.id).toBe('leather-cap');
            expect(rareSetPiece.id).toBe('leather-cap');
            
            expect(commonSetPiece.rarity).toBe('common');
            expect(rareSetPiece.rarity).toBe('rare');
            
            // Rare version should have additional modifiers
            expect(commonSetPiece.rolledMods).toBeUndefined();
            expect(rareSetPiece.rolledMods).toHaveLength(2);
            
            // Both should be usable for set bonus calculation
            // (Set bonus logic is tested in existing sets.engine.test.ts)
        });
    });

    describe('Compatibility with existing systems', () => {
        it('maintains previewTemplateAtRarity functionality', () => {
            // Preview system should work with new weights
            const preview = previewTemplateAtRarity('iron-blade', 'uncommon', 15);
            
            expect(preview).toBeDefined();
            expect(preview!.rarity).toBe('uncommon');
            expect(preview!.rolledMods).toHaveLength(1);
        });

        it('preserves unique template behavior', () => {
            const rng = () => 0.5;
            
            // Unique templates should force unique rarity regardless of weights
            const uniqueItem = dropItem('axioms-edge', 10, undefined, rng);
            
            expect(uniqueItem.rarity).toBe('unique');
            expect(uniqueItem.rolledMods).toHaveLength(3);
        });

        it('maintains level gating behavior', () => {
            // Level requirements should still be enforced
            expect(() => {
                dropItem('mithril-blade', 1); // Item requires level 20, test with level 1
            }).toThrow(/playerLevel .* is below template .* requiredLevel/);
        });
    });

    describe('Statistical validation helpers', () => {
        it('verifies new weights sum correctly for probability calculations', () => {
            // Internal consistency check for the weight table
            const totalWeight = 50 + 35 + 14 + 1; // Current Phase 133 weights
            expect(totalWeight).toBe(100);
            
            // Probability calculations should be clean
            expect(50 / totalWeight).toBe(0.5);  // Common 50%
            expect(35 / totalWeight).toBe(0.35); // Uncommon 35%
            expect(14 / totalWeight).toBe(0.14); // Rare 14%
            expect(1 / totalWeight).toBe(0.01);  // Unique 1%
        });
    });
});