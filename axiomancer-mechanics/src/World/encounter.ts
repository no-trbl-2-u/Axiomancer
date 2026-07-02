/**
 * Encounter generator (Spec 07 Q5 / Q6).
 *
 * `generateEncounter(mapNode, playerLevel)` picks an `Encounter` for the
 * given map node, scaling the selected enemy's level by their difficulty
 * band (Spec 07 Q6's adaptive answer). The result is a fresh `Encounter`
 * with a deep-cloned enemy so combat mutations don't leak back into the
 * canonical library.
 *
 * Map node → map name resolution comes from `nodeIdToMapName`: today every
 * authored node id starts with a per-map prefix (`fv-*` / `nf-*`); when
 * unknown the generator falls back to the player's currently authored
 * `mapName` if supplied via options.
 */

import { Enemy, EnemyDifficulty } from '../Enemy/types';
import { deepClone, calculateMaxHealth } from '../Utils';
import { deriveStats } from '../Utils';
import { EnemiesByMap } from '../Enemy/enemy.library';
import { DEFAULT_XP_BY_DIFFICULTY } from '../Enemy';
import { MapName } from './map.library';
import { MapNode, Encounter } from './types';
import type { BaseStats } from '../Character/types';

/**
 * Adaptive scaling bands (Spec 07 Q6). For each difficulty tier the picked
 * enemy's level is shifted by a random offset in `[min, max]` relative to
 * the player's level. `unique` keeps the authored level — signature fights
 * have curated difficulty.
 */
export const DIFFICULTY_LEVEL_BANDS: Record<EnemyDifficulty, { min: number; max: number } | 'authored'> = {
    simple: { min: -1, max:  0 },
    normal: { min:  0, max:  1 },
    elite:  { min:  1, max:  2 },
    boss:   { min:  2, max:  3 },
    unique: 'authored',
};

/** Resolves a node id (e.g. `'fv-2'`) into the owning `MapName`. */
function nodeIdToMapName(nodeId: string): MapName | undefined {
    if (nodeId.startsWith('fv-')) return 'fishing-village';
    if (nodeId.startsWith('nf-')) return 'northern-forest';
    return undefined;
}

/** Picks a uniform element from `arr`, or returns `undefined` if empty. */
function pickRandom<T>(arr: readonly T[], rng: () => number = Math.random): T | undefined {
    if (arr.length === 0) return undefined;
    return arr[Math.floor(rng() * arr.length)];
}

/** Inclusive integer in `[min, max]`. */
function randomIntInclusive(min: number, max: number, rng: () => number = Math.random): number {
    return Math.floor(rng() * (max - min + 1)) + min;
}

function scaleBaseStatsToLevel(baseStats: BaseStats, level: number): BaseStats {
    const targetTotal = Math.max(3, level * 5);
    const currentTotal = baseStats.body + baseStats.heart + baseStats.mind;
    if (currentTotal <= 0) {
        const floor = Math.floor(targetTotal / 3);
        const remainder = targetTotal - floor * 3;
        return {
            body: floor + (remainder > 0 ? 1 : 0),
            heart: floor + (remainder > 1 ? 1 : 0),
            mind: floor,
        };
    }

    const entries = (['body', 'heart', 'mind'] as const).map(stat => {
        const exact = (baseStats[stat] / currentTotal) * targetTotal;
        const whole = Math.floor(exact);
        return { stat, whole, fraction: exact - whole };
    });

    let remainder = targetTotal - entries.reduce((total, entry) => total + entry.whole, 0);
    entries.sort((a, b) => b.fraction - a.fraction);
    for (const entry of entries) {
        if (remainder <= 0) break;
        entry.whole += 1;
        remainder -= 1;
    }

    return entries.reduce((stats, entry) => {
        stats[entry.stat] = entry.whole;
        return stats;
    }, {} as BaseStats);
}

/**
 * Returns a fresh `Enemy` scaled to `targetLevel`. Recomputes maxHealth and
 * derivedStats so the scaling stays internally consistent. `xpReward` is
 * also rescaled by the new level when the original was a level-multiplier
 * default (the common case).
 */
export function scaleEnemyToLevel(source: Enemy, targetLevel: number): Enemy {
    const level = Math.max(1, targetLevel);
    const scaled: Enemy = {
        ...deepClone(source),
        level,
        baseStats: scaleBaseStatsToLevel(source.baseStats, level),
    };
    scaled.maxHealth = calculateMaxHealth(level, scaled.baseStats);
    scaled.health = scaled.maxHealth;
    scaled.derivedStats = deriveStats(scaled.baseStats);

    // Rescale XP when the source XP looked like the default multiplier.
    if (source.difficulty) {
        const expected = source.level * DEFAULT_XP_BY_DIFFICULTY[source.difficulty];
        if (source.xpReward === expected) {
            scaled.xpReward = level * DEFAULT_XP_BY_DIFFICULTY[source.difficulty];
        }
    }
    return scaled;
}

/**
 * Computes the encounter level for `enemy` at `playerLevel` using the
 * difficulty bands above. Clamped to a floor of 1 so simple enemies don't
 * drop below the minimum at level 1.
 */
export function scaledEncounterLevel(
    enemy: Enemy,
    playerLevel: number,
    rng: () => number = Math.random,
): number {
    const band = enemy.difficulty ? DIFFICULTY_LEVEL_BANDS[enemy.difficulty] : DIFFICULTY_LEVEL_BANDS.normal;
    if (band === 'authored') return enemy.level;
    const offset = randomIntInclusive(band.min, band.max, rng);
    return Math.max(1, playerLevel + offset);
}

/** Options for `generateEncounter`. */
export interface GenerateEncounterOptions {
    /** Pluggable RNG, in `[0, 1)`. Defaults to `Math.random`. */
    rng?: () => number;
    /**
     * Restrict the candidate pool to a single difficulty band. When omitted
     * the generator picks from every enemy assigned to the resolved map.
     * Useful for "boss node" gating from the World layer.
     */
    difficulty?: EnemyDifficulty;
    /**
     * Override the resolved map for nodes whose id doesn't match the
     * authored prefix convention. Defaults to the `mapName` derived from
     * `mapNode.id`.
     */
    mapName?: MapName;
}

/**
 * Generates a single combat encounter for the given map node.
 *
 * Selection order:
 *   1. Resolve the owning map for `mapNode` (id prefix → `MapName`, or via
 *      `options.mapName`).
 *   2. Look up the per-map enemy pool from `EnemiesByMap`. If empty, the
 *      generator throws — the world layer guarantees populated maps.
 *   3. Optionally filter by `options.difficulty`.
 *   4. Pick one enemy uniformly from the filtered pool.
 *   5. Scale its level to the Q6 band relative to `playerLevel`.
 *   6. Return a fresh `Encounter` carrying the deep-cloned, scaled enemy.
 *
 * The returned encounter's `origin` is `<mapName>:<nodeId>` so the world
 * layer can attribute drops / rewards back to the specific node when
 * `endCombat` resolves the reward grant (Spec 06 hook).
 */
export function generateEncounter(
    mapNode: MapNode,
    playerLevel: number,
    options: GenerateEncounterOptions = {},
): Encounter {
    const rng = options.rng ?? Math.random;
    const resolvedMap: MapName | undefined =
        options.mapName ?? nodeIdToMapName(mapNode.id);

    if (!resolvedMap) {
        throw new Error(
            `generateEncounter: cannot resolve map for node '${mapNode.id}'. ` +
            `Supply options.mapName explicitly when authoring new continents.`,
        );
    }

    const pool = (EnemiesByMap as Record<string, readonly Enemy[] | undefined>)[resolvedMap];
    if (!pool || pool.length === 0) {
        throw new Error(`generateEncounter: no enemies registered for map '${resolvedMap}'.`);
    }

    const filtered = options.difficulty
        ? pool.filter(e => e.difficulty === options.difficulty)
        : pool;
    if (filtered.length === 0) {
        throw new Error(
            `generateEncounter: no enemies of difficulty '${options.difficulty}' on map '${resolvedMap}'.`,
        );
    }

    const picked = pickRandom(filtered, rng)!;
    const targetLevel = scaledEncounterLevel(picked, playerLevel, rng);
    const scaled = scaleEnemyToLevel(picked, targetLevel);

    return {
        enemies: [scaled],
        origin: `${resolvedMap}:${mapNode.id}`,
    };
}
