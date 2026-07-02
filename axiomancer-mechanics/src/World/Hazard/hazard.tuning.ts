/**
 * Hazard minigame — centralised balance tuning.
 *
 * Every numeric knob the hazard-tuning skill is allowed to move lives
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
 *  - `rewards`  — reward / consequence payouts and reward-rarity odds.
 *  - `hand`     — the fanned-hand arch geometry.
 *
 * The authored hazard thresholds stay in `hazard.content.ts` (they are
 * per-hazard, not global), but they are the other half of the
 * difficulty dial and are guarded by `__tests__/balance.sim.test.ts`.
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
            /** Reward-tier red/blue. */
            reward: { free: 4, powered: 7 },
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
        /**
         * Reward-pool EXPANSION magnitudes (2026-06-11 roster). These cards
         * are acquired, never in the starter bag, so they do not move the
         * balance sim — but they still read every number from here.
         */
        expansion: {
            /** Two-tone pivots: free one meter, surge the other (bigger). */
            pivot: { uncFree: 4, uncPowered: 7, rareFree: 5, rarePowered: 10 },
            /** Lopsided purple duals (strong/weak meter split). */
            dual: { strong: 5, strongPowered: 7, weak: 2, weakPowered: 3 },
            /** Number+utility hybrids. */
            hybrid: {
                /** PATHFINDER / WINDCALLER: flat number, die upgrades the utility. */
                flatNumber: 5,
                /** STONE/TIDEREADER: number grows on power, draw grows too. */
                drawFree: 3,
                drawPowered: 5,
            },
            /** Enchantments (auras). */
            aura: {
                redBlueFree: 3,
                redBluePowered: 6,
                redBlueAmount: 2,
                purpleNumber: 2,
                purpleMinor: 1,
                purpleMajor: 2,
                goldNumber: 6,
                goldAmount: 3,
                /** RELIC OF FURY surge-row boost. */
                surgeBoost: 2,
            },
            /** Bursts (this-round-only). */
            burst: {
                base: 5,
                powered: 8,
                warcryPerDie: 1,
                bloodForce: 8,
                bloodPowered: 12,
                bloodVitae: 4,
                goldDual: 4,
                goldNumber: 6,
            },
            /** GILDED VOW one-shot. */
            vow: { force: 7, escape: 7 },
            /** TWIN PATHS choose value. */
            choose: 8,
            /** SAINT'S PATIENCE. */
            saint: { number: 3, draw: 2, momentum: 2 },
        },
        /**
         * CODEX LIBRARY magnitudes (2026-06-13 — the 150-card roster).
         * All codex cards live in the reward pool, so the starter-bag
         * balance sim is untouched; these numbers shape the acquired-card
         * power curve instead.
         */
        codex: {
            /** Single-meter number ladder [free, powered] per rarity. */
            numbers: {
                common: { free: 3, powered: 6 },
                uncommon: { free: 4, powered: 8 },
                rare: { free: 5, powered: 10 },
            },
            /** Dual (both-meter) ladder per rarity. */
            dual: {
                common: { free: 2, powered: 3 },
                uncommon: { free: 2, powered: 4 },
                rare: { free: 3, powered: 5 },
            },
            /** Two-tone pivot ladder (free one meter, surge the other). */
            pivot: { uncommon: { free: 4, powered: 7 }, rare: { free: 5, powered: 9 } },
            /** PURGE cards: numbers carried alongside the cut. */
            purge: { number: 2, rareNumber: 4 },
            /** TRANSMUTE cards. */
            transmute: { number: 2, rareNumber: 4 },
            /** MEND: vitae restored at claim (minor / major tier). */
            mend: { minor: 2, major: 4, rareMajor: 6 },
            /** BOUNTY: shillings banked at claim (minor / major tier). */
            bounty: { minor: 4, major: 8, rareMajor: 12 },
            /** WARD: route-penalty reduction (minor / major tier). */
            ward: { minor: 2, major: 4 },
            /** ANCHOR: momentum floor raised (minor / major tier). */
            anchor: { minor: 1, major: 2 },
            /** JEOPARDY: bonus progress per meter when ≥1 mark is 'X'. */
            jeopardy: { minor: 2, major: 3 },
            /** MIRACLE (first-play): bonus progress per meter when played first. */
            miracle: { minor: 2, major: 3 },
            /** DELVE: bonus per discard-pile card per meter. */
            delve: { minor: 1, major: 2 },
        },
    },

    // -- rewards & consequences -------------------------------------------
    rewards: {
        /** Vitae restored by the `vitae` reward. */
        vitae: 6,
        /** Shillings granted by the `cache` reward. */
        cacheShillings: 12,
        /** Shillings granted by the `relic` reward. */
        relicShillings: 20,
        /** Vitae lost to the `minhp` consequence. */
        minhpLoss: 8,
        /** Maximum-vitae reduction from the `maxhp` consequence. */
        maxhpScar: 5,
    },

    // -- sub-quests (optional per-hazard objectives) ----------------------
    // Each hazard rolls `pickCount` objectives from the catalogue
    // (`HAZARD_SUBQUESTS`). Completing one on a survived crossing pays its
    // bonus on top of the main spoils. Bonuses are forfeit on a failure.
    subquests: {
        /** How many objectives are rolled per hazard. */
        pickCount: 3,
        /** Shillings paid by a `shillings`-reward objective. */
        shillings: 9,
        /** Vitae restored by a `vitae`-reward objective. */
        vitae: 4,
        /** Paradox tokens banked by a `token`-reward objective. */
        token: 1,
        /** TRAVEL LIGHT: commit no more than this many cards all hazard. */
        travelLightCap: 12,
        /** SURGE MASTER: power at least this many cards with dice. */
        surgeMasterCount: 3,
        /** STORMCALLER: fire at least this many re-cast / convert effects. */
        stormcallerCount: 2,
        /** SCAVENGER: salvage at least this many cards to the bin. */
        scavengerCount: 2,
        /** DICE IN RESERVE: hold at least this many dice at the final resolve. */
        diceReserveCount: 2,
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
