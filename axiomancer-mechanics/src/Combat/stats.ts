/**
 * Stat lookups for combatants.
 *
 * Every helper passes through `getEffectiveStats` so active effects'
 * `statModifiers` and stance-agnostic `defenseModifier` are baked into the
 * value the rest of the engine sees. See `src/Combat/effect-modifiers.ts`
 * for the aggregation pipeline.
 */

import { Stance, Combatant } from './types';
import { getEffectiveStats } from './effect-modifiers';

/** Raw base stat (heart/body/mind) for a stance, after effect modifiers. */
export function getBaseStat(combatant: Combatant, stance: Stance): number {
    return getEffectiveStats(combatant).baseStats[stance];
}

/** Attack value for the given stance, taken from effective derivedStats. */
export function getAttackStat(combatant: Combatant, stance: Stance): number {
    const { derivedStats } = getEffectiveStats(combatant);
    switch (stance) {
        case 'body':  return derivedStats.physicalAttack;
        case 'mind':  return derivedStats.mentalAttack;
        case 'heart': return derivedStats.emotionalAttack;
    }
}

/**
 * Defense value for the given stance, taken from effective derivedStats and
 * augmented by the stance-agnostic `defenseModifier` aggregated from active effects.
 */
export function getDefenseStat(combatant: Combatant, stance: Stance): number {
    const { derivedStats, defenseDelta } = getEffectiveStats(combatant);
    let stat: number;
    switch (stance) {
        case 'body':  stat = derivedStats.physicalDefense; break;
        case 'mind':  stat = derivedStats.mentalDefense; break;
        case 'heart': stat = derivedStats.emotionalDefense; break;
    }
    return stat + defenseDelta;
}

/**
 * Saving-throw value for the given stance. Characters have dedicated saves;
 * enemies don't, so they fall back to their (effective) defense for that stance.
 */
export function getSaveStat(combatant: Combatant, stance: Stance): number {
    const eff = getEffectiveStats(combatant);
    if (eff.nonCombatStats) {
        switch (stance) {
            case 'body':  return eff.nonCombatStats.physicalSave;
            case 'mind':  return eff.nonCombatStats.mentalSave;
            case 'heart': return eff.nonCombatStats.emotionalSave;
        }
    }
    return getDefenseStat(combatant, stance);
}

