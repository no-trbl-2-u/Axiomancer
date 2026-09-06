/**
 * Hermetic tests — dev reward helpers.
 *
 * Pins:
 *   - The hazard and journal catalogues are non-empty and de-duped.
 *   - `unlockAllJournal` writes through the engine dispatch and is
 *     idempotent.
 *   - `grantXp` is additive; `forceLevelUp` advances `player.level`.
 *   - `learnAllCards` knows every library card exactly once.
 */

import { cardLibrary } from '@mechanics';

import {
    CACHE_TIERS,
    forceLevelUp,
    grantXp,
    learnAllCards,
    listHazards,
    listJournalEntries,
    unlockAllJournal,
} from '@/state/dev/rewards';
import { createAppStore } from '@/state/store';

describe('rewards dev helpers', () => {
    it('catalogues are populated and de-duped', () => {
        expect(CACHE_TIERS.map((t) => t.tier)).toEqual(['modest', 'rich']);
        expect(listHazards().length).toBeGreaterThan(0);
        const ids = listJournalEntries().map((e) => e.id);
        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('unlockAllJournal unlocks every entry once', () => {
        const store = createAppStore();
        const total = listJournalEntries().length;
        expect(unlockAllJournal(store)).toBe(total);
        expect(store.getState().codex.unlockedEntries).toHaveLength(total);
        expect(unlockAllJournal(store)).toBe(0);
    });

    it('grantXp adds experience', () => {
        const store = createAppStore();
        const before = store.getState().player.experience ?? 0;
        expect(grantXp(store, 100)).toBe(before + 100);
        expect(store.getState().player.experience).toBe(before + 100);
    });

    it('forceLevelUp advances the level', () => {
        const store = createAppStore();
        const before = store.getState().player.level;
        expect(forceLevelUp(store)).toBeGreaterThan(before);
    });

    it('learnAllCards knows every library card exactly once', () => {
        const store = createAppStore();
        learnAllCards(store);
        const known = store.getState().player.knownCards;
        expect(new Set(known).size).toBe(known.length);
        for (const c of cardLibrary) expect(known).toContain(c.id);
        expect(learnAllCards(store)).toBe(0);
    });
});
