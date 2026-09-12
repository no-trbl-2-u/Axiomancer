/**
 * Rest-choice screen copy (Phase 52d). Neutral register on purpose — this
 * is the placeholder voice Phase 44f's retheme pass replaces without
 * touching `app/rest/index.tsx` or the presenter.
 */

import type { RestChoiceOfferId } from '@mechanics';

export const REST_CHOICE_EYEBROW = 'A MOMENT TO STOP';
export const REST_CHOICE_TITLE = 'TWO DOORS, ONE STEP THROUGH';
export const REST_CHOICE_INTRO =
    'The node is spent the moment you stopped here. Pick one — there is no walking back out.';

export const REST_CHOICE_OFFER_LABEL: Record<RestChoiceOfferId, string> = Object.freeze({
    rest: 'REST',
    cut: 'THE CUT',
});

export const REST_CHOICE_OFFER_DESC: Record<RestChoiceOfferId, string> = Object.freeze({
    rest: 'Sleep where you stand. Free.',
    cut: 'Thin the deck by one card.',
});

/**
 * The REST offer's description, with the heal it actually pays (FE-024).
 *
 * @param maxHealth - the pilgrim's maximum VITAE; the heal is a flat fraction
 *   of MAX, not of missing or current health (`RESTCHOICE_TUNING`).
 * @returns the static sentence with the restored amount appended, or the
 *   static sentence alone when the maximum is unknown (0 or negative).
 *
 * The screen showed 'SLEEP WHERE YOU STAND. FREE.' beside a bar reading
 * 20/175 — three statements of the price and none of the payoff, so the only
 * number a hurt player wants was withheld until after committing. The
 * fraction stays in the engine; this reads it, it does not restate the rule.
 */
export function restOfferDesc(maxHealth: number, healFraction: number): string {
    const base = REST_CHOICE_OFFER_DESC.rest;
    if (!Number.isFinite(maxHealth) || maxHealth <= 0) return base;
    const healed = Math.round(maxHealth * healFraction);
    if (healed <= 0) return base;
    return `${base} Restores ${healed} VITAE.`;
}

export const REST_CHOICE_PURSE_LABEL = 'PURSE';
export const REST_CHOICE_FREE_LABEL = 'FREE';

export const REST_CUT_SHEET_TITLE = 'WHAT LEAVES THE DECK';
export const REST_CUT_SHEET_INTRO =
    'One card, gone for the run. The price climbs every time you do this.';
export const REST_CUT_NEXT_PRICE_PREFIX = 'the one after this costs';
export const REST_CUT_CONFIRM_LABEL = 'CUT IT';

export const REST_OUTCOME_EYEBROW = 'SETTLED';
export const REST_OUTCOME_CLAIM_LABEL = 'MOVE ON';

export function restOutcomeHealChip(healed: number): string {
    return `+${healed} VITAE`;
}

export function restOutcomeSpendChip(spent: number): string {
    return `−${spent} SHILLINGS`;
}

export function restOutcomeRemovedChip(cardName: string): string {
    return `CUT: ${cardName}`;
}
