/**
 * AXM Log — mobile integration tests (state/logging.ts).
 *
 * Covers the action wrapper contract (passthrough, rethrow, promise
 * settle, durations), the read-only `__AXM_LOG__` bridge, and the
 * crash-tail sink (bounded write, debounce, previous-session read).
 */

import {
    getLogger,
    resetLoggingForTests,
} from '@mechanics';

import {
    __resetAppLoggingForTests,
    flushLogTail,
    getPrevSessionLogTail,
    initAppLogging,
    LOG_TAIL_DEBOUNCE_MS,
    LOG_TAIL_FAST_FLUSH_MS,
    LOG_TAIL_KEY,
    wrapActionsWithLogging,
    type AxmLogBridge,
} from '../logging';

function makeStorage(initial: Record<string, string> = {}) {
    const map = new Map(Object.entries(initial));
    return {
        getItem: jest.fn(async (k: string) => map.get(k) ?? null),
        setItem: jest.fn(async (k: string, v: string) => {
            map.set(k, v);
        }),
        removeItem: jest.fn(async (k: string) => {
            map.delete(k);
        }),
        _map: map,
    };
}

afterEach(() => {
    jest.useRealTimers();
    __resetAppLoggingForTests();
    resetLoggingForTests();
    delete (globalThis as Record<string, unknown>).__AXM_LOG__;
    delete (globalThis as Record<string, unknown>).__AXM_LOG_LEVEL__;
});

describe('wrapActionsWithLogging', () => {
    beforeEach(() => {
        initAppLogging({ storage: makeStorage() });
        getLogger().clear();
    });

    it('passes through sync return values and logs a debug action entry', () => {
        const actions = wrapActionsWithLogging({
            add: (a: number, b: number) => a + b,
            notAFunction: 42 as unknown,
        });
        expect(actions.add(2, 3)).toBe(5);
        expect(actions.notAFunction).toBe(42);
        const entries = getLogger().entries({ domains: ['action'] });
        expect(entries).toHaveLength(1);
        expect(entries[0].kind).toBe('add');
        expect(entries[0].level).toBe('debug');
        expect(typeof (entries[0].data as { durationMs: number }).durationMs).toBe('number');
    });

    it('rethrows sync errors after logging an error entry', () => {
        const actions = wrapActionsWithLogging({
            boom: () => {
                throw new Error('kaput');
            },
        });
        expect(() => actions.boom()).toThrow('kaput');
        const errors = getLogger().entries({ domains: ['action'], minLevel: 'error' });
        expect(errors).toHaveLength(1);
        expect(errors[0].kind).toBe('boom');
        expect((errors[0].data as { message: string }).message).toBe('kaput');
    });

    it('logs promise-returning actions on settle without altering results', async () => {
        const actions = wrapActionsWithLogging({
            ok: async () => 'value',
            fail: async () => {
                throw new Error('async kaput');
            },
        });
        await expect(actions.ok()).resolves.toBe('value');
        await expect(actions.fail()).rejects.toThrow('async kaput');
        const entries = getLogger().entries({ domains: ['action'] });
        expect(entries.map((e) => [e.kind, e.level])).toEqual([
            ['ok', 'debug'],
            ['fail', 'error'],
        ]);
    });
});

describe('__AXM_LOG__ bridge', () => {
    it('exposes a frozen read-only view over the logger', () => {
        initAppLogging({ storage: makeStorage() });
        const bridge = (globalThis as Record<string, unknown>).__AXM_LOG__ as AxmLogBridge;
        expect(bridge).toBeDefined();
        expect(Object.isFrozen(bridge)).toBe(true);

        getLogger().info('ui', 'bridge-witness', { n: 1 });
        const tail = bridge.tail(5);
        expect(tail.some((e) => e.kind === 'bridge-witness')).toBe(true);
        expect(bridge.stats().total).toBeGreaterThan(0);
        expect(bridge.entries({ kind: 'bridge-witness' })).toHaveLength(1);
    });

    it('honors the __AXM_LOG_LEVEL__ inward override', () => {
        (globalThis as Record<string, unknown>).__AXM_LOG_LEVEL__ = 'warn';
        initAppLogging({ storage: makeStorage() });
        getLogger().clear();
        getLogger().info('ui', 'filtered-out');
        getLogger().warn('ui', 'kept');
        expect(getLogger().entries().map((e) => e.kind)).toEqual(['kept']);
    });

    it('init is idempotent — remounts do not stack sinks', () => {
        const storage = makeStorage();
        initAppLogging({ storage });
        initAppLogging({ storage });
        getLogger().clear();
        getLogger().info('ui', 'once');
        // One console mirror + one crash-tail sink means the entry is
        // buffered exactly once regardless of double-init.
        expect(getLogger().entries({ kind: 'once' })).toHaveLength(1);
    });
});

describe('crash tail', () => {
    it('debounces quiet writes and fast-flushes on warn/error', async () => {
        jest.useFakeTimers();
        const storage = makeStorage();
        initAppLogging({ storage });
        getLogger().clear();
        storage.setItem.mockClear();

        getLogger().info('ui', 'quiet');
        jest.advanceTimersByTime(LOG_TAIL_FAST_FLUSH_MS + 10);
        expect(storage.setItem).not.toHaveBeenCalled();

        getLogger().error('error', 'urgent');
        jest.advanceTimersByTime(LOG_TAIL_FAST_FLUSH_MS + 10);
        await Promise.resolve();
        expect(storage.setItem).toHaveBeenCalledTimes(1);
        const [key, payload] = storage.setItem.mock.calls[0] as [string, string];
        expect(key).toBe(LOG_TAIL_KEY);
        const envelope = JSON.parse(payload) as { entries: { kind: string }[] };
        expect(envelope.entries.map((e) => e.kind)).toEqual(
            expect.arrayContaining(['quiet', 'urgent']),
        );

        // The quiet path flushes on its own debounce too.
        storage.setItem.mockClear();
        getLogger().info('ui', 'later');
        jest.advanceTimersByTime(LOG_TAIL_DEBOUNCE_MS + 10);
        await Promise.resolve();
        expect(storage.setItem).toHaveBeenCalledTimes(1);
    });

    it('flushLogTail forces the write and the tail excludes debug entries', async () => {
        const storage = makeStorage();
        initAppLogging({ storage });
        getLogger().clear();
        storage.setItem.mockClear();

        getLogger().debug('combat', 'noisy-debug');
        getLogger().info('game', 'kept');
        await flushLogTail();

        expect(storage.setItem).toHaveBeenCalled();
        const [, payload] = storage.setItem.mock.calls.at(-1) as [string, string];
        const envelope = JSON.parse(payload) as { entries: { kind: string }[] };
        const kinds = envelope.entries.map((e) => e.kind);
        expect(kinds).toContain('kept');
        expect(kinds).not.toContain('noisy-debug');
    });

    it('reads the previous session tail before overwriting the slot', async () => {
        const prev = {
            savedAt: '2026-07-19T00:00:00.000Z',
            entries: [
                { seq: 1, t: 1, level: 'error', domain: 'error', kind: 'old-crash' },
            ],
        };
        const storage = makeStorage({ [LOG_TAIL_KEY]: JSON.stringify(prev) });
        initAppLogging({ storage });
        // The read is async; drain the microtask queue.
        await Promise.resolve();
        await Promise.resolve();
        const tail = getPrevSessionLogTail();
        expect(tail).not.toBeNull();
        expect(tail![0].kind).toBe('old-crash');
    });
});
