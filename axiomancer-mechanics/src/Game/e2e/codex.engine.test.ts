/**
 * Phase 73 — Codex / journal-entry surface (closes GH#65 ask 3).
 *
 * Pins the auto-firing unlock matrix on friendship outcomes + the
 * dispatchable `unlockCodexEntry` surface + the v6 → v7 migration
 * that defaults the codex slice on legacy saves. The brief at
 * `plan/phases/phase_73_codex_journal_surface.md` lays out the
 * decisions D1..D13 these cases pin.
 */
import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { migrate } from '../game.migrate';
import {
    MournfulGull,
    TidepoolCrab,
} from '../../Enemy/enemy.library';

describe('Phase 73 — codex / journal-entry surface', () => {
    it('new game starts with an empty codex slice', () => {
        const state = createNewGameState();
        expect(state.codex).toEqual({ unlockedEntries: [] });
    });

    it('befriending MournfulGull unlocks codex entry + surfaces { id, title } on report', () => {
        const store = createGameStore(nullAdapter);
        // Drive a friendship outcome directly — combat resolution lives outside
        // the store now, so endCombat takes the resolved outcome.
        store.getState().startCombat(MournfulGull);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(store.getState().codex.unlockedEntries).toContain('codex-mournful-gull');
        expect(report.friendshipReward?.codexEntryUnlocked).toEqual({
            id: 'codex-mournful-gull',
            title: 'The Catalogue of Slights',
        });
    });

    it('unlockCodexEntry de-dupes on repeat dispatch', () => {
        const store = createGameStore(nullAdapter);
        store.getState().unlockCodexEntry('codex-test');
        store.getState().unlockCodexEntry('codex-test'); // repeat
        expect(store.getState().codex.unlockedEntries).toEqual(['codex-test']);
    });

    it('TidepoolCrab (no journalEntry) friendship leaves codex empty + no report field', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(TidepoolCrab);
        const report = store.getState().endCombat('friendship');
        expect(report.outcome).toBe('friendship');
        expect(store.getState().codex.unlockedEntries).toEqual([]);
        expect(report.friendshipReward?.codexEntryUnlocked).toBeUndefined();
    });

    it('victory outcome against MournfulGull does NOT unlock the codex entry', () => {
        const store = createGameStore(nullAdapter);
        store.getState().startCombat(MournfulGull);
        const report = store.getState().endCombat('victory');
        expect(report.outcome).toBe('victory');
        expect(store.getState().codex.unlockedEntries).toEqual([]);
        expect(report.friendshipReward).toBeUndefined();
    });

    it('migrateV6toV7 defaults codex on legacy v6 saves', () => {
        const fresh = createNewGameState();
        const { codex: _drop, ...rest } = fresh;
        const v6Payload = { ...rest, version: 6 };
        const migrated = migrate(v6Payload, 6);
        expect(migrated.version).toBe(GAME_STATE_VERSION);
        expect(migrated.codex).toEqual({ unlockedEntries: [] });
        // Other fields pass through.
        expect(migrated.runId).toBe(fresh.runId);
        expect(migrated.moralMeter).toBe(fresh.moralMeter);
    });
});
