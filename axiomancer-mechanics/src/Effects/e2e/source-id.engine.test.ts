/**
 * Hermetic e2e — ActiveEffect.sourceId attribution (Phase 38).
 *
 * Pins the convention that every applied effect carries a sourceId
 * pointing back to the agent that caused it: player.id on the skill
 * path, actor.id on the proc path (Character | Enemy), item.id for
 * equipment passives, and undefined for environmental hazards.
 *
 * The unit-level coverage of `applyEffect`'s sourceId plumbing lives
 * in `src/Effects/e2e/effects.engine.test.ts`. This file drives the
 * field through the public surfaces a consumer actually touches.
 */

import { afterEach, describe, it, expect, vi } from 'vitest';
import { mockSequentialRng } from '../../test-utils/rng';
import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { executeSkill } from '../../Cards/skill.engine';
import type { Card } from '../../Cards/types';
import { applyProcOutcome } from '../../Combat/combat-effects';
import type { ProcRollOutcome } from '../../Combat/combat-effects';
import type { Effect } from '../types';

afterEach(() => vi.restoreAllMocks());

const lookup = (skill: Card) => (id: string): Card | undefined =>
    id === skill.id ? skill : undefined;

const debuffSkill: Card = {
    id: 'sk_doubt',
    name: 'Sow Doubt',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description: 'Plants a seed of doubt.',
    tier: 1,
    targetType: 'enemy',
    basePower: 0,
    scalingStat: 'mind',
    combatEffects: [{ effectId: 'debuff_poison', appliedTo: 'opponent' }],
};

const buffSkill: Card = {
    id: 'sk_resolve',
    name: 'Self-Resolve',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description: 'A heartening certainty.',
    tier: 1,
    targetType: 'self',
    basePower: 0,
    scalingStat: 'heart',
    combatEffects: [{ effectId: 'tier1_heart_attack', appliedTo: 'self' }],
};

function fixturePlayer() {
    return createCharacter({
        id: 'char-player-shopper',
        name: 'P',
        level: 1,
        baseStats: { heart: 4, body: 6, mind: 4 },
        knownSkills: [debuffSkill.id, buffSkill.id],
    });
}

function fixtureEnemy() {
    return createEnemy({
        id: 'enemy-rat-7',
        name: 'Rat',
        description: 'd',
        level: 1,
        baseStats: { heart: 3, body: 3, mind: 3 },
        mapName: 'northern-city',
        logic: 'random',
    });
}

describe('Phase 38 — player skill applies debuff onto enemy', () => {
    it('enemy effect carries sourceId === player.id', () => {
        mockSequentialRng(0.05);
        const player = fixturePlayer();
        const enemy = fixtureEnemy();
        const base = initializeCombat(player, enemy);
        const state = { ...base, combatResources: { heart: 0, body: 0, mind: 2, fallacy: 0, paradox: 0 } };

        const { state: next } = executeSkill(state, debuffSkill.id, lookup(debuffSkill));

        const applied = next.enemy.effects.find(e => e.effectId === 'debuff_poison');
        expect(applied).toBeDefined();
        expect(applied!.sourceId).toBe('char-player-shopper');
    });
});

describe('Phase 38 — player skill applies buff onto self', () => {
    it('player effect carries sourceId === player.id', () => {
        mockSequentialRng(0.5);
        const player = fixturePlayer();
        const enemy = fixtureEnemy();
        const base = initializeCombat(player, enemy);
        const state = { ...base, combatResources: { heart: 1, body: 0, mind: 0, fallacy: 0, paradox: 0 } };

        const { state: next } = executeSkill(state, buffSkill.id, lookup(buffSkill));

        const applied = next.player.effects.find(e => e.effectId === 'tier1_heart_attack');
        expect(applied).toBeDefined();
        expect(applied!.sourceId).toBe('char-player-shopper');
    });
});

describe('Phase 38 — enemy proc applies debuff onto player', () => {
    it('player effect carries sourceId === enemy.id', () => {
        mockSequentialRng(0.05);
        const player = fixturePlayer();
        const enemy = fixtureEnemy();

        // Synthesise a tier-1 proc outcome the enemy applies onto the player.
        const tier1Debuff: Effect = {
            id: 'tier1_mind_mark',
            name: 'Exposed Reasoning',
            description: 'test',
            type: 'debuff',
            category: 'stat',
            duration: 1,
            stacking: 'intensity',
            tier: 1,
            payload: {},
        };

        const outcome: ProcRollOutcome = {
            trigger: {
                stance: 'mind',
                action: 'attack',
                tier: 1,
                effectId: 'tier1_mind_mark',
                target: 'opponent',
                baseChance: 1.0,
            },
            effect: tier1Debuff,
            decision: 'normal',
            intensityBonus: 0,
            durationBonus: 0,
            appliedTo: 'opponent',
        };

        const result = applyProcOutcome(
            outcome,
            enemy, enemy.effects,
            player, player.effects,
            0,
        );

        // appliedTo === 'opponent' means the effect lands on `opponent`,
        // which is the player in this call. The new ActiveEffect should
        // carry the enemy's id (the actor) as sourceId.
        expect(result.appliedTo).toBe('opponent');
        const applied = result.opponentEffects.find(e => e.effectId === 'tier1_mind_mark');
        expect(applied).toBeDefined();
        expect(applied!.sourceId).toBe('enemy-rat-7');
    });
});

describe('Phase 38 — sourceId round-trips through JSON serialization (save/load)', () => {
    it('preserves the field unchanged across JSON.stringify → JSON.parse', () => {
        mockSequentialRng(0.05);
        const player = fixturePlayer();
        const enemy = fixtureEnemy();
        const base = initializeCombat(player, enemy);
        const state = { ...base, combatResources: { heart: 0, body: 0, mind: 2, fallacy: 0, paradox: 0 } };
        const { state: applied } = executeSkill(state, debuffSkill.id, lookup(debuffSkill));

        const serialized = JSON.stringify(applied);
        const restored = JSON.parse(serialized);

        const before = applied.enemy.effects.find((e: { effectId: string }) => e.effectId === 'debuff_poison');
        const after = restored.enemy.effects.find((e: { effectId: string }) => e.effectId === 'debuff_poison');
        expect(before).toBeDefined();
        expect(after).toBeDefined();
        expect(after.sourceId).toBe(before!.sourceId);
        expect(after.sourceId).toBe('char-player-shopper');
    });
});

describe('Phase 38 — regression: equipment passives keep sourceId === item.id', () => {
    it('equipping an item that grants a passive effect stamps sourceId with the item id', async () => {
        const { equipItem } = await import('../../Character/equipment.reducer');
        const player = fixturePlayer();
        const passiveEquipment = {
            id: 'eq_regen_band',
            name: 'Regen Band',
            description: 'Ticks heal each round.',
            category: 'equipment' as const,
            slot: 'accessory' as const,
            tier: 1,
            rarity: 'common' as const,
            requiredLevel: 1,
            passiveEffects: ['tier1_heart_defend'],
        };

        const equipped = equipItem(player, passiveEquipment);
        const passive = equipped.effects.find(e => e.effectId === 'tier1_heart_defend');
        expect(passive).toBeDefined();
        expect(passive!.sourceId).toBe('eq_regen_band');
    });
});
