/**
 * Unit tests for consequence-copy.ts (Phase 46c).
 *
 * Ported verbatim out of `app/event/index.tsx`'s dead local
 * `consequenceLabel` — pinning every `ConsequenceKind` case so
 * `/event` and `/dialogue` cannot silently drift on what a
 * consequence chip says.
 */

import { consequenceLabel } from '../consequence-copy';
import type { EventConsequence } from '../event.engine';

describe('consequenceLabel', () => {
    it('renders damage', () => {
        expect(consequenceLabel({ kind: 'damage', amount: 5 })).toBe('-5 HP');
    });

    it('renders heal', () => {
        expect(consequenceLabel({ kind: 'heal', amount: 3 })).toBe('+3 HP');
    });

    it('renders currency, pluralizing shillings', () => {
        expect(consequenceLabel({ kind: 'currency', amount: 1 })).toBe('+1 shilling');
        expect(consequenceLabel({ kind: 'currency', amount: 25 })).toBe('+25 shillings');
    });

    it('renders moral shift with an explicit sign', () => {
        expect(consequenceLabel({ kind: 'moral', amount: 2 })).toBe('+2 grace');
        expect(consequenceLabel({ kind: 'moral', amount: -2 })).toBe('-2 grace');
        expect(consequenceLabel({ kind: 'moral', amount: 0 })).toBe('0 grace');
    });

    it('renders item and flag from label', () => {
        expect(consequenceLabel({ kind: 'item', label: 'Rusty Key' })).toBe('Rusty Key');
        expect(consequenceLabel({ kind: 'flag', label: 'marrow_pressed' })).toBe('marrow_pressed');
    });

    it('renders quest-start — the chip Old Marrow\'s accept reply needs', () => {
        expect(consequenceLabel({ kind: 'quest-start', label: 'starting-quest' })).toBe(
            'quest: starting-quest',
        );
    });

    it('renders quest-progress and card-learn', () => {
        expect(consequenceLabel({ kind: 'quest-progress', label: 'starting-quest' })).toBe(
            'progress: starting-quest',
        );
        expect(consequenceLabel({ kind: 'card-learn', label: 'Fireball' })).toBe('card: Fireball');
    });

    it('returns empty string for an unrecognized kind', () => {
        expect(consequenceLabel({ kind: 'unknown' as EventConsequence['kind'] })).toBe('');
    });
});
