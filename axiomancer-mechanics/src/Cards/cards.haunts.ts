/**
 * The HAUNT registry (spec 34 R-13: THOUGHTFORM renamed HAUNT) — the cards
 * CONJURE creates (spec 32 v3 §3: "create a one-use Thoughtform card into
 * hand (removed after play / combat end)").
 *
 * WS2.1 (plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md,
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

// ─── Forge — Cinder (conjured by Foundry Sprite, sandbox set
//     'conjure-exercise') ──────────────────────────────────────────────────────

/**
 * Payload choice (WS2.1, against the seed-1 deck-matrix baseline,
 * docs/reports/baselines/deck-matrix-baseline.json — provisional,
 * pre-Phase-26): the forge's pip economy is already its best-fed line
 * (`half-step` aggregates 25,958 plays across the matrix, the theme's
 * most-played card by 3x), while its ONLY status face
 * (`sketch-of-a-thought`'s kindling ember: 2,554 plays / 2,366 lands) is
 * comparatively thin. Doctrine prices status engagement above economy, so
 * Cinder is the EMBER face, not a second pip grant — the conjured token
 * feeds `statusEngagement`, and its DoT is RUPTURE/Overtake fuel the pip
 * line can cash.
 */
const cinder: Card = {
    id: 'ht-cinder',
    theme: 'grave',
    name: 'Cinder',
    philosophicalAspect: 'mind',
    description:
        'A thought struck off the forge, still glowing. It exists to be ' +
        'thrown once — and it does not come back.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    // pts (post-Phase-30 merge re-pin 2026-07-12 — TICK is dead
    // registry-wide, FREE deposits forge's currency, a PIP, instead):
    // ember i3 d3 (printed lifetime 9 → phase-36b tempo-weighted 6.94 ÷ 3 =
    // 2.31; round-clocked ramp-free, so the horizon shaves the round-2/3 ticks)
    // + FREE pip 1 (1.5) = 3.81 → Ash band 1.5-7.5. Verified against scoreCard() in
    // haunts.engine.test.ts (the pricing lint pins only the 50
    // library spells; the haunt suite carries the band check).
    free: { pips: 1 },
    combatEffects: [{ effectId: 'debuff_kindling_ember', appliedTo: 'opponent', intensity: 3, duration: 3 }],
    addedIn: '2026-07-11',
    tags: ['haunt', 'forge', 'dot'],
};

// ─── Peroration — Minor Charge (conjured by Corollary, sandbox set
//     'conjure-exercise') ──────────────────────────────────────────────────────

const minorCharge: Card = {
    id: 'ht-minor-charge',
    theme: 'trial',
    name: 'Minor Charge',
    philosophicalAspect: 'heart',
    description:
        'Small, undeniable, already conceded. Say it once and it has done ' +
        'its work; the case keeps the weight, not the words.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    // pts: CHARGE 1 (0.8) + FREE premise 1 (0.8) = 1.6 → Ash band
    // 1.5-7.5 (floor-adjacent by design: a one-use tally token). Either
    // face cashes the same premise — the FREE face just costs no die.
    free: { premises: 1 },
    specialMechanics: [{ kind: 'premise', count: 1 }],
    addedIn: '2026-07-11',
    tags: ['haunt', 'peroration'],
};

/**
 * Every Haunt in existence. NOT part of the curated library — the library
 * lints do not count these, and no reward/stage/draft pool ever
 * offers one.
 */
export const hauntLibrary: Card[] = [cinder, minorCharge];

const registry = new Map<string, Card>(hauntLibrary.map(card => [card.id, card]));

/** O(1) Haunt lookup by card id (the middle link of `getCardById`'s
 *  sandbox → haunt → library chain). */
export function getHauntById(id: string): Card | undefined {
    return registry.get(id);
}
