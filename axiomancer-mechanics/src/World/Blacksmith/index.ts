/**
 * Blacksmith encounter ("The Anvil") — Public API.
 *
 * The die-gear upgrade surface (Spec 33 §6, Phase D5): HONE (add a mana face),
 * TEMPER (mana → special), and gear SWAP, each priced in shillings
 * (`ANVIL_VERB_PRICING`, ratified Phase 52f). The engine is two-way like the
 * other minigames — it never reads `GameState`; the host passes the rail +
 * budget + variant offers and applies the upgraded rail to `Character.dieGear`
 * at claim.
 *
 * Seeded-RNG helpers are aliased `blacksmith*` because sibling modules already
 * export `seedRng`/`nextFloat`/… from the package root.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    BlacksmithVerb,
    BlacksmithVariantOffer,
    BlacksmithCard,
    BlacksmithOutcome,
    BlacksmithPhase,
    BlacksmithSession,
} from './blacksmith.types';

// ── Seeded RNG (aliased — see module note) ─────────────────────────────────
export type { BlacksmithRngState } from './blacksmith.rng';
export {
    seedRng as blacksmithSeedRng,
    nextFloat as blacksmithNextFloat,
    nextInt as blacksmithNextInt,
} from './blacksmith.rng';

// ── Tuning ─────────────────────────────────────────────────────────────────
export { ANVIL_VERB_PRICING } from './blacksmith.engine';

// ── Witness variant gear (D5 content — minimal, see module note) ────────────
export { BLACKSMITH_WITNESS_VARIANTS, HEART_RICH_PAYLOAD_VARIANT } from './blacksmith.content';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    createBlacksmithSession,
    beginBlacksmith,
    honeBlacksmith,
    temperBlacksmith,
    swapBlacksmith,
    continueBlacksmithCard,
    leaveBlacksmith,
    claimBlacksmithOutcome,
    canHone,
    canTemper,
} from './blacksmith.engine';
