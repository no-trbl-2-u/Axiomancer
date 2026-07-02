import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { mockSequentialRng } from '../../test-utils';
import { restoreOriginalRng } from '../../test-utils/rng';
import {
    calculateSkillDamage,
    executeSkill,
    generateBasicActionResources,
    generatePhilosophicalResource,
} from '../skill.engine';
import { CombatResources, Card } from '../types';
import { CombatState } from '../../Combat/types';

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
});

const zero: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

const damagingSkill: Card = {
    id: 'sk_strike',
    name: 'Sophist Strike',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description: 'A direct refutation.',
    tier: 1,
    targetType: 'enemy',
    basePower: 5,
    scalingStat: 'body',
};

const buffSkill: Card = {
    id: 'sk_resolve',
    name: 'Self-Resolve',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description: 'A heartening certainty.',
    tier: 1,
    targetType: 'self',
    basePower: 4,
    scalingStat: 'heart',
};

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
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent' },
    ],
};

const fixturePlayer = () => createCharacter({
    name: 'P', level: 1,
    baseStats: { heart: 4, body: 6, mind: 4 },
    knownSkills: [damagingSkill.id, buffSkill.id, debuffSkill.id],
});

const fixtureEnemy = () => createEnemy({
    id: 'e1', name: 'E', description: 'd', level: 1,
    baseStats: { heart: 3, body: 3, mind: 3 },
    mapName: 'northern-city', logic: 'random',
});

const fixtureState = (resources: Partial<CombatResources> = {}): CombatState => {
    const state = initializeCombat(fixturePlayer(), fixtureEnemy());
    return { ...state, combatResources: { ...zero, ...resources } };
};

const lookup = (id: string): Card | undefined =>
    [damagingSkill, buffSkill, debuffSkill].find(s => s.id === id);

describe('generateBasicActionResources', () => {
    it('attack hit on body stance grants +3 body', () => {
        expect(generateBasicActionResources(zero, 'body', 'hit'))
            .toEqual({ ...zero, body: 3 });
    });

    it('attack miss on heart stance grants +1 heart', () => {
        expect(generateBasicActionResources(zero, 'heart', 'miss'))
            .toEqual({ ...zero, heart: 1 });
    });

    it('defend on mind stance grants +5 mind', () => {
        expect(generateBasicActionResources(zero, 'mind', 'defend'))
            .toEqual({ ...zero, mind: 5 });
    });

    it('does not mutate the input snapshot', () => {
        const r = { ...zero };
        generateBasicActionResources(r, 'body', 'hit');
        expect(r).toEqual(zero);
    });
});

describe('generatePhilosophicalResource', () => {
    it('fallacy category adds +1 fallacy', () => {
        expect(generatePhilosophicalResource(zero, 'fallacy'))
            .toEqual({ ...zero, fallacy: 1 });
    });

    it('paradox category adds +1 paradox', () => {
        expect(generatePhilosophicalResource(zero, 'paradox'))
            .toEqual({ ...zero, paradox: 1 });
    });
});

describe('calculateSkillDamage', () => {
    it('basePower + baseStats[scalingStat] × 0.5, rounded', () => {
        const player = fixturePlayer();          // body 6
        // 5 + 6 × 0.5 = 8
        expect(calculateSkillDamage(player, damagingSkill)).toBe(8);
    });

    it('clamps at 0 for negative results', () => {
        const player = createCharacter({
            name: 'P', level: 1, baseStats: { heart: 0, body: 0, mind: 0 },
        });
        const skill: Card = { ...damagingSkill, basePower: -10 };
        expect(calculateSkillDamage(player, skill)).toBe(0);
    });
});

describe('executeSkill — damaging', () => {
    it('applies damage and grants 1 fallacy token (no cost spent)', () => {
        const state = fixtureState({ body: 3 });
        const enemyHpBefore = state.enemy.health;
        const { state: next, events } = executeSkill(state, damagingSkill.id, lookup);

        expect(next.enemy.health).toBe(enemyHpBefore - 5); // 8 base damage - 3 body resistance
        // Cards carry no resource cost — the pool passes through, +1 fallacy generated.
        expect(next.combatResources).toEqual({ ...zero, body: 3, fallacy: 1 });
        expect(events.find(e => e.kind === 'damage')).toMatchObject({
            target: 'enemy', amount: 5, hpBefore: enemyHpBefore, hpAfter: next.enemy.health,
        });
        expect(events.find(e => e.kind === 'philosophical-generated')).toMatchObject({
            category: 'fallacy',
        });
    });
});

describe('executeSkill — buff (self-target)', () => {
    it('heals the player and grants 1 paradox token', () => {
        const player = fixturePlayer();
        const state = {
            ...initializeCombat({ ...player, health: player.maxHealth - 10 }, fixtureEnemy()),
            combatResources: { ...zero, heart: 3 },
        };
        const hpBefore = state.player.health;
        const { state: next } = executeSkill(state, buffSkill.id, lookup);

        // 4 + 4 × 0.5 = 6
        expect(next.player.health).toBe(hpBefore + 6);
        expect(next.combatResources).toEqual({ ...zero, heart: 3, paradox: 1 });
    });
});

describe('executeSkill — debuff (effect application)', () => {
    it('routes the effect through the resist pipeline and lands it on the enemy', () => {
        // Tier 2 debuff resist roll → land guaranteed by stubbing nat-2 (low resist roll).
        mockSequentialRng(0.05);
        const state = fixtureState({ mind: 2, fallacy: 1 });
        const { state: next, events } = executeSkill(state, debuffSkill.id, lookup);

        expect(next.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(next.combatResources).toEqual({ ...zero, mind: 2, fallacy: 2 });
        expect(events.find(e => e.kind === 'effect-applied')).toBeDefined();
    });
});

describe('executeSkill — guards', () => {
    it('throws when skill is not known', () => {
        const state = fixtureState({ body: 3 });
        const player = { ...state.player, knownSkills: [] };
        expect(() => executeSkill({ ...state, player }, damagingSkill.id, lookup))
            .toThrow(/not known/);
    });

    it('throws when skill id is unknown', () => {
        const state = fixtureState({ body: 3 });
        const player = { ...state.player, knownSkills: ['sk_unknown'] };
        expect(() => executeSkill({ ...state, player }, 'sk_unknown', () => undefined))
            .toThrow(/not found/);
    });
});

describe('executeSkill — Phase 49 casterSide=enemy', () => {
    it("routes a damaging skill from the enemy's rotation against the player", () => {
        const enemy = { ...fixtureEnemy(), skills: [damagingSkill] };
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemy),
            // D2 sentinel — enemy bypasses resource costs.
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        const playerHpBefore = state.player.health;

        const { state: next, events } = executeSkill(state, damagingSkill.id, lookup, 'enemy');

        // Damage formula: basePower 5 + body 3 × 0.5 = 6.5 → 7, reduced by player body(6) resistance = 1.
        expect(next.player.health).toBe(playerHpBefore - 1);
        // Caster (enemy) is unchanged on HP.
        expect(next.enemy.health).toBe(state.enemy.health);
        // Damage event target=='enemy' is relative-to-caster — D3.
        expect(events.find(e => e.kind === 'damage')).toMatchObject({
            target: 'enemy', amount: 1, hpBefore: playerHpBefore, hpAfter: next.player.health,
        });
    });

    it("routes a self-target heal onto the enemy when casterSide='enemy'", () => {
        const enemyAtLowHp = { ...fixtureEnemy(), skills: [buffSkill] };
        enemyAtLowHp.health = Math.max(1, enemyAtLowHp.health - 10);
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemyAtLowHp),
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        const enemyHpBefore = state.enemy.health;
        const playerHpBefore = state.player.health;

        const { state: next, events } = executeSkill(state, buffSkill.id, lookup, 'enemy');

        // Heal lands on the caster (enemy). 4 + heart 3 × 0.5 = 5.5 → 6.
        expect(next.enemy.health).toBe(enemyHpBefore + 6);
        // Player (target) is untouched.
        expect(next.player.health).toBe(playerHpBefore);
        expect(events.find(e => e.kind === 'heal')).toMatchObject({
            target: 'self', amount: 6,
        });
    });

    it("throws when skill is not in the enemy's rotation", () => {
        const enemy = { ...fixtureEnemy(), skills: [] as Card[] };
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemy),
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        expect(() => executeSkill(state, damagingSkill.id, lookup, 'enemy'))
            .toThrow(/not in the enemy's rotation/);
    });

    it("player-side default behaviour is unchanged when casterSide is omitted", () => {
        // Regression — pre-Phase-49 call sites omit the 4th arg and must
        // still get the player-cast pathway.
        const state = fixtureState({ body: 3 });
        const enemyHpBefore = state.enemy.health;
        const { state: next } = executeSkill(state, damagingSkill.id, lookup);

        expect(next.enemy.health).toBe(enemyHpBefore - 5); // 8 base damage - 3 body resistance
        // Player's pool passes through (no cost) + 1 fallacy token generated.
        expect(next.combatResources).toEqual({ ...zero, body: 3, fallacy: 1 });
    });
});

describe('initializeCombat — resource initialization', () => {
    it('initializes combatResources to zero', () => {
        const state = initializeCombat(fixturePlayer(), fixtureEnemy());
        expect(state.combatResources).toEqual(zero);
    });
});
