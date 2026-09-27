/**
 * THE GREY OFFICE — the whole player card library (the card purge, P1,
 * 2026-09-27; decisions D36, D42–D44).
 *
 * Every other player card — the eight Threadbare starters, the six archetype
 * libraries, the apocrypha, the relic valves and the curses — was purged.
 * New cards arrive only through a guided session with T (D37). These three
 * are the fresh-run deck (Blow 5 / Ward 3 / Word 2, D43) and, since D44, the
 * reward pool.
 *
 * This file is data-only. All runtime behaviour lives in
 * `src/Cards/card.engine.ts` and `src/Combat/combat.engine.ts`.
 */

import type { Card } from '../types';

// ─── THE GREY OFFICE — Phase 104's fresh-run seed ─────────────────────────────
// Colourless shapes (aspect 'any' — every die colour powers them, neutral
// colour-match bonus), theme 'grey'. Deliberately plain: fight one teaches
// STRIKE, WARD, FREE-vs-PAID, and the die-spend loop with zero colour
// arithmetic. Since the purge (D44) they are also the whole reward pool.

const GREY_ADDED = '2026-09-20';

const greyStrike: Card = {
    id: 'grey-strike',
    theme: 'grey',
    name: 'A Plain Blow',
    color: 'any',
    description:
        'No flourish, no colour, no argument. You hit the thing that is ' +
        'hitting you. It works today the same as it will in a month.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'Deal 5.',
    // pts: deliberately under the Ash curve (spoiled-poultice's PAID deals 7
    // plus a DoT for the same die) — the grey office is the deck you outgrow.
    free: { damage: 2 },
    specialMechanics: [{ kind: 'deal', amount: 5 }],
    addedIn: GREY_ADDED,
    tags: ['grey', 'starter'],
};

const greyWard: Card = {
    id: 'grey-ward',
    theme: 'grey',
    name: 'A Plain Ward',
    color: 'any',
    description:
        'No flourish, no colour, no argument. You put something solid ' +
        'between yourself and the thing that wants in.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'self',
    paidSummary: 'GUARD 5.',
    // pts: deliberately under the Ash curve (chilblain-watch's PAID guards 12
    // plus THORNS for the same die) — the grey office is the deck you outgrow.
    free: { guard: 2 },
    specialMechanics: [{ kind: 'guard', amount: 5 }],
    addedIn: GREY_ADDED,
    tags: ['grey', 'starter'],
};

// A Plain Word — T's guided S3 session, 2026-09-27 (D42, D43). The grey
// office's heart verb: VULNERABLE lands on the foe, so heart scales its
// percentage (`stat-scaling.ts`). Grey frame like its siblings.
const greyWord: Card = {
    id: 'grey-word',
    theme: 'grey',
    name: 'A Plain Word',
    color: 'any',
    description:
        'No flourish, no colour, no argument. You tell it plainly what it ' +
        'is, and it cannot unhear you.',
    tier: 1, rank: 1, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'VULNERABLE +25% for 2 turns.',
    // D43: +25% for 2 turns, adds up and refreshes on re-application; FREE is
    // the same verb at whisper volume. Both scale with heart.
    free: { applyEffect: { effectId: 'debuff_vulnerable', intensity: 10, duration: 1 } },
    combatEffects: [{ effectId: 'debuff_vulnerable', appliedTo: 'opponent', intensity: 25, duration: 2 }],
    addedIn: '2026-09-27',
    tags: ['grey', 'starter'],
};

/** The grey office (Phase 104; A Plain Word, D42): the entire player card
 *  library after the purge, and the reward pool (D44). */
export const GREY_OFFICE_CARDS: Card[] = [greyStrike, greyWard, greyWord];
