/**
 * The ALLY registry (Phase 62 — plan/phases/phase_62_ally_cards.md).
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
 * other owned card — Phase 65's village-goodwill payout is the intended
 * grant path. That grant mechanism (the per-map goodwill counter, the shop
 * discount, the actual "add this id to the player's collection" call) is
 * Phase 65's job, not built here; this phase ships the schema, the
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

// ─── The Sworn Second — Phase 62's reference Ally ────────────────────────────

/**
 * A companion recruited through a village's goodwill (the loot-cache
 * sacrifice chain Phase 65 wires up), not drafted or found. Its passive is
 * built entirely from the existing THORNS vocabulary (Bulwark's hallmark,
 * `buff_thorns` in `Effects/buffs.library.json`) — no new keyword. Hooked at
 * the SAME round-end site every other oath/hex passive uses
 * (`combat.engine.ts` `processBetweenPhases`, gated by `zoneHas`), capped at
 * 3 stacks so a long fight's standing reflect never runs away — mirrors the
 * `grace-momentum` cap's shape (irresistible-grace, `GRACE_MOMENTUM_MAX_STACKS`).
 */
const theSwornSecond: Card = {
    id: 'the-sworn-second',
    name: 'The Sworn Second',
    philosophicalAspect: 'heart',
    persistentEffect:
        'At the end of each round, while you carry fewer than 3 stacks of ' +
        'THORNS, your retainer answers a blow leveled at you: gain THORNS 1 ' +
        'for 2 turns.',
    description:
        'Recruited, not conscripted — a debt paid forward from a village you ' +
        'did not have to help. They do not carry your cards. They carry your ' +
        'back.',
    tier: 2, rank: 5, cardType: 'oath',
    targetType: 'self',
    // pts: engine text — a capped, refreshed THORNS 1 (2t) at round end
    // (statusPerIntensityTurn 0.75 x i1 x d2 = 1.5/application, hand-priced
    // per the min-4-triggers convention every oath/hex comment uses) sustained
    // across a full fight -> Skull-adjacent. The 3-stack cap keeps the payoff
    // bounded rather than a runaway reflect stack (grace-momentum precedent).
    addedIn: '2026-08-26',
    tags: ['ally', 'reward', 'oath'],
};

/**
 * Every Ally in existence. NOT part of the curated library — no
 * reward/stage/draft pool ever offers one; Phase 65's village-goodwill
 * payout is the only intended grant path (not built here).
 */
export const allyLibrary: Card[] = [theSwornSecond];

const registry = new Map<string, Card>(allyLibrary.map(card => [card.id, card]));

/** O(1) Ally lookup by card id (a link in `getCardById`'s
 *  sandbox -> haunt -> ally -> library chain). */
export function getAllyById(id: string): Card | undefined {
    return registry.get(id);
}

/** True when `id` names a granted Ally — the gate Phase 65's goodwill payout
 *  (or any future grant surface) should check before adding an id to a
 *  player's collection under the ally fiction. */
export function isAllyCard(id: string): boolean {
    return registry.has(id);
}
