/**
 * Rest-choice encounter — tuning (Phase 52c).
 *
 * T direct (attended chat, 2026-08-08): a rest node offers exactly three
 * things — a free heal, one anvil visit, or one deck cut — and locks after
 * one is chosen. Prices here are PROVISIONAL, the same way
 * `BLACKSMITH_PRICING_PLACEHOLDER` and `CARD_REMOVAL_PRICING_PLACEHOLDER`
 * mark their own unratified tiers. Phase 52f calibrates against measured
 * income; do not tune these numbers elsewhere.
 */
export const RESTCHOICE_TUNING = Object.freeze({
    /**
     * PROVISIONAL — a camp `rest` heals this fraction of MAX vitae. T said
     * "20% of the player's health"; max, not missing or current health, is
     * the reading that does not punish a player for being nearly dead.
     */
    campHealFraction: 0.2,
    /**
     * PROVISIONAL — the flat anvil price for exactly ONE hone-or-temper.
     * Replaces `BLACKSMITH_PRICING_PLACEHOLDER`'s per-verb tiers at THIS
     * surface only; the blacksmith engine's own tiers stay untouched.
     */
    anvilPrice: 50,
});
