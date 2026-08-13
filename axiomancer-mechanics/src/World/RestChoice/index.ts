/**
 * Rest-choice encounter ("rest" / "anvil" / "cut") — Public API. Phase 52c.
 *
 * A rest node is one irreversible choice of three, replacing the Night
 * Watch's silent per-node heal (T's ruling, attended chat, 2026-08-08). The
 * engine never reads `GameState`; the host settles the outcome ledger
 * against the real `Character` at claim time — see `restchoice.types.ts`
 * for why `cut` names a card rather than removing it itself.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    RestChoiceOfferId,
    RestChoiceAnvilVerb,
    RestChoiceOffer,
    RestChoicePhase,
    RestChoiceOutcome,
    RestChoiceSession,
} from './restchoice.types';

// ── Tuning ─────────────────────────────────────────────────────────────────
export { RESTCHOICE_TUNING } from './restchoice.content';

// ── Pure engine transitions ────────────────────────────────────────────────
export type { CreateRestChoiceOptions } from './restchoice.engine';
export {
    createRestChoiceSession,
    chooseRestChoiceOffer,
    pickRestChoiceAnvil,
    pickRestChoiceCut,
    claimRestChoiceOutcome,
} from './restchoice.engine';
