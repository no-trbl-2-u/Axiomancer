/**
 * Spec 25 — Hazard-Pattern Combat: card deck (§4.3, §8).
 *
 * Mirrors the Hazard deck-management pattern (`src/World/Hazard/hazard.engine`
 * `drawFromPile` / `refillPile`): Fisher-Yates shuffle, draw-up-to-N, and
 * reshuffle-the-discard when the draw pile runs dry. The Hazard engine threads
 * its own `HazardRngState`; combat threads the seedable global RNG singleton so
 * dice, deck, and card procs share one reproducible stream (hermetic via
 * `mockFixedRng` / `setSeed`).
 *
 * The player's combat deck is built from their learned cards (§4.3). There is
 * no in-combat escape card — once a fight is joined it resolves only by
 * winning or losing. Every character preset grants a starting kit of cards
 * (`TIER_1_CARDS`), so a real player never reaches combat with an empty
 * deck; the always-available `Signature Skills` kit (`combat.signature.ts`,
 * funded by Conviction, independent of the drawn hand) is the real fallback
 * action space regardless of deck contents.
 */

import { getRng } from '../Utils/rng';
import type { Character } from '../Character/types';
import { getCombatLoadout } from './combat.loadout';

/** Hand-size target. The opening hand draws this many; every round boundary
 *  REFILLS the hand up to this target (keep-hand rule, 2026-07-13): unplayed
 *  cards stay in hand and occupy draw room, so holding a card is a real cost —
 *  a dead card clogs the hand until it is played or scrapped, instead of being
 *  silently recycled by a full redraw. (Replaces the spec 26b "draw 6 fresh"
 *  rule.) */
export const COMBAT_HAND_SIZE = 5;

const defaultRng = (): number => getRng().random();

/** Fisher–Yates shuffle over the global/explicit `() => number` RNG. Pure. */
export function shuffleCombatDeck<T>(items: readonly T[], rng: () => number = defaultRng): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.min(i, Math.floor(rng() * (i + 1)));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/**
 * Builds the player's combat deck from the curated loadout (Phase 169) when
 * `flags` contains loadout entries, or falls back to the full `knownCards`
 * list for backwards compatibility with saves that pre-date Phase 169.
 *
 * Card ids are card ids (kebab-case). Reward cards stack on top of the card
 * base. No escape card is appended — see the file header.
 *
 * COPIES ARE REAL, IN BOTH LISTS (playthrough report 2026-09-05). This
 * function used to DE-DUPLICATE the card base, so however many times the base
 * named an id it contributed exactly one deck copy. That silently destroyed
 * every authored copy count in the shipped data: the mobile starter-bundle
 * path writes a campaign preset's recipe into `knownCards` verbatim, 3x copies
 * and all, so the 18-card Threadbare Office was dealt as an 8-card deck (and
 * the 45-card Apostate Canon as 30). An 8-card deck reshuffles inside a single
 * round — which is what made every fight deal the same few cards — and it sat
 * BELOW `MIN_COMBAT_DECK_SIZE` (then 12; now 10), so deck removal refused every request
 * with `deck-at-floor`. A deckbuilder's copy counts are load-bearing; the base
 * now keeps them, exactly as the reward list always has.
 *
 * Order is preserved from both lists, so opening hands still deal from an
 * authored order before the shuffle touches them.
 *
 * @param player - Character whose `knownCards` / `combatRewardCards` supply the base.
 * @param flags  - `GameState.flags` — when non-empty loadout flags are present
 *                 the curated list is used instead of all `knownCards`.
 */
export function buildCombatDeck(player: Character, flags?: readonly string[]): string[] {
    const loadout = flags && flags.length > 0 ? getCombatLoadout(flags) : [];
    const base = loadout.length > 0 ? loadout : (player.knownCards ?? []);
    // The card base keeps its copies (see the note above) and its order.
    const deck: string[] = [...base];
    // Spec 26b deckbuilder — reward cards stack on top (DUPLICATES kept: extra
    // copies are the whole point of a deckbuilder pickup).
    for (const id of player.combatRewardCards ?? []) deck.push(id);
    return deck;
}

export interface DrawResult {
    drawn: string[];
    drawPile: string[];
    discard: string[];
}

/**
 * Draws up to `n` cards from `drawPile`. When the pile runs dry, the discard is
 * shuffled back in (reshuffle-discard-on-empty — same as Hazard). The full
 * `deck` is the fallback shuffle source when both pile and discard are empty
 * (so a tiny deck never starves the hand).
 */
export function drawCombatCards(
    drawPile: readonly string[],
    discard: readonly string[],
    deck: readonly string[],
    n: number,
    rng: () => number = defaultRng,
): DrawResult {
    let pile = drawPile.slice();
    let disc = discard.slice();
    const drawn: string[] = [];
    for (let i = 0; i < n; i++) {
        if (pile.length === 0) {
            // Reshuffle the discard; if that is also empty, reshuffle the whole deck.
            const source = disc.length > 0 ? disc : deck;
            if (source.length === 0) break;
            pile = shuffleCombatDeck(source, rng);
            disc = [];
        }
        drawn.push(pile.shift() as string);
    }
    return { drawn, drawPile: pile, discard: disc };
}
