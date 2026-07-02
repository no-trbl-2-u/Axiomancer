/**
 * Phase 93 — Damage-resist primitive
 *
 * Completes Phase 80 direction (a) "damage rolls separately + applies its own
 * resistance." Skills' damage output is reduced by the target's resistance
 * stats before being applied.
 *
 * Direction (a) pure split: effects always land (Phase 80 shipped), damage
 * applies resistance separately (this phase).
 */

import type { Combatant } from './types';

/**
 * Damage type based on the primary stat that drives the damage.
 * Maps to resistance calculation.
 */
export type DamageType = 'physical' | 'mental' | 'emotional';

/**
 * Calculates damage reduction based on target's resistance stats.
 * 
 * Direction (a) damage-side primitive: damage applies resistance
 * separately from effect application. Linear resistance model where
 * each point of resistance stat reduces damage by 1.
 * 
 * @param target - The combatant taking damage
 * @param baseDamage - Damage before resistance
 * @param damageType - Type of damage for resistance mapping
 * @returns Final damage after resistance (minimum 1)
 */
export function calculateDamageResistance(
    target: Combatant,
    baseDamage: number,
    damageType: DamageType,
): number {
    if (baseDamage <= 0) return 0;
    
    // Map damage types to resistance stats
    const resistanceStat = damageType === 'physical' ? target.baseStats.body
        : damageType === 'mental' ? target.baseStats.mind
        : target.baseStats.heart;
    
    // Linear resistance: every point reduces damage by 1
    const resistance = Math.max(0, resistanceStat);
    const finalDamage = Math.max(1, baseDamage - resistance); // Minimum 1 damage
    
    return finalDamage;
}

/**
 * Determines damage type based on skill's scaling stat.
 * Body scales → physical damage, Mind scales → mental damage, 
 * Heart scales → emotional damage.
 */
export function getSkillDamageType(scalingStat: 'body' | 'mind' | 'heart'): DamageType {
    return scalingStat === 'body' ? 'physical'
        : scalingStat === 'mind' ? 'mental' 
        : 'emotional';
}