/**
 * Befriend eligibility read off the foe itself — the rules The Open Hand
 * (the Suppliant's Ring signature, D47) and the card-side befriend predicate
 * in `Combat/index.ts` share, so the two can never disagree.
 */

import type { Enemy } from './types';

/**
 * A foe can be befriended when it carries a `friendshipReward`: that is what
 * the friendship outcome pays out, and a foe without one has nothing to give
 * (the survivors: the Brine Hag yes, Float-Eye and the Doorwarden no).
 */
export function isEnemyBefriendable(enemy: Pick<Enemy, 'friendshipReward'>): boolean {
    return enemy.friendshipReward !== undefined;
}

/**
 * The foe's `befriendabilityConfig.hpGate`: open when its VITAE fraction is at
 * or below `belowPct`. A foe with no gate is always open.
 */
export function befriendHpGateOpen(enemy: Pick<Enemy, 'befriendabilityConfig' | 'health' | 'maxHealth'>): boolean {
    const gate = enemy.befriendabilityConfig?.hpGate;
    if (!gate) return true;
    if (enemy.maxHealth <= 0) return false;
    return enemy.health / enemy.maxHealth <= gate.belowPct;
}
