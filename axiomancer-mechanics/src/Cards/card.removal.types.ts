/**
 * Phase 52a — deck removal: the RESULT SHAPE.
 *
 * Removal is a transaction that can be REFUSED, and a refusal is a first-class
 * returned value — never a thrown string, never a silent no-op. The caller
 * (52c's rest-choice engine, 52d's picker screen) must be able to render the
 * reason verbatim without pattern-matching on prose, so a refusal carries BOTH
 * a stable machine `code` and a loud human `reason`.
 *
 * The result is a discriminated union on `ok`, so TypeScript narrows
 * `result.refusal` to non-null on the refusal arm and `null` on the success
 * arm. Both arms carry the same accounting fields (deck sizes, the removal
 * counter) so a UI can render the ledger without branching first.
 */

import type { Character } from '../Character/types';

/** Why a removal was refused. Stable ids — presentation maps these to copy. */
export type CardRemovalRefusalCode =
    /** The card is not in the combat deck `buildCombatDeck` would deal. */
    | 'not-in-deck'
    /** The deck is already at `MIN_COMBAT_DECK_SIZE`. Refused, never clamped. */
    | 'deck-at-floor';

/** The loud refusal. Present iff `CardRemovalResult.ok === false`. */
export interface CardRemovalRefusal {
    /** Stable machine code — switch on this, not on `reason`. */
    code: CardRemovalRefusalCode;
    /** Human-readable and loud. Safe to surface verbatim. */
    reason: string;
    /** The card the caller asked to remove. */
    cardId: string;
    /** Deck size the refusal was measured against. */
    deckSize: number;
    /** The floor in force (`MIN_COMBAT_DECK_SIZE`). */
    floor: number;
}

/**
 * Which list gave up the copy.
 *
 * - `'rewards'` — one copy left `combatRewardCards` (drained FIRST: rewards are
 *   the bloat the player is paying to undo).
 * - `'known'`   — the card base gave it up: the loadout dropped a slot and/or
 *   the id left `knownCards`. See `loadoutReconciled`.
 */
export type CardRemovalSource = 'rewards' | 'known';

/** Fields common to both arms — the ledger a UI renders either way. */
interface CardRemovalLedger {
    /** The card the caller asked to remove. */
    cardId: string;
    /** `buildCombatDeck` size before the attempt. */
    deckSizeBefore: number;
    /** `buildCombatDeck` size after the attempt (=== before on a refusal). */
    deckSizeAfter: number;
    /** `player.cardRemovals` AFTER the attempt (unchanged on a refusal). */
    removals: number;
    /** The floor in force. */
    floor: number;
}

/** A removal that happened. `player`/`flags` are new values — apply both. */
export interface CardRemovalAccepted extends CardRemovalLedger {
    ok: true;
    /** New character: one deck copy gone, `cardRemovals` incremented. */
    player: Character;
    /** New flags: loadout reconciled when it named the removed card. */
    flags: string[];
    removedFrom: CardRemovalSource;
    /** True when a `combat-loadout-card:` flag was dropped. */
    loadoutReconciled: boolean;
    refusal: null;
}

/** A removal that was refused. Nothing moved. */
export interface CardRemovalRefused extends CardRemovalLedger {
    ok: false;
    /** The SAME `Character` reference that was passed in — provably untouched. */
    player: Character;
    /** A copy of the flags passed in — provably unreconciled. */
    flags: string[];
    removedFrom: null;
    loadoutReconciled: false;
    refusal: CardRemovalRefusal;
}

/** The return of `removeCardFromCombatDeck`. Narrow on `ok`. */
export type CardRemovalResult = CardRemovalAccepted | CardRemovalRefused;
