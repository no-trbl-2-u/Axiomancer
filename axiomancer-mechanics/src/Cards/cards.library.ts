/**
 * THE CARD LIBRARY — the aggregator.
 *
 * After the card purge (P1, 2026-09-27) the player library is the grey
 * office: three colourless cards (`library/starters.cards.ts`). Stat scaling
 * (S3, `Combat/stat-scaling.ts`) grows their numbers with the player's
 * body, mind and heart. New cards are designed only in a guided session with
 * T (D37), which is where this file grows again.
 *
 * THE SURVIVING CONSTRAINTS (the 5/5/5 aspect thirds went with the presets in
 * the purge, D36):
 *   1. Every card is playable without a die: a spell authors a non-empty
 *      `free`, an oath/hex gets an engine-derived timed FREE instance.
 *   2. One tray roll per threat phase (a bug fix, not a design law).
 *
 * There is no rank band, no pricing gate, no win-rate curve and no governing
 * objective function. Numbers are judged by playing the game.
 *
 * Direct damage is a first-class verb (DEAL), scaled by body (S3). Enemy
 * VITAE falls to any authored mix of hits, statuses and reflect.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import { Card } from './types';
import { bindSandboxLibraryGuard, getSandboxCard } from './cards.sandbox';
import { getHauntById } from './cards.haunts';
import { getAllyById } from './cards.allies';
import { getUpgradedCardById, isUpgradedCardId } from './card-upgrades';
import { GREY_OFFICE_CARDS } from './library/starters.cards';

/**
 * THE CARD PURGE (P1, 2026-09-27; D36, D42–D44): the player library is the
 * grey office alone — A Plain Blow, A Plain Ward, A Plain Word. Every other
 * player card was deleted (git history keeps them). New cards arrive only
 * through a guided session with T (D37).
 */
export const cardLibrary: Card[] = [
    ...GREY_OFFICE_CARDS,
];

const registry = new Map<string, Card>(cardLibrary.map(card => [card.id, card]));

// Sandbox integration: experimental cards / overrides (loaded via --sandbox)
// take precedence over the curated library at lookup time.
bindSandboxLibraryGuard(id => registry.get(id));

/** O(1) lookup by card id; sandbox-aware. Chain (WS2.1, extended phase 62):
 *  sandbox first (so experiments can shadow anything), then the Haunt
 *  registry (CONJURE targets — real cards, deliberately outside the pinned
 *  library), then the Ally registry (granted cards — also
 *  deliberately outside the pinned library), then the curated library. */
export function getCardById(id: string): Card | undefined {
    const direct = getSandboxCard(id) ?? getHauntById(id) ?? getAllyById(id) ?? registry.get(id);
    if (direct) return direct;
    // THE PATH — card upgrades (Slay the Spire's model). An upgraded copy sits
    // in a deck as a plain id string, `some-card+`, and resolves here by
    // upgrading its base on demand. Last in the chain so nothing else changes
    // and a literal `+` card in any registry above still wins.
    // Guarded on the suffix: without it an unknown `foo` would bounce between
    // this function and the resolver forever (baseCardId('foo') === 'foo').
    return isUpgradedCardId(id) ? getUpgradedCardById(id) : undefined;
}
