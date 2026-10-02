/**
 * Unit tests for consequence-copy.ts.
 *
 * Pins every `ConsequenceKind` case of `consequenceLabel` so
 * `/event` and `/dialogue` cannot silently drift on what a
 * consequence chip says.
 *
 * Damage/heal chips say VITAE (the canon word), and quest/progress/card chips
 * never echo the engine slug into player copy. Resolver-level coverage lives in
 * `engine-id-copy.test.ts`.
 */

import { consequenceLabel } from '../consequence-copy';
import type { EventConsequence } from '../event.engine';

describe('consequenceLabel', () => {
    it('renders damage in the canon VITAE word', () => {
        expect(consequenceLabel({ kind: 'damage', amount: 5 })).toBe('-5 VITAE');
    });

    it('renders heal in the canon VITAE word', () => {
        expect(consequenceLabel({ kind: 'heal', amount: 3 })).toBe('+3 VITAE');
    });

    it('renders currency, pluralizing shillings', () => {
        expect(consequenceLabel({ kind: 'currency', amount: 1 })).toBe('+1 shilling');
        expect(consequenceLabel({ kind: 'currency', amount: 25 })).toBe('+25 shillings');
    });

    it('renders an item from its authored label, and no chip for a story flag', () => {
        expect(consequenceLabel({ kind: 'item', label: 'Rusty Key' })).toBe('Rusty Key');
        // A flag id is bookkeeping, never copy.
        expect(consequenceLabel({ kind: 'flag', label: 'marrow_pressed' })).toBe('');
    });

    it('renders quest-start as the errand\'s title', () => {
        expect(consequenceLabel({ kind: 'quest-start', label: 'fixture-quest' })).toBe(
            'new errand · Fixture Quest',
        );
    });

    it('renders quest-progress and card-learn without echoing the id', () => {
        expect(consequenceLabel({ kind: 'quest-progress', label: 'fixture-quest' })).toBe(
            'errand · Fixture Quest',
        );
        expect(consequenceLabel({ kind: 'card-learn', label: 'thin-hymn' })).toBe(
            'new card · Thin Hymn',
        );
    });

    it('returns empty string for an unrecognized kind', () => {
        expect(consequenceLabel({ kind: 'unknown' as EventConsequence['kind'] })).toBe('');
    });
});
