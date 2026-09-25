import { Card } from '../Cards/types';
import { MapName } from '../World/map.library';
import { ActiveEffect } from '../Effects/types';
import { BaseStats } from '../Character/types';
import { deriveStats } from '../Utils';
import { PhilosophicalAlignment } from '../Ledger/types';
import {
    ENEMY_STAT_PER_LEVEL, ENEMY_GEAR_TIER_PER_LEVEL,
    ENEMY_VITAE_BASE, ENEMY_VITAE_PER_LEVEL, ENEMY_VITAE_MULT,
} from '../Game/game-mechanics.constants';
import {
    Enemy, EnemyLogic, EnemyDifficulty, LootTableEntry,
    FriendshipReward, BefriendabilityConfig,
    FinalBlowLines, PactLines, CauseLines,
    CodexEntry,
} from './types';
import type { EnemyKeyword, EnemyStage } from './enemy-keywords';

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
    cards?: Card[];
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
    /** Content-provenance metadata (the tuning `--focus` filter that consumed it is retired). */
    addedIn?: string;
    tags?: string[];
    /** Spec 26 §3.1 — asset id for the enemy's combat portrait (kebab-case). */
    portraitAsset?: string;
    /** Spec 26b §2 — enemy-level thematic stance tell surfaced in the combat reveal. */
    stanceHint?: string;
    /**
     * THE BIG NUMBERS REWRITE — authored VITAE pool. Overrides the difficulty
     * curve in {@link enemyVitae}. Every boss and unique authors this; ordinary
     * foes let the curve decide.
     */
    vitae?: number;
    /** THE BIG NUMBERS REWRITE — combat keywords (HIDE, BRUTAL, VENOM, …). */
    keywords?: EnemyKeyword[];
    /** THE BIG NUMBERS REWRITE — boss/unique stage thresholds. */
    stages?: EnemyStage[];
}

/**
 * The VITAE pool a player has to chew through, THE BIG NUMBERS REWRITE
 * (2026-09-02).
 *
 * Enemies no longer borrow the player's per-stat health formula: `baseStats`
 * still drives stance procs, derived combat stats and befriend logic, but the
 * pool is its own number so the difficulty bands separate cleanly and a boss
 * can be a wall without a grotesque stat budget.
 *
 *   vitae = round((ENEMY_VITAE_BASE + ENEMY_VITAE_PER_LEVEL × level)
 *                 × ENEMY_VITAE_MULT[difficulty])
 *
 * An authored `vitae` always wins (every boss and unique authors one).
 *
 * @param level      - Enemy level.
 * @param difficulty - Difficulty band; absent is treated as `normal`.
 * @param authored   - An authored override, used verbatim when > 0.
 */
export function enemyVitae(
    level: number,
    difficulty: EnemyDifficulty | undefined,
    authored?: number,
): number {
    if (authored !== undefined && authored > 0) return Math.round(authored);
    const mult = ENEMY_VITAE_MULT[difficulty ?? 'normal'];
    return Math.round((ENEMY_VITAE_BASE + ENEMY_VITAE_PER_LEVEL * Math.max(0, level)) * mult);
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
 * THE BIG NUMBERS REWRITE (2026-09-02) — the keyword floor.
 *
 * Every foe should change the arithmetic of a fight somehow, but hand-authoring
 * eleven keywords across some eighty enemies would mostly produce noise. So the
 * roster gets a DERIVED baseline by difficulty and level, and the enemies worth
 * a character note author their own list (which wins outright — this is a
 * default, not an addition).
 *
 * The curve is deliberately gentle at the bottom: a level-1 Float-Eye carries
 * nothing, because the first fight of the game should teach the dice, not the
 * exceptions. HIDE arrives first (it is the keyword that makes card choice
 * matter), then the band-specific character.
 */
/**
 * THE EARLY HIDE RAMP (2026-09-20, T's ruling after the grey office shipped).
 *
 * HIDE is the flat per-hit soak (`{ kind: 'hide', n }`), and the grey office
 * a run opens with deals 2 FREE / 5 PAID — a boss's old floor of HIDE 3 turned
 * those into 1 / 2 and made the fishing village's pinned level-3 King of
 * Revenge unwinnable for a deck with no rewards yet. The ruling: the boss
 * loses its HIDE at that level rather than the deck being buffed or the
 * boss being handicapped by reward count. So HIDE is capped by LEVEL, one
 * point per level from level 4: a level-1..3 foe carries none, level 4
 * carries at most 1, level 6 at most 3 — which is exactly where the
 * authored mid-tier kits (the King at his home level 6, the Butcher's HIDE
 * 2) already sit, so nothing above the opening changes. Applied wherever a
 * foe's level is decided: the difficulty defaults below, `createEnemy`'s
 * authored lists, and `scaleEnemyToLevel` (every live map encounter).
 */
export const HIDE_RAMP_FIRST_LEVEL = 4;

/** The most HIDE a foe of `level` may carry: `max(0, level − 3)`. */
export function hideCapForLevel(level: number): number {
    return Math.max(0, Math.floor(level) - (HIDE_RAMP_FIRST_LEVEL - 1));
}

/**
 * Clamps every HIDE keyword in `keywords` to {@link hideCapForLevel} for
 * `level`, dropping a HIDE that clamps to 0. Every other keyword passes
 * through untouched (WOUNDING, BRUTAL and the rest are not level-ramped —
 * the ruling named HIDE alone). Pure; returns the same array when nothing
 * changes.
 */
export function applyHideRamp(keywords: readonly EnemyKeyword[], level: number): EnemyKeyword[] {
    const cap = hideCapForLevel(level);
    let changed = false;
    const out: EnemyKeyword[] = [];
    for (const k of keywords) {
        if (k.kind !== 'hide' || k.n <= cap) { out.push(k); continue; }
        changed = true;
        if (cap > 0) out.push({ kind: 'hide', n: cap });
    }
    return changed ? out : [...keywords];
}

export function defaultEnemyKeywords(
    level: number,
    difficulty: EnemyDifficulty | undefined,
): EnemyKeyword[] {
    return applyHideRamp(defaultEnemyKeywordsUnramped(level, difficulty), level);
}

/** The difficulty-derived kit BEFORE the early HIDE ramp — the mid/late
 *  formulas, unchanged since THE BIG NUMBERS REWRITE. */
function defaultEnemyKeywordsUnramped(
    level: number,
    difficulty: EnemyDifficulty | undefined,
): EnemyKeyword[] {
    const lv = Math.max(1, level);
    switch (difficulty) {
        case 'simple':
            return [];
        case 'elite':
            return [
                { kind: 'hide', n: Math.max(2, Math.ceil(lv / 5)) },
                ...(lv >= 10 ? [{ kind: 'swift' } as EnemyKeyword] : []),
            ];
        case 'boss':
            return [
                { kind: 'hide', n: Math.max(3, Math.ceil(lv / 4)) },
                { kind: 'brutal' },
            ];
        case 'unique':
            return [
                { kind: 'hide', n: Math.max(4, Math.ceil(lv / 3)) },
                { kind: 'unshaken' },
                { kind: 'regrow', n: Math.max(2, Math.round(lv / 2)) },
            ];
        case 'normal':
        default:
            return lv >= 8 ? [{ kind: 'hide', n: Math.ceil(lv / 8) }] : [];
    }
}

/**
 * THE BIG NUMBERS REWRITE (2026-09-02) — the stage floor.
 *
 * Every boss and unique gets at least one moment where the fight becomes a
 * different fight. Marquee foes author their own stages (which win outright);
 * the rest inherit this pair — a second wind at 60% and a last stand at 25% —
 * so no boss is simply a larger pile of VITAE.
 */
export function defaultEnemyStages(
    difficulty: EnemyDifficulty | undefined,
    vitae: number,
): EnemyStage[] {
    if (difficulty !== 'boss' && difficulty !== 'unique') return [];
    return [
        {
            at: { vitaePct: 0.6 },
            name: 'SECOND WIND',
            text: 'It stops fighting like something that expects to win easily.',
            gain: [{ kind: 'swift' }],
            heal: { pct: 0.1 },
            threatBonus: 0.15,
        },
        {
            at: { vitaePct: 0.25 },
            name: 'LAST STAND',
            text: 'Whatever it was holding back, it is not holding back now.',
            gain: [{ kind: 'brutal' }],
            heal: Math.round(vitae * 0.05),
            threatBonus: 0.25,
        },
    ];
}

/**
 * Builds a fully-initialised Enemy. Derived stats and resources are
 * computed automatically from `baseStats` and `level`. `xpReward` defaults
 * to `level × DEFAULT_XP_BY_DIFFICULTY[difficulty]` when not supplied.
 */
export function createEnemy(options: CreateEnemyOptions): Enemy {
    const {
        id, name, description, level, baseStats, mapName, logic,
        difficulty,
        cards, loot, xpReward, effects = [], philosophicalAlignment,
        friendshipReward, befriendabilityConfig,
        finalBlowLines, pactLines, causeLines,
        journalEntry, addedIn, tags,
        portraitAsset, stanceHint,
        vitae, keywords, stages,
    } = options;

    const maxHealth = enemyVitae(level, difficulty, vitae);
    const resolvedXp =
        xpReward ?? (difficulty ? level * DEFAULT_XP_BY_DIFFICULTY[difficulty] : level * DEFAULT_XP_BY_DIFFICULTY.normal);

    return {
        id, name, description, level,
        health: maxHealth, maxHealth,
        baseStats,
        derivedStats: deriveStats(baseStats),
        mapName, logic,
        difficulty,
        cards,
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
        // THE BIG NUMBERS REWRITE — an authored list wins outright; otherwise
        // the foe inherits the difficulty-derived floor so every fight has some
        // arithmetic of its own.
        // THE EARLY HIDE RAMP — an authored list still bows to the level cap.
        keywords: applyHideRamp(keywords ?? defaultEnemyKeywords(level, difficulty), level),
        stages: stages ?? defaultEnemyStages(difficulty, maxHealth),
    };
}

export {
    ENEMY_KEYWORD_KINDS, ENEMY_KEYWORD_LABEL, ENEMY_KEYWORD_GLOSS,
    enemyKeywordText, enemyKeywordGloss, findEnemyKeyword, hasEnemyKeyword,
} from './enemy-keywords';
export type { EnemyKeyword, EnemyStage } from './enemy-keywords';
export { rollLoot, rollLootMany } from './loot';
export type { LootRng } from './loot';
export type {
    Enemy, EnemyLogic, EnemyDifficulty, LootTableEntry,
    FriendshipReward, BefriendabilityConfig,
    FinalBlowLines, PactLines, CauseLines,
    CodexEntry,
} from './types';
