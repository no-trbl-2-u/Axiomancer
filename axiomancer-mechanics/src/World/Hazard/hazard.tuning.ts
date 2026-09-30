/**
 * Hazard minigame — centralised balance tuning.
 *
 * Every numeric knob the hazard-tuning card is allowed to move lives
 * here, in one object, so balance passes never have to hunt through the
 * engine, content, or components. Nothing in this file decides rules —
 * it only supplies the magnitudes that the rules and authored content
 * read.
 *
 * Grouped by what they affect:
 *  - `round`    — the shape of a round (dice, hand, momentum).
 *  - `deck`     — draw-bag sizing (the starter deck size multiplier).
 *  - `dice`     — the die-face bag, i.e. colour spread + hex (✕) odds.
 *  - `cards`    — per-colour number bands + utility base/powered amounts.
 *  - `rewards`  — reward / consequence payouts.
 *  - `hand`     — the fanned-hand arch geometry.
 *
 * The authored hazard thresholds stay in `hazard.content.ts` (they are
 * per-hazard, not global), but they are the other half of the
 * difficulty dial and are guarded by `e2e/hazard.balance.sim.test.ts`.
 */

import type { HazardDieKind } from './hazard.types';

export const HAZARD_TUNING = {
    // -- core round shape --------------------------------------------------
    round: {
        /** Dice cast once at route selection — they do NOT re-cast. */
        diceCount: 4,
        /** Cards drawn at the start of every round. */
        handSize: 5,
        /** Momentum cap: carried surplus per meter never exceeds this. */
        momentumCap: 3,
    },

    // -- draw-bag sizing ---------------------------------------------------
    deck: {
        /**
         * Multiplies every starter card's authored weight when the draw
         * bag is built. >1 makes a thicker deck (rarer specific cards per
         * round), <1 a thinner one. Rounded per card, floored at 1.
         */
        starterWeightScale: 1,
    },

    // -- dice --------------------------------------------------------------
    dice: {
        /**
         * The die-face bag. Hex (✕) frequency is
         * (count of 'hex') / faces.length. Default 1/6 ≈ 17% hostile.
         * Gold is the wild face — a gold die powers a card of any colour;
         * two gold faces make the wild meaningfully more common.
         */
        faces: ['red', 'blue', 'purple', 'gold', 'gold', 'hex'] as HazardDieKind[],
    },

    // -- card stat bands ---------------------------------------------------
    // Number magnitudes the authored card library draws from. Red/blue are
    // single-meter; purple/gold fill BOTH meters (dual). "powered" is the
    // value when a matching (or wild gold) die is applied.
    cards: {
        /** Red (FORCE) / Blue (ESCAPE) single-meter numbers [free, powered]. */
        redBlue: {
            common: { free: 3, powered: 6 },
            uncommon: { free: 5, powered: 9 },
        },
        /** Purple low DUAL number (per meter); the die upgrades the utility,
         *  not the number, so powered == free here by design. */
        purple: { free: 2, powered: 2, strong: 3 },
        /** Gold DUAL number (per meter): zero until a die is applied. */
        gold: { free: 0, powered: 6, strongPowered: 7 },
        /** Utility amounts. draw = cards pulled; recast/convert add +1 die
         *  at the major tier. minor = purple/red-blue base; major = the
         *  powered purple tier and gold's free tier. */
        utility: {
            drawMinorBase: 1,
            drawMinorPowered: 2,
            /** Gold's free draw is already "major" and does not grow on power. */
            drawMajor: 2,
        },
    },

    // -- rewards & consequences -------------------------------------------
    rewards: {
        /** Vitae restored by the `vitae` reward. */
        vitae: 6,
        /** Shillings granted by the `shillings` reward. */
        shillings: 12,
        /** Shillings granted by the `riskShillings` reward (the risk route's premium). */
        riskShillings: 32,
        /** Vitae lost to the `minhp` consequence. */
        minhpLoss: 8,
        /** Maximum-vitae reduction from the `maxhp` consequence. */
        maxhpScar: 5,
    },

    // -- fanned-hand geometry ---------------------------------------------
    hand: {
        /** Vertical lift (px) per card-step away from the centre card. */
        archLiftPerStep: 9,
        /** Outward rotation (deg) per card-step away from the centre. */
        archRotatePerStep: 6,
        /** Tighter spacing kicks in past this many cards. */
        tightenAbove: 6,
        /** Lift / rotate scale applied when the hand is tightened. */
        tightenScale: 0.72,
    },
} as const;

// ---------------------------------------------------------------------------
// Flat re-exports for the long-standing constant names. Engine, content,
// and tests import these; keeping the names stable means the tuning module
// is a drop-in source of truth rather than a churning rename.
// ---------------------------------------------------------------------------

export const HAZARD_DICE_COUNT = HAZARD_TUNING.round.diceCount;
export const HAZARD_HAND_SIZE = HAZARD_TUNING.round.handSize;
export const HAZARD_MOMENTUM_CAP = HAZARD_TUNING.round.momentumCap;

/** Die faces: colours + hostile ✕. Gold is wild. */
export const HAZARD_DIE_FACES: HazardDieKind[] = HAZARD_TUNING.dice.faces;
