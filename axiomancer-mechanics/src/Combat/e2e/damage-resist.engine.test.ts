/**
 * Phase 93 — Damage-resist primitive hermetic e2e test
 *
 * Tests damage resistance calculation and integration with skill execution.
 * Verifies Phase 80 direction (a) completion: "damage rolls separately +
 * applies its own resistance."
 */

import { describe, it, expect } from 'vitest';
import { calculateDamageResistance, getSkillDamageType } from '../damage-resist';
import { Player } from '../../Character/characters.mock';
import { Disatree_01 } from '../../Enemy/enemy.library';
import { getCardById } from '../../Cards/cards.library';
import { calculateSkillDamage } from '../../Cards/skill.engine';

describe('Phase 93 — Damage-resist primitive', () => {
    it('reduces damage by target resistance stats', () => {
        // Use mock character with known stats
        const target = { ...Disatree_01 };
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
        const target = { ...Disatree_01 };
        target.baseStats = { body: 20, mind: 20, heart: 20 };

        // High resistance should not completely negate damage
        const damage = calculateDamageResistance(target, 5, 'physical');
        expect(damage).toBe(1); // Minimum 1 damage, not 0 or negative
    });

    it('maps skill scaling stats to damage types correctly', () => {
        expect(getSkillDamageType('body')).toBe('physical');
        expect(getSkillDamageType('mind')).toBe('mental');
        expect(getSkillDamageType('heart')).toBe('emotional');
    });

    it('integrates with skill execution via calculateSkillDamage', () => {
        const attacker = Player;
        const defender = { ...Disatree_01 };
        defender.baseStats.body = 5; // Some resistance

        // Get a body-scaling skill
        const bodySkill = getCardById('ad-hominem-strike')!;
        expect(bodySkill.scalingStat).toBe('body');

        // Calculate damage with resistance applied
        const damageWithResistance = calculateSkillDamage(attacker, bodySkill, defender);
        
        // Calculate damage without resistance for comparison
        const damageWithoutResistance = calculateSkillDamage(attacker, bodySkill);

        // With resistance should be lower (unless already at minimum 1)
        expect(damageWithResistance).toBeLessThanOrEqual(damageWithoutResistance);
        expect(damageWithResistance).toBeGreaterThanOrEqual(1); // Min 1 damage
    });

    it('maintains backward compatibility when target not provided', () => {
        const attacker = Player;
        const skill = getCardById('ad-hominem-strike')!;

        // Without target should work as before (no resistance applied)
        const damageWithoutTarget = calculateSkillDamage(attacker, skill);
        expect(damageWithoutTarget).toBeGreaterThan(0);
        
        // With undefined target should be same as without
        const damageWithUndefinedTarget = calculateSkillDamage(attacker, skill, undefined);
        expect(damageWithUndefinedTarget).toBe(damageWithoutTarget);
    });

    it('handles zero or negative base damage gracefully', () => {
        const target = Disatree_01;
        
        // Zero damage stays zero
        expect(calculateDamageResistance(target, 0, 'physical')).toBe(0);
        
        // Negative damage becomes zero (edge case handling)
        expect(calculateDamageResistance(target, -5, 'physical')).toBe(0);
    });

    it('handles different damage types with corresponding resistance stats', () => {
        const target = { ...Disatree_01 };
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