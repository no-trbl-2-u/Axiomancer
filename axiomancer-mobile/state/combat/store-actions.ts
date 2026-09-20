/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. This
 * module carries the *first-fight tutorial* flag plus the deck-identity layer:
 * dev deck presets and the pre-run starter-bundle picker, both sourced from the
 * engine's ten themed preset decks (spec 32 v3 §8). Mobile invents no cards,
 * costs, or tuning — every id comes from the engine's own preset table.
 */

import {
    COMBAT_REWARD_POOL,
    STARTING_CARD_IDS,
    addRewardCard,
    listDeckPresets,
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
export const COMBAT_TUTORIAL_FLAG = 'combat-tutorial-done';

/**
 * Marks the guided first combat as done (completed or skipped): sets the
 * persistent flag so the first-fight trigger never re-runs it, and persists.
 * Idempotent — safe to call again (e.g. when the dev button force-replays the
 * tutorial on a save that already has the flag).
 */
export function completeCombatTutorialAction(store: AppStore, skipped: boolean): void {
    const state = store.getState() as unknown as GameState;
    if (!(state.flags ?? []).includes(COMBAT_TUTORIAL_FLAG)) {
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
// Deck presets — spec 32 v3 §8: the TEN themed preset decks, engine-owned.
//
// The combat deck the engine deals from is `buildCombatDeck(player)` =
// `player.knownCards` + `player.combatRewardCards` + the synthetic cards. So a
// "swap your deck" is just: replace `knownCards` with the preset's card ids
// (duplicates intentional — the 4/4/2/2/1/1/1 recipe) and clear the earned
// reward cards, leaving the deck EXACTLY the preset plus the engine's
// always-on synthetics (Retreat).
// ---------------------------------------------------------------------------

/** Every distinct combat card the engine can deal: starters + the 70-card pool. */
const COMBAT_CARD_POOL: readonly string[] = Object.freeze(
    Array.from(new Set([...STARTING_CARD_IDS, ...COMBAT_REWARD_POOL])),
);

/**
 * The starting deck — Phase 104: the engine's `STARTING_CARD_IDS`, THE GREY
 * OFFICE (7 STRIKE / 3 WARD, every card powered by any die). Copies are
 * real, so the list is seeded verbatim.
 */
const STARTER_DECK_IDS: readonly string[] = STARTING_CARD_IDS;

/** The three campaign preset ids (the Profane Canon rework, 2026-08-08) —
 *  snapshots of ONE deck evolving early → mid → late, in campaign order. */
export type ThemedDeckId =
    | 'threadbare'
    | 'pilgrim'
    | 'apostate';

export type CombatDeckPresetId = 'starter-baseline' | ThemedDeckId;

export interface CombatDeckPreset {
    id: CombatDeckPresetId;
    label: string;
    description: string;
    cardIds: readonly string[];
}

export interface CombatDeckPresetResult {
    presetId: CombatDeckPresetId;
    label: string;
    cardIds: string[];
}

// The dev presets: the starter baseline plus the engine's ten themed decks,
// verbatim (name/description/recipe are engine truth).
export const COMBAT_DECK_PRESETS: readonly CombatDeckPreset[] = Object.freeze([
    {
        id: 'starter-baseline' as const,
        label: 'Starter baseline',
        description: 'The starting deck a new player is seeded with. Clean control.',
        cardIds: STARTER_DECK_IDS,
    },
    ...listDeckPresets().map((preset): CombatDeckPreset => ({
        id: preset.id as ThemedDeckId,
        label: preset.name,
        description: preset.description,
        cardIds: preset.cardIds,
    })),
]);

function combatDeckPresetById(presetId: CombatDeckPresetId): CombatDeckPreset {
    const preset = COMBAT_DECK_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) throw new Error(`Unknown combat deck preset: ${presetId}`);
    return preset;
}

/**
 * Dev tool — swap the player's combat deck for a preset. Sets
 * `player.knownCards` to the preset's card ids and clears earned
 * `combatRewardCards`, so the next encounter deals exactly the preset deck
 * (`buildCombatDeck` adds only the engine's synthetic cards on top). No-op
 * with an empty result shape if there is no player loaded.
 */
export function applyCombatDeckPresetAction(
    store: AppStore,
    presetId: CombatDeckPresetId,
): CombatDeckPresetResult {
    const preset = combatDeckPresetById(presetId);
    const cardIds = [...preset.cardIds];
    const player = (store.getState() as unknown as GameState).player;
    if (player) {
        store.setState({
            player: { ...player, knownCards: cardIds, combatRewardCards: [] },
        } as never);
    }
    return { presetId: preset.id, label: preset.label, cardIds };
}

/** How many random cards `randomizeCombatDeckAction` deals into the deck. */
const RANDOMIZE_CARD_COUNT = 8;

/**
 * Dev tool — rebuild the player's combat deck as a random selection from EVERY
 * defined combat card (starters + the full 70-card pool, rares included), so
 * dev sessions surface cards normal play rarely reaches. Replaces
 * `knownCards` with the random unique pull and clears `combatRewardCards`.
 * Returns the granted card ids.
 */
export function randomizeCombatDeckAction(store: AppStore): string[] {
    const pool = [...COMBAT_CARD_POOL];
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const granted = pool.slice(0, Math.min(RANDOMIZE_CARD_COUNT, pool.length));
    const player = (store.getState() as unknown as GameState).player;
    if (player) {
        store.setState({
            player: { ...player, knownCards: granted, combatRewardCards: [] },
        } as never);
    }
    return granted;
}

// ---------------------------------------------------------------------------
// Starter bundles (deck identity) — the pre-run "choose your path" decks.
//
// A bundle is one of the engine's themed preset decks plus a HIDDEN archetype
// tag. The tag is never shown to the player. It no longer steers card rewards
// — the reward draft reads the deck's THEMES directly (2026-08-08), which is
// both finer-grained and works on the neutral Threadbare Office where the
// archetype read was simply null. The tag survives as a run-identity marker.
// Mobile authors only presentation (accent + the theme's two hallmark-keyword
// pills) — every card id is engine truth.
// ---------------------------------------------------------------------------

export type StarterArchetype = 'bleeder' | 'guardian' | 'controller';

export interface StarterBundle {
    id: string;
    name: string;
    description: string;
    /**
     * Hidden archetype tag — never surfaced in the UI, and no longer a reward
     * lever (the draft reads deck THEMES now). Kept as the run-identity marker
     * the bundle flag records. `null` for themes that map onto none of the
     * three archetypes.
     */
    archetype: StarterArchetype | null;
    /** Tile accent colour. A per-theme hue, decoupled from stance colour so
     *  every deck reads distinct on the picker. */
    accent: string;
    /** The theme's two hallmark keywords (spec 32 v3 §3), shown as pills. */
    pills: readonly string[];
    /** The seeded knownCards deck (the engine recipe — duplicates intended). */
    cardIds: string[];
}

/** Persisted once the player picks (or is migrated past) a starter bundle. */
export const BUNDLE_CHOSEN_FLAG = 'starter-bundle-chosen';
const BUNDLE_FLAG_PREFIX = 'bundle:';
const ARCHETYPE_FLAG_PREFIX = 'archetype:';

/** Mobile presentation + reward-skew tag per campaign preset (the Profane
 *  Canon): a stage accent and the snapshot's leading keywords. The early
 *  Office skews nowhere (it is deliberately neutral chaff); the mid Burden
 *  leans rot/debt (bleeder); the late Canon adds the wall (guardian). */
const BUNDLE_CHROME: Record<ThemedDeckId, { accent: string; pills: readonly string[]; archetype: StarterArchetype | null }> = {
    threadbare: { accent: '#8a8273', pills: ['GUARD', 'POISON'], archetype: null },
    pilgrim: { accent: '#5aa02c', pills: ['POISON', 'RECOIL'], archetype: 'bleeder' },
    apostate: { accent: '#a63a3a', pills: ['DOOM', 'THORNS'], archetype: 'guardian' },
};

/**
 * Phase 104 — THE GREY OFFICE, the bundle every brand-new run is seeded with
 * (`NEW_PLAYER_STARTER_BUNDLE_ID`). Ten grey cards, no archetype, no hallmark
 * pills: the deck leans nowhere until its first rewards are taken. The card
 * ids are engine truth (`STARTING_CARD_IDS`).
 */
const GREY_OFFICE_BUNDLE: StarterBundle = Object.freeze({
    id: 'grey-office',
    name: 'The Grey Office',
    description: 'Seven plain blows and three plain wards. Any die powers any of them. What the deck becomes is decided by what you take.',
    archetype: null,
    accent: '#8a8273',
    pills: [],
    cardIds: [...STARTER_DECK_IDS],
});

// The grey office first, then one bundle per themed preset deck in the
// engine's display order. Each preset carries its theme's reward-skew
// archetype so wins bias rewards toward the same family.
export const STARTER_BUNDLES: readonly StarterBundle[] = Object.freeze([
    GREY_OFFICE_BUNDLE,
    ...listDeckPresets().map((preset): StarterBundle => {
        const chrome = BUNDLE_CHROME[preset.id as ThemedDeckId];
        return {
            id: preset.id,
            name: preset.name,
            description: preset.description,
            archetype: chrome?.archetype ?? null,
            accent: chrome?.accent ?? '#8a8273',
            pills: chrome?.pills ?? [],
            cardIds: [...preset.cardIds],
        };
    }),
]);

export function starterBundleById(id: string): StarterBundle | null {
    return STARTER_BUNDLES.find((b) => b.id === id) ?? null;
}

/** The sole starter a brand-new player is seeded with (phase 46b: no picker;
 *  Phase 104: the grey office replaces the Threadbare Office as that seed). */
export const NEW_PLAYER_STARTER_BUNDLE_ID: string = 'grey-office';

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
// Post-combat card reward — the theme-aware 1-of-3 draft.
//
// The ROLL is engine truth (`rollCombatCardRewards` reads the player's actual
// deck themes and weights offers toward them, keeping an off-theme pivot open
// — see `REWARD_OFF_THEME_RATE`). Mobile owns exactly two things: WHEN the
// draft opens, and persisting the claim. The old mobile-side archetype skew
// (`skewRewardsByArchetype`) is gone — it re-sorted the engine's weighted roll
// behind its back and did nothing at all on the neutral Threadbare Office.
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
