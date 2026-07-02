/**
 * Save-state migration (Spec 09 Q3).
 *
 * Save files are tagged with `version`. When the schema changes, this module
 * narrows raw JSON onto the current `GameState` shape, applying step-wise
 * migrations along the way. Phase 09 establishes the v2 baseline — older
 * versions are not yet supported because no shipped save file pre-dates v2,
 * but the function is wired so future bumps can slot in cleanly.
 */

import { GameState } from './types';
import { GAME_STATE_VERSION } from './game.reducer';
import { getRng } from '../Utils/rng';
import { defaultAlignment } from '../Philosophy';
import { createDefaultFactionReputations } from '../Faction';
import { generateRunId } from './run-loop';

/** GameState shape before v3 (before moralMeter field was added). */
interface GameStateV2 extends Omit<GameState, 'moralMeter' | 'rngState' | 'philosophicalAlignment'> {
    version: 2;
}

/** GameState shape before v4 (before rngState field was added). */
interface GameStateV3 extends Omit<GameState, 'rngState' | 'philosophicalAlignment'> {
    version: 3;
}

/** GameState shape before v5 (before philosophicalAlignment field was added). */
interface GameStateV4 extends Omit<GameState, 'philosophicalAlignment' | 'runId'> {
    version: 4;
}

/** GameState shape before v6 (before Phase 72 runId field was added). */
interface GameStateV5 extends Omit<GameState, 'runId' | 'codex'> {
    version: 5;
}

/** GameState shape before v7 (before Phase 73 codex slice was added). */
interface GameStateV6 extends Omit<GameState, 'codex'> {
    version: 6;
}

/**
 * GameState shape before v8 (Phase 99 unlocked-skill access). v7 saves carry a
 * legacy `player.equippedSkills` rotation that v8 folds into `knownSkills`. The
 * field was fully removed from the live `Character` type in Phase 159, so it is
 * typed locally here as legacy-only and is never written back.
 */
interface GameStateV7 extends Omit<GameState, 'player'> {
    version: 7;
    player: GameState['player'] & { equippedSkills?: string[] };
}

/** GameState shape before v9 (before Phase 109 regionConsequences was added). */
interface GameStateV8 extends Omit<GameState, 'regionConsequences'> {
    version: 8;
}

/** GameState shape before v10 (before Phase 110 factionReputations was added). */
interface GameStateV9 extends Omit<GameState, 'factionReputations'> {
    version: 9;
}

/**
 * Migrate from v2 to v3: add moralMeter field defaulting to 0 (neutral).
 * v2 saves had no moral tracking; new field allows existing saves to continue.
 */
function migrateV2toV3(v2: GameStateV2): GameStateV3 {
    return {
        ...v2,
        version: 3,
        moralMeter: 0,
    };
}

/**
 * Migrate from v3 to v4: add rngState field defaulting to current RNG state.
 * v3 saves had no RNG state persistence; default to current state.
 */
function migrateV3toV4(v3: GameStateV3): GameStateV4 {
    return {
        ...v3,
        version: 4,
        rngState: getRng().getState(),
    };
}

/**
 * Migrate from v4 to v5: add philosophicalAlignment field defaulting to
 * neutral on every axis. v4 saves had no philosophical alignment tracking;
 * the new field defaults to `{0, 0, 0}` so existing saves continue to load.
 */
function migrateV4toV5(v4: GameStateV4): GameStateV5 {
    return {
        ...v4,
        version: 5,
        philosophicalAlignment: defaultAlignment(),
    };
}

/**
 * Migrate from v5 to v6: add `runId: string` field defaulting to a fresh
 * Phase 72 hex id via `generateRunId(() => getRng().random())`. Legacy saves
 * have no run identity; the migration assigns one at load time so consumers
 * always read a non-empty runId. The default is collision-free in the limit
 * (16 hex chars = 64 bits of entropy) and matches the `/^[0-9a-f]{16}$/`
 * shape `generateRunId` produces for fresh saves.
 */
function migrateV5toV6(v5: GameStateV5): GameStateV6 {
    return {
        ...v5,
        version: 6,
        runId: generateRunId(() => getRng().random()),
    };
}

/**
 * Migrate from v6 to v7 (Phase 73 — closes GH#65 ask 3): add the required
 * `codex: CodexState` slice defaulting to `{ unlockedEntries: [] }`. Legacy
 * v6 saves have no codex tracking; the migration defaults the slice at load
 * time so consumers always read a non-null value.
 */
function migrateV6toV7(v6: GameStateV6): GameStateV7 {
    return {
        ...v6,
        version: 7,
        codex: { unlockedEntries: [] },
    };
}

/**
 * Migrate from v7 to v8 (Phase 99 — unlocked skill access): merge the legacy
 * `equippedSkills` rotation into `knownSkills` so old saves don't lose access to
 * skills. Post-migration, combat uses `knownSkills` directly as the catalogue
 * (ADR-0002). Phase 159 removed `equippedSkills` from the live
 * `Character` type entirely, so the legacy field is read off the v7 payload and
 * dropped — it is never written back onto the migrated player.
 */
function migrateV7toV8(v7: GameStateV7): GameStateV8 {
    const mergedKnown = new Set(v7.player.knownSkills);
    for (const skillId of v7.player.equippedSkills ?? []) {
        mergedKnown.add(skillId);
    }

    const { equippedSkills: _legacyEquippedSkills, ...player } = v7.player;

    return {
        ...v7,
        version: 8,
        player: {
            ...player,
            knownSkills: [...mergedKnown],
        },
    };
}

/**
 * Migrate from v8 to v9 (Phase 109 — region consequences): add regionConsequences
 * field defaulting to empty arrays. v8 saves had no region consequence tracking;
 * the new field defaults to `{ exploitedRegions: [], sparedRegions: [] }` so
 * existing saves continue to load without any befriend exploit/spare history.
 */
function migrateV8toV9(v8: GameStateV8): GameStateV9 {
    return {
        ...v8,
        version: 9,
        regionConsequences: { exploitedRegions: [], sparedRegions: [] },
    };
}

/**
 * Migrate from v9 to v10 (Phase 110 — faction reputation): add factionReputations
 * field defaulting to empty object. v9 saves had no faction reputation tracking;
 * the new field defaults to `{}` (all factions neutral) so existing saves
 * continue to load without any faction reputation history.
 */
function migrateV9toV10(v9: GameStateV9): GameState {
    return {
        ...v9,
        version: 10,
        factionReputations: createDefaultFactionReputations(),
    };
}

/**
 * Migrate a raw save payload to the current `GameState` shape.
 *
 * @param raw         - The deserialised JSON object pulled from persistence.
 * @param fromVersion - The `version` field of the saved payload.
 * @param toVersion   - The target schema version (defaults to current).
 * @returns The migrated `GameState`.
 * @throws If the raw payload's shape can't be validated as a `GameState`.
 */
export function migrate(
    raw: unknown,
    fromVersion: number,
    toVersion: number = GAME_STATE_VERSION,
): GameState {
    if (!raw || typeof raw !== 'object') {
        throw new Error(`migrate: invalid save payload (got ${typeof raw}).`);
    }

    if (fromVersion === toVersion) {
        return assertGameState(raw);
    }

    if (fromVersion > toVersion) {
        throw new Error(
            `migrate: save version ${fromVersion} is newer than runtime ${toVersion}; ` +
            'refusing to downgrade.',
        );
    }

    // Stepwise migration funnel
    let migrated = raw;

    if (fromVersion < 3) {
        migrated = migrateV2toV3(migrated as GameStateV2);
    }

    if (fromVersion < 4) {
        migrated = migrateV3toV4(migrated as GameStateV3);
    }

    if (fromVersion < 5) {
        migrated = migrateV4toV5(migrated as GameStateV4);
    }

    if (fromVersion < 6) {
        migrated = migrateV5toV6(migrated as GameStateV5);
    }

    if (fromVersion < 7) {
        migrated = migrateV6toV7(migrated as GameStateV6);
    }

    if (fromVersion < 8) {
        migrated = migrateV7toV8(migrated as GameStateV7);
    }

    if (fromVersion < 9) {
        migrated = migrateV8toV9(migrated as GameStateV8);
    }

    if (fromVersion < 10) {
        migrated = migrateV9toV10(migrated as GameStateV9);
    }

    return assertGameState(migrated);
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
