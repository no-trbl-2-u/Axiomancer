/**
 * Rest-choice engine ("rest" / "anvil" / "cut") — pure engine transitions.
 *
 * Replaces the Night Watch's silent per-node heal with T's ruling (attended
 * chat, 2026-08-08): a rest node is one irreversible choice of three. State
 * machine:
 *
 *   offer ──chooseRestChoiceOffer('rest')────────────────▶ outcome
 *     │
 *     ├──chooseRestChoiceOffer('anvil')──▶ anvil-pick ──pickRestChoiceAnvil──▶ outcome
 *     │                                        │  ▲                             │
 *     │                                        │  └── (refused: cap violation) ─┘ (stays)
 *     │
 *     └──chooseRestChoiceOffer('cut')────▶ cut-pick ──pickRestChoiceCut──▶ outcome
 *                                                                              │
 *                                                                    claimRestChoiceOutcome
 *                                                                              ▼
 *                                                                            done
 *
 * `anvil` composes the ALREADY-BUILT D5 `World/Blacksmith` engine for one
 * HONE-or-TEMPER — it is not rebuilt here. The flat 50-shilling anvil price
 * is this surface's own charge; the ephemeral Blacksmith session underneath
 * is handed an effectively unlimited budget so its own PLACEHOLDER tiers
 * never double-charge or double-refuse on affordability. Only the die-gear
 * legality check (the special/mana face caps) is reused.
 *
 * `cut` does NOT call `Cards/card.removal`'s `removeCardFromCombatDeck`
 * itself — that primitive needs the full `Character` (which list, rewards
 * or known, actually owns the copy) that this engine never carries. It only
 * names the picked card; the host performs the real removal against its own
 * `Character` at claim, exactly as it writes `outcome.rail` to
 * `Character.dieGear` — see `restchoice.types.ts` header.
 */

import { RESTCHOICE_TUNING } from './restchoice.content';
import type { SeedInput } from '../seed';
import type { DieGearColor } from '../../Character/dieGear.reducer';
import {
    createBlacksmithSession,
    beginBlacksmith,
    honeBlacksmith,
    temperBlacksmith,
} from '../Blacksmith/blacksmith.engine';
import { MIN_COMBAT_DECK_SIZE, cardRemovalPrice } from '../../Cards/card.removal';
import type {
    RestChoiceAnvilVerb,
    RestChoiceOffer,
    RestChoiceOfferId,
    RestChoiceOutcome,
    RestChoiceSession,
    RestShelter,
    DieGearRail,
} from './restchoice.types';

const T = RESTCHOICE_TUNING;

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export interface CreateRestChoiceOptions {
    shelter: RestShelter;
    maxHealth: number;
    health: number;
    currency: number;
    rail: DieGearRail;
    /** `buildCombatDeck(player, flags)` output — the `cut` picker's choices. */
    deckCardIds: readonly string[];
    /** `Character.cardRemovals` going in. Defaults to 0 — same seam as `cardRemovalsOf`. */
    removals?: number;
}

function buildOffers(currency: number, deckSize: number, removals: number): RestChoiceOffer[] {
    const cutPrice = cardRemovalPrice(removals);
    return [
        { id: 'rest', cost: 0 },
        {
            id: 'anvil',
            cost: T.anvilPrice,
            ...(currency < T.anvilPrice
                ? { disabledReason: `you can't cover the ${T.anvilPrice} it costs` }
                : {}),
        },
        {
            id: 'cut',
            cost: cutPrice,
            ...(deckSize <= MIN_COMBAT_DECK_SIZE
                ? { disabledReason: `the deck is at its floor of ${MIN_COMBAT_DECK_SIZE} cards` }
                : currency < cutPrice
                    ? { disabledReason: `you can't cover the ${cutPrice} it costs` }
                    : {}),
        },
    ];
}

/** Builds the offer session from the authored payload. Nothing is read from `GameState`. */
export function createRestChoiceSession(seed: SeedInput, opts: CreateRestChoiceOptions): RestChoiceSession {
    const removals = typeof opts.removals === 'number' && Number.isFinite(opts.removals) && opts.removals > 0
        ? Math.floor(opts.removals)
        : 0;
    return {
        phase: 'offer',
        shelter: opts.shelter,
        maxHealth: opts.maxHealth,
        health: opts.health,
        currency: opts.currency,
        rail: { ...opts.rail },
        deckCardIds: opts.deckCardIds.slice(),
        removals,
        offers: buildOffers(opts.currency, opts.deckCardIds.length, removals),
        pendingRefusal: null,
        outcome: null,
        seed,
    };
}

function offerFor(s: RestChoiceSession, id: RestChoiceOfferId): RestChoiceOffer | undefined {
    return s.offers.find(o => o.id === id);
}

function sealOutcome(s: RestChoiceSession, outcome: RestChoiceOutcome): RestChoiceSession {
    return { ...s, phase: 'outcome', pendingRefusal: null, outcome };
}

// ---------------------------------------------------------------------------
// Offer commit
// ---------------------------------------------------------------------------

/**
 * offer → outcome | anvil-pick | cut-pick. Commits ONE offer — the other two
 * vanish (the caller's `offers` list is only meaningful in the `offer`
 * phase). A disabled or unknown offer id is an invalid call: silent no-op.
 */
export function chooseRestChoiceOffer(s: RestChoiceSession, offer: RestChoiceOfferId): RestChoiceSession {
    if (s.phase !== 'offer') return s;
    const found = offerFor(s, offer);
    if (!found || found.disabledReason) return s;

    if (offer === 'rest') {
        const healCap = Math.max(0, s.maxHealth - s.health);
        const raw = s.shelter === 'inn'
            ? healCap
            : Math.round(s.maxHealth * T.campHealFraction);
        const healed = Math.max(0, Math.min(healCap, raw));
        return sealOutcome(s, {
            chosen: 'rest', healed, spent: 0, rail: s.rail, removedCardId: null, removals: s.removals,
        });
    }
    if (offer === 'anvil') return { ...s, phase: 'anvil-pick', pendingRefusal: null };
    return { ...s, phase: 'cut-pick', pendingRefusal: null };
}

// ---------------------------------------------------------------------------
// Anvil sub-step
// ---------------------------------------------------------------------------

/**
 * anvil-pick → outcome, or anvil-pick (refused). Composes `honeBlacksmith` /
 * `temperBlacksmith` for the cap-legality check + gear transform; the
 * ephemeral Blacksmith session's own budget is unlimited so only the die-gear
 * caps can refuse this, never Blacksmith's own PLACEHOLDER prices. A refusal
 * leaves the session in `anvil-pick`, choosable again — the player may pick
 * a different die or verb without losing the rest node (no back-out of the
 * node itself, but this is not that).
 */
export function pickRestChoiceAnvil(
    s: RestChoiceSession,
    color: DieGearColor,
    verb: RestChoiceAnvilVerb,
): RestChoiceSession {
    if (s.phase !== 'anvil-pick') return s;
    let bs = beginBlacksmith(createBlacksmithSession(s.seed, s.rail, Number.MAX_SAFE_INTEGER));
    bs = verb === 'hone' ? honeBlacksmith(bs, color) : temperBlacksmith(bs, color);

    if (bs.card?.refused) {
        return { ...s, pendingRefusal: bs.card.reason };
    }
    return sealOutcome(s, {
        chosen: 'anvil', healed: 0, spent: T.anvilPrice, rail: bs.rail, removedCardId: null, removals: s.removals,
    });
}

// ---------------------------------------------------------------------------
// Cut sub-step
// ---------------------------------------------------------------------------

/**
 * cut-pick → outcome. Only a card actually offered (`deckCardIds`) is a
 * valid pick — anything else is an invalid call: silent no-op, matching the
 * sibling engines' unknown-id contract (e.g. Blacksmith's unknown swap
 * offer). The real `removeCardFromCombatDeck` call is the host's, at claim.
 */
export function pickRestChoiceCut(s: RestChoiceSession, cardId: string): RestChoiceSession {
    if (s.phase !== 'cut-pick') return s;
    if (!s.deckCardIds.includes(cardId)) return s;
    return sealOutcome(s, {
        chosen: 'cut',
        healed: 0,
        spent: cardRemovalPrice(s.removals),
        rail: s.rail,
        removedCardId: cardId,
        removals: s.removals + 1,
    });
}

// ---------------------------------------------------------------------------
// Claim
// ---------------------------------------------------------------------------

/** outcome → done. The host applies the ledger to the real `Character` and seals the visit. */
export function claimRestChoiceOutcome(s: RestChoiceSession): RestChoiceSession {
    if (s.phase !== 'outcome' || s.outcome === null) return s;
    return { ...s, phase: 'done' };
}
