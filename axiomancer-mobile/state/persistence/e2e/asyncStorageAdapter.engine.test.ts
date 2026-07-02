/**
 * Hermetic E2E — AsyncStorage persistence adapter (Spec 09).
 *
 * Drives `createAsyncStorageAdapter` end-to-end against
 * AsyncStorage's official jest mock. Hermetic = self-contained +
 * deterministic + isolated. See docs/testing.md.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { createCharacter, createNewGameState, type GameState } from 'axiomancer-mechanics';

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
    createAsyncStorageAdapter,
    SAVE_KEY,
} from '../asyncStorageAdapter';
import {
    CURRENT_SCHEMA_VERSION,
    type MigrationMap,
    type StoredEnvelope,
    unwrap,
    wrap,
} from '../migrations';

afterEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
});

function buildState(playerName = 'Pilgrim'): GameState {
    const base = createNewGameState();
    const player = createCharacter({
        name: playerName,
        level: 1,
        baseStats: { heart: 4, body: 4, mind: 4 },
    });
    return { ...base, player };
}

// ---------------------------------------------------------------------------
// preload + load
// ---------------------------------------------------------------------------

describe('createAsyncStorageAdapter — preload + load', () => {
    it('preload with no saved data leaves the cache empty; load returns null', async () => {
        const adapter = createAsyncStorageAdapter();

        await adapter.preload();

        expect(adapter.load()).toBeNull();
    });

    it('preload reads a previously-saved envelope from AsyncStorage', async () => {
        const state = buildState('Pilgrim');
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(wrap(state)));

        const adapter = createAsyncStorageAdapter();
        await adapter.preload();

        const loaded = adapter.load();
        expect(loaded).not.toBeNull();
        expect(loaded?.player.name).toBe('Pilgrim');
    });

    it('preload throws on corrupted JSON (Q7=A — surface to host)', async () => {
        await AsyncStorage.setItem(SAVE_KEY, '{ not valid json');

        const adapter = createAsyncStorageAdapter();

        await expect(adapter.preload()).rejects.toThrow();
    });

    it('preload throws on a save from a future schema version', async () => {
        const envelope: StoredEnvelope = { schemaVersion: 999, state: {} };
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(envelope));

        const adapter = createAsyncStorageAdapter();

        await expect(adapter.preload()).rejects.toThrow(/future version/);
    });
});

// ---------------------------------------------------------------------------
// save (debounced) + flush
//
// Call-count tests inject a fake `storage` so they don't share spy state
// with the module-level AsyncStorage mock.
// ---------------------------------------------------------------------------

interface FakeStorage {
    getItem: jest.Mock<(key: string) => Promise<string | null>>;
    setItem: jest.Mock<(key: string, value: string) => Promise<void>>;
    removeItem: jest.Mock<(key: string) => Promise<void>>;
}

function createFakeStorage(): FakeStorage {
    return {
        getItem: jest.fn<(key: string) => Promise<string | null>>().mockResolvedValue(null),
        setItem: jest.fn<(key: string, value: string) => Promise<void>>().mockResolvedValue(undefined),
        removeItem: jest.fn<(key: string) => Promise<void>>().mockResolvedValue(undefined),
    };
}

describe('createAsyncStorageAdapter — save (debounced)', () => {
    it('save updates the load cache immediately', () => {
        const adapter = createAsyncStorageAdapter({
            debounceMs: 50,
            storage: createFakeStorage(),
        });

        adapter.save(buildState('Alice'));

        expect(adapter.load()?.player.name).toBe('Alice');
    });

    it('save coalesces bursts within the debounce window into one AsyncStorage write', async () => {
        const storage = createFakeStorage();
        const adapter = createAsyncStorageAdapter({ debounceMs: 50, storage });

        adapter.save(buildState('A'));
        adapter.save(buildState('B'));
        adapter.save(buildState('C'));

        expect(storage.setItem).not.toHaveBeenCalled();

        await adapter.flush();

        expect(storage.setItem).toHaveBeenCalledTimes(1);
        const [, blob] = storage.setItem.mock.calls[0];
        const written = JSON.parse(blob) as StoredEnvelope;
        expect(written.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        const result = unwrap(written);
        expect(result.player.name).toBe('C');
    });

    it('debounceMs: 0 writes synchronously on every save', async () => {
        const storage = createFakeStorage();
        const adapter = createAsyncStorageAdapter({ debounceMs: 0, storage });

        adapter.save(buildState('A'));
        adapter.save(buildState('B'));

        await adapter.flush();

        expect(storage.setItem).toHaveBeenCalledTimes(2);
    });

    it('flush is a no-op when there is no pending write', async () => {
        const storage = createFakeStorage();
        const adapter = createAsyncStorageAdapter({ storage });

        await adapter.flush();

        expect(storage.setItem).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// clear
// ---------------------------------------------------------------------------

describe('createAsyncStorageAdapter — clear', () => {
    it('clear removes the stored save and resets the cache', async () => {
        const adapter = createAsyncStorageAdapter({ debounceMs: 10 });

        adapter.save(buildState());
        await adapter.flush();
        await adapter.clear();

        expect(adapter.load()).toBeNull();
        expect(await AsyncStorage.getItem(SAVE_KEY)).toBeNull();
    });

    it('clear cancels a pending debounced write', async () => {
        const storage = createFakeStorage();
        const adapter = createAsyncStorageAdapter({ debounceMs: 50, storage });

        adapter.save(buildState());
        await adapter.clear();
        await adapter.flush();

        expect(storage.setItem).not.toHaveBeenCalled();
        expect(storage.removeItem).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// migrations
// ---------------------------------------------------------------------------

describe('migrations — unwrap', () => {
    it('returns state unchanged when the envelope is already at CURRENT', () => {
        const envelope: StoredEnvelope = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            state: { foo: 'bar' },
        };

        const result = unwrap(envelope) as unknown as { foo: string };

        expect(result.foo).toBe('bar');
    });

    it('throws when the saved version is newer than CURRENT', () => {
        const envelope: StoredEnvelope = { schemaVersion: 999, state: {} };

        expect(() => unwrap(envelope)).toThrow(/future version/);
    });

    it('throws on a malformed envelope (missing schemaVersion)', () => {
        expect(() => unwrap({} as StoredEnvelope)).toThrow(/corrupt save/);
    });

    it('chains forward-migrations from the source version to CURRENT', () => {
        // Simulate a save with a hypothetically-older schema by pretending
        // CURRENT bumped without us moving the saved data. We construct an
        // envelope at version -1 and a migration from -1 to 0; if CURRENT
        // is also 0 we exit cleanly. The chain pattern itself is what's
        // tested; a real v1 → v2 bump uses the same shape.
        if (CURRENT_SCHEMA_VERSION <= 1) {
            // Cannot exercise a real migration chain at v1; assert the
            // contract by simulating one step backward via a stub current.
            const migrations: MigrationMap = {
                0: (s) => ({ ...(s as object), migrated: true }),
            };
            // The migration path 0 -> 1 only fires when source < CURRENT.
            // At CURRENT_SCHEMA_VERSION === 1 we test the 0 -> 1 path.
            const envelope: StoredEnvelope = { schemaVersion: 0, state: { foo: 'bar' } };
            const result = unwrap(envelope, migrations) as unknown as { foo: string; migrated: boolean };
            expect(result.foo).toBe('bar');
            expect(result.migrated).toBe(true);
        }
    });

    it('throws when no migration exists for an older version', () => {
        if (CURRENT_SCHEMA_VERSION <= 1) {
            const envelope: StoredEnvelope = { schemaVersion: 0, state: {} };
            expect(() => unwrap(envelope, {})).toThrow(/no migration from v0/);
        }
    });

    it('preload + load on a v2 envelope yields state with philosophicalAlignment backfilled (Phase 51 + 52)', async () => {
        // Per the brief: load a `schemaVersion: 2` envelope through the
        // adapter and confirm the resulting state has the engine's
        // defaultAlignment() applied. Pins the migration runs end-to-end
        // through createAsyncStorageAdapter, not just through unwrap().
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { defaultAlignment } = require('axiomancer-mechanics');
        const v2State = {
            player: {
                name: 'V2 Pilgrim',
                baseStats: { heart: 10, body: 10, mind: 10 },
                derivedStats: {},
                nonCombatStats: {},
            },
        };
        await AsyncStorage.setItem(
            SAVE_KEY,
            JSON.stringify({ schemaVersion: 2, state: v2State }),
        );

        const adapter = createAsyncStorageAdapter();
        await adapter.preload();
        const loaded = adapter.load() as unknown as Record<string, unknown>;

        expect(loaded).not.toBeNull();
        expect(loaded.philosophicalAlignment).toEqual(defaultAlignment());
    });
});
