/**
 * Effect application resolver.
 *
 * Every effect lands as authored — no roll at any tier:
 *
 * - Tier 1 auto-applies (always did).
 * - Tier 2 / Tier 3 debuffs always land (Phase 80, direction (a): target
 *   resist, Nat-20 rebound/escape and Nat-1 overwhelm were removed then).
 * - Tier 2 buffs land at printed intensity. D12
 *   (`plan/2026-09-25-refactor-strategy.decisions.md`, trim spec Tier 0
 *   item 5) removed the hidden caster-side d20 that fizzled 5 % of buffs
 *   and doubled 5 % without the player ever seeing the roll.
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
