/**
 * Phase 52a — deck removal: THE ESCALATING PRICE.
 *
 * T direct (2026-08-08): removal is *"a low price to start, but every time the
 * player does this across the game, it costs a little more."* The curve is
 * LINEAR — `base + step × removals` — deliberately, not exponential: an
 * exponential curve prices the fourth removal out of the game entirely, and
 * thinning a deck is a strategy the player should be able to commit to.
 *
 * The counter is PER RUN (`Character.cardRemovals`), not per node and not
 * lifetime-across-runs.
 *
 * PRICES ARE PROVISIONAL. They are anchored on the shipped economy only
 * loosely — the loot-cache default purse is 10 shillings
 * (`DEFAULT_CACHE_CURRENCY`) and shop wares run ~1-12 — and **Phase 52f
 * calibrates them against MEASURED income**. Marked the same way
 * `BLACKSMITH_PRICING_PLACEHOLDER` marks its own unratified tiers. Do not
 * treat these numbers as final, and do not fork copies of them: read the
 * constant.
 *
 * This module charges nothing. `removeCardFromCombatDeck` deliberately does
 * not spend currency — pricing is the CALLER's transaction (52c's rest-choice
 * engine debits `Character.currency`), so the primitive stays single-purpose
 * and testable without an economy.
 */

import type { Character } from '../Character/types';

/**
 * The removal curve, PLACEHOLDER pending Phase 52f's calibration against
 * measured income. Currency unit is SHILLINGS (`Character.currency`).
 */
export const CARD_REMOVAL_PRICING_PLACEHOLDER = Object.freeze({
    /** PLACEHOLDER — what the FIRST removal of a run costs. */
    base: 15,
    /** PLACEHOLDER — what each subsequent removal adds. Linear, not a factor. */
    step: 10,
});

/**
 * Reads a character's per-run removal count. Absent (sparse-optional) reads as
 * 0 — this is the single seam, so a fresh save (field absent) and a migrated
 * v16 save (field materialised to 0) answer identically.
 */
export function cardRemovalsOf(player: Pick<Character, 'cardRemovals'>): number {
    const n = player.cardRemovals;
    return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * The price of the NEXT removal given how many have already been made this
 * run: 15 / 25 / 35 / 45 … Negative or non-finite input floors at 0 removals.
 *
 * @param removals - Removals already made this run (`Character.cardRemovals`).
 */
export function cardRemovalPrice(removals: number): number {
    const n = Number.isFinite(removals) && removals > 0 ? Math.floor(removals) : 0;
    return CARD_REMOVAL_PRICING_PLACEHOLDER.base + CARD_REMOVAL_PRICING_PLACEHOLDER.step * n;
}

/** The price of this character's next removal. Sugar over `cardRemovalPrice`. */
export function cardRemovalPriceFor(player: Pick<Character, 'cardRemovals'>): number {
    return cardRemovalPrice(cardRemovalsOf(player));
}

/** Whether the character can afford their next removal. Read-only; spends nothing. */
export function canAffordCardRemoval(player: Pick<Character, 'cardRemovals' | 'currency'>): boolean {
    return player.currency >= cardRemovalPriceFor(player);
}
