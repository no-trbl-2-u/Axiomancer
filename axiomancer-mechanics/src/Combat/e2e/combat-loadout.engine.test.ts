/**
 * Phase 169 — Curated Combat Loadout: hermetic e2e test.
 *
 * Covers:
 *  1. Codec round-trip: addToLoadout / getCombatLoadout / removeFromLoadout.
 *  2. Max-capacity guard.
 *  3. buildCombatDeck — curated loadout when flags present.
 *  4. buildCombatDeck — fallback to knownSkills when no loadout flags.
 *  5. isCombatSynergySatisfied — target-side predicate (true / false).
 *  6. isCombatSynergySatisfied — caster-side predicate always false.
 *  7. isCombatSynergySatisfied — synthetic card always false.
 */

import { describe, it, expect } from 'vitest';
import {
    COMBAT_LOADOUT_FLAG_PREFIX, COMBAT_LOADOUT_MAX,
    addToLoadout, removeFromLoadout, getCombatLoadout,
} from '../combat.loadout';
import { buildCombatDeck } from '../combat.deck';
import { isCombatSynergySatisfied, toCombatCard } from '../combat.cards';
import { getCardById } from '../../Cards/cards.library';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { lookupEffect } from '../../Effects';
import { createCharacter } from '../../Character';
import type { ActiveEffect } from '../../Effects/types';

const SKILL_A = 'slippery-slope';
const SKILL_B = 'brace-for-impact';

describe('combat loadout codec', () => {
    it('addToLoadout encodes a card as a flag', () => {
        const flags = addToLoadout([], SKILL_A);
        expect(flags).toHaveLength(1);
        expect(flags[0]).toMatch(new RegExp(`^${COMBAT_LOADOUT_FLAG_PREFIX}${SKILL_A}:`));
    });

    it('getCombatLoadout decodes in insertion order', () => {
        let flags: string[] = [];
        flags = addToLoadout(flags, SKILL_A);
        flags = addToLoadout(flags, SKILL_B);
        expect(getCombatLoadout(flags)).toEqual([SKILL_A, SKILL_B]);
    });

    it('addToLoadout allows duplicate card copies', () => {
        let flags: string[] = [];
        flags = addToLoadout(flags, SKILL_A);
        flags = addToLoadout(flags, SKILL_A);
        const loadout = getCombatLoadout(flags);
        expect(loadout).toEqual([SKILL_A, SKILL_A]);
    });

    it('removeFromLoadout removes the first occurrence only', () => {
        let flags: string[] = [];
        flags = addToLoadout(flags, SKILL_A);
        flags = addToLoadout(flags, SKILL_A);
        flags = addToLoadout(flags, SKILL_B);
        flags = removeFromLoadout(flags, SKILL_A);
        expect(getCombatLoadout(flags)).toEqual([SKILL_A, SKILL_B]);
    });

    it('removeFromLoadout is a no-op when card not in loadout', () => {
        const flags = addToLoadout([], SKILL_A);
        const after = removeFromLoadout(flags, SKILL_B);
        expect(getCombatLoadout(after)).toEqual([SKILL_A]);
    });

    it('getCombatLoadout returns [] when no loadout flags present', () => {
        expect(getCombatLoadout([])).toEqual([]);
        expect(getCombatLoadout(['other-flag:value', 'hazard-card:grip:1'])).toEqual([]);
    });

    it('addToLoadout is a no-op when at COMBAT_LOADOUT_MAX capacity', () => {
        let flags: string[] = [];
        for (let i = 0; i < COMBAT_LOADOUT_MAX; i++) flags = addToLoadout(flags, SKILL_A);
        const before = getCombatLoadout(flags).length;
        const after = addToLoadout(flags, SKILL_B);
        expect(getCombatLoadout(after).length).toBe(before);
    });
});

describe('buildCombatDeck with curated loadout', () => {
    const player = createCharacter({
        name: 'Tester',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
    });
    const EXTRA = 'straw-mans-jab'; // a third real card only knownSkills carries
    const playerWithSkills = { ...player, knownSkills: [SKILL_A, SKILL_B, EXTRA] };

    it('uses the curated loadout when loadout flags are present', () => {
        let flags: string[] = [];
        flags = addToLoadout(flags, SKILL_A);
        flags = addToLoadout(flags, SKILL_B);
        const deck = buildCombatDeck(playerWithSkills, flags);
        expect(deck).toContain(SKILL_A);
        expect(deck).toContain(SKILL_B);
        expect(deck).not.toContain(EXTRA);
        expect(deck).not.toContain('card-retreat');
    });

    it('falls back to knownSkills when flags array is empty', () => {
        const deck = buildCombatDeck(playerWithSkills, []);
        expect(deck).toContain(SKILL_A);
        expect(deck).toContain(SKILL_B);
        expect(deck).toContain(EXTRA);
        expect(deck).not.toContain('card-retreat');
    });

    it('falls back to knownSkills when flags has no loadout prefix', () => {
        const deck = buildCombatDeck(playerWithSkills, ['other-flag:1']);
        expect(deck).toContain(EXTRA);
    });

    it('falls back to knownSkills when flags parameter is omitted', () => {
        const deck = buildCombatDeck(playerWithSkills);
        expect(deck).toContain(EXTRA);
    });
});

describe('isCombatSynergySatisfied', () => {
    const buildCard = (skillId: string) => toCombatCard(skillId, getCardById, lookupEffect);

    // spec 32 v3: no library card carries a synergy clause any more — the
    // machinery survives for sandbox/tuning experiments, so the fixtures are
    // sandbox-only cards (no basePower; the strike is dead at the schema level).
    registerSandboxCards([{
        id: 'qa-target-synergy',
        name: 'QA Target Synergy (test fixture)',
        category: 'fallacy',
        philosophicalAspect: 'body',
        description: 'Test-only: target-side synergy predicate on bleed.',
        tier: 2,
        rank: 2,
        cardType: 'spell',
        targetType: 'enemy',
        synergy: { predicate: { effectId: 'debuff_bleed', on: 'target', intensityMin: 1, durationMin: 2 }, bonusDamage: 0 },
    }]);

    it('returns true when target-side predicate is satisfied', () => {
        const card = buildCard('qa-target-synergy');
        expect(card).not.toBeNull();
        const enemyEffects: ActiveEffect[] = [
            {
                effectId: 'debuff_bleed',
                intensity: 2,
                remainingDuration: 3,
                sourceId: 'test',
                appliedAt: 0,
                tier: 1,
                resistedBy: 'body',
                resistDR: 0,
            },
        ];
        expect(isCombatSynergySatisfied(card!, enemyEffects)).toBe(true);
    });

    it('returns false when the required effect is absent', () => {
        const card = buildCard('qa-target-synergy');
        expect(isCombatSynergySatisfied(card!, [])).toBe(false);
    });

    it('returns false when durationMin is not met', () => {
        const card = buildCard('qa-target-synergy');
        const enemyEffects: ActiveEffect[] = [
            {
                effectId: 'debuff_bleed',
                intensity: 2,
                remainingDuration: 1,
                sourceId: 'test',
                appliedAt: 0,
                tier: 1,
                resistedBy: 'body',
                resistDR: 0,
            },
        ];
        expect(isCombatSynergySatisfied(card!, enemyEffects)).toBe(false);
    });

    it('returns false for a caster-side predicate (on: caster)', () => {
        registerSandboxCards([{
            id: 'qa-caster-synergy',
            name: 'QA Caster Synergy (test fixture)',
            category: 'paradox',
            philosophicalAspect: 'mind',
            description: 'Test-only: caster-side synergy predicate.',
            tier: 2,
            rank: 3,
            cardType: 'spell',
            targetType: 'enemy',
            synergy: { predicate: { effectId: 'buff_regeneration', on: 'caster', intensityMin: 1 }, bonusDamage: 5 },
        }]);
        const card = buildCard('qa-caster-synergy');
        expect(card).not.toBeNull();
        const enemyEffects: ActiveEffect[] = [
            {
                effectId: 'buff_regeneration',
                intensity: 1,
                remainingDuration: 2,
                sourceId: 'test',
                appliedAt: 0,
                tier: 2,
                resistedBy: 'heart',
                resistDR: 0,
            },
        ];
        expect(isCombatSynergySatisfied(card!, enemyEffects)).toBe(false);
    });

    it('returns false for a card with no backing skillId (no crash on a null skillId)', () => {
        const card = toCombatCard(SKILL_A, getCardById, lookupEffect);
        expect(card).not.toBeNull();
        const noSkillCard = { ...card!, skillId: null };
        expect(isCombatSynergySatisfied(noSkillCard, [])).toBe(false);
    });
});
