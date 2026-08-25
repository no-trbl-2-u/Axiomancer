/**
 * Rest-choice encounter — tuning (Phase 52c; prices ratified Phase 52f;
 * anvil offer + price dropped Phase 59).
 *
 * T direct (attended chat, 2026-08-08; heal fraction updated 2026-08-15): a
 * rest node offers exactly two things — a free heal, or one deck cut — and
 * locks after one is chosen. `restHealFraction` is a design choice, not an
 * economy number. Do not tune it elsewhere.
 */
export const RESTCHOICE_TUNING = Object.freeze({
    /**
     * `rest` heals this fraction of MAX vitae, flat — no shelter-class
     * distinction (T direct, 2026-08-15: "Heal 25% health or remove a
     * card."). Max, not missing or current health, is the reading that
     * does not punish a player for being nearly dead.
     */
    restHealFraction: 0.25,
});
