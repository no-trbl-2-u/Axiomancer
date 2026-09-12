/**
 * S7-hazard-C04 — the two marks a hazard card prints must be keyed.
 *
 * A first-time player met every card carrying two micro-glyphs with
 * numbers and no names, so the card's actual effect was unreadable. The
 * presenter now owns the key copy (`HAZARD_STAT_KEY`) and the spoken
 * label for a pair (`hazardStatPairLabel`).
 *
 * The suite pins what the finding is about: the key names both types,
 * in the order the card prints them, and a pair announces itself by
 * name and number.
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it } from '@jest/globals';

import { HAZARD_STAT_KEY, hazardStatPairLabel } from '@/state/presenters/hazard.engine';

describe('S7-hazard-C04 — hazard card stat key', () => {
    it('names both progress types in the order a card prints them', () => {
        expect(HAZARD_STAT_KEY.rows.map((r) => r.key)).toEqual(['force', 'escape']);
        expect(HAZARD_STAT_KEY.rows.map((r) => r.label)).toEqual(['FORCE', 'ESCAPE']);
    });

    it('captions how to read the pair', () => {
        expect(HAZARD_STAT_KEY.caption).toMatch(/FORCE/);
        expect(HAZARD_STAT_KEY.caption).toMatch(/ESCAPE/);
    });

    it('announces a pair by name and number, zeros included', () => {
        expect(hazardStatPairLabel(3, 1)).toBe('FORCE 3, ESCAPE 1');
        expect(hazardStatPairLabel(0, 2)).toBe('FORCE 0, ESCAPE 2');
    });
});
