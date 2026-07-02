/**
 * Combat (hazard-pattern encounter) store-actions — mobile UI layer.
 *
 * The encounter engine (`CombatEncounterState`) is pure and the
 * `/combat-encounter` screen holds it in local React state, so unlike the
 * gathering/hazard slices there is no mobile combat session slice here. The
 * only thing that must outlive a single encounter is the *first-fight tutorial*
 * flag, so this module is deliberately tiny: one persistent flag and the action
 * that sets it, mirroring `completeGatheringTutorialAction`.
 */

import {
    COMBAT_REWARD_POOL,
    STARTING_SKILL_IDS,
    getCard,
    isGoldCard,
    type CombatCard,
    type GameState,
} from 'axiomancer-mechanics';

import type { AppStore } from '../store';

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
// Dev-only combat deck presets (mirrors the hazard deck presets — see
// `state/hazard/store-actions.ts`). The combat deck the engine deals from is
// `buildCombatDeck(player)` = `player.knownSkills` + `player.combatRewardCards`
// + the synthetic cards. So a dev "swap your deck" is just: replace
// `knownSkills` with the preset's card ids and clear the earned reward cards,
// leaving the deck EXACTLY the preset (plus the engine's always-on synthetics).
//
// No local rule data: every preset is a curated *selection of engine-defined
// card ids* (the starter skills + `COMBAT_REWARD_POOL`), categorised by the
// engine's own card metadata (`getCard`). Mobile invents no cards, costs, or
// tuning — exactly the contract the hazard presets already satisfy.
// ---------------------------------------------------------------------------

/** Every distinct combat card the engine can deal: starter skills + reward pool. */
const COMBAT_CARD_POOL: readonly string[] = Object.freeze(
    Array.from(new Set([...STARTING_SKILL_IDS, ...COMBAT_REWARD_POOL])),
);

/**
 * The tier-1 set a brand-new player is seeded with — kept in sync by hand with
 * `STARTER_SKILL_IDS` in `state/actions.ts` (the new-player default deck). The
 * engine's `STARTING_SKILL_IDS` is intentionally NOT used here: it lists
 * `slippery-slope` (a level-14 learn requirement), so it is not the clean
 * level-1 starter the live game actually grants.
 */
const STARTER_DECK_IDS: readonly string[] = Object.freeze([
    'ad-hominem-strike', // body · attack
    'brace-for-impact', //  body · defend (guard)
    'false-dilemma', //     mind · attack + control
    'suspend-judgment', //  mind · defend (guard)
    'ship-of-theseus', //   heart · attack
]);

export type CombatDeckPresetId =
    | 'starter-baseline'
    | 'body-force'
    | 'mind-logic'
    | 'heart-will'
    | 'aggression'
    | 'attrition'
    | 'control-guard'
    | 'gold-showcase';

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

/** Pool card ids whose engine metadata satisfies `predicate`, in pool order. */
function poolMatching(predicate: (card: CombatCard) => boolean): string[] {
    const out: string[] = [];
    for (const id of COMBAT_CARD_POOL) {
        const card = getCard(id);
        if (card && predicate(card)) out.push(id);
    }
    return out;
}

export const COMBAT_DECK_PRESETS: readonly CombatDeckPreset[] = Object.freeze([
    {
        id: 'starter-baseline',
        label: 'Starter baseline',
        description: 'The default level-1 deck a new player is seeded with. Clean control.',
        cardIds: STARTER_DECK_IDS,
    },
    {
        id: 'body-force',
        label: 'Body / Force',
        description: 'Every body-stance card — direct force, bleed, and a brace.',
        cardIds: poolMatching((c) => c.stance === 'body'),
    },
    {
        id: 'mind-logic',
        label: 'Mind / Logic',
        description: 'Every mind-stance card — strikes, confusion control, and erosion.',
        cardIds: poolMatching((c) => c.stance === 'mind'),
    },
    {
        id: 'heart-will',
        label: 'Heart / Will',
        description: 'Every heart-stance card — self-buffs, control, and a guard.',
        cardIds: poolMatching((c) => c.stance === 'heart'),
    },
    {
        id: 'aggression',
        label: 'Aggression',
        description: 'All direct-damage cards across stances for raw burst testing.',
        cardIds: poolMatching((c) => c.verbClass === 'direct-damage'),
    },
    {
        id: 'attrition',
        label: 'Attrition (DoT)',
        description: 'Damage-over-time engines plus self-buff sustain for long-game testing.',
        cardIds: poolMatching((c) => c.effectKind === 'dot' || c.verbClass === 'buff-self'),
    },
    {
        id: 'control-guard',
        label: 'Control & Guard',
        description: 'Confusion/control plus every defensive GUARD card for stall testing.',
        cardIds: poolMatching((c) => c.effectKind === 'control' || c.verbClass === 'defend'),
    },
    {
        id: 'gold-showcase',
        label: 'Gold showcase',
        description: 'The three Gold rares plus tier-3 support — exercise the rare tier.',
        cardIds: poolMatching((c) => isGoldCard(c.id) || c.tier === 3),
    },
]);

function combatDeckPresetById(presetId: CombatDeckPresetId): CombatDeckPreset {
    const preset = COMBAT_DECK_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) throw new Error(`Unknown combat deck preset: ${presetId}`);
    return preset;
}

/**
 * Dev tool — swap the player's combat deck for a preset. Sets
 * `player.knownSkills` to the preset's card ids and clears earned
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
            player: { ...player, knownSkills: cardIds, combatRewardCards: [] },
        } as never);
    }
    return { presetId: preset.id, label: preset.label, cardIds };
}

/** How many random cards `randomizeCombatDeckAction` deals into the deck. */
const RANDOMIZE_CARD_COUNT = 8;

/**
 * Dev tool — rebuild the player's combat deck as a random selection from EVERY
 * defined combat card (starter skills + the full reward pool, gold rares
 * included), so dev sessions surface cards normal play rarely reaches. Replaces
 * `knownSkills` with the random unique pull and clears `combatRewardCards`.
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
            player: { ...player, knownSkills: granted, combatRewardCards: [] },
        } as never);
    }
    return granted;
}

// ---------------------------------------------------------------------------
// Starter bundles (deck identity) — the pre-run "choose your path" decks.
//
// A bundle is just a curated knownSkills deck (built from engine card metadata,
// exactly like the dev presets above) plus a HIDDEN archetype tag. The tag is
// never shown to the player; it biases combat-card rewards toward the kind of
// cards their chosen path wants (see `skewRewardsByArchetype`). Mobile invents
// no cards — every id comes from the engine's own pool.
// ---------------------------------------------------------------------------

export type StarterArchetype = 'bleeder' | 'guardian' | 'controller';

export interface StarterBundle {
    id: string;
    name: string;
    description: string;
    /** Hidden archetype tag — never surfaced in the UI. */
    archetype: StarterArchetype;
    /** Keyword pills shown on the selection tile. */
    pills: readonly string[];
    /** The seeded knownSkills deck (valid engine card ids). */
    cardIds: string[];
}

/** Persisted once the player picks (or is migrated past) a starter bundle. */
export const BUNDLE_CHOSEN_FLAG = 'starter-bundle-chosen';
const BUNDLE_FLAG_PREFIX = 'bundle:';
const ARCHETYPE_FLAG_PREFIX = 'archetype:';

// Build a playable level-1 deck: a themed core (≤ tier 2) plus an attack and a
// guard staple so every path can both threaten and survive, padded from the
// proven baseline starters so a thin category never yields a stub deck.
function bundleDeck(themed: (c: CombatCard) => boolean): string[] {
    const ids: string[] = [];
    const add = (id: string | undefined): void => { if (id && !ids.includes(id)) ids.push(id); };
    poolMatching((c) => themed(c) && c.tier <= 2).slice(0, 3).forEach(add);
    add(poolMatching((c) => c.verbClass === 'direct-damage' && c.tier === 1)[0]);
    add(poolMatching((c) => c.verbClass === 'defend' && c.tier === 1)[0]);
    for (const id of STARTER_DECK_IDS) { if (ids.length >= 5) break; add(id); }
    return ids;
}

export const STARTER_BUNDLES: readonly StarterBundle[] = Object.freeze([
    {
        id: 'bleeding-edge',
        name: 'The Bleeding Edge',
        description: 'Aggressive. Stack damage-over-time and erode the foe turn by turn.',
        archetype: 'bleeder',
        pills: ['BLEED', 'POISON', 'DoT'],
        cardIds: bundleDeck((c) => c.effectKind === 'dot'),
    },
    {
        id: 'patient-defender',
        name: 'The Patient Defender',
        description: 'Reactive. Absorb attacks, mend, and outlast the enemy.',
        archetype: 'guardian',
        pills: ['GUARD', 'REGENERATE', 'FORTIFY'],
        cardIds: bundleDeck((c) => c.verbClass === 'defend' || c.verbClass === 'buff-self'),
    },
    {
        id: 'minds-unraveling',
        name: "Mind's Unraveling",
        description: 'Control. Confuse, slow, and dominate the enemy mind.',
        archetype: 'controller',
        pills: ['CONFUSE', 'STUN', 'SLOW'],
        cardIds: bundleDeck((c) => c.effectKind === 'control'),
    },
]);

export function starterBundleById(id: string): StarterBundle | null {
    return STARTER_BUNDLES.find((b) => b.id === id) ?? null;
}

/** The starter bundle chosen this run (read from flags), or null. */
export function chosenStarterBundle(store: AppStore): StarterBundle | null {
    const flags = (store.getState() as unknown as GameState).flags ?? [];
    const tag = flags.find((f) => f.startsWith(BUNDLE_FLAG_PREFIX));
    return tag ? starterBundleById(tag.slice(BUNDLE_FLAG_PREFIX.length)) : null;
}

/** The hidden archetype tag for this run, or null. Drives the reward skew. */
export function runArchetype(store: AppStore): StarterArchetype | null {
    const flags = (store.getState() as unknown as GameState).flags ?? [];
    const tag = flags.find((f) => f.startsWith(ARCHETYPE_FLAG_PREFIX));
    return tag ? (tag.slice(ARCHETYPE_FLAG_PREFIX.length) as StarterArchetype) : null;
}

/**
 * Records the player's starter-bundle choice: seeds the bundle deck onto the
 * player (when one is loaded and skill-less), and persists the bundle + hidden
 * archetype tag + the "chosen" flag so the picker never re-shows. Seeding also
 * happens lazily at first combat via `ensureStarterSkills`, so a null/!loaded
 * player here is safe — the choice still rides the save as a flag.
 */
export function seedStarterBundleAction(store: AppStore, bundleId: string): void {
    const bundle = starterBundleById(bundleId);
    if (!bundle) return;
    const state = store.getState() as unknown as GameState;
    const flags = new Set(state.flags ?? []);
    flags.add(BUNDLE_CHOSEN_FLAG);
    flags.add(`${BUNDLE_FLAG_PREFIX}${bundle.id}`);
    flags.add(`${ARCHETYPE_FLAG_PREFIX}${bundle.archetype}`);
    const player = state.player;
    const patch: Record<string, unknown> = { flags: [...flags] };
    if (player && (player.knownSkills?.length ?? 0) === 0) {
        patch.player = { ...player, knownSkills: [...bundle.cardIds], combatRewardCards: [] };
    }
    store.setState(patch as never);
    try { store.getState().save(); } catch { /* persistence must not block the run */ }
}

/** Coarse archetype a reward card belongs to, from its engine metadata. */
function cardArchetypeOf(card: CombatCard | null | undefined): StarterArchetype | null {
    if (!card) return null;
    if (card.effectKind === 'dot') return 'bleeder';
    if (card.effectKind === 'control') return 'controller';
    if (card.verbClass === 'defend' || card.verbClass === 'buff-self') return 'guardian';
    return null;
}

/**
 * Bias a pool of reward ids ~60% toward the run's hidden archetype, returning
 * `n` ids. A no-op (first `n`, original order) when there is no archetype tag —
 * so non-bundle runs keep today's behaviour exactly.
 */
export function skewRewardsByArchetype(ids: string[], archetype: StarterArchetype | null, n: number): string[] {
    if (!archetype) return ids.slice(0, n);
    const match = ids.filter((id) => cardArchetypeOf(getCard(id)) === archetype);
    const rest = ids.filter((id) => !match.includes(id));
    const out: string[] = [];
    const add = (id: string): void => { if (!out.includes(id) && out.length < n) out.push(id); };
    match.slice(0, Math.min(match.length, Math.round(n * 0.6))).forEach(add);
    rest.forEach(add);
    match.forEach(add); // pad from any remaining matches if `rest` was short
    return out.slice(0, n);
}
