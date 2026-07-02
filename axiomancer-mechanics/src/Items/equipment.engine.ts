/**
 * Equipment & Consumable Engine — combat-side helpers for Spec 05.
 *
 * Pure functions that the combat resolver and the game store consume to wire
 * equipment and consumables into combat:
 *
 *   - `aggregateCombatStartTokens` — sums `combatStartTokens` across every
 *     equipped piece. The resolver folds the result into `combatResources`
 *     in `initializeCombat` so battles can begin with non-zero stance / phil
 *     counters when the wearer carries Berserker Band-style accessories.
 *   - `applyEquipmentGenerationBonus` — folds equipment `generationBonus`
 *     entries on top of the base `generateBasicActionResources` table.
 *   - `getEquipmentProcTriggers` — assembles the `EquipmentProcTrigger[]` the
 *     combat resolver appends to the Spec 03 proc roll for an `attack` or
 *     `defend` action.
 *   - `useConsumableEffect` — resolves a consumable's heal / effect payload
 *     against the caller's `ActiveEffect` array and HP, returning the new
 *     player snapshot. The caller decrements the inventory stack itself via
 *     the existing `useConsumable` reducer.
 */

import { Equipment, EquipmentProcTrigger, EquipmentSlot, Consumable } from './types';
import { Effect } from '../Effects/types';
import { applyEffect } from '../Effects';
import { heal } from '../Combat/health';
import { CombatResources } from '../Cards/types';
import { Character } from '../Character/types';
import { getEquippedItems } from '../Character/equipment.reducer';

/**
 * Sums each item's `resourceInteraction.combatStartTokens` into a flat
 * `CombatResources` snapshot. Items without `resourceInteraction` contribute
 * zero to every counter. Pure.
 */
export function aggregateCombatStartTokens(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
): CombatResources {
    const totals: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
    for (const piece of getEquippedItems(equipment)) {
        const grant = piece.resourceInteraction?.combatStartTokens;
        if (!grant) continue;
        for (const key of Object.keys(totals) as Array<keyof CombatResources>) {
            const value = grant[key];
            if (typeof value === 'number') totals[key] += value;
        }
    }
    return totals;
}

/** Outcome of a basic action — kept aligned with the `outcome` argument of
 *  `generateBasicActionResources` in the skills module to avoid an awkward
 *  import cycle. */
export type EquipmentBonusOutcome = 'hit' | 'miss' | 'defend';

/**
 * Applies every applicable equipment `generationBonus` entry on top of a
 * `CombatResources` snapshot that already has the base-table token baked in.
 * Bonuses with `trigger: 'any'` apply to every basic action; matching triggers
 * apply only to the actor's chosen action outcome. Negative bonuses are
 * tolerated but each counter is clamped to ≥ 0 so an item never zeroes out a
 * pool the player legitimately earned.
 */
export function applyEquipmentGenerationBonus(
    resources: CombatResources,
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
    outcome: EquipmentBonusOutcome,
): CombatResources {
    const next: CombatResources = { ...resources };
    for (const piece of getEquippedItems(equipment)) {
        const bonuses = piece.resourceInteraction?.generationBonus;
        if (!bonuses) continue;
        for (const entry of bonuses) {
            if (entry.trigger !== 'any' && entry.trigger !== outcome) continue;
            next[entry.resourceType] = Math.max(0, next[entry.resourceType] + entry.bonus);
        }
    }
    return next;
}

/**
 * Returns the equipment-provided proc triggers the wearer rolls for on this
 * action. `'attack'` returns every equipped item's `onHitEffects`; `'defend'`
 * returns every equipped item's `onDefendEffects`. Pure.
 */
export function getEquipmentProcTriggers(
    equipment: Partial<Record<EquipmentSlot, Equipment>>,
    action: 'attack' | 'defend',
): EquipmentProcTrigger[] {
    const out: EquipmentProcTrigger[] = [];
    for (const piece of getEquippedItems(equipment)) {
        const source = action === 'attack' ? piece.onHitEffects : piece.onDefendEffects;
        if (!source) continue;
        out.push(...source);
    }
    return out;
}

/**
 * Result of applying a consumable's payload to a player snapshot. The caller
 * is responsible for decrementing the inventory stack via the existing
 * `useConsumable` inventory reducer; this engine call only handles the HP +
 * `effects` side of the transaction.
 *
 * `resourceGrant` is returned as a flat delta the caller folds into the
 * combat-side `combatResources` snapshot (see Spec 05b Q6 — the consumable
 * engine has no view of combat state itself, only the player Character).
 *
 * @property player         - The updated player snapshot (new HP / effects).
 * @property healed         - HP actually restored (after clamping to `maxHealth`).
 * @property applied        - The Effect that landed via `applyEffect`, if any.
 * @property resourceGrant  - The token delta from the consumable's
 *                            `resourceGrant`, with missing keys defaulted to
 *                            zero. Always present so the caller can fold it
 *                            unconditionally; an empty grant returns all zeros.
 */
export interface ConsumableUseResult {
    player: Character;
    healed: number;
    applied: Effect | null;
    resourceGrant: CombatResources;
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
    const resourceGrant: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };
    if (consumable.resourceGrant) {
        for (const key of Object.keys(resourceGrant) as Array<keyof CombatResources>) {
            const value = consumable.resourceGrant[key];
            if (typeof value === 'number') resourceGrant[key] = value;
        }
    }

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

    return { player: next, healed, applied, resourceGrant };
}
