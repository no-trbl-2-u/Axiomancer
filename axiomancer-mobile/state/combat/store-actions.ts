/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. This
 * module carries the post-combat card draft. Mobile invents no cards, costs,
 * or tuning.
 */

import {
    addRewardCard,
    rollCombatCardRewards,
    type GameState,
} from '@mechanics';

import { EMPTY_COMBAT_REWARD_SLICE, type AppStore } from '../store';

// ---------------------------------------------------------------------------
// Post-combat card reward — the 1-of-3 draft.
//
// The ROLL is engine truth (`rollCombatCardRewards` draws uniformly from
// `COMBAT_REWARD_POOL`). Mobile owns exactly two things: WHEN the draft
// opens, and persisting the claim.
// ---------------------------------------------------------------------------

/** Offers shown per reward screen. */
export const COMBAT_REWARD_OFFER_COUNT = 3;

/**
 * Rolls the post-combat draft into the store, once. No-ops when a draft is
 * already open, when the reward was already claimed this encounter, or when no
 * player is loaded — so a re-render (or a panel remount mid-draft) re-reads the
 * SAME offer instead of rerolling it.
 */
export function rollCombatRewardAction(store: AppStore): readonly string[] {
    const state = store.getState();
    const slice = state.combatReward ?? EMPTY_COMBAT_REWARD_SLICE;
    if (slice.claimed || slice.offers.length > 0) return slice.offers;
    const player = (state as unknown as GameState).player;
    if (!player) return EMPTY_COMBAT_REWARD_SLICE.offers;
    const offers = rollCombatCardRewards(player, Math.random, COMBAT_REWARD_OFFER_COUNT);
    store.setState({ combatReward: { offers, claimed: false } } as never);
    return offers;
}

/**
 * Resolves the draft: `cardId` appends that card to the player's persistent
 * `combatRewardCards`; `null` is the SKIP (a lean deck is a legitimate play —
 * the draft is claimed, nothing is added). Either way the claim is PERSISTED
 * immediately: before this, a pick lived
 * only in memory until some unrelated `save()` happened to run, so closing the
 * app after taking a card silently lost it.
 */
export function claimCombatRewardAction(store: AppStore, cardId: string | null): void {
    const player = (store.getState() as unknown as GameState).player;
    const patch: Record<string, unknown> = { combatReward: { offers: [], claimed: true } };
    if (cardId && player) patch.player = addRewardCard(player, cardId);
    store.setState(patch as never);
    try { store.getState().save(); } catch { /* persistence must not strand the reward screen */ }
}

/** Clears the draft for the next encounter (called when combat is left). */
export function resetCombatRewardAction(store: AppStore): void {
    store.setState({ combatReward: EMPTY_COMBAT_REWARD_SLICE } as never);
}
