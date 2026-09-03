/**
 * Hermetic E2E — pricing sanity guard.
 *
 * The rank-band lint, the DoT arithmetic anchors, and the pinned
 * VERB_POINTS/CONDITION_DISCOUNTS constants were repealed on 2026-09-02
 * (see plan/2026-09-02-big-numbers-overhaul.prompt.md §3 L17, §10). This
 * file now only asserts `scoreCard` is a well-formed number — a bug
 * detector, not a balance law — so the library can be rescaled freely.
 *
 * Curse cards stay exempt from the non-negative half: they are deliberately
 * worthless enemy-injected junk by design (not a rank-priced reward), and
 * `scoreCard` can legitimately read negative for one. `Number.isFinite` is
 * still required of every card, curses included.
 */

import { describe, it, expect } from 'vitest';

import { cardLibrary } from '../cards.library';
import { scoreCard } from '../cards.pricing';

describe('pricing sanity — scoreCard is always a well-formed number', () => {
    it.each(cardLibrary.map(c => [c.id, c] as const))('%s scores a finite number', (_id, card) => {
        const pts = scoreCard(card);
        expect(Number.isFinite(pts), `${card.id} scored a non-finite value: ${pts}`).toBe(true);
    });

    it.each(cardLibrary.filter(c => c.theme !== 'curse').map(c => [c.id, c] as const))(
        '%s (non-curse) scores non-negative',
        (_id, card) => {
            const pts = scoreCard(card);
            expect(pts, `${card.id} scored negative: ${pts}`).toBeGreaterThanOrEqual(0);
        },
    );
});
