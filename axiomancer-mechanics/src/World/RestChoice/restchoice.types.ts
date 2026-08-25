/**
 * Rest-choice encounter (Phase 52c; anvil offer dropped Phase 59) — engine
 * types.
 *
 * A rest node is one irreversible choice of two: `rest` (free, flat-25%
 * heal) or `cut` (paid, composes `Cards/card.removal` for ONE deck
 * removal). Two-way like every minigame here: the engine never reads
 * `GameState`, and the host settles the outcome ledger against the real
 * `Character` at claim time — including the actual
 * `removeCardFromCombatDeck` call, which needs the full card-base/reward-list
 * accounting this engine does not carry.
 */

import type { SeedInput } from '../seed';
import type { RestShelter } from '../MapEvents/types';

export type { RestShelter };

/** The two offers on the table. Exactly one may be committed. */
export type RestChoiceOfferId = 'rest' | 'cut';

/** One offer's price + loud affordability. */
export interface RestChoiceOffer {
    id: RestChoiceOfferId;
    cost: number;
    disabledReason?: string;
}

export type RestChoicePhase =
    | 'offer'      // two offers on the table
    | 'cut-pick'   // choosing a card to remove
    | 'outcome'    // the settled ledger
    | 'done';      // host claimed

/** The claim-time ledger. Narrow on `chosen` for the fields that apply. */
export interface RestChoiceOutcome {
    chosen: RestChoiceOfferId;
    /** Vitae healed (0 unless `chosen === 'rest'`). Never overheals past maxHealth. */
    healed: number;
    /** Currency the host should deduct (0 for `rest`). */
    spent: number;
    /**
     * The card id the host should pass to `removeCardFromCombatDeck` —
     * non-null iff `chosen === 'cut'`. The engine does not perform the
     * removal itself (see module header); it only names the card.
     */
    removedCardId: string | null;
    /** `Character.cardRemovals` the host should write — incremented iff `chosen === 'cut'`. */
    removals: number;
}

export interface RestChoiceSession {
    phase: RestChoicePhase;
    /** Authored shelter class (Phase 52b) — kept for the inn scar-mend (unrelated to the flat rest heal). */
    shelter: RestShelter;
    maxHealth: number;
    health: number;
    currency: number;
    /** `buildCombatDeck(player, flags)` output — the cut picker's choices. */
    deckCardIds: readonly string[];
    /** `Character.cardRemovals` going in — prices the `cut` offer. */
    removals: number;
    offers: readonly RestChoiceOffer[];
    /** Phase 59 — the authored MapEvent one-liner, preferred over the placeholder intro when present. */
    description: string | null;
    outcome: RestChoiceOutcome | null;
    seed: SeedInput;
}
