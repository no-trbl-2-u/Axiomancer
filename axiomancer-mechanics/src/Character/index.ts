import { Character, BaseStats, PreviewAllocation, PreviewResult, emptyLoadout } from './types';
import { ActiveEffect } from '../Effects/types';
import { ProcUnlocks } from '../Combat/combat-effects';
import { Equipment, Item } from '../Items/types';
import { deriveStats, deriveNonCombatStats, calculateMaxHealth } from '../Utils';
import { getRng } from '../Utils/rng';
import { EXPERIENCE_PER_LEVEL } from '../Game/game-mechanics.constants';
import { equipItem, getEquipmentModifiers, recomputeDerivedStats } from './equipment.reducer';
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
     * a guarded no-op — order the list so the worn 3 come first). Stat
     * modifiers are folded into the resulting `derivedStats` at create-time
     * (Spec 05 Q3 option A) so the returned `Character` is already
     * "post-equipment".
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
    procUnlocks?: ProcUnlocks;
}

/**
 * Builds a fully-initialised Character. Resources and derived stats are
 * computed automatically from `baseStats` and `level`.
 */
export function createCharacter(options: CreateCharacterOptions): Character {
    const {
        id, name, level, baseStats, inventory = [], currency = 0, equipment = [], effects = [],
        knownCards = [], procUnlocks, seedStartingRelics = false,
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
        derivedStats: deriveStats(baseStats),
        nonCombatStats: deriveNonCombatStats(baseStats),
        inventory: seededInventory,
        currency,
        equipment: emptyLoadout(),
        effects,
        knownCards,
        availableStatPoints: 0,
        procUnlocks,
    };

    // Equip every worn piece in order so stat modifiers and
    // the maxHp fold get applied via the canonical path (weapon/armor replace,
    // accessories fill the first 3 positions).
    let initialised = baseChar;
    for (const piece of wornPieces) {
        initialised = equipItem(initialised, piece);
    }
    return initialised;
}

/**
 * Spec 06 Q3 — spend one entry from `availableStatPoints` to raise the
 * named base stat by 1, re-derive equipment-aware derived stats + non-
 * combat stats + maxHealth, and grow current HP by the maxHealth delta.
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
    const mods = getEquipmentModifiers(character.equipment);
    const nextDerived = recomputeDerivedStats(nextBase, mods);
    const nextNonCombat = deriveNonCombatStats(nextBase);
    const nextMaxHealth = calculateMaxHealth(character.level, nextBase);
    // Grow current HP by the maxHealth delta — allocation isn't a free
    // heal, but neither does raising max-HP leave the player stuck below
    // the new ceiling.
    const hpDelta = nextMaxHealth - character.maxHealth;

    return {
        ...character,
        baseStats:           nextBase,
        derivedStats:        nextDerived,
        nonCombatStats:      nextNonCombat,
        maxHealth:           nextMaxHealth,
        health:              character.health + hpDelta,
        availableStatPoints: character.availableStatPoints - 1,
    };
}

/**
 * Phase 97 — preview exact derived stats for hypothetical stat point allocation.
 * Enables mobile level-up modal to show accurate cross-stat effects without
 * duplicating the engine's stat derivation formula.
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

    // Compute derived stats using the same functions as allocateStatPoint
    const derivedStats = deriveStats(previewStats);
    const nonCombatStats = deriveNonCombatStats(previewStats);
    const maxHealth = calculateMaxHealth(level, previewStats);

    return {
        derivedStats,
        nonCombatStats,
        maxHealth,
    };
}

export type { Character, BaseStats, DerivedStats, NonCombatStats, PreviewAllocation, PreviewResult, EquipmentLoadout } from './types';
export { emptyLoadout } from './types';
export { equipItem, unequipItem, getEquipmentModifiers, getEquippedItems } from './equipment.reducer';
export type { AggregatedEquipmentModifiers } from './equipment.reducer';
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
