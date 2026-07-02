/**
 * Phase 72 — Run-loop semantics (closes GH#65 ask 2).
 *
 * Pins the preserve / reset matrix for `resetRun({ keepCharacter })` plus
 * the v5 → v6 migration that defaults `runId` on legacy saves. The phase
 * brief at `plan/phases/phase_72_run_loop_semantics.md` lays out the
 * decisions D1..D15 these cases pin.
 */
import { describe, it, expect } from 'vitest';
import { createGameStore } from '../store';
import { nullAdapter } from '../persistence/null.adapter';
import { createNewGameState, GAME_STATE_VERSION } from '../game.reducer';
import { migrate } from '../game.migrate';
import { STARTING_REGION } from '../run-loop';
import { getMapDefinition } from '../../World';
import { TidepoolCrab } from '../../Enemy/enemy.library';

describe('Phase 72 — run-loop semantics', () => {
    it('createNewGameState assigns a fresh 16-char hex runId', () => {
        const state = createNewGameState();
        expect(state.runId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('resetRun({ keepCharacter: true }) preserves player identity + refills HP', () => {
        const store = createGameStore(nullAdapter);
        const before = store.getState();
        // Mutate health below max so the refill is observable.
        const damaged = {
            ...before.player,
            health: 1,
        };
        store.setState({ player: damaged });
        const next = store.getState().resetRun({ keepCharacter: true });
        expect(next.player.id).toBe(before.player.id);
        expect(next.player.name).toBe(before.player.name);
        expect(next.player.level).toBe(before.player.level);
        expect(next.player.baseStats).toEqual(before.player.baseStats);
        expect(next.player.equipment).toEqual(before.player.equipment);
        expect(next.player.knownSkills).toEqual(before.player.knownSkills);
        expect(next.player.inventory).toEqual(before.player.inventory);
        expect(next.player.health).toBe(next.player.maxHealth); // D1 — HP refill
        expect(next.player.effects).toEqual([]); // D1 — defensive clear
    });

    it('keepCharacter: true preserves philosophicalAlignment + moralMeter (character ledger)', () => {
        const store = createGameStore(nullAdapter);
        // Shift both ledgers so the preserve assertion is meaningful.
        store.getState().shiftMoralMeter(15);
        store.getState().shiftPhilosophicalAlignment({ outlook: 20 });
        const before = store.getState();
        const next = store.getState().resetRun({ keepCharacter: true });
        expect(next.moralMeter).toBe(before.moralMeter);
        expect(next.philosophicalAlignment).toEqual(before.philosophicalAlignment);
    });

    it('keepCharacter: true resets world / combat / quests / flags / observer cache', () => {
        const store = createGameStore(nullAdapter, {
            flags: ['pre-reset-flag'],
            lastSeenAlignmentCells: { 'old-marrow': 'mid-mid-mid' },
        });
        store.getState().startCombat(TidepoolCrab);
        expect(store.getState().currentEncounter).toBeDefined();
        const next = store.getState().resetRun({ keepCharacter: true });
        expect(next.currentEncounter).toBeUndefined();
        expect(next.flags).toEqual([]);
        expect(next.quests.active).toEqual([]);
        expect(next.lastSeenAlignmentCells).toBeUndefined(); // D12
        // World resets back to STARTING_REGION's starting node
        // (createStartingWorld pattern; D5).
        const startingNodeId = getMapDefinition(
            'coastal-continent',
            STARTING_REGION,
        ).startingNode.id;
        expect(next.world.currentMap.name).toBe(STARTING_REGION);
        expect(next.world.currentMap.currentNode).toBe(startingNodeId);
    });

    it('resetRun generates a new runId distinct from the pre-reset', () => {
        const store = createGameStore(nullAdapter);
        const before = store.getState().runId;
        const next = store.getState().resetRun({ keepCharacter: true });
        expect(next.runId).not.toBe(before);
        expect(next.runId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('keepCharacter: false performs full new-game reset (level 1 / default alignment / moralMeter 0)', () => {
        const store = createGameStore(nullAdapter);
        store.getState().shiftMoralMeter(50);
        store.getState().shiftPhilosophicalAlignment({ epistemology: 40 });
        const before = store.getState();
        const next = store.getState().resetRun({ keepCharacter: false });
        expect(next.player.id).not.toBe(before.player.id); // fresh character
        expect(next.player.level).toBe(1);
        expect(next.moralMeter).toBe(0);
        expect(next.philosophicalAlignment).toEqual({ epistemology: 0, outlook: 0, scope: 0 });
        expect(next.runId).not.toBe(before.runId);
        expect(next.runId).toMatch(/^[0-9a-f]{16}$/);
    });

    it('migrateV5toV6 defaults runId on legacy saves; other fields pass through', () => {
        // Build a v5 payload (current shape minus runId, version forced to 5).
        const fresh = createNewGameState();
        const { runId: _drop, ...rest } = fresh;
        const v5Payload = { ...rest, version: 5, moralMeter: 11 };
        const migrated = migrate(v5Payload, 5);
        expect(migrated.version).toBe(GAME_STATE_VERSION);
        expect(migrated.runId).toMatch(/^[0-9a-f]{16}$/);
        expect(migrated.moralMeter).toBe(11); // pass-through
        expect(migrated.player).toEqual(fresh.player); // pass-through
    });

    it('resetRun persists through the adapter on the new runId (DURABLE_ACTIONS)', () => {
        let lastSave: { runId: string } | null = null;
        const captureAdapter = {
            load: () => null,
            save: (state: { runId: string }) => {
                lastSave = state;
            },
        };
        const store = createGameStore(captureAdapter);
        const before = store.getState().runId;
        const next = store.getState().resetRun({ keepCharacter: true });
        expect(lastSave).not.toBeNull();
        expect(lastSave!.runId).toBe(next.runId);
        expect(lastSave!.runId).not.toBe(before);
    });
});
