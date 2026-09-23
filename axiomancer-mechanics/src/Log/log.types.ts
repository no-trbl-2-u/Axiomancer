/**
 * AXM Log — shared structured-logging types (see docs/logging.md).
 *
 * The logger is the repo-wide observability spine: engine chokepoints
 * (combat `withLog`, the game store's event emitter, RNG seeding) forward
 * structured entries into a bounded ring buffer that CLIs dump as JSONL and
 * mobile exposes to agents via `globalThis.__AXM_LOG__`. Everything here is
 * platform-neutral plain data — no Node imports, no side effects.
 */

/** Severity levels, ordered least → most severe. */
export const AXM_LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error'] as const;

export type AxmLogLevel = typeof AXM_LOG_LEVELS[number];

/** Numeric rank per level (higher = more severe) for threshold checks. */
export const AXM_LOG_LEVEL_RANK: Record<AxmLogLevel, number> = {
    trace: 0, debug: 1, info: 2, warn: 3, error: 4,
};

/**
 * The closed domain vocabulary. One domain per subsystem so consumers can
 * filter a session down to the slice they care about:
 * - `combat`      — every CombatEvent flowing through the engine's `withLog`
 * - `game`        — game-store actions + sanitized TypedGameEvents
 * - `world`       — world/map processing outside the store event stream
 * - `minigame`    — hazard sessions (the gathering / rest / loot-cache /
 *                   quest-board minigames that once shared this domain are retired)
 * - `rng`         — seed sets / RNG replacement (the replay key)
 * - `cli`         — CLI envelope events mirrored off stdout
 * - `action`      — mobile action-dispatch wrapper (name, duration, errors)
 * - `nav`         — mobile route changes
 * - `persistence` — save/load/migrate/clear outcomes
 * - `ui`          — presentation-layer notes (mount/exit markers)
 * - `error`       — crashes and caught boundary errors
 */
export const AXM_LOG_DOMAINS = [
    'combat', 'game', 'world', 'minigame', 'rng', 'cli',
    'action', 'nav', 'persistence', 'ui', 'error',
] as const;

export type AxmLogDomain = typeof AXM_LOG_DOMAINS[number];

/**
 * One log record. `data` is stored BY REFERENCE — emitters own sanitization
 * and must never hand the logger something huge or mutable-in-place they
 * care about (the game-store tap strips `state` for exactly this reason).
 */
export interface AxmLogEntry {
    /** Monotonic sequence number; never reset (survives `clear()`). */
    seq: number;
    /** Wall-clock ms (`Date.now()`). */
    t: number;
    level: AxmLogLevel;
    domain: AxmLogDomain;
    /** Event kind within the domain, e.g. `dot-tick`, `seed-set`, `route-changed`. */
    kind: string;
    /** Optional human-readable one-liner. */
    msg?: string;
    /** Optional structured payload (caller-sanitized, JSON-serializable). */
    data?: unknown;
}

/** A sink receives every accepted entry. Sinks must not throw; the logger
 *  guards each call anyway — a broken sink can never break gameplay. */
export type AxmLogSink = (entry: AxmLogEntry) => void;

/** Filter for `entries()` / `tail()` reads. All fields optional and ANDed. */
export interface AxmLogFilter {
    minLevel?: AxmLogLevel;
    domains?: readonly AxmLogDomain[];
    kind?: string;
    /** Only entries with `seq > sinceSeq` — for incremental agent polls. */
    sinceSeq?: number;
    limit?: number;
}

export interface AxmLoggerStats {
    /** Entries currently held in the buffer. */
    total: number;
    /** Entries rotated out of the ring since creation. */
    dropped: number;
    byLevel: Record<AxmLogLevel, number>;
    byDomain: Partial<Record<AxmLogDomain, number>>;
    firstSeq: number;
    lastSeq: number;
}

export interface AxmLoggerConfig {
    enabled?: boolean;
    /** Minimum level captured (default `debug`). */
    level?: AxmLogLevel;
    /** Domain allowlist; null/undefined = all domains. */
    domains?: readonly AxmLogDomain[] | null;
    /** Ring-buffer capacity (default 1000). */
    capacity?: number;
}
