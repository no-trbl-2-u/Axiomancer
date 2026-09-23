/**
 * Playtest stage profiles — canonical "moments in the campaign" for the
 * Hazard-Pattern Combat playtest harness (stage matrix, deck drafting, CLIs).
 *
 * A stage profile freezes the three inputs that define a player's power at a
 * point in the campaign: level, base stats, and max HP — plus the deck-maturity
 * gate (`maxCardTier`) and the enemy roster that stage is measured against.
 * `buildStagePlayer` turns a profile into a ready-to-fight `Character` whose
 * known cards are exactly the stage-eligible card pool.
 *
 * HP is the sole win condition (the old status-primacy doctrine is retired —
 * see `docs/lexicon.json`). Stage rosters exist so the playtest matrix can
 * measure every win path at EVERY stage of the campaign, not just at one
 * tuned snapshot.
 *
 * Pure data + pure helpers. Enemy slugs are NOT validated at import time — the
 * stage-profiles e2e asserts every slug against `ENEMY_REGISTRY`.
 */

import type { BaseStats, Character } from '../Character/types';
import type { Card, CardTier, CardRank } from '../Cards/types';
import { cardLibrary } from '../Cards/cards.library';
import { UPGRADE_SUFFIX } from '../Cards/card-upgrades';
import { Player } from '../Character/characters.mock';
import { deepClone, deriveStats, calculateMaxHealth } from '../Utils';
import { MAX_DIE_UPGRADE_LEVEL } from './combat.dice';

/**
 * Deck-MATURITY level implied by a card's RANK (the quality ladder Ash 1 …
 * Saint 6). Cards no longer carry a player-level requirement (removed
 * 2026-07-08); the playtest harness instead uses this rank→maturity mapping to
 * decide which cards a player "at stage X" would plausibly hold — so the stage
 * pools (and the balance-band win-rate curve they feed) are unchanged. This is
 * a SIM-harness heuristic only; it is not a gate the game enforces on the
 * player. Mapping mirrors the retired rank-ladder level gates exactly.
 */
export function rankMaturityLevel(rank: CardRank): number {
    return ({ 1: 1, 2: 2, 3: 4, 4: 6, 5: 10, 6: 12 } as Record<CardRank, number>)[rank];
}

/** The four campaign moments the playtest matrix measures. */
export type CombatStageId = 'early' | 'mid' | 'late' | 'impossible';

/** A frozen campaign moment: player power + deck maturity + enemy roster. */
export interface CombatStageProfile {
    id: CombatStageId;
    /** Display name for reports and CLIs. */
    name: string;
    /** One-line pitch: what this stage is measuring. */
    description: string;
    /** Player level at this stage (drives player stat scaling, and — via
     *  `rankMaturityLevel` — the deck-maturity gate in `stageEligibleCardIds`). */
    playerLevel: number;
    /** Heart/Body/Mind core attributes at this stage. */
    playerBaseStats: BaseStats;
    /** Authored max HP of the profile's era — documentation only:
     *  `buildStagePlayer` DERIVES the live VITAE from level + stats. */
    playerMaxHealth: number;
    /** Deck maturity gate — only cards with `tier <= maxCardTier` are eligible. */
    maxCardTier: CardTier;
    // ── THE PATH (owner ruling 2026-09-02) — the progression axes ────────────
    // A player's power does NOT grow through card rank alone. Modelling only
    // rank + stats is what made every late cell read unwinnable: the harness
    // was sending an act-1 body at act-4 content. These fields carry the rest
    // of the campaign's growth into the measurement.
    /** ACT REWARD DICE banked by this stage — extra dice in every turn's tray.
     *  One per completed act ("a red/blue/purple base die of their choice").
     *
     *  NOT A SHIPPED FEATURE YET (owner note 2026-09-03): the game is still in
     *  act one, so no player has ever been handed an act-reward die. This field
     *  is the harness PROJECTING the campaign the design intends, so a mid/late
     *  cell is measured with the body that stage of the game will actually
     *  have. Do not read it as evidence the reward exists in the product. */
    bonusBaseDice: number;
    /** DIE UPGRADES bought by this stage (0-`MAX_DIE_UPGRADE_LEVEL`) — the share
     *  of LIVE and WILD faces in the roll bag. Expensive in the fiction.
     *
     *  Owner-set bands (2026-09-03): early = the base die, mid = 1-2 upgrades,
     *  late = 3-4. Pinned in `progression-axes.engine.test.ts`. */
    dieUpgradeLevel: number;
    /** CARD UPGRADES: the fraction of this stage's deck that has been upgraded
     *  (Slay the Spire's rest-site upgrade). 0 = none, 1 = the whole deck. */
    upgradedCardShare: number;
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
        // Act 1: nothing banked yet. This is the body the game starts you in.
        bonusBaseDice: 0,
        dieUpgradeLevel: 0,
        upgradedCardShare: 0,
        enemySlugs: [
            'grave-larva', 'foot-stealer', 'little-belle',
            'water-holger', 'the-butcher', 'king-of-revenge',
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
        // THE BIG NUMBERS REWRITE (2026-09-02) — raised 2 -> 3. `tier` is the
        // RESIST tier, never a power axis; using it as a maturity gate was a
        // proxy that `rankMaturityLevel` already does properly (rank 5 wants
        // level 10, rank 6 level 12). At level 20 a player plainly holds Skull
        // and Saint cards, and every one of them is tier 3 — so the old cap
        // sent a Rib-capped deck against thousand-VITAE bosses and read 0%.
        maxCardTier: 3,
        // One act cleared: a fourth die, two hones (top of the owner's "1 or 2"
        // band), a third of the deck upgraded at rest sites.
        bonusBaseDice: 1,
        dieUpgradeLevel: 2,
        upgradedCardShare: 0.33,
        enemySlugs: [
            'tri-eyes', 'mirac', 'hasshaku-sama',
            'jeweled-tree', 'rawhead-rex',
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
        // Two acts cleared: five dice, three hones (the owner's "3 or 4" band),
        // most of the deck upgraded.
        bonusBaseDice: 2,
        dieUpgradeLevel: 3,
        upgradedCardShare: 0.66,
        enemySlugs: [
            'fire-giant', 'rangda', 'tezcatlipoca',
            'arch-demon', 'death', 'the-abortive',
        ],
    },
    impossible: {
        id: 'impossible',
        name: 'The Unprovable',
        description: 'The ceiling: a maxed player against The Unfinished. Losing here is the design — the profile exists to prove the top of the curve stays out of reach.',
        // PLAYTEST-CALIBRATION — the L50 ladder preset's exact stat block
        // (src/Character/presets.ts ladderL50Preset), HP = stat sum x 5.
        playerLevel: 50,
        playerBaseStats: { heart: 40, body: 44, mind: 42 },
        playerMaxHealth: 630,
        maxCardTier: 3,
        // Everything the campaign can give — six dice, the honed ceiling, every
        // card upgraded. If The Unfinished is still out of reach HERE, it is
        // out of reach by design.
        bonusBaseDice: 3,
        dieUpgradeLevel: MAX_DIE_UPGRADE_LEVEL,
        upgradedCardShare: 1,
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
 * `rankMaturityLevel(rank) <= playerLevel`. Excludes nothing else — the point
 * is the WHOLE maturity-gated library, so the playtest matrix can measure
 * coverage of it. (Cards no longer carry a level requirement; the rank→maturity
 * heuristic reproduces the retired level gate so stage pools are unchanged.)
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
        if (rankMaturityLevel(card.rank) > stage.playerLevel) continue;
        // Phase 104 — the grey office is what a run OPENS with, never what it
        // drafts toward: a stage pool models the reward-built deck, so the two
        // grey starters stay out of it (they are excluded from the reward pool
        // for the same reason).
        if (card.theme === 'grey') continue;
        ids.push(card.id);
    }
    // THE PATH — CARD UPGRADES (axis 3). By this stage the player has spent
    // `upgradedCardShare` of their rest-site beats on `+` copies. Applied
    // DETERMINISTICALLY (every Nth id in a stable order), never by rng, so a
    // seeded cell stays reproducible. Oath and hex are skipped: their passives
    // are engine hooks with nothing numeric to raise, and curses are prices —
    // both are no-ops under `upgradeCard` anyway, so upgrading them would only
    // make the ids noisier.
    const share = Math.max(0, Math.min(1, stage.upgradedCardShare));
    if (share <= 0) return ids;
    ids.sort();
    const step = share >= 1 ? 1 : Math.max(2, Math.round(1 / share));
    return ids.map((id, i) => {
        if (i % step !== 0) return id;
        const card = pool.get(id);
        if (!card || card.cardType !== 'spell' || card.theme === 'curse') return id;
        return `${id}${UPGRADE_SUFFIX}`;
    });
}

/**
 * Builds the stage's player: a deep clone of the canonical `Player` mock with
 * level / base stats / HP set from the profile, derived stats recomputed from
 * the new base stats, and `knownCards` = the full stage-eligible card pool
 * (so `buildCombatDeck` and deck drafting both see the same maturity gate).
 */
export function buildStagePlayer(stage: CombatStageProfile): Character {
    const player = deepClone(Player);
    player.level = stage.playerLevel;
    player.baseStats = { ...stage.playerBaseStats };
    player.derivedStats = deriveStats(player.baseStats);
    // THE BIG NUMBERS REWRITE (2026-09-02) — DERIVE the pool, never author it.
    // These profiles used to hard-code `playerMaxHealth` at the old
    // `stats x 5` scale (mid 255, late 570). When the formula moved to
    // `50 + stats x 8` the harness kept fighting the new enemies with the old
    // body, and every mid/late/impossible cell read 0% — a measurement
    // artefact that looked exactly like a balance catastrophe. The authored
    // field is retained only as documentation of the profile's era.
    const vitae = calculateMaxHealth(stage.playerLevel, player.baseStats);
    player.maxHealth = vitae;
    player.health = vitae;
    player.knownCards = stageEligibleCardIds(stage);
    // THE PATH — carry the dice axes into the encounter. `upgradedCardShare` is
    // consumed by `stageEligibleCardIds` (the `knownCards` pool above), not here.
    player.bonusTurnDice = stage.bonusBaseDice;
    player.dieUpgradeLevel = stage.dieUpgradeLevel;
    return player;
}
