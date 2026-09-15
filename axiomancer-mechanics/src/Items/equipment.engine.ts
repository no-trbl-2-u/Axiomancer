/**
 * Consumable engine — combat-side consumable helper (Spec 05).
 *
 * Phases 20-23 decoupled equipment from combat entirely: equipment contributes
 * only `statModifiers` (folded into `derivedStats` at equip-time), so the old
 * equipment combat helpers (`aggregateCombatStartTokens`,
 * `applyEquipmentGenerationBonus`, `getEquipmentProcTriggers`) are gone. Only
 * the consumable helper remains here:
 *
 *   - `useConsumableEffect` — resolves a consumable's heal / effect payload
 *     against the caller's `ActiveEffect` array and HP, returning the new
 *     player snapshot. The caller decrements the inventory stack itself via
 *     the existing `useConsumable` reducer.
 */

import { Consumable } from './types';
import { Effect } from '../Effects/types';
import { applyEffect, removeEffectsByType } from '../Effects';
import { heal } from '../Combat/health';
import { Character } from '../Character/types';

/**
 * Result of applying a consumable's payload to a player snapshot. The caller
 * is responsible for decrementing the inventory stack via the existing
 * `useConsumable` inventory reducer; this engine call only handles the HP +
 * `effects` side of the transaction.
 *
 * @property player         - The updated player snapshot (new HP / effects).
 * @property healed         - HP actually restored (after clamping to `maxHealth`).
 * @property applied        - The Effect that landed via `applyEffect`, if any.
 */
export interface ConsumableUseResult {
    player: Character;
    healed: number;
    applied: Effect | null;
}

/**
 * Applies a `Consumable`'s payload onto a `Character`:
 *
 *   1. If `healAmount` is set, restores that many HP (clamped via `heal`).
 *   2. If `effectId` resolves into the library, applies the effect via
 *      `applyEffect` honouring `intensityOverride` / `durationOverride`.
 *   3. If `inlineEffect` is provided, applies it the same way (no library
 *      lookup needed). Both `effectId` and `inlineEffect` may be present
 *      simultaneously; the inline effect runs first so a consumable can
 *      apply a bespoke effect and then a known library effect.
 *
 * Pure — returns the updated player snapshot.
 */
export function useConsumableEffect(
    player: Character,
    consumable: Consumable,
    round: number,
    lookupEffectFn: (id: string) => Effect | undefined,
): ConsumableUseResult {
    let next: Character = player;
    let healed = 0;
    let applied: Effect | null = null;

    if (typeof consumable.healAmount === 'number' && consumable.healAmount > 0) {
        const hpBefore = next.health;
        next = heal(next, consumable.healAmount);
        healed = next.health - hpBefore;
    }

    const intensityDelta = consumable.intensityOverride;
    const durationDelta  = consumable.durationOverride;

    const buildApplyOptions = () => {
        if (durationDelta !== undefined) {
            return {
                intensityDelta: intensityDelta ?? 1,
                durationMode:   'additive' as const,
                durationDelta,
            };
        }
        if (intensityDelta !== undefined) {
            return { intensityDelta };
        }
        return undefined;
    };

    const runEffect = (effect: Effect): void => {
        // CLEANSE consumables (antidote → `buff_cleanse` tier 2, clarity-serum →
        // `buff_cleanse_minor` tier 1) carry a payload-less instant whose job is
        // to STRIP debuffs, not to persist. Route it to `removeEffectsByType`
        // scoped by the effect's tier (a tier-2 cleanse sheds tier 1+2 debuffs,
        // a tier-1 cleanse sheds tier 1 only) instead of adding an inert
        // instance — otherwise the item advertises "purges venoms" and does
        // nothing.
        if (effect.payload.cleanse) {
            const { activeEffects } = removeEffectsByType(next.effects, 'debuff', effect.tier);
            next = { ...next, effects: activeEffects };
            applied = effect;
            return;
        }
        const { activeEffects } = applyEffect(next.effects, effect, round, buildApplyOptions());
        next = { ...next, effects: activeEffects };
        applied = effect;
    };

    if (consumable.inlineEffect) {
        runEffect(consumable.inlineEffect);
    }
    if (consumable.effectId) {
        const def = lookupEffectFn(consumable.effectId);
        if (def) runEffect(def);
    }

    return { player: next, healed, applied };
}
