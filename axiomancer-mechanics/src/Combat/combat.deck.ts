/**
 * Spec 25 — Hazard-Pattern Combat: card deck (§4.3, §8).
 *
 * Mirrors the Hazard deck-management pattern (`src/World/Hazard/hazard.engine`
 * `drawFromPile` / `refillPile`): Fisher-Yates shuffle, draw-up-to-N, and
 * reshuffle-the-discard when the draw pile runs dry. The Hazard engine threads
 * its own `HazardRngState`; combat threads the seedable global RNG singleton so
 * dice, deck, and skill procs share one reproducible stream (hermetic via
 * `mockFixedRng` / `setSeed`).
 *
 * The player's combat deck is built from their learned skills (§4.3). There is
 * no in-combat escape card — once a fight is joined it resolves only by
 * winning or losing. Every character preset grants a starting kit of skills
 * (`TIER_1_SKILLS`), so a real player never reaches combat with an empty
 * deck; the always-available `Signature Skills` kit (`combat.signature.ts`,
 * funded by Conviction, independent of the drawn hand) is the real fallback
 * action space regardless of deck contents.
 */

import { getRng } from '../Utils/rng';
import type { Character } from '../Character/types';
import { getCombatLoadout } from './combat.loadout';

/** Cards drawn at the start of every threat phase. Spec 26b hazard-combat tuning:
 *  raised 5→6 so a phase (fought with ONE hand) can assemble a genuine multi-card
 *  solution instead of being decided by raw draw luck — directly serves the
 *  anti-single-card-spam / "assembled solution" doctrine. */
export const COMBAT_HAND_SIZE = 6;

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
 * Card ids are skill ids (kebab-case). Reward cards stack on top of the skill
 * base. No escape card is appended — see the file header.
 *
 * @param player - Character whose `knownCards` / `combatRewardCards` supply the base.
 * @param flags  - `GameState.flags` — when non-empty loadout flags are present
 *                 the curated list is used instead of all `knownCards`.
 */
export function buildCombatDeck(player: Character, flags?: readonly string[]): string[] {
    const loadout = flags && flags.length > 0 ? getCombatLoadout(flags) : [];
    const known = loadout.length > 0 ? loadout : (player.knownCards ?? []);
    // De-dup the skill base; preserve order so opening hands feel authored.
    const seen = new Set<string>();
    const deck: string[] = [];
    for (const id of known) {
        if (!seen.has(id)) { seen.add(id); deck.push(id); }
    }
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
