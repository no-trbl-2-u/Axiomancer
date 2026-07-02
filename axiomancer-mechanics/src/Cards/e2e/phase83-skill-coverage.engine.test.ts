import { afterEach, describe, it, expect, vi } from 'vitest';

import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { executeSkill } from '../skill.engine';
import { getCardById } from '../cards.library';
import { mockSequentialRng } from '../../test-utils/rng';
import { CombatResources } from '../types';
import { CombatState } from '../../Combat/types';

afterEach(() => vi.restoreAllMocks());

const zero: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

const fixturePlayer = (overrides: Partial<{ knownSkills: string[] }> = {}) =>
    createCharacter({
        name: 'P83', level: 1,
        baseStats: { heart: 4, body: 6, mind: 4 },
        knownSkills: overrides.knownSkills ?? [],
    });

const fixtureEnemy = () => createEnemy({
    id: 'e83', name: 'E83', description: 'Phase 83 test enemy', level: 1,
    baseStats: { heart: 3, body: 3, mind: 3 },
    mapName: 'northern-city', logic: 'random',
});

const fixtureState = (skillId: string, resources: Partial<CombatResources> = {}): CombatState => {
    const player = fixturePlayer({ knownSkills: [skillId] });
    const state = initializeCombat(player, fixtureEnemy());
    return { ...state, combatResources: { ...zero, ...resources } };
};

describe('false-dilemma — Tier 1 mind + debuff_confusion always lands', () => {
    it('applies debuff_confusion at duration 2 on the enemy', () => {
        mockSequentialRng(0.99);
        const state = fixtureState('false-dilemma', { mind: 3 });
        const { state: next, events } = executeSkill(state, 'false-dilemma', getCardById);

        expect(next.enemy.effects.some(e => e.effectId === 'debuff_confusion')).toBe(true);
        const applied = next.enemy.effects.find(e => e.effectId === 'debuff_confusion')!;
        expect(applied.remainingDuration).toBe(2);
        expect(events.find(e => e.kind === 'effect-applied')).toBeDefined();
    });
});

describe('appeal-to-pity — Tier 1 self-heal heart x 2', () => {
    it('restores heart x scalingMultiplier x 0.5 = heart x 2 HP on the caster', () => {
        mockSequentialRng(0.99);
        const player = fixturePlayer({ knownSkills: ['appeal-to-pity'] });
        const enemy = fixtureEnemy();
        const state: CombatState = {
            ...initializeCombat({ ...player, health: player.maxHealth - 10 } as typeof player, enemy),
            combatResources: { ...zero, heart: 3 },
        };
        const hpBefore = state.player.health;
        const { state: next } = executeSkill(state, 'appeal-to-pity', getCardById);

        // heal = 0 + heart(4) x 0.5 x 4 = 8
        expect(next.player.health).toBe(hpBefore + 8);
    });
});

describe('liars-echo — Tier 1 mind + tier1_mind_mark intensity 2 duration 2', () => {
    it('applies tier1_mind_mark on the enemy', () => {
        mockSequentialRng(0.99);
        const state = fixtureState('liars-echo', { mind: 3 });
        const { state: next } = executeSkill(state, 'liars-echo', getCardById);

        const mark = next.enemy.effects.find(e => e.effectId === 'tier1_mind_mark');
        expect(mark).toBeDefined();
        expect(mark!.intensity).toBe(2);
        expect(mark!.remainingDuration).toBe(2);
    });
});

describe('ship-of-theseus — convert_enemy_buff_to_self primitive', () => {
    it('transfers one enemy buff onto the caster', () => {
        mockSequentialRng(0.99);
        const player = fixturePlayer({ knownSkills: ['ship-of-theseus'] });
        const enemy = fixtureEnemy();
        const state: CombatState = {
            ...initializeCombat(player, enemy),
            combatResources: { ...zero, heart: 3 },
        };
        // Seed the enemy with a buff.
        state.enemy = {
            ...state.enemy,
            effects: [{
                effectId: 'buff_body_attack_up',
                tier: 1,
                intensity: 1,
                remainingDuration: 3,
                appliedAt: 1,
                resistedBy: 'body',
                resistDR: 0,
            }],
        } as typeof state.enemy;

        const { state: next, events } = executeSkill(state, 'ship-of-theseus', getCardById);

        expect(next.player.effects.some(e => e.effectId === 'buff_body_attack_up')).toBe(true);
        expect(events.find(e => e.kind === 'buff-converted')).toMatchObject({
            kind: 'buff-converted',
        });
    });

    it('no-ops gracefully when enemy has zero buffs', () => {
        mockSequentialRng(0.99);
        const state = fixtureState('ship-of-theseus', { heart: 3 });

        const { state: next, events } = executeSkill(state, 'ship-of-theseus', getCardById);

        expect(next.player.effects.length).toBe(0);
        expect(events.find(e => e.kind === 'buff-converted')).toMatchObject({
            effect: null,
        });
    });
});

describe('mob-appeal — Tier 2 body + secondary_heal_self', () => {
    it('damages enemy and heals caster by heart x multiplier x 0.5 = heart x 0.5', () => {
        mockSequentialRng(0.99);
        const player = fixturePlayer({ knownSkills: ['mob-appeal'] });
        const enemy = fixtureEnemy();
        const state: CombatState = {
            ...initializeCombat({ ...player, health: player.maxHealth - 10 } as typeof player, enemy),
            combatResources: { ...zero, body: 2, heart: 2 },
        };
        const casterHpBefore = state.player.health;
        const enemyHpBefore = state.enemy.health;

        const { state: next, events } = executeSkill(state, 'mob-appeal', getCardById);

        // basePower 10 + body(6) x 0.5 = 13 damage, reduced by enemy body(3) resistance = 10 damage
        expect(next.enemy.health).toBe(enemyHpBefore - 10);
        // secondary_heal_self: heart(4) x 0.5 x 1 = 2
        expect(next.player.health).toBe(casterHpBefore + 2);
        expect(events.filter(e => e.kind === 'heal').length).toBeGreaterThanOrEqual(1);
    });
});

describe('undistributed-middle — Tier 2 mind + tier1_mind_mark intensity 3 duration 3', () => {
    it('applies tier1_mind_mark at intensity 3 duration 3 on the enemy', () => {
        mockSequentialRng(0.99);
        const state = fixtureState('undistributed-middle', { body: 2, mind: 2 });
        const { state: next } = executeSkill(state, 'undistributed-middle', getCardById);

        const mark = next.enemy.effects.find(e => e.effectId === 'tier1_mind_mark');
        expect(mark).toBeDefined();
        expect(mark!.intensity).toBe(3);
        expect(mark!.remainingDuration).toBe(3);
    });
});

describe('eternal-regress — Tier 2 heart + two-effect compound (debuff_confusion + debuff_slow)', () => {
    it('applies BOTH debuff_confusion and debuff_slow on the enemy', () => {
        mockSequentialRng(0.99);
        const state = fixtureState('eternal-regress', { heart: 2, mind: 2 });
        const { state: next } = executeSkill(state, 'eternal-regress', getCardById);

        expect(next.enemy.effects.some(e => e.effectId === 'debuff_confusion')).toBe(true);
        expect(next.enemy.effects.some(e => e.effectId === 'debuff_slow')).toBe(true);
    });
});

describe('bootstrap-paradox — Tier 3 self-heal heart x 2', () => {
    it('restores heart x scalingMultiplier x 0.5 = heart x 2 HP on the caster', () => {
        mockSequentialRng(0.99);
        const player = fixturePlayer({ knownSkills: ['bootstrap-paradox'] });
        const enemy = fixtureEnemy();
        const state: CombatState = {
            ...initializeCombat({ ...player, health: player.maxHealth - 10 } as typeof player, enemy),
            combatResources: { ...zero, heart: 2, paradox: 1 },
        };
        const hpBefore = state.player.health;
        const { state: next } = executeSkill(state, 'bootstrap-paradox', getCardById);

        // heal = 0 + heart(4) x 0.5 x 4 = 8
        expect(next.player.health).toBe(hpBefore + 8);
    });
});
