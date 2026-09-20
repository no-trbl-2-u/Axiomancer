/**
 * Hermetic unit tests — combat-cards adapter (Phase 16).
 *
 * Pins the mapping contract from the engine's `Card` to the
 * mobile `CombatCardOption` row: shape coverage, name uppercased,
 * stance literal-union safety.
 */

import { describe, expect, it } from '@jest/globals';
import { cardLibrary } from '@mechanics';

import {
    COMBAT_CARDS,
    getCombatCardById,
    type CombatCardOption,
} from '@/state/selectors/combat-cards';

describe('COMBAT_CARDS: library coverage', () => {
    it('mirrors the engine library length 1:1', () => {
        expect(COMBAT_CARDS).toHaveLength(cardLibrary.length);
    });

    it('every entry has a non-empty id, name, description', () => {
        for (const card of COMBAT_CARDS) {
            expect(card.id.length).toBeGreaterThan(0);
            expect(card.name.length).toBeGreaterThan(0);
            expect(card.description.length).toBeGreaterThan(0);
        }
    });

    it('every name is uppercase', () => {
        for (const card of COMBAT_CARDS) {
            expect(card.name).toBe(card.name.toUpperCase());
        }
    });

    it('every stance is a known StanceKey literal', () => {
        const known: ReadonlyArray<CombatCardOption['stance']> = ['heart', 'body', 'mind', 'any'];
        for (const card of COMBAT_CARDS) {
            expect(known).toContain(card.stance);
        }
    });
});

describe('getCombatCardById: resolution', () => {
    it('returns the mapped row for a known engine id', () => {
        const first = COMBAT_CARDS[0];
        const found = getCombatCardById(first.id);
        expect(found).not.toBeNull();
        expect(found!.id).toBe(first.id);
        expect(found!.name).toBe(first.name);
    });

    it('returns null for an unknown id (e.g. legacy pre-Phase-16 ids)', () => {
        expect(getCombatCardById('not-a-real-card')).toBeNull();
        // Legacy mock id from the fixture that did NOT match an engine id.
        expect(getCombatCardById('ad-hominem')).toBeNull();
    });

    it('round-trips: every COMBAT_CARDS entry resolves via id', () => {
        for (const card of COMBAT_CARDS) {
            const resolved = getCombatCardById(card.id);
            expect(resolved).toEqual(card);
        }
    });
});
