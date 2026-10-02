/**
 * Loot-cache choice encounter ("card" / "item") — Public API.
 *
 * A loot-cache node is one irreversible choice of two. The
 * engine never reads `GameState`; the host settles the outcome against the
 * real `Character`/`GameState` at claim time — see `lootcachechoice.types.ts`
 * for why `card`/`item` name host-rolled candidates rather than rolling
 * them itself.
 */

// ── Engine types ───────────────────────────────────────────────────────────
export type {
    LootCacheChoiceOfferId,
    LootCacheChoiceOutcome,
    LootCacheChoiceSession,
} from './lootcachechoice.types';

// ── Pure engine transitions ────────────────────────────────────────────────
export {
    createLootCacheChoiceSession,
    chooseLootCacheChoiceOffer,
    claimLootCacheChoiceOutcome,
} from './lootcachechoice.engine';
