/**
 * Rest encounter ("The Night Watch") — Public API.
 *
 * One night at camp in three watches: posture, fire, dreams, stirs.
 * The engine never reads `GameState`; the host applies the dawn
 * outcome (heal fraction, cleanse, keepsakes) at claim time.
 *
 * Seeded-RNG helpers are aliased `rest*` because sibling modules
 * already export `seedRng`/`nextFloat`/… from the package root.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    RestPosture,
    RestPostureDef,
    RestWatchKind,
    RestDreamDef,
    RestWatchOption,
    RestWatchResult,
    RestPendingWatch,
    RestOutcomeTier,
    RestOutcome,
    RestPhase,
    RestSession,
} from './rest.types';

// ── Seeded RNG (aliased — see module note) ─────────────────────────────────
export type { RestRngState } from './rest.rng';
export {
    seedRng as restSeedRng,
    nextFloat as restNextFloat,
    nextInt as restNextInt,
    rollDie as restRollDie,
    shuffle as restShuffle,
} from './rest.rng';

// ── Content & tuning ───────────────────────────────────────────────────────
export {
    REST_TUNING,
    REST_WATCHES_PER_NIGHT,
    REST_WARMTH_MAX,
    REST_POSTURES,
    getRestPostureDef,
    REST_WATCH_BAG,
    REST_DREAMS,
    getRestDreamDef,
} from './rest.content';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    createRestSession,
    chooseRestPosture,
    chooseRestOption,
    continueRestWatch,
    claimRestOutcome,
} from './rest.engine';

// ── Balance simulator (policy bots + bands) ────────────────────────────────
export type {
    RestPolicyId,
    RestSimRunResult,
    RestSimSummary,
    RunRestSimOptions,
    RestBalanceReport,
} from './rest.sim';
export {
    simulateRest,
    runRestSim,
    generateRestBalanceReport,
} from './rest.sim';
