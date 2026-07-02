/**
 * Hermetic e2e tests for persistence schema migrations.
 *
 * Covers the v1 → v2 migration that backfills missing derivedStats
 * and nonCombatStats fields using engine derivation helpers, and
 * the v2 → v3 migration that backfills `state.philosophicalAlignment` (engine
 * Phase 42, mobile Phase 51 bump from 0.7.0 → 0.10.0).
 */

import {
    defaultAlignment,
    deriveStats,
    deriveNonCombatStats,
    createNewGameState,
    GAME_STATE_VERSION,
} from 'axiomancer-mechanics';
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
                knownSkills: [],
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

        test('adds missing derivedStats to v1 save', () => {
            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: mockV1GameState,
            };

            const migrated = unwrap(v1Envelope);
            const expectedDerived = deriveStats(mockBaseStats);

            expect(migrated.player.derivedStats).toEqual(expectedDerived);
        });

        test('adds missing nonCombatStats to v1 save', () => {
            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: mockV1GameState,
            };

            const migrated = unwrap(v1Envelope);
            const expectedNonCombat = deriveNonCombatStats(mockBaseStats);

            expect(migrated.player.nonCombatStats).toEqual(expectedNonCombat);
        });

        test('preserves existing derivedStats if present', () => {
            const existingDerived = {
                physicalAttack: 999,
                physicalSkill: 999,
                physicalDefense: 999,
                mentalAttack: 999,
                mentalSkill: 999,
                mentalDefense: 999,
                emotionalAttack: 999,
                emotionalSkill: 999,
                emotionalDefense: 999,
                luck: 999,
            };

            const v1WithDerived = {
                ...mockV1GameState,
                player: {
                    ...mockV1GameState.player,
                    derivedStats: existingDerived,
                },
            };

            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: v1WithDerived,
            };

            const migrated = unwrap(v1Envelope);

            expect(migrated.player.derivedStats).toEqual(existingDerived);
        });

        test('preserves existing nonCombatStats if present', () => {
            const existingNonCombat = {
                physicalSave: 888,
                mentalSave: 888,
                emotionalSave: 888,
                physicalTest: 888,
                mentalTest: 888,
                emotionalTest: 888,
                maxHealth: 888,
            };

            const v1WithNonCombat = {
                ...mockV1GameState,
                player: {
                    ...mockV1GameState.player,
                    nonCombatStats: existingNonCombat,
                },
            };

            const v1Envelope: StoredEnvelope = {
                schemaVersion: 1,
                state: v1WithNonCombat,
            };

            const migrated = unwrap(v1Envelope);

            expect(migrated.player.nonCombatStats).toEqual(existingNonCombat);
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
                player: {
                    ...mockV1GameState.player,
                    derivedStats: deriveStats(mockBaseStats),
                    nonCombatStats: deriveNonCombatStats(mockBaseStats),
                },
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
        test('an engine-shaped save below GAME_STATE_VERSION is migrated up by the engine', () => {
            // Take a current engine state, knock it back to an older engine
            // version, and strip a field a later engine migration adds. The
            // adapter must delegate to the engine `migrate`, which re-adds it —
            // proving mobile no longer needs per-engine-version steps.
            const current = createNewGameState() as unknown as Record<string, unknown>;
            const stale = {
                ...current,
                version: 9, // engine v9 → factionReputations added at v9→v10
            };
            delete (stale as Record<string, unknown>).factionReputations;

            const result = unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: stale }) as unknown as Record<
                string,
                unknown
            >;

            expect(result.version).toBe(GAME_STATE_VERSION);
            expect(result.factionReputations).toBeDefined();
        });

        test('a current-version engine save passes through untouched', () => {
            const current = createNewGameState();
            const result = unwrap({ schemaVersion: CURRENT_SCHEMA_VERSION, state: current });

            expect(result.version).toBe(GAME_STATE_VERSION);
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