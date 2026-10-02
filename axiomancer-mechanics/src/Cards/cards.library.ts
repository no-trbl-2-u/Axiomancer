/**
 * THE CARD LIBRARY — the aggregator.
 *
 * The player library is the grey office: three colourless cards
 * (`library/starters.cards.ts`). Stat scaling (`Combat/stat-scaling.ts`)
 * grows their numbers with the player's body, mind and heart. New cards are
 * designed only in a guided session with T, which is where this file grows.
 *
 * THE CONSTRAINTS:
 *   1. Every card is playable without a die: a spell authors a non-empty
 *      `free`, an oath/hex gets an engine-derived timed FREE instance.
 *   2. One tray roll per threat phase (a bug fix, not a design law).
 *
 * There is no rank band, no pricing gate, no win-rate curve and no governing
 * objective function. Numbers are judged by playing the game.
 *
 * Direct damage is a first-class verb (DEAL), scaled by body. Enemy
 * VITAE falls to any authored mix of hits, statuses and reflect.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';
import { getUpgradedCardById, isUpgradedCardId } from './card-upgrades';
import { GREY_OFFICE_CARDS } from './library/starters.cards';

/**
 * The player library is the grey office alone — A Plain Blow, A Plain Ward,
 * A Plain Word. New cards arrive only through a guided session with T.
 */
export const cardLibrary: Card[] = [
    ...GREY_OFFICE_CARDS,
];

const registry = new Map<string, Card>(cardLibrary.map(card => [card.id, card]));

// Sandbox integration: experimental cards / overrides (loaded via --sandbox)
// take precedence over the curated library at lookup time.
bindSandboxLibraryGuard(id => registry.get(id));

/** O(1) lookup by card id; sandbox-aware: the sandbox first (so experiments
 *  can shadow anything), then the curated library. */
export function getCardById(id: string): Card | undefined {
    const direct = getSandboxCard(id) ?? registry.get(id);
    if (direct) return direct;
    // THE PATH — card upgrades (Slay the Spire's model). An upgraded copy sits
    // in a deck as a plain id string, `some-card+`, and resolves here by
    // upgrading its base on demand. Last in the chain so nothing else changes
    // and a literal `+` card in any registry above still wins.
    // Guarded on the suffix: without it an unknown `foo` would bounce between
    // this function and the resolver forever (baseCardId('foo') === 'foo').
    return isUpgradedCardId(id) ? getUpgradedCardById(id) : undefined;
}
