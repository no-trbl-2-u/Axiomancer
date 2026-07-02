/**
 * Damage math: critical multipliers, final damage calculation, and the simple
 * higher-roll-wins comparator.
 */

import type { CritStyle } from './types';

/** Doubles raw damage on a critical hit. Adjust here to rebalance crits. */
export function applyCriticalMultiplier(baseDamage: number): number {
    return baseDamage * 2;
}

/**
 * Phase 32 — `critStyle` auto-selection. On a crit, two damage paths are
 * possible:
 *   - `'double'` — 2 × baseDamage, then subtract defence.
 *   - `'pierce'` — baseDamage as-is, defence ignored.
 * `damageBonus` rides on both paths (e.g. mind-stance study marks).
 *
 * Returns the picked style + final damage. The picker is "whichever deals
 * more"; ties fall to `'double'` so it remains the default-tagged style.
 * Damage is clamped to 0 and rounded up.
 */
export function selectCritDamage(
    baseDamage: number,
    damageReduction: number,
    damageBonus = 0,
): { style: CritStyle; damage: number } {
    const doubled = Math.ceil(Math.max(0, 2 * baseDamage + damageBonus - damageReduction));
    const pierced = Math.ceil(Math.max(0, baseDamage + damageBonus));
    if (pierced > doubled) return { style: 'pierce', damage: pierced };
    return { style: 'double', damage: doubled };
}

/**
 * Final damage after crits and defence reduction (clamped to 0).
 *
 * @param baseDamage      - Pre-reduction damage.
 * @param damageReduction - Defence value to subtract (already multiplied).
 * @param isCritical      - When true, the higher of the two crit-style
 *                          damage paths is picked (see `selectCritDamage`).
 * @param damageBonus     - Optional flat bonus added before defence (e.g. marks).
 */
export function calculateFinalDamage(
    baseDamage: number,
    damageReduction: number,
    isCritical: boolean,
    damageBonus = 0,
): number {
    if (isCritical) {
        return selectCritDamage(baseDamage, damageReduction, damageBonus).damage;
    }
    return Math.ceil(Math.max(0, baseDamage + damageBonus - damageReduction));
}

/** True iff `attackRoll` strictly exceeds `defenseRoll`. */
export function isAttackSuccessful(attackRoll: number, defenseRoll: number): boolean {
    return attackRoll > defenseRoll;
}
