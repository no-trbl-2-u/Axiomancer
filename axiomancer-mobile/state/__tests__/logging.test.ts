/**
 * AXM Log — mobile integration tests (state/logging.ts).
 *
 * Covers the action wrapper contract (passthrough, rethrow, promise
 * settle, durations), the read-only `__AXM_LOG__` bridge, and the
 * crash-tail sink (bounded write, debounce, previous-session read).
 */

import { Platform } from 'react-native';

import {
    getLogger,
    resetLoggingForTests,
} from '@mechanics';

import {
    __resetAppLoggingForTests,
    flushLogTail,
    getPrevSessionCrash,
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
    delete (globalThis as Record<string, unknown>).ErrorUtils;
    delete (globalThis as Record<string, unknown>).HermesInternal;
    (Platform as { OS: string }).OS = 'ios';
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

    it('reads a previous session crash marker (Phase 77)', async () => {
        const prev = {
            savedAt: '2026-07-19T00:00:00.000Z',
            entries: [],
            crash: { kind: 'global-error', message: 'boom from last session' },
        };
        const storage = makeStorage({ [LOG_TAIL_KEY]: JSON.stringify(prev) });
        initAppLogging({ storage });
        await Promise.resolve();
        await Promise.resolve();
        expect(getPrevSessionCrash()).toEqual({
            kind: 'global-error',
            message: 'boom from last session',
        });
    });

    it('returns null when the previous envelope predates the crash field', async () => {
        const prev = {
            savedAt: '2026-07-19T00:00:00.000Z',
            entries: [{ seq: 1, t: 1, level: 'info', domain: 'ui', kind: 'old' }],
        };
        const storage = makeStorage({ [LOG_TAIL_KEY]: JSON.stringify(prev) });
        initAppLogging({ storage });
        await Promise.resolve();
        await Promise.resolve();
        expect(getPrevSessionCrash()).toBeNull();
    });
});

describe('crash marker (Phase 77)', () => {
    it('getPrevSessionCrash is null before any crash is flushed', () => {
        initAppLogging({ storage: makeStorage() });
        expect(getPrevSessionCrash()).toBeNull();
    });

    it('flushLogTail(crash) persists the marker on the written envelope', async () => {
        const storage = makeStorage();
        initAppLogging({ storage });
        getLogger().clear();
        storage.setItem.mockClear();

        await flushLogTail({ kind: 'global-error', message: 'kaboom' });

        const [, payload] = storage.setItem.mock.calls.at(-1) as [string, string];
        const envelope = JSON.parse(payload) as { crash: { kind: string; message: string } | null };
        expect(envelope.crash).toEqual({ kind: 'global-error', message: 'kaboom' });
    });

    it('a later routine write keeps carrying the crash marker forward', async () => {
        jest.useFakeTimers();
        const storage = makeStorage();
        initAppLogging({ storage });
        getLogger().clear();

        await flushLogTail({ kind: 'unhandled-rejection', message: 'first' });
        storage.setItem.mockClear();

        // A subsequent quiet log triggers the debounced writer with no
        // explicit `crash` argument — the marker must still be present,
        // or a crash could self-erase before the app actually restarts.
        getLogger().info('ui', 'after-crash-still-running');
        jest.advanceTimersByTime(LOG_TAIL_DEBOUNCE_MS + 10);
        await Promise.resolve();

        const [, payload] = storage.setItem.mock.calls.at(-1) as [string, string];
        const envelope = JSON.parse(payload) as { crash: { kind: string; message: string } | null };
        expect(envelope.crash).toEqual({ kind: 'unhandled-rejection', message: 'first' });
    });
});

describe('global error handlers — native (Phase 77)', () => {
    it('chains ErrorUtils.setGlobalHandler: logs, flushes a crash marker, then calls the previous handler', async () => {
        const prevHandler = jest.fn();
        let installedHandler: ((error: unknown, isFatal?: boolean) => void) | undefined;
        (globalThis as Record<string, unknown>).ErrorUtils = {
            getGlobalHandler: () => prevHandler,
            setGlobalHandler: (h: (error: unknown, isFatal?: boolean) => void) => {
                installedHandler = h;
            },
        };

        const storage = makeStorage();
        initAppLogging({ storage });
        getLogger().clear();
        storage.setItem.mockClear();

        expect(installedHandler).toBeDefined();
        const err = new Error('native crash');
        installedHandler!(err, true);
        await Promise.resolve();

        const errors = getLogger().entries({ domains: ['error'], kind: 'global-error' });
        expect(errors).toHaveLength(1);
        expect((errors[0].data as { message: string; isFatal: boolean }).message).toBe(
            'native crash',
        );
        expect((errors[0].data as { message: string; isFatal: boolean }).isFatal).toBe(true);
        expect(prevHandler).toHaveBeenCalledWith(err, true);

        const [, payload] = storage.setItem.mock.calls.at(-1) as [string, string];
        const envelope = JSON.parse(payload) as { crash: { kind: string } | null };
        expect(envelope.crash?.kind).toBe('global-error');
    });

    it('installs the HermesInternal promise-rejection tracker only outside __DEV__', () => {
        const g = globalThis as Record<string, unknown>;
        const originalDev = g.__DEV__;

        let trackerOptions: { onUnhandled?: (id: number, r: unknown) => void } | undefined;
        g.HermesInternal = {
            enablePromiseRejectionTracker: (opts: typeof trackerOptions) => {
                trackerOptions = opts;
            },
        };

        try {
            g.__DEV__ = true;
            initAppLogging({ storage: makeStorage() });
            expect(trackerOptions).toBeUndefined();
            __resetAppLoggingForTests();

            g.__DEV__ = false;
            initAppLogging({ storage: makeStorage() });
            expect(trackerOptions).toBeDefined();
        } finally {
            g.__DEV__ = originalDev;
        }
    });

    it('the production HermesInternal tracker logs + flushes on an unhandled rejection', async () => {
        const g = globalThis as Record<string, unknown>;
        const originalDev = g.__DEV__;
        let trackerOptions: { onUnhandled?: (id: number, r: unknown) => void } | undefined;
        g.HermesInternal = {
            enablePromiseRejectionTracker: (opts: typeof trackerOptions) => {
                trackerOptions = opts;
            },
        };

        const storage = makeStorage();
        try {
            g.__DEV__ = false;
            initAppLogging({ storage });
            getLogger().clear();

            expect(trackerOptions?.onUnhandled).toBeDefined();
            trackerOptions!.onUnhandled!(1, new Error('dangling promise'));
            await Promise.resolve();

            const errors = getLogger().entries({ domains: ['error'], kind: 'unhandled-rejection' });
            expect(errors).toHaveLength(1);
            expect(getPrevSessionCrash()).toBeNull(); // this-session marker, not prev-session
        } finally {
            g.__DEV__ = originalDev;
        }
    });
});

describe('global error handlers — web (Phase 77)', () => {
    it('window "error" and "unhandledrejection" listeners log + flush a crash marker', async () => {
        // The jest-expo test environment is Node, not jsdom — there is no
        // real `window`. Install a minimal fake so `Platform.OS === 'web'`
        // exercises the same branch a browser build would take.
        (Platform as { OS: string }).OS = 'web';
        const listeners: Record<string, (event: unknown) => void> = {};
        const g = globalThis as Record<string, unknown>;
        const hadWindow = 'window' in g;
        const originalWindow = g.window;
        g.window = {
            addEventListener: jest.fn((type: string, handler: unknown) => {
                listeners[type] = handler as (event: unknown) => void;
            }),
        };

        try {
            const storage = makeStorage();
            initAppLogging({ storage });
            getLogger().clear();
            storage.setItem.mockClear();

            expect(listeners.error).toBeDefined();
            expect(listeners.unhandledrejection).toBeDefined();

            listeners.error({ error: new Error('web crash'), filename: 'app.js', lineno: 12 });
            await Promise.resolve();
            let errors = getLogger().entries({ domains: ['error'], kind: 'global-error' });
            expect(errors).toHaveLength(1);

            listeners.unhandledrejection({ reason: new Error('web rejection') });
            await Promise.resolve();
            errors = getLogger().entries({ domains: ['error'], kind: 'unhandled-rejection' });
            expect(errors).toHaveLength(1);
        } finally {
            if (hadWindow) {
                g.window = originalWindow;
            } else {
                delete g.window;
            }
        }
    });
});
