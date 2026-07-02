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
    it('exports at least 12 early-game skills', () => {
        expect(cardLibrary.length).toBeGreaterThanOrEqual(12);
    });

    it('every skill has the Spec 04b required shape', () => {
        for (const skill of cardLibrary) {
            expect(typeof skill.id).toBe('string');
            expect(skill.id).toMatch(/^[a-z][a-z0-9-]*$/);  // kebab-case
            expect([1, 2, 3]).toContain(skill.tier);
            expect(['self', 'enemy']).toContain(skill.targetType);
            expect(['body', 'mind', 'heart']).toContain(skill.scalingStat);
            expect(['fallacy', 'paradox']).toContain(skill.category);
            expect(typeof skill.basePower).toBe('number');
        }
    });

    it('all skill IDs are unique', () => {
        const ids = cardLibrary.map(s => s.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('library carries at least 3 Tier 3 skills', () => {
        const t3 = cardLibrary.filter(s => s.tier === 3);
        expect(t3.length).toBeGreaterThanOrEqual(3);
    });
});
