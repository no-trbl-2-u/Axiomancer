/**
 * Gathering minigame — centralised balance tuning.
 *
 * Every numeric knob lives here, in one object, so balance passes never
 * hunt through the engine or content. Nothing in this file decides
 * rules — it only supplies the magnitudes that the rules and authored
 * content read. The authored plot numbers stay in `content.ts` (they
 * are per-plot, not global) but draw their bands from `plots` below;
 * both halves are guarded by `__tests__/balance.sim.test.ts`.
 */

import type { GatherApproachDef } from './gathering.types';

export const GATHERING_TUNING = {
    // -- core shape ---------------------------------------------------------
    spread: {
        /** Face-up plots on offer at once. */
        size: 3,
    },

    // -- wrath (the site's anger) -------------------------------------------
    wrath: {
        /**
         * The top of the TEMPER band — the highest eruption point any site
         * can roll, and the denominator the meter shows the player.
         *
         * Pre-2026-08-08 this WAS the eruption point, fixed at 12 for every
         * session. With it fixed, and every plot's wrath cost printed on its
         * face, the whole "push your luck" loop had no luck in it: a player
         * could compute the exact number of takings left and the exact turn a
         * reprisal would fire. See `temperMin` below.
         */
        max: 15,
        /**
         * THE SITE'S TEMPER — how much the place will actually bear before it
         * erupts, rolled per session from [temperMin, max] off a branched
         * seed. The player is never told the number; they are told the OMEN
         * (see `omens` below), which is enough to play well and not enough to
         * play by arithmetic. Reading the site (`readGatheringSite`) buys the
         * exact figure for the price of a turn.
         */
        temperMin: 10,
        /** Crossing a threshold draws a reprisal (each fires once). */
        thresholds: [4, 8],
    },

    // -- omens (the site tells you, if you are listening) ---------------------
    //
    // Graded on the GAP between the site's true temper and current wrath.
    // This is the skill lever that keeps the doctrine honest: with the
    // eruption point hidden, a player who reads the omens and stops can still
    // out-earn one who guesses, and blind greed still erupts.
    omens: {
        /** Gap at or above this reads CALM. */
        calmGap: 6,
        /** Gap at or above this (but below calm) reads STIRRING. */
        stirringGap: 4,
        /** Gap at or above this (but below stirring) reads ROUSED. */
        rousedGap: 2,
        // Anything tighter reads SEETHING — the next taking may be the last.
    },

    // -- the unsteady hand (wrath cost is a range, not a number) --------------
    //
    // A taking harvest costs its authored wrath PLUS a roll of [0, spread].
    // The floor is always the printed number, so a plot can never surprise you
    // downward; how far above it you might land is the stance's business.
    // GLEAN's tender hand knows exactly what it is taking (spread 0 — the
    // careful line stays fully computable); STRIP tears it out and cannot tell
    // what it will wake. BREATH plots are always exact: you always know what
    // soothing costs.
    // STRIP's spread REPLACES the flat +1 wrath surcharge the stance used to
    // pay: 0..3 per taking, expected +1.5, and never a number you can plan
    // around. That is the whole fork — GLEAN buys certainty and a cheaper
    // hand at the cost of a yield cap; STRIP buys uncapped yield and plunder
    // coin and pays in variance. Tuned to 3 (from 2) on 2026-08-08 because at
    // 2 an informed stripper beat an informed gleaner on BOTH richness and
    // coin, which makes the choice at the threshold decoration.
    unsteadyHand: {
        glean: 0,
        strip: 3,
    },

    // -- reading the site -----------------------------------------------------
    read: {
        /**
         * Reading costs a TURN (it pushes dusk closer) but no wrath and yields
         * nothing. Once read, the temper is known for the rest of the session:
         * the deep push becomes an informed decision instead of a guess.
         */
        turnCost: 1,
    },

    // -- dusk (the impatience clock) ------------------------------------------
    dusk: {
        /** Taking harvests after this many cost +1 wrath each. */
        afterTurn: 8,
    },

    // -- approaches (the stance chosen at the threshold) ----------------------
    approaches: {
        glean: {
            key: 'glean',
            startGrace: 1,
            richnessCap: 2,
            richnessBonus: 0,
            wrathBonus: 0,
            eruptionLoss: { num: 1, den: 3 },
            plunderPerRichness: 0,
        } as GatherApproachDef,
        strip: {
            key: 'strip',
            startGrace: 0,
            richnessCap: 0,
            richnessBonus: 1,
            // 0 since 2026-08-08 — the unsteady hand's spread carries the
            // surcharge now (see `unsteadyHand` above).
            wrathBonus: 0,
            eruptionLoss: { num: 1, den: 2 },
            plunderPerRichness: 1,
        } as GatherApproachDef,
    },

    // -- plot stat bands (the content library draws from these) --------------
    plots: {
        verge: { richness: { low: 1, high: 2 }, wrath: { low: 0, high: 1 } },
        hollow: { richness: { low: 2, high: 2 }, wrath: { low: 1, high: 2 } },
        root: { richness: { low: 2, high: 3 }, wrath: { low: 2, high: 3 } },
        /** BREATH plots lower wrath by this much (authored as negative). */
        breathRelief: 2,
    },

    // -- offerings ------------------------------------------------------------
    offerings: {
        /** Demands rolled per site. */
        pickCount: 2,
        /** Wrath relieved per paid offering. */
        wrathRelief: 3,
        /** Grace granted per paid offering. */
        grace: 1,
        /** Demand magnitudes. */
        shillings: 6,
        vitae: 2,
    },

    // -- field tools ------------------------------------------------------------
    tools: {
        /** Tools rolled per site. */
        pickCount: 2,
        /** WARDEN'S BELL: immediate wrath relief. */
        bellRelief: 2,
        /** GRAVE SPADE: extra plots revealed into the spread. */
        spadeReveal: 2,
        /** CLINGING MIRE: wrath surcharge on the next taking harvest. */
        mireSurcharge: 2,
    },

    // -- reprisals ----------------------------------------------------------------
    reprisals: {
        /** THE BRIAR'S TOLL: vitae bitten. */
        thornsBite: 3,
        /** THE SOFT DECAY: fraction of the largest family that spoils. */
        rotLoss: { num: 1, den: 2 },
    },

    // -- eruption --------------------------------------------------------------------
    eruption: {
        /** Vitae bitten on the way out. */
        bite: 4,
    },

    // -- sets & spoils ---------------------------------------------------------------
    sets: {
        /** Total family richness that completes a set. */
        threshold: 6,
        /** Shillings per completed set (the refinement's worth). */
        shillings: 8,
        /** Shillings for carrying all four families out. */
        roundHarvestShillings: 6,
    },

    // -- communion / despoilment ---------------------------------------------------------
    //
    // The two wrath cuts are TEMPER-RELATIVE, not absolute. They were fixed at
    // 4 and 8 while every site erupted at exactly 12; once the eruption point
    // started rolling per session (2026-08-08) an absolute cut stopped meaning
    // anything — leaving a site that would have borne 15 at wrath 8 is not
    // despoiling it, and judging a site that only bears 10 by the same number
    // is unfair in the other direction. Both are now fractions of the site's
    // own patience: you are judged against what THIS place could take.
    outcome: {
        /** COMMUNION requires at least this much grace… */
        communionGrace: 2,
        /** …and wrath no higher than this fraction of the site's temper. */
        communionTemperFraction: 1 / 3,
        /** Withdrawing at or above this fraction of temper is DESPOILMENT. */
        despoilTemperFraction: 2 / 3,
        /** Communion blessing (vitae restored at claim). */
        blessingVitae: 5,
    },

    // -- boons (rolled objectives) -----------------------------------------------------------
    boons: {
        /** How many boons are rolled per site. */
        pickCount: 2,
        /** Reward magnitudes. */
        shillings: 9,
        shillingsSmall: 6,
        vitae: 4,
        token: 1,
        /** LIGHT OF FOOT: leave with wrath at or below this. */
        lightfootWrathMax: 3,
        /** THE DEVOUT: pay at least this many offerings. */
        devoutCount: 2,
        /** ROOT-DELVER: taking harvests at root depth. */
        rootDelverCount: 2,
        /** SWIFT GLEANER: withdraw within this many taking harvests. */
        swiftTurnMax: 6,
    },
} as const;

// ---------------------------------------------------------------------------
// Flat re-exports for the long-standing constant names.
// ---------------------------------------------------------------------------

export const GATHER_SPREAD_SIZE = GATHERING_TUNING.spread.size;
/** The displayed ceiling of the wrath meter — NOT the eruption point.
 *  The eruption point is the session's rolled `temper`. */
export const GATHER_WRATH_MAX = GATHERING_TUNING.wrath.max;
export const GATHER_TEMPER_MIN = GATHERING_TUNING.wrath.temperMin;
export const GATHER_WRATH_THRESHOLDS: readonly number[] = GATHERING_TUNING.wrath.thresholds;
export const GATHER_DUSK_AFTER = GATHERING_TUNING.dusk.afterTurn;
