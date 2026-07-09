/**
 * Save-state validation.
 *
 * Save files are tagged with `version`. Old-save migration was dropped
 * (2026-07-08 — legacy cleanup): only the current `GAME_STATE_VERSION` loads.
 * A save at any other version is rejected so the caller can start a fresh game.
 * There are no shipped saves to preserve, so the step-wise migration chain (and
 * its legacy `knownSkills` / `equippedSkills` scaffolding) was removed.
 */

import { GameState } from './types';
import { GAME_STATE_VERSION } from './game.reducer';

/**
 * Narrow a raw save payload to the current `GameState`. Only the current
 * version is accepted; any other version throws (the caller resets to a new
 * game). The name/signature is kept so the persistence layer's call site is
 * unchanged.
 *
 * @param raw         - The deserialised JSON object pulled from persistence.
 * @param fromVersion - The `version` field of the saved payload.
 * @param toVersion   - The target schema version (defaults to current).
 * @throws If the payload is not an object, is not the current version, or is
 *   missing required `GameState` fields.
 */
export function migrate(
    raw: unknown,
    fromVersion: number,
    toVersion: number = GAME_STATE_VERSION,
): GameState {
    if (!raw || typeof raw !== 'object') {
        throw new Error(`migrate: invalid save payload (got ${typeof raw}).`);
    }

    if (fromVersion !== toVersion) {
        throw new Error(
            `migrate: save version ${fromVersion} is not supported (runtime is ${toVersion}); ` +
            'old saves are no longer migrated — start a new game.',
        );
    }

    return assertGameState(raw);
}

/**
 * Narrow `raw` to a `GameState`. Only the top-level shape is checked — the
 * sub-modules trust their own invariants and the serialiser writes the full
 * shape. Adjust here as `GameState` gains required keys.
 */
function assertGameState(raw: unknown): GameState {
    const r = raw as Partial<GameState>;
    if (typeof r.version !== 'number'
        || typeof r.runId !== 'string'
        || r.player == null
        || r.world == null
        || r.quests == null
        || !Array.isArray(r.flags)
        || typeof r.moralMeter !== 'number'
        || typeof r.rngState !== 'number'
        || r.philosophicalAlignment == null
        || typeof r.philosophicalAlignment.epistemology !== 'number'
        || typeof r.philosophicalAlignment.outlook !== 'number'
        || typeof r.philosophicalAlignment.scope !== 'number'
        || r.codex == null
        || !Array.isArray(r.codex.unlockedEntries)
    ) {
        throw new Error('migrate: payload missing required GameState fields.');
    }
    return raw as GameState;
}
