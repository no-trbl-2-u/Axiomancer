/**
 * AXM Log — mobile integration (docs/logging.md).
 *
 * One module owns the whole app-side logging surface:
 *
 *   - `initAppLogging()` enables the engine's structured logger at boot
 *     (`app/_layout.tsx`) and installs three sinks:
 *       1. console mirror — dev builds mirror info+ as one-liners so Metro
 *          and playtester console reports stay useful; ERRORS mirror to
 *          `console.error` in EVERY build so Playwright harnesses
 *          (`scripts/critique-drive.mjs` console listeners) catch them.
 *       2. `globalThis.__AXM_LOG__` — the read-only outward bridge agents
 *          query via `browser_evaluate` (follows the `__AXM_*` convention).
 *       3. crash tail — the last ~200 info+ entries persisted to a
 *          dedicated AsyncStorage key so a crash/restart on an APK leaves
 *          a structured trace (`prevSession()` / the /dev log viewer).
 *   - `wrapActionsWithLogging()` instruments the `createAppActions`
 *     dispatch chokepoint (name, duration, error capture-and-rethrow).
 *
 * Law: logging never throws and never blocks play. Every closure here is
 * guarded; failures degrade to silence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    AXM_LOG_LEVEL_RANK,
    configureLogging,
    getLogger,
    type AxmLogEntry,
    type AxmLogFilter,
} from '@mechanics';

/** Crash-tail slot — NEVER the save slot (`@axiomancer/save:v1`). */
export const LOG_TAIL_KEY = '@axiomancer/logtail:v1';

/** How many buffered entries the crash tail keeps (info+ only). */
export const LOG_TAIL_ENTRIES = 200;

/** Serialized-tail size guard (chars ≈ bytes for ASCII-ish JSON). */
export const LOG_TAIL_MAX_CHARS = 64 * 1024;

/** Quiet-path debounce; warn/error flush after FAST_FLUSH_MS instead. */
export const LOG_TAIL_DEBOUNCE_MS = 3000;
export const LOG_TAIL_FAST_FLUSH_MS = 250;

type StorageLike = Pick<
    typeof AsyncStorage,
    'getItem' | 'setItem' | 'removeItem'
>;

export interface AppLoggingOptions {
    /** Injectable for tests; defaults to the real AsyncStorage. */
    storage?: StorageLike;
}

interface LogTailEnvelope {
    savedAt: string;
    entries: AxmLogEntry[];
}

let initialized = false;
let storage: StorageLike = AsyncStorage;
let prevSessionTail: AxmLogEntry[] | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

declare const __DEV__: boolean | undefined;

function isDev(): boolean {
    return typeof __DEV__ !== 'undefined' && Boolean(__DEV__);
}

function compact(data: unknown): string {
    if (data === undefined) return '';
    try {
        const s = JSON.stringify(data);
        if (s === undefined) return '';
        return s.length > 200 ? ` ${s.slice(0, 200)}…` : ` ${s}`;
    } catch {
        return '';
    }
}

/** Sink 1 — console mirror. */
function consoleMirrorSink(entry: AxmLogEntry): void {
    try {
        const line = `[axm] ${entry.level} ${entry.domain}/${entry.kind}${compact(entry.data)}`;
        if (entry.level === 'error') {
            // Always, production included: the Playwright harnesses and the
            // playtester's mandatory Console & Network section listen here.
            // eslint-disable-next-line no-console
            console.error(line);
        } else if (isDev() && AXM_LOG_LEVEL_RANK[entry.level] >= AXM_LOG_LEVEL_RANK.info) {
            if (entry.level === 'warn') {
                // eslint-disable-next-line no-console
                console.warn(line);
            } else {
                // eslint-disable-next-line no-console
                console.log(line);
            }
        }
    } catch { /* never break play */ }
}

/** Sink 3 — crash-tail scheduler. */
function crashTailSink(entry: AxmLogEntry): void {
    try {
        if (AXM_LOG_LEVEL_RANK[entry.level] < AXM_LOG_LEVEL_RANK.info) return;
        const urgent = AXM_LOG_LEVEL_RANK[entry.level] >= AXM_LOG_LEVEL_RANK.warn;
        if (pendingTimer !== null) {
            if (!urgent) return; // quiet write already scheduled
            clearTimeout(pendingTimer);
        }
        pendingTimer = setTimeout(() => {
            pendingTimer = null;
            void writeTailNow();
        }, urgent ? LOG_TAIL_FAST_FLUSH_MS : LOG_TAIL_DEBOUNCE_MS);
    } catch { /* never break play */ }
}

async function writeTailNow(): Promise<void> {
    try {
        let entries = getLogger().tail(LOG_TAIL_ENTRIES, { minLevel: 'info' });
        let payload = JSON.stringify({
            savedAt: new Date().toISOString(),
            entries,
        } satisfies LogTailEnvelope);
        // Bounded slot: halve until under the size guard.
        while (payload.length > LOG_TAIL_MAX_CHARS && entries.length > 1) {
            entries = entries.slice(Math.ceil(entries.length / 2));
            payload = JSON.stringify({
                savedAt: new Date().toISOString(),
                entries,
            } satisfies LogTailEnvelope);
        }
        await storage.setItem(LOG_TAIL_KEY, payload);
    } catch { /* silent — a tail write must never surface */ }
}

/**
 * Force the crash-tail write (ErrorBoundary calls this fire-and-forget
 * right after logging the boundary error).
 */
export async function flushLogTail(): Promise<void> {
    if (pendingTimer !== null) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
    }
    await writeTailNow();
}

/** The previous session's persisted tail (null until loaded / none saved). */
export function getPrevSessionLogTail(): AxmLogEntry[] | null {
    return prevSessionTail;
}

/** Read-only surface agents reach via `globalThis.__AXM_LOG__`. */
export interface AxmLogBridge {
    entries(filter?: AxmLogFilter): AxmLogEntry[];
    tail(n?: number, filter?: AxmLogFilter): AxmLogEntry[];
    stats(): ReturnType<ReturnType<typeof getLogger>['stats']>;
    clear(): void;
    prevSession(): AxmLogEntry[] | null;
}

/** Sink 2 — the outward bridge. Installed unconditionally (works in the
 *  static expo-web export where dev tools are off; read-only, frozen). */
function installBridge(): void {
    try {
        const bridge: AxmLogBridge = Object.freeze({
            entries: (filter?: AxmLogFilter) => getLogger().entries(filter),
            tail: (n = 50, filter?: AxmLogFilter) => getLogger().tail(n, filter),
            stats: () => getLogger().stats(),
            clear: () => getLogger().clear(),
            prevSession: () => prevSessionTail,
        });
        (globalThis as Record<string, unknown>).__AXM_LOG__ = bridge;
    } catch { /* never break play */ }
}

/**
 * Boot the app-wide logging surface. Idempotent — the root layout calls it
 * at module scope; test remounts are no-ops.
 */
export function initAppLogging(options: AppLoggingOptions = {}): void {
    if (initialized) return;
    initialized = true;
    try {
        if (options.storage) storage = options.storage;
        // Inward override (same __AXM_* convention as the seed globals):
        // Playwright harnesses inject `__AXM_LOG_LEVEL__` via addInitScript
        // to capture the debug combat stream from a static export, where
        // the default is info.
        const override = (globalThis as Record<string, unknown>).__AXM_LOG_LEVEL__;
        const level =
            override === 'trace' || override === 'debug' || override === 'info'
            || override === 'warn' || override === 'error'
                ? override
                : isDev() ? 'debug' : 'info';
        configureLogging({
            enabled: true,
            level,
            capacity: 1000,
        });
        const logger = getLogger();
        logger.addSink(consoleMirrorSink);
        logger.addSink(crashTailSink);
        installBridge();
        // Read last session's tail BEFORE this session's first write
        // overwrites the slot.
        void storage
            .getItem(LOG_TAIL_KEY)
            .then((raw) => {
                if (raw === null) return;
                const envelope = JSON.parse(raw) as LogTailEnvelope;
                if (Array.isArray(envelope.entries)) {
                    prevSessionTail = envelope.entries;
                }
            })
            .catch(() => undefined);
        logger.info('ui', 'app-logging-initialized', { dev: isDev() });
    } catch { /* never break play */ }
}

/** Test hygiene — resets module state (pair with resetLoggingForTests). */
export function __resetAppLoggingForTests(): void {
    initialized = false;
    storage = AsyncStorage;
    prevSessionTail = null;
    if (pendingTimer !== null) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
    }
}

// ---------------------------------------------------------------------------
// Action instrumentation
// ---------------------------------------------------------------------------

type AnyFn = (...args: never[]) => unknown;

function isThenable(v: unknown): v is Promise<unknown> {
    return typeof (v as { then?: unknown } | null | undefined)?.then === 'function';
}

/**
 * Wrap every function property of the actions object with a logging shim:
 * `debug action/<name> { durationMs }` on success, `error action/<name>`
 * (then rethrow) on failure; promise-returning actions log on settle
 * without altering the returned promise's value or rejection.
 *
 * Wrapping happens ONCE inside `createAppActions`, so the provider-stable
 * `AppActions` reference contract is preserved.
 */
export function wrapActionsWithLogging<T extends object>(actions: T): T {
    const wrapped: Record<string, unknown> = {};
    for (const key of Object.keys(actions) as (keyof T & string)[]) {
        const fn = actions[key];
        if (typeof fn !== 'function') {
            wrapped[key] = fn;
            continue;
        }
        wrapped[key] = (...args: never[]) => {
            const started = Date.now();
            try {
                const result = (fn as AnyFn)(...args);
                if (isThenable(result)) {
                    return result.then(
                        (v) => {
                            logActionOk(key, started);
                            return v;
                        },
                        (err: unknown) => {
                            logActionError(key, started, err);
                            throw err;
                        },
                    );
                }
                logActionOk(key, started);
                return result;
            } catch (err) {
                logActionError(key, started, err);
                throw err;
            }
        };
    }
    return wrapped as T;
}

function logActionOk(name: string, started: number): void {
    try {
        getLogger().debug('action', name, { durationMs: Date.now() - started });
    } catch { /* never break play */ }
}

function logActionError(name: string, started: number, err: unknown): void {
    try {
        getLogger().error('action', name, {
            durationMs: Date.now() - started,
            message: err instanceof Error ? err.message : String(err),
        });
    } catch { /* never break play */ }
}
