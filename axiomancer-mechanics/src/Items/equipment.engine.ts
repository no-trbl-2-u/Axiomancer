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
 * @property desperate      - Phase 96. True when the drinker was below
 *   {@link DESPERATION_HP_FRACTION} of `maxHealth` at the moment of use AND the
 *   consumable carried a `healAmountBelowHalf`, i.e. the larger desperation-band
 *   heal is the one that fired. False for every flat heal and for every
 *   non-healing consumable. Presenters read this to tell the player WHICH band
 *   they got; nothing in the engine branches on it.
 */
export interface ConsumableUseResult {
    player: Character;
    healed: number;
    applied: Effect | null;
    desperate: boolean;
}

/**
 * Phase 96 — the desperation band's upper bound, as a fraction of `maxHealth`.
 *
 * A drinker is "desperate" while `health / maxHealth < DESPERATION_HP_FRACTION`.
 * Strictly less-than, so a combatant sitting exactly at half health is NOT
 * desperate and gets the flat `healAmount` — the band is the half BELOW the
 * midpoint, not the midpoint itself.
 *
 * 0.5 matches the corpus convention the lever is modelled on
 * (`kb:dawncaster/0796-healing-potion` — "If you are below 50% health"), which
 * keeps the threshold legible to a player without a tutorial: "under half".
 */
export const DESPERATION_HP_FRACTION = 0.5;

/**
 * Phase 96 — is this combatant inside the desperation band right now?
 *
 * Exported so presenters (mobile's inventory modal, the village ware line) can
 * ask the same question the engine asks, instead of re-deriving the threshold
 * and drifting from it.
 *
 * A combatant with a non-positive `maxHealth` is never desperate: the fraction
 * is undefined there (division by zero), and treating a degenerate record as
 * "desperate" would silently hand out the larger heal.
 *
 * @param player - the combatant to test (any record carrying health/maxHealth).
 * @returns true when `health / maxHealth` is STRICTLY below the threshold.
 */
export function isDesperate(player: Pick<Character, 'health' | 'maxHealth'>): boolean {
    if (player.maxHealth <= 0) return false;
    return player.health / player.maxHealth < DESPERATION_HP_FRACTION;
}

/**
 * Phase 96 — which heal a consumable pays out against a given HP snapshot.
 *
 * The single place that resolves the two-band heal, shared by the engine
 * (`useConsumableEffect`) and by every presenter that previews a drink before
 * the player commits to it. Keeping it in one exported function is what stops
 * the shop line, the inventory preview and the actual heal from disagreeing.
 *
 * Resolution order:
 *   1. No `healAmount` (or a non-positive one) — this consumable does not heal;
 *      pays 0 in both bands. `healAmountBelowHalf` alone is NOT a payload (see
 *      the `Consumable` docblock), so it is ignored here.
 *   2. Drinker inside the desperation band AND `healAmountBelowHalf` is a
 *      positive number — pay `healAmountBelowHalf`.
 *   3. Otherwise — pay the flat `healAmount`.
 *
 * @param player     - the drinker, read for `health` / `maxHealth` only.
 * @param consumable - the item being drunk.
 * @returns `amount` (HP the drink will try to restore, before `maxHealth`
 *   clamping) and `desperate` (whether band 2 is the one that fired).
 */
export function resolveConsumableHeal(
    player: Pick<Character, 'health' | 'maxHealth'>,
    consumable: Consumable,
): { amount: number; desperate: boolean } {
    const flat = consumable.healAmount;
    if (typeof flat !== 'number' || flat <= 0) {
        return { amount: 0, desperate: false };
    }
    const below = consumable.healAmountBelowHalf;
    if (typeof below === 'number' && below > 0 && isDesperate(player)) {
        return { amount: below, desperate: true };
    }
    return { amount: flat, desperate: false };
}

/**
 * Applies a `Consumable`'s payload onto a `Character`:
 *
 *   1. If `healAmount` is set, restores that many HP (clamped via `heal`) —
 *      or, when the drinker is inside the desperation band and the item carries
 *      a `healAmountBelowHalf`, that larger amount instead (Phase 96; see
 *      {@link resolveConsumableHeal}). The band is read off the player snapshot
 *      BEFORE any healing is applied, so a drink that lifts the player out of
 *      the band still pays the desperation amount — the potion answers the
 *      state it was drunk in.
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

    // Phase 96 — resolved against the INCOMING snapshot, before any healing or
    // effect application mutates HP. Reading the band first is what makes the
    // payout depend on the state the player chose to drink in.
    const { amount: healPayout, desperate } = resolveConsumableHeal(player, consumable);
    if (healPayout > 0) {
        const hpBefore = next.health;
        next = heal(next, healPayout);
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

    return { player: next, healed, applied, desperate };
}
