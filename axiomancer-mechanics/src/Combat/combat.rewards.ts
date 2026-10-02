/**
 * Deckbuilder — combat card rewards + the card-unlock hook.
 *
 * Two distinct progression levers (per the design):
 *   1. CARD REWARDS (frequent, after a won combat) grow the DECK — extra copies
 *      and variety. They append to `Character.combatRewardCards`, which
 *      `buildCombatDeck` stacks on top of the learned-card baseline.
 *   2. CARD UNLOCKS (rare, via ethical-dilemma events) add a NEW card type.
 *      `unlockCardViaDilemma` is the hook those events call; it bypasses the
 *      normal learning requirements (the dilemma IS the gate), unlike
 *      `learnCard`. It has no live caller.
 *
 * Pure: rolling takes an explicit `rng`. The mobile aftermath offers the 1-of-N
 * and persists the pick.
 */

import type { Character } from '../Character/types';
import { cardLibrary, getCardById } from '../Cards/cards.library';

/**
 * The card-reward pool: the whole library. The grey office IS the pool: a won fight offers A Plain Blow, Ward and Word,
 * and the pool grows as guided sessions add cards.
 */
export const COMBAT_REWARD_POOL: readonly string[] = Object.freeze(
    cardLibrary.map(card => card.id),
);

/**
 * The grey office — every brand-new player's opening 10-card
 * deck: three colourless shapes (`color: 'any'` — every die
 * colour powers each), so fight one teaches STRIKE, WARD, FREE-vs-PAID, and
 * the die-spend loop with zero colour arithmetic: Blow 5, Ward 3, and 2 of
 * A Plain Word.
 *
 * `ensureStarterCards` writes this list VERBATIM (copies kept — 5 + 3 + 2, not
 * deduplicated) into a fresh character's `knownCards`, and every sim and
 * playtest deck is this list.
 */
export const STARTING_CARD_IDS: readonly string[] = Object.freeze([
    'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike', 'grey-strike',
    'grey-ward', 'grey-ward', 'grey-ward',
    'grey-word', 'grey-word',
]);

/**
 * Rolls `count` distinct card-reward offers after a won combat: a uniform
 * draw over {@link COMBAT_REWARD_POOL}. Pure: every decision is seeded by
 * `rng`, so the same seed always yields the same offers. There is no theme
 * pull, keyword guarantee or rarity weighting: all three grey cards share
 * one rank.
 */
export function rollCombatCardRewards(
    _player: Character,
    rng: () => number,
    count = 3,
): string[] {
    const remaining = COMBAT_REWARD_POOL.filter(id => !!getCardById(id));
    const offers: string[] = [];
    while (offers.length < count && remaining.length > 0) {
        const idx = Math.min(Math.floor(rng() * remaining.length), remaining.length - 1);
        offers.push(remaining[idx]);
        remaining.splice(idx, 1);
    }
    return offers;
}

/** Appends a chosen reward card to the player's persistent deck collection. */
export function addRewardCard(player: Character, cardId: string): Character {
    return { ...player, combatRewardCards: [...(player.combatRewardCards ?? []), cardId] };
}

/**
 * Unlock a NEW card from an ethical-dilemma event. Bypasses the
 * normal `learnCard` requirement gates (level/stat/prereq) because the dilemma
 * choice is itself the gate. No-op (same ref) when already known or unknown id.
 * It has no live caller.
 */
export function unlockCardViaDilemma(player: Character, cardId: string): Character {
    if (player.knownCards.includes(cardId)) return player;
    if (!getCardById(cardId)) return player;
    return { ...player, knownCards: [...player.knownCards, cardId] };
}
