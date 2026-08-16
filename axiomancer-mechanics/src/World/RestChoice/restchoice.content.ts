/**
 * Rest-choice encounter — tuning (Phase 52c; prices ratified Phase 52f).
 *
 * T direct (attended chat, 2026-08-08): a rest node offers exactly three
 * things — a free heal, one anvil visit, or one deck cut — and locks after
 * one is chosen. `campHealFraction` is a design choice, not an economy
 * number; `anvilPrice` is ratified against measured loot-cache income (see
 * `plan/phases/phase_52f_shilling_economy_calibration.md`). Do not tune
 * these numbers elsewhere.
 */
export const RESTCHOICE_TUNING = Object.freeze({
    /**
     * A camp `rest` heals this fraction of MAX vitae. T said "20% of the
     * player's health"; max, not missing or current health, is the reading
     * that does not punish a player for being nearly dead.
     */
    campHealFraction: 0.2,
    /**
     * The flat anvil price for exactly ONE hone-or-temper, ratified Phase
     * 52f against a measured guaranteed 26 shillings/act (fishing-village's
     * three loot-cache nodes) — roughly a full act's income, so a player
     * upgrades dice a handful of times per campaign, not at every rest.
     * Replaces `ANVIL_VERB_PRICING`'s per-verb tiers at THIS surface only;
     * the blacksmith engine's own tiers stay untouched.
     */
    anvilPrice: 25,
});
