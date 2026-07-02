/**
 * Hermetic e2e — playtest stage profiles (`combat.stage-profiles`).
 *
 * Verifies the four campaign stages are well-formed (order, roster slugs
 * resolve in ENEMY_REGISTRY), the eligible card pool respects each stage's
 * tier/level maturity gate, `buildStagePlayer` produces a ready-to-fight
 * Character, and the pool grows with the campaign (early < late).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import {
    COMBAT_STAGE_ORDER, COMBAT_STAGE_PROFILES,
    getStageProfile, isCombatStageId,
    stageEligibleCardIds, buildStagePlayer,
} from '../combat.stage-profiles';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import { getCardById, cardLibrary } from '../../Cards/cards.library';
import { Player } from '../../Character/characters.mock';
import type { Card } from '../../Cards/types';

afterEach(() => vi.restoreAllMocks());

describe('stage roster shape', () => {
    it('defines exactly the four canonical stages, in campaign order', () => {
        expect(COMBAT_STAGE_ORDER).toEqual(['early', 'mid', 'late', 'impossible']);
        expect(Object.keys(COMBAT_STAGE_PROFILES).sort()).toEqual([...COMBAT_STAGE_ORDER].sort());
        for (const id of COMBAT_STAGE_ORDER) {
            const profile = COMBAT_STAGE_PROFILES[id];
            expect(profile.id).toBe(id);
            expect(profile.name.length).toBeGreaterThan(0);
            expect(profile.description.length).toBeGreaterThan(0);
            expect(profile.enemySlugs.length).toBeGreaterThan(0);
        }
    });

    it('getStageProfile / isCombatStageId round-trip and reject unknowns', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            expect(isCombatStageId(id)).toBe(true);
            expect(getStageProfile(id)).toBe(COMBAT_STAGE_PROFILES[id]);
        }
        expect(isCombatStageId('endgame')).toBe(false);
        expect(getStageProfile('endgame')).toBeUndefined();
        expect(getStageProfile('')).toBeUndefined();
    });

    it('every enemy slug of every stage resolves in ENEMY_REGISTRY', () => {
        const registry = ENEMY_REGISTRY as Record<string, unknown>;
        for (const id of COMBAT_STAGE_ORDER) {
            for (const slug of COMBAT_STAGE_PROFILES[id].enemySlugs) {
                expect(registry[slug], `stage ${id} → slug ${slug}`).toBeDefined();
            }
        }
    });

    it('stages escalate: level, HP, and tier gate are non-decreasing along the order', () => {
        for (let i = 1; i < COMBAT_STAGE_ORDER.length; i++) {
            const prev = COMBAT_STAGE_PROFILES[COMBAT_STAGE_ORDER[i - 1]];
            const next = COMBAT_STAGE_PROFILES[COMBAT_STAGE_ORDER[i]];
            expect(next.playerLevel).toBeGreaterThanOrEqual(prev.playerLevel);
            expect(next.playerMaxHealth).toBeGreaterThanOrEqual(prev.playerMaxHealth);
            expect(next.maxCardTier).toBeGreaterThanOrEqual(prev.maxCardTier);
        }
    });
});

describe('stage-eligible card pools', () => {
    it('every stage pool is non-empty and respects the tier + level gates', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            const stage = COMBAT_STAGE_PROFILES[id];
            const pool = stageEligibleCardIds(stage);
            expect(pool.length, `stage ${id} pool is empty`).toBeGreaterThan(0);
            for (const cardId of pool) {
                const card = getCardById(cardId);
                expect(card, `stage ${id} → unknown card ${cardId}`).toBeDefined();
                expect(card!.tier, `stage ${id} → ${cardId} over tier gate`)
                    .toBeLessThanOrEqual(stage.maxCardTier);
                expect(card!.learningRequirement?.level ?? 1, `stage ${id} → ${cardId} over level gate`)
                    .toBeLessThanOrEqual(stage.playerLevel);
            }
        }
    });

    it('the pool excludes nothing else — every library card passing the gates is in', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            const stage = COMBAT_STAGE_PROFILES[id];
            const pool = new Set(stageEligibleCardIds(stage));
            const expected = cardLibrary.filter(c =>
                c.tier <= stage.maxCardTier
                && (c.learningRequirement?.level ?? 1) <= stage.playerLevel);
            expect(pool.size).toBe(expected.length);
            for (const card of expected) expect(pool.has(card.id)).toBe(true);
        }
    });

    it('the early pool is strictly smaller than the late pool (deck maturity grows)', () => {
        const early = stageEligibleCardIds(COMBAT_STAGE_PROFILES.early);
        const late = stageEligibleCardIds(COMBAT_STAGE_PROFILES.late);
        expect(early.length).toBeLessThan(late.length);
    });

    it('extraCards join the pool under the same gates (and may override by id)', () => {
        const early = COMBAT_STAGE_PROFILES.early;
        const fits: Card = {
            id: 'stage-test-extra-fit', name: 'Stage Test Extra', category: 'fallacy',
            philosophicalAspect: 'body', description: 'test-only card', tier: 1,
            targetType: 'enemy', basePower: 5, scalingStat: 'body',
            learningRequirement: { level: 1 },
        };
        const overTier: Card = { ...fits, id: 'stage-test-extra-tier3', tier: 3 };
        const overLevel: Card = { ...fits, id: 'stage-test-extra-lv40', learningRequirement: { level: 40 } };

        const pool = stageEligibleCardIds(early, [fits, overTier, overLevel]);
        expect(pool).toContain('stage-test-extra-fit');
        expect(pool).not.toContain('stage-test-extra-tier3');
        expect(pool).not.toContain('stage-test-extra-lv40');

        // An extra card sharing a library id overrides that entry for filtering.
        const baseline = stageEligibleCardIds(early);
        const libraryTier1 = baseline[0];
        const promotedOut: Card = { ...getCardById(libraryTier1)!, tier: 3 };
        const overridden = stageEligibleCardIds(early, [promotedOut]);
        expect(overridden).not.toContain(libraryTier1);
        expect(overridden.length).toBe(baseline.length - 1);
    });
});

describe('buildStagePlayer', () => {
    it('sets level, base stats, HP, and derived stats from the profile', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            const stage = COMBAT_STAGE_PROFILES[id];
            const player = buildStagePlayer(stage);
            expect(player.level).toBe(stage.playerLevel);
            expect(player.baseStats).toEqual(stage.playerBaseStats);
            expect(player.health).toBe(stage.playerMaxHealth);
            expect(player.maxHealth).toBe(stage.playerMaxHealth);
            // Derived stats track the stage's base stats, not the mock's level-1 spread.
            expect(player.derivedStats).not.toEqual(Player.derivedStats);
        }
    });

    it('knows exactly the stage-eligible pool as its skills', () => {
        for (const id of COMBAT_STAGE_ORDER) {
            const stage = COMBAT_STAGE_PROFILES[id];
            const player = buildStagePlayer(stage);
            expect([...player.knownSkills].sort()).toEqual(stageEligibleCardIds(stage).sort());
        }
    });

    it('never mutates the canonical Player mock', () => {
        const before = JSON.stringify(Player);
        buildStagePlayer(COMBAT_STAGE_PROFILES.late);
        expect(JSON.stringify(Player)).toBe(before);
    });

    it('returns an independent player per call (no shared references)', () => {
        const a = buildStagePlayer(COMBAT_STAGE_PROFILES.mid);
        const b = buildStagePlayer(COMBAT_STAGE_PROFILES.mid);
        expect(a).not.toBe(b);
        a.baseStats.body = 99;
        a.knownSkills.push('mutation-canary');
        expect(b.baseStats.body).toBe(COMBAT_STAGE_PROFILES.mid.playerBaseStats.body);
        expect(b.knownSkills).not.toContain('mutation-canary');
    });
});
