import { Character, BaseStats, PreviewAllocation, PreviewResult, emptyLoadout } from './types';
import { ActiveEffect } from '../Effects/types';
import { Equipment, Item } from '../Items/types';
import { calculateMaxHealth } from '../Utils';
import { getRng } from '../Utils/rng';
import { EXPERIENCE_PER_LEVEL } from '../Game/game-mechanics.constants';
import { equipItem, wornMaxHpBonus } from './equipment.reducer';
import { cloneStartingRelics } from '../Items/relic.library';

/**
 * Phase 35 — produce a stable character id drawn from `getRng()`. Seeded
 * tests inherit determinism; production gets a non-colliding 8-char base36
 * suffix that's good enough for in-process attribution. Not a true UUID
 * because the package ships into React Native and we don't want a
 * Node-only `crypto` import on the core barrel.
 */
function generateCharacterId(): string {
    const r = getRng().random();
    const suffix = Math.floor(r * 36 ** 8).toString(36).padStart(8, '0');
    return `char-${suffix}`;
}

/**
 * Inputs required to create a new Character.
 */
export interface CreateCharacterOptions {
    /**
     * Stable identifier. Auto-generated via `getRng()` when omitted so every
     * Character ships with a non-empty `id`. Supply explicitly when you need
     * a deterministic id (e.g. fixtures that pin `ActiveEffect.sourceId`).
     */
    id?: string;
    name: string;
    level: number;
    baseStats: BaseStats;
    inventory?: Item[];
    /** Starting currency (Spec 08 Q8). Defaults to 0. */
    currency?: number;
    /**
     * Optional starting equipment as an ordered list of pieces to equip
     * (Phase 18). Each is equipped via `equipItem`, so weapon/armor replace in
     * place and accessories fill the first 3 free positions (a 4th accessory is
     * a guarded no-op — order the list so the worn 3 come first). A worn
     * armor relic's +max VITAE is folded in at create-time, so the returned
     * `Character` is already "post-equipment".
     */
    equipment?: Equipment[];
    /**
     * Phase 19 — seed the 11 signet relics: the fixed default 5 are worn (1
     * weapon + 1 armor + 3 accessories) and the other 6 seed the inventory, so a
     * fresh character always enters combat with a full signature kit (signatures
     * derive from the worn loadout, not archetype). Off by default so bare
     * `createCharacter` fixtures keep their exact (relic-free) stats;
     * `buildCharacterFromPreset` and the `Player` mock opt in (`createNewGameState`
     * no longer seeds relics — owner call 2026-09-23). Ignored when an explicit `equipment` list is
     * passed (the caller is choosing the loadout).
     */
    seedStartingRelics?: boolean;
    effects?: ActiveEffect[];
    knownCards?: string[];
}

/**
 * Builds a fully-initialised Character. Max VITAE is computed from
 * `baseStats` (plus any worn armor relic's bonus).
 */
export function createCharacter(options: CreateCharacterOptions): Character {
    const {
        id, name, level, baseStats, inventory = [], currency = 0, equipment = [], effects = [],
        knownCards = [], seedStartingRelics = false,
    } = options;

    // Phase 19 — the 11 signet relics: 5 default-worn, 6 benched.
    // Opt-in and only when the caller hasn't chosen an explicit loadout.
    const useRelics = seedStartingRelics && equipment.length === 0;
    const relics = useRelics ? cloneStartingRelics() : { worn: [] as Equipment[], benched: [] as Equipment[] };
    const wornPieces = useRelics ? relics.worn : equipment;

    // The worn relics live in inventory too, ordered worn-first per slot, so the
    // presenter's inventory-position worn convention (`wornPerSlot`) agrees with
    // the engine `equipment` loadout combat reads. Benched relics follow, then
    // the caller's inventory (kept after so its gear never displaces a relic from
    // the worn window).
    const seededInventory: Item[] = useRelics
        ? [...relics.worn, ...relics.benched, ...inventory]
        : [...inventory];

    const maxHealth = calculateMaxHealth(level, baseStats);

    const baseChar: Character = {
        id: id ?? generateCharacterId(),
        name,
        level,
        experience: (level - 1) * EXPERIENCE_PER_LEVEL,
        experienceToNextLevel: level * EXPERIENCE_PER_LEVEL,
        health: maxHealth,
        maxHealth,
        baseStats,
        inventory: seededInventory,
        currency,
        equipment: emptyLoadout(),
        effects,
        knownCards,
        availableStatPoints: 0,
    };

    // Equip every worn piece in order so the maxHp fold gets applied via the
    // canonical path (weapon/armor replace,
    // accessories fill the first 3 positions).
    let initialised = baseChar;
    for (const piece of wornPieces) {
        initialised = equipItem(initialised, piece);
    }
    return initialised;
}

/**
 * Spec 06 Q3 — spend one entry from `availableStatPoints` to raise the
 * named base stat by 1, recompute maxHealth, and grow current HP by the
 * maxHealth delta.
 *
 * Returns the unchanged character (and logs a warning at the call site,
 * not here) when `availableStatPoints <= 0`.
 *
 * Pure; equipment passives are not touched — only the base-stat math.
 */
export function allocateStatPoint(
    character: Character,
    stat: 'heart' | 'body' | 'mind',
): Character {
    if (character.availableStatPoints <= 0) return character;

    const nextBase: BaseStats = {
        ...character.baseStats,
        [stat]: character.baseStats[stat] + 1,
    };
    // Tier 0 item 4 (TRIM THE FAT T2a): keep the worn armor relics' bonus.
    const nextMaxHealth = calculateMaxHealth(character.level, nextBase) + wornMaxHpBonus(character.equipment);
    // Grow current HP by the maxHealth delta — allocation isn't a free
    // heal, but neither does raising max-HP leave the player stuck below
    // the new ceiling.
    const hpDelta = nextMaxHealth - character.maxHealth;

    return {
        ...character,
        baseStats:           nextBase,
        maxHealth:           nextMaxHealth,
        health:              character.health + hpDelta,
        availableStatPoints: character.availableStatPoints - 1,
    };
}

/**
 * Phase 97 — preview max VITAE for a hypothetical stat point allocation, so
 * the mobile level-up modal never duplicates the engine's VITAE formula.
 *
 * Takes current base stats, character level, and allocation delta. Returns computed
 * stats without mutating any character data. Pure function.
 */
export function previewStatAllocation(
    baseStats: BaseStats,
    level: number,
    allocation: PreviewAllocation,
): PreviewResult {
    // Apply allocation deltas additively to base stats
    const previewStats: BaseStats = {
        heart: baseStats.heart + allocation.heart,
        body: baseStats.body + allocation.body,
        mind: baseStats.mind + allocation.mind,
    };

    return { maxHealth: calculateMaxHealth(level, previewStats) };
}

export type { Character, BaseStats, PreviewAllocation, PreviewResult, EquipmentLoadout } from './types';
export { emptyLoadout } from './types';
export { equipItem, unequipItem, getEquippedItems, wornMaxHpBonus } from './equipment.reducer';
export {
    grantFirstNodeRelic, withholdFirstNodeRelic, isFirstNodeRelicPending,
    FIRST_NODE_RELIC_ID, STAND_IN_RELIC_ID, FIRST_NODE_RELIC_FLAG,
} from './first-node-grant';
export type { FirstNodeRelicGrant, FirstNodeGrantReason } from './first-node-grant';
export { computeEquipDelta } from './equip-delta';
export type {
    EquipDelta, EquipDeltaMode,
    StatDeltaEntry, SignatureDeltaEntry,
} from './equip-delta';
export {
    honeDieGear, temperDieGear, swapDieGear,
    validateDieGear, concreteDefaultRail, characterDieGear,
    dieSpecialCap, dieGearMissFaces,
    DIE_GEAR_COLORS, DIE_GEAR_FACE_COUNT,
} from './dieGear.reducer';
export type { DieGearColor, DieGearRail, DieGearOutcome } from './dieGear.reducer';
export {
    characterPresets, apprenticePreset, wandererPreset, sagePreset,
    levelLadderPresets, ladderL1Preset, ladderL15Preset, ladderL30Preset, ladderL50Preset,
    getPresetById, buildCharacterFromPreset,
} from './presets';
export type { CharacterPreset, CharacterPresetEquipmentEntry } from './presets';
