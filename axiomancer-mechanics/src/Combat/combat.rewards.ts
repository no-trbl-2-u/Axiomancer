/**
 * Spec 26b deckbuilder — combat card rewards + the card-unlock hook.
 *
 * Two distinct progression levers (per the design):
 *   1. CARD REWARDS (frequent, after a won combat) grow the DECK — extra copies
 *      and variety. They append to `Character.combatRewardCards`, which
 *      `buildCombatDeck` stacks on top of the learned-card baseline.
 *   2. CARD UNLOCKS (rare, via ethical-dilemma events — not implemented yet)
 *      add a NEW card type. `unlockCardViaDilemma` is the hook those events will
 *      call; it bypasses the normal learning requirements (the dilemma IS the
 *      gate), unlike `learnCard`.
 *
 * Pure: rolling takes an explicit `rng`. The mobile aftermath offers the 1-of-N
 * and persists the pick.
 */

import type { Character } from '../Character/types';
import { cardLibrary, getCardById } from '../Cards/cards.library';
import { rankToRarity } from '../Cards/types';
import { CARD_THEMES, THEME_KEYWORDS, type CardTheme } from '../Cards/card-themes';
import { cardComplexity } from './combat.card-complexity';

/** Themes that are never offered: enemy-injected junk, and the grey office
 *  (Phase 104 — the starters a run opens with are not something it earns). */
const UNOFFERABLE_THEMES: ReadonlySet<CardTheme> = new Set<CardTheme>(['curse', 'grey']);

/** True when a card's theme may sit on the reward screen. */
function isOfferableTheme(theme: CardTheme | undefined): boolean {
    return theme !== undefined && !UNOFFERABLE_THEMES.has(theme);
}

/**
 * The card-reward pool — the Profane Canon: the whole library EXCEPT the
 * curse class (theme `'curse'` cards are enemy-injected junk — offering one
 * as a reward would be a cruelty the reward screen does not stock) and the
 * grey office (Phase 104 — never a reward). Drop odds are governed by
 * PER-RARITY weights: common cards drop freely, uncommons less, rares are
 * the prize. Invalid ids are filtered at roll time so the list stays safe to
 * edit.
 */
export const COMBAT_REWARD_POOL: readonly string[] = Object.freeze(
    cardLibrary.filter(card => isOfferableTheme(card.theme)).map(card => card.id),
);

/** Per-rarity drop weights (spec 32 v3 §4 — the reward-roll lever). Tunable. */
export const REWARD_RARITY_WEIGHTS: Readonly<Record<'common' | 'uncommon' | 'rare', number>> =
    Object.freeze({ common: 1, uncommon: 0.5, rare: 0.2 });

/**
 * The cards a brand-new player starts with — THE GREY OFFICE (Phase 104,
 * T's ruling 2026-09-20): ten copies of two colourless shapes, 7 STRIKE
 * (`grey-strike`: deal 2 free / 5 paid) and 3 WARD (`grey-ward`: GUARD 2
 * free / 5 paid). A grey card (`philosophicalAspect: 'any'`) is powered by
 * ANY die, so the colour law never blocks a fight-one play and the deck
 * teaches STRIKE, WARD, FREE-vs-PAID and the die spend with zero colour
 * arithmetic. The mobile bootstrap writes this list VERBATIM into a new
 * character's `knownCards` (copies kept — `buildCombatDeck` deals one copy
 * per entry). The deck's identity comes from the rewards it takes.
 *
 * History: 2026-09-05 → 2026-09-20 this was the four Threadbare starters
 * (`spoiled-poultice`, `chilblain-watch`, `first-spadeful`, `thin-hymn`), one
 * per colour, so a heart or mind die always had something legal to power —
 * a constraint the grey office satisfies trivially.
 */
export const STARTING_CARD_IDS: readonly string[] = Object.freeze([
    ...Array.from({ length: 7 }, () => 'grey-strike'),
    ...Array.from({ length: 3 }, () => 'grey-ward'),
]);

/** The grey office's shape, for the tests and the docs that pin it. */
export const GREY_OFFICE_SHAPE = Object.freeze({ strike: 7, ward: 3 });

/** The single OFFENSIVE card a brand-new player starts with. Kept for
 *  back-compat; prefer `STARTING_CARD_IDS` (which also grants a defense card). */
export const STARTING_CARD_ID = 'grey-strike';

/**
 * A valid reward-pool entry must resolve to a real card. `extraPool` (WS6.2 —
 * the sandbox-injection hook) appends extra candidate ids to the library pool:
 * sandbox cards must be REGISTERED (`applySandboxSet` / `registerSandboxCards`)
 * before rolling, or the resolve filter silently drops them — the same law the
 * base pool lives under. Duplicates of library ids are ignored (the pool stays
 * distinct).
 */
function validPool(extraPool: readonly string[] = []): string[] {
    const merged = [...COMBAT_REWARD_POOL];
    for (const id of extraPool) {
        if (!merged.includes(id)) merged.push(id);
    }
    // The curse / grey filter is a POOL law, not a library law: an `extraPool`
    // injection must not smuggle deck contamination (or a starter) onto the
    // reward screen. A themeless (sandbox) card stays offerable.
    return merged.filter(id => {
        const card = getCardById(id);
        return !!card && (card.theme === undefined || isOfferableTheme(card.theme));
    });
}

// ---------------------------------------------------------------------------
// THEME-AWARE DRAFT (2026-08-08) — replaces the archetype skew.
//
// The old lever read the player's dominant `philosophicalAspect` and doubled
// the weight of matching cards. It was blunt (three coarse aspects over a
// six-theme canon) and, on the neutral Threadbare Office, it did nothing at
// all. The new lever reads the deck the player is ACTUALLY PLAYING — the
// union of `knownCards` + `combatRewardCards`, tallied by `Card.theme` — and
// pulls offers toward the themes that deck already leans on.
//
// The pull is deliberately incomplete. Every offer slot first rolls its
// ALLEGIANCE: `REWARD_OFF_THEME_RATE` of slots are OFF-THEME, and an off-theme
// slot weights themes by the COMPLEMENT of their deck share, so the themes the
// deck plays LEAST are the likeliest off-theme draw. That is the pivot path:
// trial and choir are the thinnest seats in every campaign preset (the
// Apostate deck holds zero trial and one choir card), so the off-theme slot is
// how a player ever gets shown that door. Deepen a build, never lock it.
// ---------------------------------------------------------------------------

/** Every theme a reward may belong to — the canon minus the curse class and
 *  the grey office. */
export type RewardTheme = Exclude<CardTheme, 'curse' | 'grey'>;

/** The offerable themes, in canon order. */
export const REWARD_THEMES: readonly RewardTheme[] = Object.freeze(
    CARD_THEMES.filter((t): t is RewardTheme => !UNOFFERABLE_THEMES.has(t)),
);

/**
 * Phase 104 — how many reward cards a run must have TAKEN before the draft
 * starts leaning. While `combatRewardCards` holds fewer than this, every slot
 * is UNIFORM over the pool: no theme share, no rarity weight, no guaranteed
 * slot — a free look at the canon (T's ruling 2026-09-20). Counted by cards
 * actually taken, so a SKIP does not advance it. A DESIGN lever.
 */
export const REWARD_RANDOM_PICKS = 3;

/**
 * The share of offer slots rolled OFF-THEME — the run's pivot rate, and a
 * DESIGN lever, not a mechanical one.
 *
 * At 0.35, a standard 3-offer screen expects ~1.05 off-theme offers and shows
 * at least one 72.5% of the time (1 − 0.65³), while ~2 of every 3 offers still
 * deepen what the deck already plays. Raising it makes runs pivot constantly;
 * dropping it below ~0.2 closes the trial/choir door on a committed deck.
 */
export const REWARD_OFF_THEME_RATE = 0.35;

/** A reward candidate's theme, or `null` for a themeless (e.g. sandbox) card
 *  or one whose theme is never offered (curse, grey). */
function themeOf(id: string): RewardTheme | null {
    const theme = getCardById(id)?.theme;
    return theme && isOfferableTheme(theme) ? (theme as RewardTheme) : null;
}

/**
 * Phase 104 — the keywords a card carries, as the face prints them: every
 * caps run on the PAID / persistent line plus the verbs its riders imply
 * (`cardComplexity`'s vocabulary read — one derivation, shared with the
 * complexity report, so the pull and the report never disagree about what a
 * card "has"). Empty for an unknown id.
 */
export function cardKeywords(id: string): readonly string[] {
    const card = getCardById(id);
    return card ? cardComplexity(card).keywords : [];
}

/**
 * Phase 104 — the theme the deck plays MOST, or `null` while every count is
 * 0. Ties resolve in `REWARD_THEMES` (canon) order. Reads the same tally the
 * theme pull does (`deckThemeCounts`: `knownCards` + `combatRewardCards`), so
 * after three taken rewards a leader exists whenever any of them had a theme.
 */
export function dominantTheme(player: Character): RewardTheme | null {
    const counts = deckThemeCounts(player);
    let best: RewardTheme | null = null;
    for (const t of REWARD_THEMES) {
        if (counts[t] > 0 && (best === null || counts[t] > counts[best])) best = t;
    }
    return best;
}

/** True when `id` carries at least one keyword of `theme`'s family. */
function carriesFamilyKeyword(id: string, theme: RewardTheme): boolean {
    const family = THEME_KEYWORDS[theme];
    return cardKeywords(id).some(k => family.includes(k));
}

/**
 * How many cards of each theme the player's ACTUAL DECK plays — the union of
 * learned cards and earned reward cards (duplicates count: four copies of a
 * rot common IS a rot deck). Curse contamination is excluded; it is never
 * offerable, so letting it hold share would only waste weight mass.
 */
export function deckThemeCounts(player: Character): Record<RewardTheme, number> {
    const counts = Object.fromEntries(REWARD_THEMES.map(t => [t, 0])) as Record<RewardTheme, number>;
    for (const id of [...(player.knownCards ?? []), ...(player.combatRewardCards ?? [])]) {
        const theme = themeOf(id);
        if (theme) counts[theme] += 1;
    }
    return counts;
}

/**
 * The deck's theme SHARES (each theme's fraction of the themed deck; they sum
 * to 1). An all-themeless or empty deck reads as all-zero — the roll then
 * treats every theme as equally on-theme, which is the honest answer for a
 * player who has not committed to anything yet.
 */
export function deckThemeShares(player: Character): Record<RewardTheme, number> {
    const counts = deckThemeCounts(player);
    const total = REWARD_THEMES.reduce((sum, t) => sum + counts[t], 0);
    const shares = Object.fromEntries(REWARD_THEMES.map(t => [t, 0])) as Record<RewardTheme, number>;
    if (total === 0) return shares;
    for (const t of REWARD_THEMES) shares[t] = counts[t] / total;
    return shares;
}

/** Picks an index from `weights` with probability proportional to weight. */
function weightedIndex(weights: number[], roll: number): number {
    const total = weights.reduce((a, b) => a + b, 0);
    if (total <= 0) return -1;
    let r = roll * total;
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

/**
 * Rolls `count` distinct card-reward offers after a won combat. Pure — every
 * decision is seeded by `rng`, so the same (player, seed, count) always yields
 * the same offers.
 *
 * Phase 104 — THREE REGIMES, by how many reward cards the run has TAKEN
 * (`combatRewardCards.length`, so a SKIP advances nothing):
 *
 *   1. Fewer than `REWARD_RANDOM_PICKS` (3): UNIFORM. Every slot is one `rng`
 *      draw over the remaining pool — no theme share, no rarity weight, no
 *      guarantee. The first three rewards are a free look at the canon.
 *   2. Three or more, deck still uncommitted (every theme count 0 — only
 *      possible with themeless sandbox rewards): the theme-aware roll below,
 *      which reads an all-zero deck as uniform-by-theme.
 *   3. Three or more with a leader: slot 0 is the GUARANTEED slot — drawn,
 *      rarity-weighted, from the pool cards that carry at least one keyword
 *      of the dominant theme's family (`THEME_KEYWORDS`, `dominantTheme`).
 *      It spends ONE `rng` draw. If no remaining card qualifies, the slot
 *      falls through to the plain roll — never an empty offer, never a throw.
 *      Slots 1..n keep the theme-aware roll.
 *
 * The theme-aware roll (2026-08-08): each slot spends exactly three `rng`
 * draws — allegiance (`REWARD_OFF_THEME_RATE`), theme by deck share, card by
 * rarity (`REWARD_RARITY_WEIGHTS`, applied WITHIN the chosen theme so the two
 * levers stay independent).
 *
 * `extraPool` (WS6.2) injects extra candidate ids — the sandbox measurement
 * hook: registered sandbox cards can compete at the reward screen without
 * touching the pinned `COMBAT_REWARD_POOL`. Unregistered ids are dropped by
 * the resolve filter, never offered.
 */
export function rollCombatCardRewards(
    player: Character,
    rng: () => number,
    count = 3,
    extraPool: readonly string[] = [],
): string[] {
    const remaining = validPool(extraPool);
    const offers: string[] = [];
    const take = (pick: string): void => {
        offers.push(pick);
        remaining.splice(remaining.indexOf(pick), 1);
    };

    // Regime 1 — the first three rewards taken are a uniform look at the canon.
    const taken = (player.combatRewardCards ?? []).length;
    if (taken < REWARD_RANDOM_PICKS) {
        while (offers.length < count && remaining.length > 0) {
            take(remaining[Math.min(remaining.length - 1, Math.floor(rng() * remaining.length))]);
        }
        return offers;
    }

    const shares = deckThemeShares(player);
    const rarityWeights = (ids: readonly string[]): number[] =>
        ids.map(id => REWARD_RARITY_WEIGHTS[rankToRarity(getCardById(id)?.rank ?? 1)]);

    // Regime 3 — slot 0 guarantees the dominant family a seat.
    const lead = dominantTheme(player);
    if (lead !== null && count > 0 && remaining.length > 0) {
        const family = remaining.filter(id => carriesFamilyKeyword(id, lead));
        if (family.length > 0) {
            const idx = weightedIndex(rarityWeights(family), rng());
            take(family[idx >= 0 ? idx : 0]);
        }
    }

    // Regime 2 / the rest of regime 3 — the theme-aware roll.
    while (offers.length < count && remaining.length > 0) {
        const offTheme = rng() < REWARD_OFF_THEME_RATE;
        // Only themes that still have a candidate left may be drawn — an
        // exhausted theme must not silently eat a slot.
        const live = REWARD_THEMES.filter(t => remaining.some(id => themeOf(id) === t));
        // On-theme weight IS the deck share; off-theme weight is its
        // complement, so the least-played themes lead the pivot draw. An
        // uncommitted deck (all shares 0) reads as uniform either way.
        const themeWeights = live.map(t => (offTheme ? 1 - shares[t] : shares[t]));
        const themeIdx = weightedIndex(themeWeights, rng());
        // Fallbacks: no live theme (only themeless candidates left), or an
        // on-theme draw whose whole weight mass is zero. Both resolve against
        // the full remaining pool rather than dropping the offer.
        const theme = themeIdx >= 0 ? live[themeIdx] : null;
        const candidates = theme === null ? remaining : remaining.filter(id => themeOf(id) === theme);
        const cardIdx = weightedIndex(rarityWeights(candidates), rng());
        take(candidates[cardIdx >= 0 ? cardIdx : 0]);
    }
    return offers;
}

/** Appends a chosen reward card to the player's persistent deck collection. */
export function addRewardCard(player: Character, cardId: string): Character {
    return { ...player, combatRewardCards: [...(player.combatRewardCards ?? []), cardId] };
}

/**
 * Spec 26b §D — unlock a NEW card from an ethical-dilemma event. Bypasses the
 * normal `learnCard` requirement gates (level/stat/prereq) because the dilemma
 * choice is itself the gate. No-op (same ref) when already known or unknown id.
 * The dilemma EVENTS are not implemented yet; this is the hook they will call.
 */
export function unlockCardViaDilemma(player: Character, cardId: string): Character {
    if (player.knownCards.includes(cardId)) return player;
    if (!getCardById(cardId)) return player;
    return { ...player, knownCards: [...player.knownCards, cardId] };
}
