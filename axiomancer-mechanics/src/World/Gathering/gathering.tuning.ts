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
        /** The eruption point. Reaching it ends the gleaning by force. */
        max: 12,
        /** Crossing a threshold draws a reprisal (each fires once). */
        thresholds: [4, 8],
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
            wrathBonus: 1,
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
    outcome: {
        /** COMMUNION requires at least this much grace… */
        communionGrace: 2,
        /** …and no more than this much wrath at withdrawal. */
        communionWrathMax: 4,
        /** Withdrawing at or above this wrath is DESPOILMENT. */
        despoilWrathMin: 8,
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
export const GATHER_WRATH_MAX = GATHERING_TUNING.wrath.max;
export const GATHER_WRATH_THRESHOLDS: readonly number[] = GATHERING_TUNING.wrath.thresholds;
export const GATHER_DUSK_AFTER = GATHERING_TUNING.dusk.afterTurn;
