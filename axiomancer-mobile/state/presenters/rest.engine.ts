/**
 * Rest-choice presenter (Phase 52d, replacing "The Night Watch") — maps
 * the engine session (`axiomancer-mechanics` World/RestChoice) onto a
 * render-ready view-model. Pure: no store writes, no rolls, no rule
 * decisions.
 *
 * Owner-UI doctrine: an unaffordable OR capped offer is disabled AND names
 * its reason out loud (never a silent no-op) — `RestChoiceOffer.disabledReason`
 * IS that reason; this module only shapes it for render.
 */

import { cardRemovalPrice, getCardById } from '@mechanics';
import type {
    RestChoiceOfferId,
    RestChoiceSession,
} from '@mechanics';
import type { AppStoreState } from '@/state/store';
import { REST_CHOICE_OFFER_DESC, REST_CHOICE_OFFER_LABEL } from './rest.copy';

// ---------------------------------------------------------------------------
// VM shapes
// ---------------------------------------------------------------------------

export interface RestChoiceOfferVM {
    id: RestChoiceOfferId;
    label: string;
    desc: string;
    price: number;
    enabled: boolean;
    disabledReason: string | null;
}

/** One row in the removal picker sheet — one per DECK COPY, duplicates included. */
export interface RestChoiceCutCardVM {
    /** React key — index-qualified since duplicate ids repeat. */
    key: string;
    cardId: string;
    name: string;
}

export interface RestChoiceCutVM {
    /** What THIS removal costs — matches the `cut` offer's price. */
    price: number;
    /** What the NEXT removal (after this one) would cost — the escalation preview. */
    nextPrice: number;
    cards: readonly RestChoiceCutCardVM[];
}

export interface RestChoiceOutcomeVM {
    chosen: RestChoiceOfferId;
    label: string;
    healed: number;
    spent: number;
    removedCardName: string | null;
}

export interface RestChoiceVM {
    active: boolean;
    phase: RestChoiceSession['phase'] | 'none';
    health: number;
    maxHealth: number;
    currency: number;
    offers: readonly RestChoiceOfferVM[];
    cut: RestChoiceCutVM | null;
    outcome: RestChoiceOutcomeVM | null;
}

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

const EMPTY_VM: RestChoiceVM = Object.freeze({
    active: false,
    phase: 'none',
    health: 0,
    maxHealth: 0,
    currency: 0,
    offers: Object.freeze([]),
    cut: null,
    outcome: null,
});

export function selectHasActiveRest(state: Pick<AppStoreState, 'rest'>): boolean {
    return state.rest?.session != null;
}

function cardName(cardId: string): string {
    return getCardById(cardId)?.name ?? cardId;
}

export function selectRestVM(state: Pick<AppStoreState, 'rest'>): RestChoiceVM {
    const s = state.rest?.session;
    if (!s) return EMPTY_VM;

    const offers: RestChoiceOfferVM[] = s.offers.map((o) => ({
        id: o.id,
        label: REST_CHOICE_OFFER_LABEL[o.id],
        desc: REST_CHOICE_OFFER_DESC[o.id],
        price: o.cost,
        enabled: !o.disabledReason,
        disabledReason: o.disabledReason ?? null,
    }));

    const cut: RestChoiceCutVM | null = s.phase !== 'cut-pick' ? null : {
        price: cardRemovalPrice(s.removals),
        nextPrice: cardRemovalPrice(s.removals + 1),
        cards: s.deckCardIds.map((cardId, i) => ({
            key: `${cardId}:${i}`,
            cardId,
            name: cardName(cardId),
        })),
    };

    const outcome: RestChoiceOutcomeVM | null = s.outcome === null ? null : {
        chosen: s.outcome.chosen,
        label: REST_CHOICE_OFFER_LABEL[s.outcome.chosen],
        healed: s.outcome.healed,
        spent: s.outcome.spent,
        removedCardName: s.outcome.removedCardId === null ? null : cardName(s.outcome.removedCardId),
    };

    return {
        active: true,
        phase: s.phase,
        health: s.health,
        maxHealth: s.maxHealth,
        currency: s.currency,
        offers,
        cut,
        outcome,
    };
}
