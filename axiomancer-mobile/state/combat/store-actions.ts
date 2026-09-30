/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. This
 * module carries the *first-fight tutorial* flag plus the deck-identity layer:
 * the one starter bundle, the grey deck. Mobile invents no cards, costs, or
 * tuning — every id comes from the engine's `STARTING_CARD_IDS`.
 */

import {
    addRewardCard,
    rollCombatCardRewards,
    STARTING_CARD_IDS,
    type GameState,
} from '@mechanics';

import { EMPTY_COMBAT_REWARD_SLICE, type AppStore } from '../store';

/**
 * Flag set once the guided first hazard-combat tutorial is completed or
 * skipped, so it never auto-runs again. Lives on `GameState.flags` (a flat
 * string array that rides the save) — no migration needed: old saves simply
 * lack it and read as "not yet seen".
 */
// Source of truth moved to `state/tutorials.ts` (SETTINGS gate, 2026-09-23);
// re-exported so existing importers keep working.
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
// Starter bundles (deck identity). One bundle since the card purge (D36): the
// grey deck. The engine's preset table went in R7b; the bundle keeps its id
// because a save's `bundle:grey` flag names it. Mobile authors only
// presentation (name, pitch, accent, pills) — every card id is engine truth.
// ---------------------------------------------------------------------------

export type StarterArchetype = 'bleeder' | 'guardian' | 'controller';

export interface StarterBundle {
    id: string;
    name: string;
    description: string;
    /**
     * Hidden archetype tag — never surfaced in the UI and no reward lever.
     * Kept as the run-identity marker the bundle flag records. `null` for
     * the grey deck.
     */
    archetype: StarterArchetype | null;
    /** Tile accent colour. */
    accent: string;
    /** The deck's glossed keywords, shown as pills. */
    pills: readonly string[];
    /** The seeded knownCards deck (the engine recipe — duplicates intended). */
    cardIds: string[];
}

/** Persisted once the player picks (or is migrated past) a starter bundle. */
export const BUNDLE_CHOSEN_FLAG = 'starter-bundle-chosen';
const BUNDLE_FLAG_PREFIX = 'bundle:';
const ARCHETYPE_FLAG_PREFIX = 'archetype:';

// DEAL has no gloss row (it reads as plain text), so the pills name the
// grey deck's two glossed keywords.
export const STARTER_BUNDLES: readonly StarterBundle[] = Object.freeze([
    {
        id: 'grey',
        name: 'The Grey Office',
        description:
            'No flourish, no colour, no argument: a plain blow, a plain ward, '
            + 'and a plain word. Everything else is earned.',
        archetype: null,
        accent: '#8a8273',
        pills: ['GUARD', 'VULNERABLE'],
        cardIds: [...STARTING_CARD_IDS],
    },
]);

export function starterBundleById(id: string): StarterBundle | null {
    return STARTER_BUNDLES.find((b) => b.id === id) ?? null;
}

/** The sole starter offered to a brand-new player (phase 46b, per 46a's D4:
 *  the neutral, earliest campaign snapshot — no picker among the three). */
export const NEW_PLAYER_STARTER_BUNDLE_ID: string = 'grey';

/** The starter bundle chosen this run (read from flags), or null. */
export function chosenStarterBundle(store: AppStore): StarterBundle | null {
    const flags = (store.getState() as unknown as GameState).flags ?? [];
    const tag = flags.find((f) => f.startsWith(BUNDLE_FLAG_PREFIX));
    return tag ? starterBundleById(tag.slice(BUNDLE_FLAG_PREFIX.length)) : null;
}

/** The hidden archetype tag for this run, or null. Run identity only. */
export function runArchetype(store: AppStore): StarterArchetype | null {
    const flags = (store.getState() as unknown as GameState).flags ?? [];
    const tag = flags.find((f) => f.startsWith(ARCHETYPE_FLAG_PREFIX));
    return tag ? (tag.slice(ARCHETYPE_FLAG_PREFIX.length) as StarterArchetype) : null;
}

/**
 * Records the player's starter-bundle choice: seeds the bundle deck onto the
 * player (when one is loaded and card-less), and persists the bundle + hidden
 * archetype tag + the "chosen" flag so the picker never re-shows. Seeding also
 * happens lazily at first combat via `ensureStarterCards`, so a null/!loaded
 * player here is safe — the choice still rides the save as a flag.
 */
export function seedStarterBundleAction(store: AppStore, bundleId: string): void {
    const bundle = starterBundleById(bundleId);
    if (!bundle) return;
    const state = store.getState() as unknown as GameState;
    const flags = new Set(state.flags ?? []);
    flags.add(BUNDLE_CHOSEN_FLAG);
    flags.add(`${BUNDLE_FLAG_PREFIX}${bundle.id}`);
    // Themes with no reward-archetype mapping carry no skew tag.
    if (bundle.archetype) flags.add(`${ARCHETYPE_FLAG_PREFIX}${bundle.archetype}`);
    const player = state.player;
    const patch: Record<string, unknown> = { flags: [...flags] };
    if (player && (player.knownCards?.length ?? 0) === 0) {
        patch.player = { ...player, knownCards: [...bundle.cardIds], combatRewardCards: [] };
    }
    store.setState(patch as never);
    try { store.getState().save(); } catch { /* persistence must not block the run */ }
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
 * immediately, mirroring `seedStarterBundleAction`: before this, a pick lived
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
