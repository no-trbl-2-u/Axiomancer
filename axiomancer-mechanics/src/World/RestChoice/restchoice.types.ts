/**
 * Rest-choice encounter (Phase 52c) — engine types.
 *
 * A rest node is one irreversible choice of three: `rest` (free, heal),
 * `anvil` (paid, composes `World/Blacksmith` for ONE hone-or-temper), or
 * `cut` (paid, composes `Cards/card.removal` for ONE deck removal).
 * Two-way like every minigame here: the engine never reads `GameState`,
 * and the host settles the outcome ledger against the real `Character` at
 * claim time — including the actual `removeCardFromCombatDeck` call, which
 * needs the full card-base/reward-list accounting this engine does not
 * carry.
 */

import type { SeedInput } from '../seed';
import type { RestShelter } from '../MapEvents/types';
import type { DieGearColor, DieGearRail } from '../../Character/dieGear.reducer';

export type { DieGearColor, DieGearRail, RestShelter };

/** The three offers on the table. Exactly one may be committed. */
export type RestChoiceOfferId = 'rest' | 'anvil' | 'cut';

/** The two blacksmith verbs the anvil offer exposes (never `swap` — see brief). */
export type RestChoiceAnvilVerb = 'hone' | 'temper';

/** One offer's price + loud affordability. */
export interface RestChoiceOffer {
    id: RestChoiceOfferId;
    cost: number;
    disabledReason?: string;
}

export type RestChoicePhase =
    | 'offer'      // three offers on the table
    | 'anvil-pick' // choosing a die + verb (hone / temper)
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
    /** The rail the host should write to `Character.dieGear` — upgraded iff `chosen === 'anvil'`. */
    rail: DieGearRail;
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
    /** Authored shelter class (Phase 52b) — decides the `rest` offer's heal. */
    shelter: RestShelter;
    maxHealth: number;
    health: number;
    currency: number;
    /** The player's current die-gear rail — the anvil's starting point. */
    rail: DieGearRail;
    /** `buildCombatDeck(player, flags)` output — the cut picker's choices. */
    deckCardIds: readonly string[];
    /** `Character.cardRemovals` going in — prices the `cut` offer. */
    removals: number;
    offers: readonly RestChoiceOffer[];
    /** Loud refusal from the last rejected anvil pick (e.g. a die at its cap); cleared on retry or commit. */
    pendingRefusal: string | null;
    outcome: RestChoiceOutcome | null;
    seed: SeedInput;
}
