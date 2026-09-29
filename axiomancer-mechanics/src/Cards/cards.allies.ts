/**
 * The ALLY registry (Phase 62 — plan/archive/2026-09-25-trim-t4/plan/phases/phase_62_ally_cards.md).
 *
 * Design decision (the phase 62 brief's central question — "what an ally
 * card IS mechanically"): an Ally is a real `Card` record of the EXISTING
 * `cardType: 'oath'` — no new `CardType`, no new `CardSpecialMechanic` kind,
 * no new keyword. `oath` already means exactly "a persistent, player-side
 * companion passive" (spec 32 v4 §2.1): the FREE (dieless) line grants a
 * TIMED taste of the passive for a few rounds, the PAID line makes the same
 * passive PERMANENT for the rest of that combat, unique-in-play. That is a
 * companion who rides along with you once recruited and answers for you
 * every fight you call on them — the "persistent companion" reading the
 * brief asked about, built entirely from vocabulary that already exists.
 *
 * Ally cards live OUTSIDE the curated library, mirroring the
 * sibling-pool pattern `cards.haunts.ts` established (WS2.1 / correction
 * C-11): real `Card` records, resolved through `getCardById`'s lookup
 * chain, but structurally excluded from `cardLibrary` — and therefore from
 * `COMBAT_REWARD_POOL`, every stage's `stageEligibleCardIds`, every draft
 * pool, and the pricing/library-count lints, all of which map over
 * `cardLibrary` alone. Unlike a Haunt (reached only via a `conjure_card`
 * play, one-use, never entering a deck), an Ally is meant to be GRANTED
 * once into the player's permanent collection and then fought with like any
 * other owned card. Phase 65's village-goodwill payout was the intended
 * grant path; R3b purged it, so no grant path exists today; this phase ships the schema, the
 * registry, one concrete Ally as a reference implementation wired all the
 * way through combat, and the primitives (`getAllyById`, `isAllyCard`)
 * Phase 65 needs to recognize one.
 *
 * Unscored: `scoreCard` returns 0 for any non-'spell' `cardType` (the same
 * "engine text, priced by hand" convention every other oath/hex in the
 * curated library follows) — see each card's own `// pts:` comment.
 *
 * Cycle safety: this module imports ONLY types, mirroring `cards.haunts.ts`
 * and `cards.sandbox.ts` — `cards.library.ts` imports it for the lookup
 * chain, never the reverse.
 */

import type { Card } from './types';

/**
 * Every Ally in existence. EMPTY since the card purge (P1, 2026-09-27; D36):
 * The Sworn Second went with the rest of the player library, and new Allies
 * arrive only through a guided session with T (D37). The registry and its
 * lookups stay so a future Ally has a home.
 */
export const allyLibrary: Card[] = [];

const registry = new Map<string, Card>(allyLibrary.map(card => [card.id, card]));

/** O(1) Ally lookup by card id (a link in `getCardById`'s
 *  sandbox -> haunt -> ally -> library chain). */
export function getAllyById(id: string): Card | undefined {
    return registry.get(id);
}

/** True when `id` names a granted Ally — the gate any grant surface
 *  should check before adding an id to a
 *  player's collection under the ally fiction. */
export function isAllyCard(id: string): boolean {
    return registry.has(id);
}
