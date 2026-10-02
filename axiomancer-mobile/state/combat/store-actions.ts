/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. This
 * module carries the *first-fight tutorial* flag and the post-combat card
 * draft. Mobile invents no cards, costs, or tuning.
 */

import {
    addRewardCard,
    rollCombatCardRewards,
    type GameState,
} from '@mechanics';

import { EMPTY_COMBAT_REWARD_SLICE, type AppStore } from '../store';

/**
 * Flag set once the guided first hazard-combat tutorial is completed or
 * skipped, so it never auto-runs again. Lives on `GameState.flags` (a flat
 * string array that rides the save) — no migration needed: old saves simply
 * lack it and read as "not yet seen".
 */
// Source of truth is `state/tutorials.ts`; re-exported for importers here.
export { COMBAT_TUTORIAL_FLAG } from '../tutorials';
import { COMBAT_TUTORIAL_FLAG, isTutorialDone } from '../tutorials';

/**
 * Marks the guided first combat as done (completed or skipped): sets the
 * persistent flag so the first-fight trigger never re-runs it, and persists.
 * Idempotent — safe to call again (e.g. when the dev button force-replays the
 * tutorial on a save that already has the flag).
 */
export function completeCombatTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    // Always stamp the FLAG (per-save), even with hints off — `isTutorialDone`
    // is the read-side gate; the write side records what actually ran.
    if (!isTutorialDone(state.flags, COMBAT_TUTORIAL_FLAG, true)) {
        store.setState({ flags: [...(state.flags ?? []), COMBAT_TUTORIAL_FLAG] } as never);
        try {
            store.getState().save();
        } catch {
            // Persistence failures must not strand the coach.
        }
    }
    void skipped;
}

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
