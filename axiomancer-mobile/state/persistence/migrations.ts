import type { GameState } from 'axiomancer-mechanics';
import {
    defaultAlignment,
    deriveStats,
    deriveNonCombatStats,
    migrate,
    GAME_STATE_VERSION,
} from 'axiomancer-mechanics';

/**
 * Envelope-format version for the *mobile-only* legacy bridge.
 *
 * This is **frozen at 3** and is NOT the source of truth for GameState
 * migration. The engine owns that (`migrate` / `GAME_STATE_VERSION`).
 * The steps below (v1→v2→v3) exist solely to normalise pre-engine save
 * *shapes* — saves that predate the engine store and carry a string
 * `version` (e.g. `'0.4.0'`) with no engine numeric `version` field —
 * up to a baseline the engine's `migrate` can take over from. All NEW
 * migrations belong in `axiomancer-mechanics`, keyed on the engine
 * `GameState.version`, and ride through `unwrap` automatically (see
 * the `migrate()` delegation at the bottom of `unwrap`). Do not add
 * entries here.
 */
export const CURRENT_SCHEMA_VERSION = 3;

export interface StoredEnvelope {
    schemaVersion: number;
    state: unknown;
}

/** Migration from version `N` to `N + 1`. */
export type Migration = (state: unknown) => unknown;

/**
 * `migrations[N]` migrates a save from version `N` to `N + 1`.
 * Empty by default — bump `CURRENT_SCHEMA_VERSION` and add an entry
 * here when the shape changes.
 */
export type MigrationMap = Record<number, Migration>;

/**
 * Migration from schema v1 to v2: backfill missing derivedStats and
 * nonCombatStats fields in player data using engine derivation helpers.
 */
function migrateV1ToV2(state: unknown): unknown {
    if (!state || typeof state !== 'object') {
        throw new Error('Migration v1→v2: invalid state object');
    }

    const gameState = state as any;
    
    // Check that we have a valid player with baseStats
    if (!gameState.player || !gameState.player.baseStats) {
        throw new Error('Migration v1→v2: missing player.baseStats');
    }

    const player = gameState.player;
    const baseStats = player.baseStats;

    // Check if baseStats has required fields
    if (typeof baseStats.heart !== 'number' || 
        typeof baseStats.body !== 'number' || 
        typeof baseStats.mind !== 'number') {
        throw new Error('Migration v1→v2: invalid baseStats structure');
    }

    // Only add missing fields, preserve existing ones
    if (!player.derivedStats) {
        player.derivedStats = deriveStats(baseStats);
    }
    
    if (!player.nonCombatStats) {
        player.nonCombatStats = deriveNonCombatStats(baseStats);
    }

    return gameState;
}

/**
 * Migration from schema v2 to v3 (Phase 51, engine 0.10.0): backfill
 * the top-level `state.philosophicalAlignment` field added by engine
 * Phase 42 (`PhilosophicalAlignment` — three-axis cube). The
 * engine's `defaultAlignment()` is the canonical seed for a neutral
 * start, so we call it rather than hardcoding the field shape;
 * future engine tweaks to the axis names ride through automatically.
 *
 * Field name correction (Phase 52, 2026-05-19): the first cut of
 * this migration wrote `state.alignment`, but the engine's
 * `GameState` exposes the field as `philosophicalAlignment` (see
 * `engine dist/World/dialogue.runtime.js` — the dialogue + map-event
 * reducers read `gameState.philosophicalAlignment`). Writing to the
 * wrong key created a dead field. Corrected here as part of the
 * Phase 52 SELF-tab adoption work.
 */
function migrateV2ToV3(state: unknown): unknown {
    if (!state || typeof state !== 'object') {
        throw new Error('Migration v2→v3: invalid state object');
    }

    const gameState = state as Record<string, unknown>;

    if (
        gameState.philosophicalAlignment === undefined ||
        gameState.philosophicalAlignment === null
    ) {
        gameState.philosophicalAlignment = defaultAlignment();
    }

    return gameState;
}

/**
 * Default migration map with v1→v2 and v2→v3 migrations.
 */
export const DEFAULT_MIGRATIONS: MigrationMap = {
    1: migrateV1ToV2,
    2: migrateV2ToV3,
};

export function wrap(state: GameState): StoredEnvelope {
    return { schemaVersion: CURRENT_SCHEMA_VERSION, state };
}

/**
 * Load an on-disk save into a current-version `GameState`.
 *
 * Two stages:
 *  1. **Legacy envelope bridge** — applies the frozen v1→v3 mobile steps
 *     to normalise pre-engine save *shapes* (string `version`, missing
 *     `derivedStats` / `philosophicalAlignment`). No new steps are added
 *     here.
 *  2. **Engine migration (source of truth)** — delegates to the engine's
 *     `migrate`, keyed on the engine numeric `GameState.version`, to bring
 *     the save up to `GAME_STATE_VERSION`. This is what makes future engine
 *     schema bumps ride through without any mobile change; mobile no longer
 *     maintains per-engine-version migration logic.
 *
 * Throws on malformed envelopes and on saves from a future version.
 */
export function unwrap(
    envelope: StoredEnvelope,
    migrations: MigrationMap = DEFAULT_MIGRATIONS,
): GameState {
    if (
        envelope === null ||
        typeof envelope !== 'object' ||
        typeof (envelope as StoredEnvelope).schemaVersion !== 'number'
    ) {
        throw new Error('asyncStorageAdapter: corrupt save (missing schemaVersion)');
    }
    let v = envelope.schemaVersion;
    let state: unknown = envelope.state;
    if (v > CURRENT_SCHEMA_VERSION) {
        throw new Error(
            `asyncStorageAdapter: save schema v${v} is from a future version (current v${CURRENT_SCHEMA_VERSION})`,
        );
    }
    // Stage 1 — legacy mobile-shape bridge (frozen).
    while (v < CURRENT_SCHEMA_VERSION) {
        const m = migrations[v];
        if (!m) {
            throw new Error(`asyncStorageAdapter: no migration from v${v}`);
        }
        state = m(state);
        v++;
    }
    // Stage 2 — engine owns GameState migration. Only engine-shaped saves
    // carry a numeric `version`; legacy bridged saves (string `version`)
    // are left to the engine reducer's own tolerance, as before.
    const engineVersion = (state as { version?: unknown } | null)?.version;
    if (typeof engineVersion === 'number' && engineVersion < GAME_STATE_VERSION) {
        state = migrate(state, engineVersion);
    }
    return state as GameState;
}
