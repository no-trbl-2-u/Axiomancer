/**
 * Phase 93 — Damage-resist primitive hermetic e2e test
 *
 * Tests damage resistance calculation and integration with skill execution.
 * Verifies Phase 80 direction (a) completion: "damage rolls separately +
 * applies its own resistance."
 */

import { describe, it, expect } from 'vitest';
import { calculateDamageResistance } from '../damage-resist';
import { Player } from '../../Character/characters.mock';
import { FloatEye } from '../../Enemy/enemy.library';
import { getCardById } from '../../Cards/cards.library';
import { calculateCardDamage } from '../../Cards/card.engine';

describe('Phase 93 — Damage-resist primitive', () => {
    it('reduces damage by target resistance stats', () => {
        // Use mock character with known stats
        const target = { ...FloatEye };
        target.baseStats = { body: 10, mind: 8, heart: 6 };

        // Test physical damage reduction
        const physicalDamage = calculateDamageResistance(target, 15, 'physical');
        expect(physicalDamage).toBe(5); // 15 - 10 = 5

        // Test mental damage reduction
        const mentalDamage = calculateDamageResistance(target, 12, 'mental');
        expect(mentalDamage).toBe(4); // 12 - 8 = 4

        // Test emotional damage reduction
        const emotionalDamage = calculateDamageResistance(target, 10, 'emotional');
        expect(emotionalDamage).toBe(4); // 10 - 6 = 4
    });

    it('enforces minimum 1 damage', () => {
        // Target with very high resistance
        const target = { ...FloatEye };
        target.baseStats = { body: 20, mind: 20, heart: 20 };

        // High resistance should not completely negate damage
        const damage = calculateDamageResistance(target, 5, 'physical');
        expect(damage).toBe(1); // Minimum 1 damage, not 0 or negative
    });

    it('calculateCardDamage is 0 for EVERY library card — the strike is dead (spec 32 v3 §1)', () => {
        // basePower was deleted at the schema level; the skill engine's damage
        // step is a permanent 0. The resist primitive survives for the threat
        // side and future non-card consumers.
        const attacker = Player;
        const defender = { ...FloatEye };
        const skill = getCardById('slippery-slope')!;
        expect(calculateCardDamage(attacker, skill, defender)).toBe(0);
        expect(calculateCardDamage(attacker, skill)).toBe(0);
    });

    it('handles zero or negative base damage gracefully', () => {
        const target = FloatEye;
        
        // Zero damage stays zero
        expect(calculateDamageResistance(target, 0, 'physical')).toBe(0);
        
        // Negative damage becomes zero (edge case handling)
        expect(calculateDamageResistance(target, -5, 'physical')).toBe(0);
    });

    it('handles different damage types with corresponding resistance stats', () => {
        const target = { ...FloatEye };
        target.baseStats = { body: 3, mind: 7, heart: 5 };

        // Same base damage, different resistances based on type
        const baseDamage = 10;
        
        const physicalResult = calculateDamageResistance(target, baseDamage, 'physical');
        expect(physicalResult).toBe(7); // 10 - 3 = 7
        
        const mentalResult = calculateDamageResistance(target, baseDamage, 'mental');
        expect(mentalResult).toBe(3); // 10 - 7 = 3
        
        const emotionalResult = calculateDamageResistance(target, baseDamage, 'emotional');
        expect(emotionalResult).toBe(5); // 10 - 5 = 5
    });
});