/**
 * Unit tests for consequence-copy.ts (Phase 46c).
 *
 * Ported verbatim out of `app/event/index.tsx`'s dead local
 * `consequenceLabel` — pinning every `ConsequenceKind` case so
 * `/event` and `/dialogue` cannot silently drift on what a
 * consequence chip says.
 *
 * FE-002 (2026-09-12 fresh-eyes sweep) rewrote four of these expectations.
 * They had pinned the defect: the damage/heal branches said HP where the canon
 * word is VITAE, and the quest/progress/card branches echoed the engine slug
 * (`quest: starting-quest`) into player copy. The cases are still pinned —
 * against the fixed strings. Resolver-level coverage lives in
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

    it('renders moral shift with an explicit sign', () => {
        expect(consequenceLabel({ kind: 'moral', amount: 2 })).toBe('+2 grace');
        expect(consequenceLabel({ kind: 'moral', amount: -2 })).toBe('-2 grace');
        expect(consequenceLabel({ kind: 'moral', amount: 0 })).toBe('0 grace');
    });

    it('renders an item from its authored label, and no chip for a story flag', () => {
        expect(consequenceLabel({ kind: 'item', label: 'Rusty Key' })).toBe('Rusty Key');
        // A flag id is bookkeeping, never copy — FE-002.
        expect(consequenceLabel({ kind: 'flag', label: 'marrow_pressed' })).toBe('');
    });

    it('renders quest-start — the chip Old Marrow\'s accept reply needs', () => {
        expect(consequenceLabel({ kind: 'quest-start', label: 'starting-quest' })).toBe(
            'new errand · The King of Revenge',
        );
    });

    it('renders quest-progress and card-learn without echoing the id', () => {
        expect(consequenceLabel({ kind: 'quest-progress', label: 'starting-quest' })).toBe(
            'errand · The King of Revenge',
        );
        expect(consequenceLabel({ kind: 'card-learn', label: 'thin-hymn' })).toBe(
            'new card · Thin Hymn',
        );
    });

    it('returns empty string for an unrecognized kind', () => {
        expect(consequenceLabel({ kind: 'unknown' as EventConsequence['kind'] })).toBe('');
    });
});
