/**
 * Playtest stage profiles — canonical "moments in the campaign" for the
 * Hazard-Pattern Combat playtest harness (stage matrix, deck drafting, CLIs).
 *
 * A stage profile freezes the three inputs that define a player's power at a
 * point in the campaign: level, base stats, and max HP — plus the deck-maturity
 * gate (`maxCardTier`) and the enemy roster that stage is measured against.
 * `buildStagePlayer` turns a profile into a ready-to-fight `Character` whose
 * known skills are exactly the stage-eligible card pool.
 *
 * Doctrine (CLAUDE.md): status effects are the MAIN fun — HP is the sole win
 * condition and status is the EFFICIENT way to drop it. Stage rosters exist so
 * the playtest matrix can verify that status play stays the winning path at
 * EVERY stage of the campaign, not just at one tuned snapshot.
 *
 * Pure data + pure helpers. Enemy slugs are NOT validated at import time — the
 * stage-profiles e2e asserts every slug against `ENEMY_REGISTRY`.
 */

import type { BaseStats, Character } from '../Character/types';
import type { Card, CardTier } from '../Cards/types';
import { cardLibrary } from '../Cards/cards.library';
import { Player } from '../Character/characters.mock';
import { deepClone, deriveStats } from '../Utils';

/** The four campaign moments the playtest matrix measures. */
export type CombatStageId = 'early' | 'mid' | 'late' | 'impossible';

/** A frozen campaign moment: player power + deck maturity + enemy roster. */
export interface CombatStageProfile {
    id: CombatStageId;
    /** Display name for reports and CLIs. */
    name: string;
    /** One-line pitch: what this stage is measuring. */
    description: string;
    /** Player level at this stage (also gates `learningRequirement.level`). */
    playerLevel: number;
    /** Heart/Body/Mind core attributes at this stage. */
    playerBaseStats: BaseStats;
    /** Player max (and starting) HP at this stage. */
    playerMaxHealth: number;
    /** Deck maturity gate — only cards with `tier <= maxCardTier` are eligible. */
    maxCardTier: CardTier;
    /** Slugs (keys of `ENEMY_REGISTRY`) this stage is measured against. */
    enemySlugs: readonly string[];
}

/** Canonical stage order — early campaign first, the unwinnable ceiling last. */
export const COMBAT_STAGE_ORDER: readonly CombatStageId[] = Object.freeze([
    'early', 'mid', 'late', 'impossible',
]);

/**
 * The stage roster. Numbers are playtest anchors, not live game tuning — the
 * orchestrator calibrates them against the balance-band e2e.
 */
export const COMBAT_STAGE_PROFILES: Record<CombatStageId, CombatStageProfile> = {
    early: {
        id: 'early',
        name: 'The Shallows',
        description: 'The opening hours: a thin tier-1 kit against the coast\'s small griefs. Status play should already be the efficient path.',
        // PLAYTEST-CALIBRATION
        playerLevel: 3,
        playerBaseStats: { heart: 5, body: 5, mind: 5 },
        playerMaxHealth: 90,
        maxCardTier: 1,
        enemySlugs: [
            'tidepool-crab', 'salt-gnaw-rat', 'mournful-gull',
            'hollow-eyed-beggar', 'hush-wraith', 'coastal-tyrant',
        ],
    },
    mid: {
        id: 'mid',
        name: 'The Long Road',
        description: 'Mid-campaign: tier-2 status engines online, against enemies that punish pure basic-attack trading.',
        // PLAYTEST-CALIBRATION — interpolated from the L15/L30 ladder presets
        // (src/Character/presets.ts): L20 ~ 51 total stats, HP = stat sum x 5.
        playerLevel: 20,
        playerBaseStats: { heart: 17, body: 17, mind: 17 },
        playerMaxHealth: 255,
        maxCardTier: 2,
        enemySlugs: [
            'audit-sentinel', 'rimeclaw-prowler', 'glassmind-oracle',
            'mire-of-consensus', 'the-lich-of-missing-steps',
        ],
    },
    late: {
        id: 'late',
        name: 'The Deep Wood',
        description: 'Late campaign: the full tier-3 library against bosses and uniques — DoT erosion and control denial must carry the fight.',
        // PLAYTEST-CALIBRATION — interpolated from the L30/L50 ladder presets:
        // L45 ~ 114 total stats, HP = stat sum x 5.
        playerLevel: 45,
        playerBaseStats: { heart: 37, body: 39, mind: 38 },
        playerMaxHealth: 570,
        maxCardTier: 3,
        enemySlugs: [
            'famine-of-the-deep-wood', 'warrant-of-the-void', 'graveward-keeper',
            'the-last-consensus', 'axiom-breaker', 'the-terminal-proof',
        ],
    },
    impossible: {
        id: 'impossible',
        name: 'The Unprovable',
        description: 'The ceiling: a maxed player against The Incompleteness. Losing here is the design — the profile exists to prove the top of the curve stays out of reach.',
        // PLAYTEST-CALIBRATION — the L50 ladder preset's exact stat block
        // (src/Character/presets.ts ladderL50Preset), HP = stat sum x 5.
        playerLevel: 50,
        playerBaseStats: { heart: 40, body: 44, mind: 42 },
        playerMaxHealth: 630,
        maxCardTier: 3,
        enemySlugs: ['the-incompleteness'],
    },
};

/** Looks up a stage profile by id (undefined when unknown). */
export function getStageProfile(id: string): CombatStageProfile | undefined {
    return isCombatStageId(id) ? COMBAT_STAGE_PROFILES[id] : undefined;
}

/** True when the string names a combat stage. */
export function isCombatStageId(id: string): id is CombatStageId {
    return (COMBAT_STAGE_ORDER as readonly string[]).includes(id);
}

/**
 * The card pool eligible at a stage: every library card (plus any
 * `extraCards` — e.g. registered sandbox cards, which may also OVERRIDE a
 * library card by sharing its id) filtered by `tier <= maxCardTier` and
 * `(learningRequirement?.level ?? 1) <= playerLevel`. Excludes nothing else —
 * the point is the WHOLE maturity-gated library, so the playtest matrix can
 * measure coverage of it.
 */
export function stageEligibleCardIds(
    stage: CombatStageProfile,
    extraCards: readonly Card[] = [],
): string[] {
    const pool = new Map<string, Card>();
    for (const card of cardLibrary) pool.set(card.id, card);
    for (const card of extraCards) pool.set(card.id, card);
    const ids: string[] = [];
    for (const card of pool.values()) {
        if (card.tier > stage.maxCardTier) continue;
        if ((card.learningRequirement?.level ?? 1) > stage.playerLevel) continue;
        ids.push(card.id);
    }
    return ids;
}

/**
 * Builds the stage's player: a deep clone of the canonical `Player` mock with
 * level / base stats / HP set from the profile, derived stats recomputed from
 * the new base stats, and `knownSkills` = the full stage-eligible card pool
 * (so `buildCombatDeck` and deck drafting both see the same maturity gate).
 */
export function buildStagePlayer(stage: CombatStageProfile): Character {
    const player = deepClone(Player);
    player.level = stage.playerLevel;
    player.baseStats = { ...stage.playerBaseStats };
    player.derivedStats = deriveStats(player.baseStats);
    player.maxHealth = stage.playerMaxHealth;
    player.health = stage.playerMaxHealth;
    player.knownSkills = stageEligibleCardIds(stage);
    return player;
}
