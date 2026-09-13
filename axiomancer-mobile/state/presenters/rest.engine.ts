/**
 * Rest-choice presenter (Phase 52d, replacing the retired rest minigame —
 * see Phase 52e) — maps
 * the engine session (`axiomancer-mechanics` World/RestChoice) onto a
 * render-ready view-model. Pure: no store writes, no rolls, no rule
 * decisions.
 *
 * Owner-UI doctrine: an unaffordable OR capped offer is disabled AND names
 * its reason out loud (never a silent no-op) — `RestChoiceOffer.disabledReason`
 * IS that reason; this module only shapes it for render.
 */

import { cardRemovalPrice, getCardById, previewRestChoiceHeal } from '@mechanics';
import type {
    RestChoiceOfferId,
    RestChoiceSession,
} from '@mechanics';
import type { AppStoreState } from '@/state/store';
import { REST_CHOICE_OFFER_DESC, REST_CHOICE_OFFER_LABEL, restOfferDesc } from './rest.copy';

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
    /** S6-camp-C03 — VITAE as it stands NOW: the snapshot, plus any settled heal. */
    health: number;
    maxHealth: number;
    currency: number;
    offers: readonly RestChoiceOfferVM[];
    cut: RestChoiceCutVM | null;
    outcome: RestChoiceOutcomeVM | null;
    /** Phase 59 — the authored MapEvent one-liner; `null` falls back to the placeholder intro. */
    description: string | null;
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
    description: null,
});

export function selectHasActiveRest(state: Pick<AppStoreState, 'rest'>): boolean {
    return state.rest?.session != null;
}

function cardName(cardId: string): string {
    return getCardById(cardId)?.name ?? cardId;
}

/**
 * Displayed VITAE for the rest screen's purse readout (S6-camp-C03).
 *
 * The engine session is a frozen snapshot: `health` keeps the value the
 * pilgrim walked in with, and the heal sits in the settled ledger until the
 * host applies it at claim time. Rendering the raw snapshot beside a
 * `+43 VITAE` outcome chip therefore showed the wounded number the choice
 * had already repaired.
 *
 * @param health - the snapshot's pre-choice VITAE.
 * @param maxHealth - the pilgrim's maximum VITAE; the ceiling on the readout.
 * @param outcome - the settled ledger, or `null` while the choice is open.
 * @returns the VITAE to render: the snapshot value while nothing is settled,
 *   otherwise the snapshot plus the ledger's own `healed`, never past max.
 *
 * Reads the engine's `healed` number — it never re-derives the heal.
 */
export function restDisplayHealth(
    health: number,
    maxHealth: number,
    outcome: RestChoiceSession['outcome'],
): number {
    if (outcome === null || outcome.healed <= 0) return health;
    return Math.min(maxHealth, health + outcome.healed);
}

export function selectRestVM(state: Pick<AppStoreState, 'rest'>): RestChoiceVM {
    const s = state.rest?.session;
    if (!s) return EMPTY_VM;

    const offers: RestChoiceOfferVM[] = s.offers.map((o) => ({
        id: o.id,
        label: REST_CHOICE_OFFER_LABEL[o.id],
        // FE-024: REST names the VITAE it restores — the one number a hurt
        // player is deciding on. Audit 2026-09-12: read from the engine's own
        // preview (cap included), never re-derived from the fraction.
        desc: o.id === 'rest'
            ? restOfferDesc(previewRestChoiceHeal(s))
            : REST_CHOICE_OFFER_DESC[o.id],
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
        // S6-camp-C03: the readout follows the settled ledger, not the
        // pre-choice snapshot.
        health: restDisplayHealth(s.health, s.maxHealth, s.outcome),
        maxHealth: s.maxHealth,
        currency: s.currency,
        offers,
        cut,
        outcome,
        description: s.description,
    };
}
