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
 * PRICES ARE RATIFIED (Phase 52f) against MEASURED income: the fishing-village
 * act's three authored loot-cache nodes grant a guaranteed 26 shillings on a
 * full walk (`src/World/MapEvents/content.ts`'s `FV_LOOT_CACHES`), and shop
 * wares run ~1-12. `base` sits well under a single loot-cache find so the
 * first cut is obviously affordable early; `step` is sized so the fourth/fifth
 * cut (20 / 25) approaches a full act's income — a real sacrifice, not a
 * lockout. See `plan/archive/2026-09-25-trim-t4/plan/phases/phase_52f_shilling_economy_calibration.md` and its
 * report for the full derivation. Do not fork copies of these numbers: read
 * the constant.
 *
 * This module charges nothing. `removeCardFromCombatDeck` deliberately does
 * not spend currency — pricing is the CALLER's transaction (52c's rest-choice
 * engine debits `Character.currency`), so the primitive stays single-purpose
 * and testable without an economy.
 */

import type { Character } from '../Character/types';

/**
 * The removal curve, ratified by Phase 52f against measured income. Currency
 * unit is SHILLINGS (`Character.currency`).
 */
export const CARD_REMOVAL_PRICING = Object.freeze({
    /** What the FIRST removal of a run costs. */
    base: 5,
    /** What each subsequent removal adds. Linear, not a factor. */
    step: 5,
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
 * run: 5 / 10 / 15 / 20 … Negative or non-finite input floors at 0 removals.
 *
 * @param removals - Removals already made this run (`Character.cardRemovals`).
 */
export function cardRemovalPrice(removals: number): number {
    const n = Number.isFinite(removals) && removals > 0 ? Math.floor(removals) : 0;
    return CARD_REMOVAL_PRICING.base + CARD_REMOVAL_PRICING.step * n;
}

/** The price of this character's next removal. Sugar over `cardRemovalPrice`. */
export function cardRemovalPriceFor(player: Pick<Character, 'cardRemovals'>): number {
    return cardRemovalPrice(cardRemovalsOf(player));
}

/** Whether the character can afford their next removal. Read-only; spends nothing. */
export function canAffordCardRemoval(player: Pick<Character, 'cardRemovals' | 'currency'>): boolean {
    return player.currency >= cardRemovalPriceFor(player);
}
