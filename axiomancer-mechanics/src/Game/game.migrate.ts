/**
 * Save-state validation + migration.
 *
 * Save files are tagged with `version`. The step-wise migration chain was
 * dropped 2026-07-08 (legacy cleanup) because there were no shipped saves to
 * preserve; a save at an unsupported version is rejected so the caller starts a
 * fresh game. Phase 18 re-introduces exactly ONE targeted hop — v11 → v12 —
 * because the equipment-signature epic (phases 18-21) changes the persisted
 * `player.equipment` shape and the re-slot transform (`LEGACY_SLOT_MAP`) has to
 * exist and be exercised regardless. Every other version mismatch still
 * rejects.
 */

import { GameState } from './types';
import type { Character, EquipmentLoadout } from '../Character/types';
import type { Equipment, Item } from '../Items/types';
import { isEquipment } from '../Items/types';
import { getEquipmentModifiers, recomputeDerivedStats } from '../Character/equipment.reducer';
import { reslotLegacyLoadout, reslotLegacyEquipment, type LegacySlot } from './legacy-slots';
import { GAME_STATE_VERSION } from './game.reducer';

/**
 * v11 → v12 (Phase 18): fold the player's 7-slot equipment record into the
 * 5-slot `EquipmentLoadout`, re-slot every persisted inventory equipment
 * instance, return worn overflow (a displaced `body` piece, 4th+ accessories)
 * to inventory, and recompute `derivedStats` from the new loadout. Pure over a
 * raw (untyped) save payload — casts are expected for save-data plumbing.
 */
function migrateV11ToV12(raw: Record<string, unknown>): Record<string, unknown> {
    const player = raw.player as (Partial<Character> & {
        equipment?: Partial<Record<LegacySlot, Equipment>>;
        inventory?: Item[];
    }) | undefined;
    if (!player || typeof player !== 'object') {
        return { ...raw, version: 12 };
    }

    const { loadout, overflow } = reslotLegacyLoadout(player.equipment ?? {});
    const inventory: Item[] = Array.isArray(player.inventory)
        ? player.inventory.map(it => (isEquipment(it) ? reslotLegacyEquipment(it) : it))
        : [];

    const nextLoadout: EquipmentLoadout = loadout;
    const migratedPlayer: Character = {
        ...(player as Character),
        equipment: nextLoadout,
        inventory: [...inventory, ...overflow],
    };
    migratedPlayer.derivedStats = recomputeDerivedStats(
        migratedPlayer.baseStats,
        getEquipmentModifiers(nextLoadout),
    );

    return { ...raw, player: migratedPlayer, version: 12 };
}

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

    let working = raw as Record<string, unknown>;
    let version = fromVersion;

    // Single supported hop: v11 → v12 re-slots equipment to the Phase-18 model.
    if (version === 11 && toVersion >= 12) {
        working = migrateV11ToV12(working);
        version = 12;
    }

    if (version !== toVersion) {
        throw new Error(
            `migrate: save version ${fromVersion} is not supported (runtime is ${toVersion}); ` +
            'old saves are no longer migrated — start a new game.',
        );
    }

    return assertGameState(working);
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
