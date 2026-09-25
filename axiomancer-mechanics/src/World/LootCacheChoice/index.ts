/**
 * Loot-cache choice encounter ("card" / "item" / "sacrifice") — Public API.
 * Phase 63, replacing the retired Pick Pool dice-pool minigame.
 *
 * A loot-cache node is one irreversible choice of three, replacing The
 * Reliquary's dice-pool delving session (T's ruling, 2026-08-15). The
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
