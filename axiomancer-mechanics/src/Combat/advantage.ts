/**
 * Type-advantage system. Heart > Body > Mind > Heart (cyclic).
 */

import { ActiveEffect } from '../Effects/types';
import { getActiveEffectModifiers } from './effect-modifiers';
import { Stance, Advantage } from './types';

/** Returns the advantage relationship of `attacker` against `defender`. */
export function determineAdvantage(attacker: Stance, defender: Stance): Advantage {
    if (attacker === defender) return 'neutral';
    if (attacker === 'heart' && defender === 'body') return 'advantage';
    if (attacker === 'body'  && defender === 'mind') return 'advantage';
    if (attacker === 'mind'  && defender === 'heart') return 'advantage';
    return 'disadvantage';
}

/** Convenience: true iff the attacker has type advantage. */
export function hasAdvantage(attacker: Stance, defender: Stance): boolean {
    return determineAdvantage(attacker, defender) === 'advantage';
}

/** Flat roll modifier corresponding to an advantage state (+2 / 0 / -2). */
export function getAdvantageModifier(advantage: Advantage): number {
    switch (advantage) {
        case 'advantage':    return 2;
        case 'disadvantage': return -2;
        default:             return 0;
    }
}

/**
 * Folds an attacker's `advantageModifier` payloads into the matchup advantage.
 *
 * Per Q8, an effect-granted advantage on the attacker's stance OVERRIDES the
 * matchup result outright (no cancellation). Likewise for disadvantage. If a
 * stance is granted both, granted advantage wins.
 *
 * If unbalanced, propose canceling overrides instead — i.e. matchup advantage
 * + effect disadvantage = neutral. That logic would replace the override path
 * here without changing call sites.
 */
export function resolveEffectiveAdvantage(
    matchup: Advantage,
    attackerEffects: ActiveEffect[],
    attackerStance: Stance,
): Advantage {
    const mods = getActiveEffectModifiers(attackerEffects);
    if (mods.advantageGrants.has(attackerStance)) return 'advantage';
    if (mods.advantageDenies.has(attackerStance)) return 'disadvantage';
    return matchup;
}
