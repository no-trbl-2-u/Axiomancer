/**
 * Hermetic e2e tests for persistence schema migrations.
 *
 * Covers the v1 → v2 migration that validates the save's base stats
 * (it no longer backfills derivedStats / nonCombatStats — those stats were
 * deleted from the engine in TRIM THE FAT T2a), and
 * the v2 → v3 migration that backfills `state.philosophicalAlignment` (engine
 * Phase 42, mobile Phase 51 bump from 0.7.0 → 0.10.0).
 */

import {
    defaultAlignment,
    createNewGameState,
    GAME_STATE_VERSION,
} from '@mechanics';
import { unwrap, wrap, CURRENT_SCHEMA_VERSION, DEFAULT_MIGRATIONS, type StoredEnvelope } from '../migrations';

describe('migrations.engine', () => {
    describe('v1 → v2 migration', () => {
        const mockBaseStats = {
            heart: 10,
            body: 12,
            mind: 8,
        };

        const mockV1GameState = {
            player: {
                name: 'Test Player',
                level: 1,
                experience: 0,
                experienceToNextLevel: 100,
                baseStats: mockBaseStats,
                inventory: [],
                currency: 0,
                effects: [],
                knownCards: [],
                equippedSkills: [],
            },
            combat: null,
            world: {
                currentMap: 'coastal',
                currentNode: 'start',
                visitedNodes: ['start'],
                unlockedMaps: ['coastal'],
                completedMaps: [],
                questLog: {},
                moralMeter: 0,
                uniqueEvents: {},
            },
            version: '0.4.0',
        };

        test('passes a valid v1 save through unchanged', () => {
            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: mockV1GameState,
            };

            const migrated = unwrap(v1Envelope) as unknown as Record<string, unknown>;

            expect(migrated.player).toEqual(mockV1GameState.player);
        });

        test('does not add the retired derivedStats / nonCombatStats keys', () => {
            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: mockV1GameState,
            };

            const migrated = unwrap(v1Envelope) as unknown as { player: Record<string, unknown> };

            expect(migrated.player).not.toHaveProperty('derivedStats');
            expect(migrated.player).not.toHaveProperty('nonCombatStats');
        });

        test('throws on malformed player data', () => {
            const malformedEnvelope: StoredEnvelope = {
                schemaVersion: 1,
                state: {
                    player: null, // Missing player
                },
            };

            expect(() => unwrap(malformedEnvelope)).toThrow('Migration v1→v2: missing player.baseStats');
        });

        test('throws on missing baseStats', () => {
            const malformedEnvelope: StoredEnvelope = {
                schemaVersion: 1,
                state: {
                    player: {
                        name: 'Test',
                        // missing baseStats
                    },
                },
            };

            expect(() => unwrap(malformedEnvelope)).toThrow('Migration v1→v2: missing player.baseStats');
        });

        test('throws on invalid baseStats structure', () => {
            const malformedEnvelope: StoredEnvelope = {
                schemaVersion: 1,
                state: {
                    player: {
                        baseStats: {
                            heart: 'invalid', // Should be number
                            body: 10,
                            mind: 10,
                        },
                    },
                },
            };

            expect(() => unwrap(malformedEnvelope)).toThrow('Migration v1→v2: invalid baseStats structure');
        });

        test('v2 envelope migrates to v3 by backfilling philosophicalAlignment', () => {
            const v2State = {
                ...mockV1GameState,
                player: { ...mockV1GameState.player },
            };

            const v2Envelope: StoredEnvelope = {
                schemaVersion: 2,
                state: v2State,
            };

            const result = unwrap(v2Envelope) as unknown as Record<string, unknown>;

            expect(result.philosophicalAlignment).toEqual(defaultAlignment());
            // Other fields pass through untouched.
            expect((result as { player: unknown }).player).toEqual(v2State.player);
        });
    });

    describe('v2 → v3 migration (alignment backfill, engine 0.10.0)', () => {
        test('adds philosophicalAlignment when missing, using defaultAlignment()', () => {
            const v2State = { player: { name: 'Pilgrim' } };
            const result = unwrap({ schemaVersion: 2, state: v2State }) as unknown as Record<string, unknown>;

            expect(result.philosophicalAlignment).toEqual(defaultAlignment());
        });

        test('preserves philosophicalAlignment if already present (no overwrite)', () => {
            const existing = { ...defaultAlignment(), epistemology: 42 };
            const v2State = {
                player: { name: 'Pilgrim' },
                philosophicalAlignment: existing,
            };
            const result = unwrap({ schemaVersion: 2, state: v2State }) as unknown as Record<string, unknown>;

            expect(result.philosophicalAlignment).toEqual(existing);
        });

        test('rejects non-object state', () => {
            const envelope: StoredEnvelope = { schemaVersion: 2, state: null };
            expect(() => unwrap(envelope)).toThrow('Migration v2→v3: invalid state object');
        });
    });

    describe('engine migration delegation (engine owns GameState versioning)', () => {
        test('an engine-shaped save below GAME_STATE_VERSION is rejected (old-save migration was dropped)', () => {
            // Old-save migration was removed (2026-07-08): only the current
            // engine version loads. A below-current save throws, surfacing to
            // the host so it can start a fresh game.
            const current = createNewGameState() as unknown as Record<string, unknown>;
            const stale = { ...current, version: 9 };

            expect(() =>
                unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: stale }),
            ).toThrow(/not supported/);
        });

        test('a current-version engine save passes through untouched', () => {
            const current = createNewGameState();
            const result = unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: current });

            expect(result.version).toBe(GAME_STATE_VERSION);
        });

        // Phase 53b — lastSeenAlignmentCells is a plain optional field on
        // GameState (no bump needed: absent-after-migration reads as "no
        // prior observation", the correct first-visit behaviour). Pin the
        // round-trip so a future envelope change can't silently drop it.
        test('lastSeenAlignmentCells survives a save/load round-trip when present', () => {
            const current = createNewGameState();
            const withObservation = { ...current, lastSeenAlignmentCells: { 'captain-blackwater': 'cell-13' } };

            const result = unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: withObservation });

            expect(result.lastSeenAlignmentCells).toEqual({ 'captain-blackwater': 'cell-13' });
        });

        test('lastSeenAlignmentCells stays absent (not defaulted to {}) when the save never wrote it', () => {
            const current = createNewGameState() as unknown as Record<string, unknown>;
            expect(current.lastSeenAlignmentCells).toBeUndefined();

            const result = unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: current }) as unknown as Record<string, unknown>;

            expect(result.lastSeenAlignmentCells).toBeUndefined();
        });
    });

    describe('migration infrastructure', () => {
        test('current schema version is 3', () => {
            expect(CURRENT_SCHEMA_VERSION).toBe(3);
        });

        test('DEFAULT_MIGRATIONS contains v1→v2 migration', () => {
            expect(DEFAULT_MIGRATIONS[1]).toBeDefined();
            expect(typeof DEFAULT_MIGRATIONS[1]).toBe('function');
        });

        test('DEFAULT_MIGRATIONS contains v2→v3 migration', () => {
            expect(DEFAULT_MIGRATIONS[2]).toBeDefined();
            expect(typeof DEFAULT_MIGRATIONS[2]).toBe('function');
        });

        test('wrap creates envelope with current schema version', () => {
            const mockState = {} as any;
            const envelope = wrap(mockState);

            expect(envelope.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
            expect(envelope.state).toBe(mockState);
        });
    });
});