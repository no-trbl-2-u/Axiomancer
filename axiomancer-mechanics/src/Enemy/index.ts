import { Card } from '../Cards/types';
import { MapName } from '../World/map.library';
import { ActiveEffect } from '../Effects/types';
import { BaseStats } from '../Character/types';
import { deriveStats, calculateMaxHealth } from '../Utils';
import { ProcOverrides, ProcUnlocks } from '../Combat/combat-effects';
import { PhilosophicalAlignment } from '../Philosophy/types';
import { ENEMY_STAT_PER_LEVEL, ENEMY_GEAR_TIER_PER_LEVEL } from '../Game/game-mechanics.constants';
import {
    Enemy, EnemyLogic, EnemyDifficulty, Tier1EffectOverrides, LootTableEntry,
    FriendshipReward, BefriendabilityConfig,
    FinalBlowLines, PactLines, CauseLines,
    CodexEntry,
} from './types';

/**
 * Inputs required to create a new Enemy.
 */
export interface CreateEnemyOptions {
    id: string;
    name: string;
    description: string;
    level: number;
    baseStats: BaseStats;
    mapName: MapName;
    logic: EnemyLogic;
    difficulty?: EnemyDifficulty;
    tier1Overrides?: Tier1EffectOverrides;
    procUnlocks?: ProcUnlocks;
    procOverrides?: ProcOverrides;
    skills?: Card[];
    loot?: LootTableEntry[];
    xpReward?: number;
    effects?: ActiveEffect[];
    /** Phase 45 — optional pin on the 27-cell alignment cube. */
    philosophicalAlignment?: PhilosophicalAlignment;
    /** Phase 60 — optional per-enemy friendship-resolution content. */
    friendshipReward?: FriendshipReward;
    /**
     * Phase 68 — optional per-enemy override of the friendship-eligibility
     * predicate. When undefined, the Phase 36 mechanic stays unchanged.
     */
    befriendabilityConfig?: BefriendabilityConfig;
    /** Phase 71 — optional per-foe victory final-blow chronicle prose (GH#65 ask 1). */
    finalBlowLines?: FinalBlowLines;
    /** Phase 71 — optional per-foe friendship-pact chronicle prose (GH#65 ask 1). */
    pactLines?: PactLines;
    /** Phase 71 — optional per-foe defeat / cause-of-loss chronicle prose (GH#65 ask 1). */
    causeLines?: CauseLines;
    /** Phase 73 — optional per-foe codex / journal entry (GH#65 ask 3). */
    journalEntry?: CodexEntry;
    /** Content-provenance metadata for the tuning `--focus` filter. */
    addedIn?: string;
    tags?: string[];
    /** Spec 26 §3.1 — asset id for the enemy's combat portrait (kebab-case). */
    portraitAsset?: string;
    /** Spec 26b §2 — enemy-level thematic stance tell surfaced in the combat reveal. */
    stanceHint?: string;
}

/**
 * Default XP grant on kill by difficulty band (Spec 07). Mirrors the
 * suggested table in Spec 06 Q2 — strategy authors can override per-enemy
 * with `xpReward`.
 */
export const DEFAULT_XP_BY_DIFFICULTY: Record<EnemyDifficulty, number> = {
    simple: 10,
    normal: 20,
    elite:  50,
    boss:   200,
    unique: 500,
};

/**
 * Distributes an enemy's total stat budget (`level × ENEMY_STAT_PER_LEVEL`)
 * across heart / body / mind according to a normalised weight triple, then
 * applies an optional gear-tier bonus weighted toward defensive stats.
 *
 * Used by budget-scaled enemies (and by the tuning workflow's enemy scaler)
 * so a single `ENEMY_STAT_PER_LEVEL` knob governs global enemy power. The
 * returned stats always sum to the rounded budget; any rounding remainder is
 * folded into the largest-weight stat so the total stays exact.
 *
 * @param level   - Enemy level.
 * @param weights - Relative heart/body/mind weighting (need not sum to 1).
 * @param perLevel - Override for `ENEMY_STAT_PER_LEVEL` (the tuner passes a
 *                   candidate value when A/B-testing the scaling constant).
 * @param gearTierPerLevel - Override for `ENEMY_GEAR_TIER_PER_LEVEL` (the tuner
 *                          passes a candidate value when A/B-testing the gear scaling).
 */
export function enemyStatBudget(
    level: number,
    weights: BaseStats = { heart: 1, body: 1, mind: 1 },
    perLevel: number = ENEMY_STAT_PER_LEVEL,
    gearTierPerLevel: number = ENEMY_GEAR_TIER_PER_LEVEL,
): BaseStats {
    const total = Math.max(0, Math.round(level * perLevel));
    const order: (keyof BaseStats)[] = (['body', 'mind', 'heart'] as (keyof BaseStats)[])
        .sort((a, b) => weights[b] - weights[a]);

    // Distribute `budget` across stats by weight, exact-sum, remainder to the
    // highest-weighted stats first.
    const distribute = (budget: number): BaseStats => {
        const weightSum = weights.heart + weights.body + weights.mind || 1;
        const out: BaseStats = {
            heart: Math.floor((weights.heart / weightSum) * budget),
            body: Math.floor((weights.body / weightSum) * budget),
            mind: Math.floor((weights.mind / weightSum) * budget),
        };
        let remainder = budget - (out.heart + out.body + out.mind);
        let i = 0;
        while (remainder > 0) {
            out[order[i % order.length]!] += 1;
            remainder -= 1;
            i += 1;
        }
        return out;
    };

    // When the budget can afford it (≥3), guarantee at least 1 in every stat so
    // no derived combat stat collapses to 0 (a heart-0 enemy would deal no
    // emotional damage). Below 3 we distribute what's available as-is.
    let baseStats: BaseStats;
    if (total >= 3) {
        const extra = distribute(total - 3);
        baseStats = { heart: extra.heart + 1, body: extra.body + 1, mind: extra.mind + 1 };
    } else {
        baseStats = distribute(total);
    }

    // Apply gear-tier scaling bonus weighted toward defensive stats (heart for HP,
    // body/mind for defense/resists). The bonus is ≈0 at level 1 and grows with level.
    const gearTierMultiplier = 1 + (level * gearTierPerLevel);
    return {
        heart: Math.round(baseStats.heart * gearTierMultiplier),
        body: Math.round(baseStats.body * gearTierMultiplier),
        mind: Math.round(baseStats.mind * gearTierMultiplier),
    };
}

/**
 * Builds a fully-initialised Enemy. Derived stats and resources are
 * computed automatically from `baseStats` and `level`. `xpReward` defaults
 * to `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]` when not supplied.
 */
export function createEnemy(options: CreateEnemyOptions): Enemy {
    const {
        id, name, description, level, baseStats, mapName, logic,
        difficulty, tier1Overrides, procUnlocks, procOverrides,
        skills, loot, xpReward, effects = [], philosophicalAlignment,
        friendshipReward, befriendabilityConfig,
        finalBlowLines, pactLines, causeLines,
        journalEntry, addedIn, tags,
        portraitAsset, stanceHint,
    } = options;

    const maxHealth = calculateMaxHealth(level, baseStats);
    const resolvedXp =
        xpReward ?? (difficulty ? level * DEFAULT_XP_BY_DIFFICULTY[difficulty] : level * DEFAULT_XP_BY_DIFFICULTY.normal);

    return {
        id, name, description, level,
        health: maxHealth, maxHealth,
        baseStats,
        derivedStats: deriveStats(baseStats),
        mapName, logic,
        difficulty, tier1Overrides,
        procUnlocks, procOverrides,
        skills,
        loot,
        xpReward: resolvedXp,
        effects,
        philosophicalAlignment,
        friendshipReward,
        befriendabilityConfig,
        finalBlowLines,
        pactLines,
        causeLines,
        journalEntry,
        addedIn,
        tags,
        portraitAsset,
        stanceHint,
    };
}

export { rollLoot, rollLootMany } from './loot';
export type { LootRng } from './loot';
export type {
    Enemy, EnemyLogic, EnemyDifficulty, Tier1EffectOverrides, LootTableEntry,
    FriendshipReward, BefriendabilityConfig,
    FinalBlowLines, PactLines, CauseLines,
    CodexEntry,
} from './types';
