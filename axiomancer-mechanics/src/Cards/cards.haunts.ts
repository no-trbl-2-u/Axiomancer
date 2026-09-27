/**
 * The HAUNT registry (spec 34 R-13: THOUGHTFORM renamed HAUNT) — the cards
 * CONJURE creates (spec 32 v3 §3: "create a one-use Thoughtform card into
 * hand (removed after play / combat end)").
 *
 * WS2.1 (plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md,
 * correction C-11): Haunts are REAL `Card` records resolved through
 * `getCardById`'s lookup chain, but they must NOT live in
 * `cards.library.ts` — the library's count pins (57 cards / 45 spells at the
 * Profane Canon; 70/50 before it) were repealed 2026-09-02, but the library
 * lints (effectiveness + pricing) still map over `cardLibrary` alone, and
 * a Haunt is unreachable
 * except through a `conjure_card` play. Keeping them in a separate
 * registry means they are automatically excluded from the reward pool
 * (`COMBAT_REWARD_POOL` maps over `cardLibrary`), from stage pools
 * (`stageEligibleCardIds` reads `cardLibrary`), and from every
 * library-pinned lint — asserted by
 * `src/Cards/e2e/haunts.engine.test.ts`.
 *
 * Contract:
 *   - every entry carries the `'haunt'` tag — the ownership gate in
 *     `executeCard` (card.engine.ts) accepts a haunt-tagged card as
 *     owned-by-conjuring, since a Haunt can only reach a hand
 *     through a `conjure_card` play;
 *   - entries are one-use at the engine level (`conjuredUids`,
 *     combat.engine.ts): a played, free-played, or scrapped conjured card
 *     leaves the combat entirely instead of entering the discard cycle;
 *   - any rank is legal; the library lints do not count this registry.
 *
 * Cycle safety: this module imports ONLY types, mirroring
 * `cards.sandbox.ts` — `cards.library.ts` imports it for the lookup
 * chain, never the reverse.
 */

import type { Card } from './types';

/**
 * Every Haunt in existence. EMPTY since the card purge (P1, 2026-09-27; D36):
 * CONJURE's targets went with the cards that conjured them.
 */
export const hauntLibrary: Card[] = [];

const registry = new Map<string, Card>(hauntLibrary.map(card => [card.id, card]));

/** O(1) Haunt lookup by card id (the middle link of `getCardById`'s
 *  sandbox → haunt → library chain). */
export function getHauntById(id: string): Card | undefined {
    return registry.get(id);
}
