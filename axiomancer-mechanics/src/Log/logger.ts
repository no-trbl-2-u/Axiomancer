/**
 * AXM Log — the ring-buffer logger and its global singleton.
 *
 * Design laws (mirrors the repo's telemetry/io conventions):
 * - NEVER throws and never blocks gameplay: every public method body and
 *   every sink invocation is individually guarded. A logging bug costs log
 *   lines, never a turn.
 * - Default OFF. `isLoggingEnabled()` is a raw module-boolean read so hot
 *   paths (the combat sim runs thousands of encounters through `withLog`)
 *   pay one branch when disabled.
 * - Zero dependencies, platform-neutral: usable from the engine, the CLIs
 *   (which attach fs sinks from the CLI layer), and mobile via `@mechanics`.
 * - Bounded: fixed-capacity ring; rotation is counted in `stats().dropped`,
 *   never silent data loss presented as coverage.
 */

import type { CombatEvent } from '../Combat/combat.encounter.types';
import {
    AXM_LOG_LEVEL_RANK, AxmLogDomain, AxmLogEntry, AxmLogFilter, AxmLogLevel,
    AxmLoggerConfig, AxmLoggerStats, AxmLogSink,
} from './log.types';

export interface AxmLogger {
    log(level: AxmLogLevel, domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    trace(domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    debug(domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    info(domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    warn(domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    error(domain: AxmLogDomain, kind: string, data?: unknown, msg?: string): void;
    /** Buffered entries oldest → newest, optionally filtered. Returns copies
     *  of the array (entries themselves are shared, treat as read-only). */
    entries(filter?: AxmLogFilter): AxmLogEntry[];
    /** Last `n` entries (after filtering), oldest → newest. */
    tail(n: number, filter?: AxmLogFilter): AxmLogEntry[];
    /** Empties the buffer. `seq` keeps counting; `dropped` is unaffected. */
    clear(): void;
    stats(): AxmLoggerStats;
    /** Registers a sink; returns an unsubscribe function. */
    addSink(sink: AxmLogSink): () => void;
    configure(config: AxmLoggerConfig): void;
    /** Whether an entry at this level/domain would currently be accepted. */
    isEnabled(level?: AxmLogLevel, domain?: AxmLogDomain): boolean;
}

const DEFAULT_CAPACITY = 1000;

function emptyLevelCounts(): Record<AxmLogLevel, number> {
    return { trace: 0, debug: 0, info: 0, warn: 0, error: 0 };
}

export function createAxmLogger(config?: AxmLoggerConfig): AxmLogger {
    let enabled = config?.enabled ?? true;
    let minRank = AXM_LOG_LEVEL_RANK[config?.level ?? 'debug'];
    let domainAllow: ReadonlySet<AxmLogDomain> | null =
        config?.domains ? new Set(config.domains) : null;
    let capacity = Math.max(1, config?.capacity ?? DEFAULT_CAPACITY);

    // Ring buffer: fixed array + write head. `size` grows to capacity then
    // sticks; `head` is the NEXT write slot (oldest entry once full).
    let buf: (AxmLogEntry | undefined)[] = new Array(capacity);
    let head = 0;
    let size = 0;
    let seq = 0;
    let dropped = 0;
    const byLevel = emptyLevelCounts();
    const byDomain: Partial<Record<AxmLogDomain, number>> = {};
    const sinks: AxmLogSink[] = [];

    function accepts(level: AxmLogLevel, domain?: AxmLogDomain): boolean {
        if (!enabled) return false;
        if (AXM_LOG_LEVEL_RANK[level] < minRank) return false;
        if (domain && domainAllow && !domainAllow.has(domain)) return false;
        return true;
    }

    function push(entry: AxmLogEntry): void {
        if (size === capacity) dropped += 1;
        else size += 1;
        buf[head] = entry;
        head = (head + 1) % capacity;
        byLevel[entry.level] += 1;
        byDomain[entry.domain] = (byDomain[entry.domain] ?? 0) + 1;
        for (const sink of sinks) {
            try { sink(entry); } catch { /* a broken sink never breaks play */ }
        }
    }

    function ordered(): AxmLogEntry[] {
        const out: AxmLogEntry[] = [];
        const start = (head - size + capacity) % capacity;
        for (let i = 0; i < size; i++) {
            const e = buf[(start + i) % capacity];
            if (e) out.push(e);
        }
        return out;
    }

    function applyFilter(list: AxmLogEntry[], filter?: AxmLogFilter): AxmLogEntry[] {
        if (!filter) return list;
        let out = list;
        if (filter.minLevel !== undefined) {
            const rank = AXM_LOG_LEVEL_RANK[filter.minLevel];
            out = out.filter(e => AXM_LOG_LEVEL_RANK[e.level] >= rank);
        }
        if (filter.domains) {
            const allow = new Set(filter.domains);
            out = out.filter(e => allow.has(e.domain));
        }
        if (filter.kind !== undefined) out = out.filter(e => e.kind === filter.kind);
        if (filter.sinceSeq !== undefined) out = out.filter(e => e.seq > filter.sinceSeq!);
        if (filter.limit !== undefined && out.length > filter.limit) {
            out = out.slice(out.length - filter.limit);
        }
        return out;
    }

    function log(
        level: AxmLogLevel, domain: AxmLogDomain, kind: string, data?: unknown, msg?: string,
    ): void {
        try {
            if (!accepts(level, domain)) return;
            const entry: AxmLogEntry = { seq: ++seq, t: Date.now(), level, domain, kind };
            if (msg !== undefined) entry.msg = msg;
            if (data !== undefined) entry.data = data;
            push(entry);
        } catch { /* never throw */ }
    }

    return {
        log,
        trace: (d, k, data, msg) => log('trace', d, k, data, msg),
        debug: (d, k, data, msg) => log('debug', d, k, data, msg),
        info: (d, k, data, msg) => log('info', d, k, data, msg),
        warn: (d, k, data, msg) => log('warn', d, k, data, msg),
        error: (d, k, data, msg) => log('error', d, k, data, msg),
        entries(filter?: AxmLogFilter): AxmLogEntry[] {
            try { return applyFilter(ordered(), filter); } catch { return []; }
        },
        tail(n: number, filter?: AxmLogFilter): AxmLogEntry[] {
            try {
                const all = applyFilter(ordered(), filter);
                return n >= all.length ? all : all.slice(all.length - n);
            } catch { return []; }
        },
        clear(): void {
            try {
                buf = new Array(capacity);
                head = 0;
                size = 0;
            } catch { /* never throw */ }
        },
        stats(): AxmLoggerStats {
            try {
                const list = ordered();
                return {
                    total: size,
                    dropped,
                    byLevel: { ...byLevel },
                    byDomain: { ...byDomain },
                    firstSeq: list.length ? list[0].seq : 0,
                    lastSeq: list.length ? list[list.length - 1].seq : 0,
                };
            } catch {
                return {
                    total: 0, dropped: 0, byLevel: emptyLevelCounts(),
                    byDomain: {}, firstSeq: 0, lastSeq: 0,
                };
            }
        },
        addSink(sink: AxmLogSink): () => void {
            sinks.push(sink);
            return () => {
                const i = sinks.indexOf(sink);
                if (i >= 0) sinks.splice(i, 1);
            };
        },
        configure(next: AxmLoggerConfig): void {
            try {
                if (next.enabled !== undefined) enabled = next.enabled;
                if (next.level !== undefined) minRank = AXM_LOG_LEVEL_RANK[next.level];
                if (next.domains !== undefined) {
                    domainAllow = next.domains ? new Set(next.domains) : null;
                }
                if (next.capacity !== undefined && next.capacity !== capacity) {
                    const keep = ordered();
                    capacity = Math.max(1, next.capacity);
                    buf = new Array(capacity);
                    head = 0;
                    size = 0;
                    for (const e of keep.slice(-capacity)) {
                        buf[head] = e;
                        head = (head + 1) % capacity;
                        size += 1;
                    }
                }
            } catch { /* never throw */ }
        },
        isEnabled(level?: AxmLogLevel, domain?: AxmLogDomain): boolean {
            try { return level === undefined ? enabled : accepts(level, domain); } catch { return false; }
        },
    };
}

// ---------------------------------------------------------------------------
// The global singleton + hot-path flag (pattern: combat.upgradeable-dice.ts)
// ---------------------------------------------------------------------------

let loggingEnabled = false;
let globalLogger: AxmLogger | null = null;

/** The raw hot-path guard: one boolean read. Engine taps check this BEFORE
 *  touching the logger so disabled logging costs a single branch. */
export function isLoggingEnabled(): boolean {
    return loggingEnabled;
}

/** The process-wide logger. Created lazily, disabled until
 *  `configureLogging({ enabled: true })`. */
export function getLogger(): AxmLogger {
    if (!globalLogger) {
        globalLogger = createAxmLogger({ enabled: loggingEnabled });
    }
    return globalLogger;
}

/** Enables/reconfigures the global logger. Mobile calls this at boot; the
 *  game CLI calls it when `--log-level`/`--log-file` are passed. Sims and
 *  tests leave it off. */
export function configureLogging(config: AxmLoggerConfig): void {
    try {
        if (config.enabled !== undefined) loggingEnabled = config.enabled;
        getLogger().configure({ ...config, enabled: loggingEnabled });
    } catch { /* never throw */ }
}

/** Test hygiene: drops the singleton and disables the flag. */
export function resetLoggingForTests(): void {
    loggingEnabled = false;
    globalLogger = null;
}

/**
 * Combat tap helper: forwards a resolver's event batch into the log stream.
 * Called from `withLog` (combat.engine.ts) behind `isLoggingEnabled()`.
 * CombatEvents are small plain-data objects, safe to store by reference.
 */
export function forwardCombatEventsToLog(events: readonly CombatEvent[]): void {
    try {
        const logger = getLogger();
        for (const e of events) logger.debug('combat', e.kind, e);
    } catch { /* never throw */ }
}
