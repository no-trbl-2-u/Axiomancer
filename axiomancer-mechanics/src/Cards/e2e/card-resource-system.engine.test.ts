/**
 * Hermetic E2E Tests — Card Library structural invariants (Spec 04b)
 *
 * Covers the card library's structural invariants via the live engine entry
 * point (`cardLibrary`).
 *
 *   - Self-contained: no disk I/O, no network, no TTY.
 *   - Isolated: `vi.restoreAllMocks()` in `afterEach`.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';

import { cardLibrary } from '../cards.library';

afterEach(() => {
    vi.restoreAllMocks();
});

// ─── Library structural invariants ───────────────────────────────────────────

describe('Card library structural invariants', () => {
    it('exports at least 12 early-game cards', () => {
        expect(cardLibrary.length).toBeGreaterThanOrEqual(12);
    });

    it('every card has the Spec 04b required shape', () => {
        for (const card of cardLibrary) {
            expect(typeof card.id).toBe('string');
            expect(card.id).toMatch(/^[a-z][a-z0-9-]*$/);  // kebab-case
            expect([1, 2, 3]).toContain(card.tier);
            expect(['self', 'enemy']).toContain(card.targetType);
            expect(['body', 'mind', 'heart', 'any']).toContain(card.philosophicalAspect);
            // Spec 32 v3 — the quality axis + card type replace the deleted
            // basePower/scalingStat damage fields (THE STRIKE IS DEAD).
            expect([1, 2, 3, 4, 5, 6]).toContain(card.rank);
            expect(['spell', 'oath', 'hex']).toContain(card.cardType);
        }
    });

    it('all card IDs are unique', () => {
        const ids = cardLibrary.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('library carries at least 3 Tier 3 cards', () => {
        const t3 = cardLibrary.filter(s => s.tier === 3);
        expect(t3.length).toBeGreaterThanOrEqual(3);
    });
});
