/**
 * Effect application resolver.
 *
 * Every effect lands as authored — no roll at any tier:
 *
 * - Tier 1 auto-applies.
 * - Tier 2 / Tier 3 debuffs always land: no target resist, no Nat-20
 *   rebound/escape, no Nat-1 overwhelm.
 * - Tier 2 buffs land at printed intensity: no hidden caster-side roll.
 *
 * The function survives (rather than callers applying effects directly)
 * because it is the single seam that turns an `ActiveEffect` into the
 * `EffectApplicationResult` the card engine and battle log consume.
 */

import { ActiveEffect, EffectType, EffectApplicationResult } from '../Effects/types';
import { Combatant } from './types';

/**
 * Resolves `activeEffect` onto `target`. Pure and deterministic: consumes
 * no RNG, never fails, and returns the effect unchanged.
 *
 * @param _target      - The combatant receiving the effect (kept for the
 *                       call-site contract; nothing about the target can
 *                       block an effect today).
 * @param activeEffect - The fully built effect instance to apply.
 * @param effectType   - `'buff'` or `'debuff'`; only shapes the log line.
 * @returns A successful result carrying `activeEffect` and a log message.
 */
export function resolveEffectApplication(
    _target: Combatant,
    activeEffect: ActiveEffect,
    effectType: EffectType,
): EffectApplicationResult {
    const message = activeEffect.tier === 1
        ? 'Effect applied automatically.'
        : activeEffect.tier === 3
            ? 'Inescapable. The Tier 3 effect takes hold.'
            : effectType === 'buff' ? 'Buff applied.' : 'Effect lands.';
    return { success: true, activeEffect, message };
}
