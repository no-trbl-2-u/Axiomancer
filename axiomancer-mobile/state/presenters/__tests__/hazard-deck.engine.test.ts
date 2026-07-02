/**
 * Persistent Hazard deck presenter — hermetic mapping suite (Phase 126).
 *
 * Composition is mechanics truth (`hazardStarterBag` +
 * `appendAcquiredCard`); these tests pin the presenter's grouping,
 * counts, distributions, the removable (acquired-only) set, and the
 * deliberately-blocked remove-card flag.
 */

import { describe, expect, it } from '@jest/globals';

import {
    appendAcquiredCard,
    hazardStarterBag,
    HAZARD_CRACK_CARD,
} from 'axiomancer-mechanics';
import { selectHazardDeckViewModel } from '@/state/presenters/hazard-deck.engine';

function vmOf(flags: string[]) {
    return selectHazardDeckViewModel({ player: null, flags } as never);
}

describe('hazard deck presenter — starter bag baseline', () => {
    it('maps the immutable starter bag with no acquired cards', () => {
        const vm = vmOf([]);
        const starter = hazardStarterBag();
        expect(vm.totalCards).toBe(starter.length);
        expect(vm.acquiredCards).toBe(0);
        expect(vm.starterCards).toBe(starter.length);
        expect(vm.distinctCards).toBe(new Set(starter).size);
        // every entry is starter-only, so nothing is removable
        expect(vm.entries.every((e) => !e.removable)).toBe(true);
        expect(vm.hasRemovable).toBe(false);
    });

    it('always carries the blocked remove-card flag + reason', () => {
        const vm = vmOf([]);
        expect(vm.removeBlocked).toBe(true);
        expect(vm.removeBlockedReason).toMatch(/not yet available/i);
    });

    it('builds colour and type distributions that sum to the deck size', () => {
        const vm = vmOf([]);
        const colourSum = vm.colorTally.reduce((n, r) => n + r.count, 0);
        const typeSum = vm.typeTally.reduce((n, r) => n + r.count, 0);
        // colour omits hex-only cards; the starter bag has none, so it sums whole
        expect(colourSum).toBe(vm.totalCards);
        expect(typeSum).toBe(vm.totalCards);
    });
});

describe('hazard deck presenter — acquired cards', () => {
    it('folds acquired reward cards into counts and marks them removable', () => {
        let flags: string[] = [];
        flags = appendAcquiredCard(flags, 'r_grip');
        flags = appendAcquiredCard(flags, 'r_grip');
        const vm = vmOf(flags);

        expect(vm.acquiredCards).toBe(2);
        expect(vm.totalCards).toBe(hazardStarterBag().length + 2);
        const grip = vm.entries.find((e) => e.cardId === 'r_grip');
        expect(grip).toBeTruthy();
        expect(grip!.acquiredCount).toBe(2);
        expect(grip!.removable).toBe(true);
        expect(vm.hasRemovable).toBe(true);
    });

    it('counts an acquired CRACK as a dead scar card', () => {
        const flags = appendAcquiredCard([], HAZARD_CRACK_CARD.id);
        const vm = vmOf(flags);
        expect(vm.scarCards).toBe(1);
        const scar = vm.entries.find((e) => e.cardId === HAZARD_CRACK_CARD.id);
        expect(scar!.scar).toBe(true);
        // scars sort to the end
        expect(vm.entries[vm.entries.length - 1].scar).toBe(true);
    });

    it('keyword tally weights by copy count and sorts by frequency', () => {
        let flags: string[] = [];
        flags = appendAcquiredCard(flags, 'r_grip');
        const vm = vmOf(flags);
        // tally is descending by count
        for (let i = 1; i < vm.keywordTally.length; i++) {
            expect(vm.keywordTally[i - 1].count).toBeGreaterThanOrEqual(vm.keywordTally[i].count);
        }
        expect(vm.keywordTally.every((k) => k.count > 0)).toBe(true);
    });
});
