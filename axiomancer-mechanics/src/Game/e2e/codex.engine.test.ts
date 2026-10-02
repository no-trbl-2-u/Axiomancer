/**
 * Codex / journal-entry surface.
 *
 * Pins the auto-firing unlock matrix on friendship outcomes + the
 * dispatchable `unlockCodexEntry` surface.
 */
import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { createNewGameState } from '../game.reducer';
import { BrineHag, FloatEye } from '../../Enemy/enemy.library';

describe('Phase 73 — codex / journal-entry surface', () => {
    it('new game starts with an empty codex slice', () => {
        const state = createNewGameState();
        expect(state.codex).toEqual({ unlockedEntries: [] });
    });

    it('befriending BrineHag unlocks codex entry + surfaces { id, title } on report', () => {
        const store = createGameStore(nullAdapter);
        // Drive a friendship outcome directly — combat resolution lives outside
        // the store now, so endCombat takes the resolved outcome.
        store.getState().startCombat(BrineHag);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(store.getState().codex.unlockedEntries).toContain('codex-brine-hag');
        expect(report.friendshipReward?.codexEntryUnlocked).toEqual({
            id: 'codex-brine-hag',
            title: 'The Face Broker',
        });
    });

    it('unlockCodexEntry de-dupes on repeat dispatch', () => {
        const store = createGameStore(nullAdapter);
        store.getState().unlockCodexEntry('codex-test');
        store.getState().unlockCodexEntry('codex-test'); // repeat
        expect(store.getState().codex.unlockedEntries).toEqual(['codex-test']);
    });

    it('FloatEye (no journalEntry) friendship leaves codex empty + no report field', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(FloatEye);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(store.getState().codex.unlockedEntries).toEqual([]);
        expect(report.friendshipReward?.codexEntryUnlocked).toBeUndefined();
    });

    it('victory outcome against BrineHag does NOT unlock the codex entry', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(BrineHag);
        const report = store.getState().endCombat('victory');
        expect(report.outcome).toBe('victory');
        expect(store.getState().codex.unlockedEntries).toEqual([]);
        expect(report.friendshipReward).toBeUndefined();
    });

});
