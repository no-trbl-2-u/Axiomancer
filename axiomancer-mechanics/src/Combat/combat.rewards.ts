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
import { cardKeywords } from '../Cards/card-keywords';

/**
 * The card-reward pool — the Profane Canon: the whole library EXCEPT the
 * curse class (theme `'curse'` cards are enemy-injected junk — offering one
 * as a reward would be a cruelty the reward screen does not stock) and the
 * grey office (Phase 104 — a starter-only shape, never a reward). Drop
 * odds are governed by PER-RARITY weights: common cards drop freely,
 * uncommons less, rares are the prize. Invalid ids are filtered at roll time
 * so the list stays safe to edit.
 */
export const COMBAT_REWARD_POOL: readonly string[] = Object.freeze(
    cardLibrary.filter(card => card.theme !== 'curse' && card.theme !== 'grey').map(card => card.id),
);

/** Per-rarity drop weights (spec 32 v3 §4 — the reward-roll lever). Tunable. */
export const REWARD_RARITY_WEIGHTS: Readonly<Record<'common' | 'uncommon' | 'rare', number>> =
    Object.freeze({ common: 1, uncommon: 0.5, rare: 0.2 });

/**
 * Phase 104 (the grey office) — every brand-new player's opening 10-card
 * deck: two colourless shapes (`philosophicalAspect: 'any'` — every die
 * colour powers either), so fight one teaches STRIKE, WARD, FREE-vs-PAID, and
 * the die-spend loop with zero colour arithmetic. Mobile's
 * `ensureStarterCards` writes this list VERBATIM (copies kept — 7 + 3, not
 * deduplicated) into a fresh character's `knownCards`.
 *
 * (Superseded history: 2026-07-through-2026-09-19 this was
 * `spoiled-poultice` + `chilblain-watch` + `first-spadeful` + `thin-hymn` —
 * one card per stance colour, because a card back then always had a fixed
 * colour and a colour-blind starter deck left a stance's die with nothing
 * legal to power. THE COLOUR LAW AT THE STARTER GATE playthrough report
 * (2026-09-05) is what that fix answered. The grey office's 'any' aspect
 * makes the whole problem moot — there is no colour left to fail to cover —
 * so the starting set no longer needs to span the three stances itself.)
 */
export const STARTING_CARD_IDS: readonly string[] = Object.freeze([
    'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
    'grey-strike', 'grey-strike', 'grey-strike',
    'grey-ward', 'grey-ward', 'grey-ward',
]);

/** Fewer than this many reward cards taken ⇒ the draft is fully uniform (no
 *  allegiance roll, no theme weighting, no rarity weighting, no guaranteed
 *  slot). Counted by cards actually TAKEN (`combatRewardCards.length`), not
 *  drafts shown — a SKIP does not advance it. See `rollCombatCardRewards`. */
export const REWARD_RANDOM_PICKS = 3;

/** The single OFFENSIVE card a brand-new player starts with. Kept for
 *  back-compat; prefer `STARTING_CARD_IDS` (which also grants a defense card). */
export const STARTING_CARD_ID = 'spoiled-poultice';

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
    // The curse filter is a POOL law, not a library law: an `extraPool`
    // injection must not smuggle deck contamination onto the reward screen.
    return merged.filter(id => {
        const card = getCardById(id);
        return !!card && card.theme !== 'curse';
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
 *  the grey office (Phase 104 — the grey starters are never a reward). */
export type RewardTheme = Exclude<CardTheme, 'curse' | 'grey'>;

/** The offerable themes, in canon order. */
export const REWARD_THEMES: readonly RewardTheme[] = Object.freeze(
    CARD_THEMES.filter((t): t is RewardTheme => t !== 'curse' && t !== 'grey'),
);

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

/** A reward candidate's theme, or `null` for a themeless (e.g. sandbox) card. */
function themeOf(id: string): RewardTheme | null {
    const theme = getCardById(id)?.theme;
    return theme && theme !== 'curse' && theme !== 'grey' ? theme : null;
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

/** Rarity-weighted pick from `candidates` (assumed non-empty). */
function rarityWeightedPick(candidates: readonly string[], rng: () => number): string {
    const cardWeights = candidates.map(id => REWARD_RARITY_WEIGHTS[rankToRarity(getCardById(id)?.rank ?? 1)]);
    const cardIdx = weightedIndex(cardWeights, rng());
    return candidates[cardIdx >= 0 ? cardIdx : 0];
}

/** The existing theme-aware allegiance roll for one slot (assumed non-empty `remaining`). */
function allegianceRoll(remaining: readonly string[], shares: Record<RewardTheme, number>, rng: () => number): string {
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
    return rarityWeightedPick(candidates, rng);
}

/**
 * The deck's DOMINANT theme (Phase 104) — the highest `deckThemeCounts`
 * entry, ties resolved in `REWARD_THEMES` canon order; `null` when every
 * count is 0 (an uncommitted deck earns no guarantee).
 */
function dominantTheme(player: Character): RewardTheme | null {
    const counts = deckThemeCounts(player);
    let best: RewardTheme | null = null;
    for (const t of REWARD_THEMES) {
        if (counts[t] > 0 && (best === null || counts[t] > counts[best])) best = t;
    }
    return best;
}

/**
 * Rolls `count` distinct card-reward offers after a won combat. Pure — every
 * decision is seeded by `rng`, so the same (player, seed, count) always
 * yields the same offers.
 *
 * Two regimes, gated on how many reward cards the player has already TAKEN
 * (`combatRewardCards.length`, not drafts shown — a SKIP never advances it):
 *
 *   - Fewer than `REWARD_RANDOM_PICKS`: every slot is a flat uniform draw
 *     over the whole pool — no allegiance roll, no theme weighting, no
 *     rarity weighting, no guaranteed slot. The first few rewards a player
 *     ever sees are a free, unbiased look at the canon.
 *   - `REWARD_RANDOM_PICKS` or more: slot 0 is GUARANTEED to carry a keyword
 *     from the deck's dominant theme family (`keywordsOf`, `Cards/index.ts`)
 *     when one exists (empty candidate pool falls through to the ordinary
 *     roll for that slot — never an empty offer, never a throw); every other
 *     slot keeps the existing theme-aware allegiance roll (drafted toward the
 *     themes the player's deck already plays, with a real off-theme pivot —
 *     see `REWARD_OFF_THEME_RATE`).
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

    if ((player.combatRewardCards ?? []).length < REWARD_RANDOM_PICKS) {
        while (offers.length < count && remaining.length > 0) {
            const idx = Math.min(Math.floor(rng() * remaining.length), remaining.length - 1);
            const pick = remaining[idx];
            offers.push(pick);
            remaining.splice(idx, 1);
        }
        return offers;
    }

    const shares = deckThemeShares(player);
    const dominant = dominantTheme(player);
    let slot = 0;
    while (offers.length < count && remaining.length > 0) {
        let pick: string | undefined;
        if (slot === 0 && dominant !== null) {
            const family = THEME_KEYWORDS[dominant];
            const guaranteed = remaining.filter(id => {
                const card = getCardById(id);
                return !!card && cardKeywords(card).some(kw => family.includes(kw));
            });
            if (guaranteed.length > 0) pick = rarityWeightedPick(guaranteed, rng);
        }
        if (pick === undefined) pick = allegianceRoll(remaining, shares, rng);
        offers.push(pick);
        remaining.splice(remaining.indexOf(pick), 1);
        slot++;
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
