/**
 * Quest Board minigame — tuning constants.
 *
 * One file so the balance loop has a single dial panel. Targets
 * (decided 2026-06-12): one full play of `build-the-boat` lands in
 * 5–10 minutes — roughly 3 laps of a 16-space loop, ~14 rolls,
 * ~5 in-game days. The quest cannot be failed; these dials shape how
 * EXPENSIVE a sloppy run feels and where the outcome tiers cut.
 */

export const QUEST_BOARD_TUNING = Object.freeze({
    /** Bone-die rolls per in-game day. Dusk falls after the last. */
    stretchesPerDay: 6,
    /** Vigor restored by supper at dusk (capped at max). */
    duskVigor: 2,
    /** Fraction of max vigor restored after a collapse (floor'd). */
    collapseRecoverFraction: 0.5,
    /** Charms rolled into the satchel at session start. */
    charmsDealt: 2,
    /** Vows rolled at session start. */
    vowsDealt: 2,
    /** Tier cuts — see `questBoardTierOf`. */
    masterworkMaxDays: 7,
    masterworkMinVows: 2,
    seaworthyMaxDays: 12,
    seaworthyMinVows: 1,
    /** Vow dials. */
    swiftKeelDay: 5,
    unbittenFloor: 2,
    fedLarderFish: 3,
    gullsBaneWins: 2,
    taleCollectorCount: 2,

    // ── Micro-game dials (the per-space decision shapes) ────────────────────
    // Each space kind plays a DIFFERENT verb so landing on it feels distinct;
    // these centralise the shared numbers. See `docs/quest-board.md`.

    /** DUEL — best-of-1 + grit. Grit assignable before the single roll. */
    duelMaxGrit: 2,
    /** Vigor each grit token costs (paid up front, win or lose). */
    duelGritVigor: 1,
    /** +die per grit committed. */
    duelGritBonus: 1,

    /** SNAG — bracing lowers the crossing threshold by this much. */
    snagBraceDrop: 2,
    /** Wind spent to brace (preferred over fish when both are offered). */
    snagBraceWind: 1,
    /** Fish spent to brace when no wind is banked. */
    snagBraceFish: 1,

    /** MARKET — each repeat buy of the SAME stall costs this much more fish. */
    marketRamp: 1,

    /** HEARTH — LINGER eats provisions for extra rest. */
    hearthLingerFish: 1,
    hearthLingerVigor: 2,
});

export const QUEST_STRETCHES_PER_DAY = QUEST_BOARD_TUNING.stretchesPerDay;
export const QUEST_CHARMS_DEALT = QUEST_BOARD_TUNING.charmsDealt;
export const QUEST_VOWS_DEALT = QUEST_BOARD_TUNING.vowsDealt;
