/**
 * Rest-choice encounter ("rest" / "cut") — Public API. Phase 52c; anvil
 * offer dropped Phase 59.
 *
 * A rest node is one irreversible choice of two, replacing the Night
 * Watch's silent per-node heal (T's ruling, attended chat, 2026-08-08). The
 * engine never reads `GameState`; the host settles the outcome ledger
 * against the real `Character` at claim time — see `restchoice.types.ts`
 * for why `cut` names a card rather than removing it itself.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    RestChoiceOfferId,
    RestChoiceSession,
} from './restchoice.types';

// ── Tuning ─────────────────────────────────────────────────────────────────
export { RESTCHOICE_TUNING } from './restchoice.content';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    createRestChoiceSession,
    previewRestChoiceHeal,
    chooseRestChoiceOffer,
    pickRestChoiceCut,
    claimRestChoiceOutcome,
} from './restchoice.engine';
