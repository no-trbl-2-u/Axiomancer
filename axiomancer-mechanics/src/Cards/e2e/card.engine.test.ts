import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { mockSequentialRng } from '../../test-utils';
import { restoreOriginalRng } from '../../test-utils/rng';
import {
    calculateCardDamage,
    executeCard,
    generateBasicActionResources,
    generatePhilosophicalResource,
} from '../card.engine';
import { CombatResources, Card } from '../types';
import { CombatState } from '../../Combat/types';

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
});

const zero: CombatResources = { heart: 0, body: 0, mind: 0, fallacy: 0, paradox: 0 };

/**
 * Spec 32 v3 fixtures — no card carries a damage magnitude (`basePower` was
 * deleted from the schema): the fallacy card applies a DoT, the paradox card
 * a self-buff. Combat-engine-owned verbs (guard etc.) no-op here.
 */
const dotCard: Card = {
    id: 'sk_erode',
    name: 'Test Erosion',
    category: 'fallacy',
    philosophicalAspect: 'body',
    description: 'A wound of reasoning.',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    free: { tickOne: true },
    combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 2 }],
};

const buffCard: Card = {
    id: 'sk_resolve',
    name: 'Self-Resolve',
    category: 'paradox',
    philosophicalAspect: 'heart',
    description: 'A heartening certainty.',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'self',
    free: { guard: 2 },
    combatEffects: [{ effectId: 'buff_thorns', appliedTo: 'self', intensity: 1, duration: 2 }],
};

const debuffCard: Card = {
    id: 'sk_doubt',
    name: 'Sow Doubt',
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description: 'Plants a seed of doubt.',
    tier: 1,
    rank: 1,
    cardType: 'spell',
    targetType: 'enemy',
    free: { drawCards: 1 },
    combatEffects: [
        { effectId: 'debuff_poison', appliedTo: 'opponent' },
    ],
};

const fixturePlayer = () => createCharacter({
    name: 'P', level: 1,
    baseStats: { heart: 4, body: 6, mind: 4 },
    knownCards: [dotCard.id, buffCard.id, debuffCard.id],
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
    [dotCard, buffCard, debuffCard].find(s => s.id === id);

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

describe('calculateCardDamage — THE STRIKE IS DEAD (spec 32 v3 §1)', () => {
    it('returns 0 unconditionally: no card deals stat-scaled damage', () => {
        const player = fixturePlayer(); // body 6 — irrelevant by design
        expect(calculateCardDamage(player, dotCard)).toBe(0);
        expect(calculateCardDamage(player, buffCard)).toBe(0);
        expect(calculateCardDamage(player, debuffCard, fixtureEnemy())).toBe(0);
    });
});

describe('executeCard — no direct HP movement (spec 32 v3)', () => {
    it('an enemy-target card leaves HP untouched and grants 1 fallacy token', () => {
        mockSequentialRng(0.05); // land the tiered resist roll
        const state = fixtureState({ body: 3 });
        const enemyHpBefore = state.enemy.health;
        const { state: next, events } = executeCard(state, dotCard.id, lookup);

        // HP falls to DoT ticks / payoffs / drips / reflect — never to the play.
        expect(next.enemy.health).toBe(enemyHpBefore);
        expect(events.find(e => e.kind === 'damage')).toBeUndefined();
        // But the affliction lands — the efficient path.
        expect(next.enemy.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
        // Cards carry no resource cost — the pool passes through, +1 fallacy generated.
        expect(next.combatResources).toEqual({ ...zero, body: 3, fallacy: 1 });
        expect(events.find(e => e.kind === 'philosophical-generated')).toMatchObject({
            category: 'fallacy',
        });
    });

    it('a self-target card no longer heals from stats; it lands its buff + 1 paradox token', () => {
        mockSequentialRng(0.5);
        const player = fixturePlayer();
        const state = {
            ...initializeCombat({ ...player, health: player.maxHealth - 10 }, fixtureEnemy()),
            combatResources: { ...zero, heart: 3 },
        };
        const hpBefore = state.player.health;
        const { state: next, events } = executeCard(state, buffCard.id, lookup);

        expect(next.player.health).toBe(hpBefore); // no stat-scaled self-heal
        expect(events.find(e => e.kind === 'heal')).toBeUndefined();
        expect(next.player.effects.some(e => e.effectId === 'buff_thorns')).toBe(true);
        expect(next.combatResources).toEqual({ ...zero, heart: 3, paradox: 1 });
    });
});

describe('executeCard — debuff (effect application)', () => {
    it('routes the effect through the resist pipeline and lands it on the enemy', () => {
        // Tier 2 debuff resist roll → land guaranteed by stubbing nat-2 (low resist roll).
        mockSequentialRng(0.05);
        const state = fixtureState({ mind: 2, fallacy: 1 });
        const { state: next, events } = executeCard(state, debuffCard.id, lookup);

        expect(next.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(next.combatResources).toEqual({ ...zero, mind: 2, fallacy: 2 });
        expect(events.find(e => e.kind === 'effect-applied')).toBeDefined();
    });
});

describe('executeCard — guards', () => {
    it('throws when skill is not known', () => {
        const state = fixtureState({ body: 3 });
        const player = { ...state.player, knownCards: [] };
        expect(() => executeCard({ ...state, player }, dotCard.id, lookup))
            .toThrow(/not known/);
    });

    it('throws when skill id is unknown', () => {
        const state = fixtureState({ body: 3 });
        const player = { ...state.player, knownCards: ['sk_unknown'] };
        expect(() => executeCard({ ...state, player }, 'sk_unknown', () => undefined))
            .toThrow(/not found/);
    });

    it('accepts a card owned via combatRewardCards but not knownCards', () => {
        // Reward-pool pickups enter the deck without joining knownCards (they
        // bypass the learning gate). The player-caster guard must treat them as
        // owned — otherwise playing a dealt reward card crashes combat.
        mockSequentialRng(0.05);
        const state = fixtureState({ body: 3 });
        const player = { ...state.player, knownCards: [], combatRewardCards: [dotCard.id] };
        expect(() => executeCard({ ...state, player }, dotCard.id, lookup))
            .not.toThrow();
    });
});

describe('executeCard — Phase 49 casterSide=enemy', () => {
    it("routes an enemy-rotation card's status onto the player, HP untouched", () => {
        mockSequentialRng(0.05);
        const enemy = { ...fixtureEnemy(), skills: [dotCard] };
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemy),
            // D2 sentinel — enemy bypasses resource costs.
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        const playerHpBefore = state.player.health;

        const { state: next, events } = executeCard(state, dotCard.id, lookup, 'enemy');

        // Spec 32 v3: the play itself never moves HP — the DoT does the work.
        expect(next.player.health).toBe(playerHpBefore);
        expect(next.enemy.health).toBe(state.enemy.health);
        expect(events.find(e => e.kind === 'damage')).toBeUndefined();
        // targetType 'enemy' is relative to the CASTER: the debuff lands on the player.
        expect(next.player.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
    });

    it("routes a self-target buff onto the enemy when casterSide='enemy'", () => {
        mockSequentialRng(0.5);
        const enemyLow = { ...fixtureEnemy(), skills: [buffCard] };
        enemyLow.health = Math.max(1, enemyLow.health - 10);
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemyLow),
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        const enemyHpBefore = state.enemy.health;
        const playerHpBefore = state.player.health;

        const { state: next, events } = executeCard(state, buffCard.id, lookup, 'enemy');

        // No stat-scaled heal any more — the buff is the whole payload.
        expect(next.enemy.health).toBe(enemyHpBefore);
        expect(next.player.health).toBe(playerHpBefore);
        expect(events.find(e => e.kind === 'heal')).toBeUndefined();
        expect(next.enemy.effects.some(e => e.effectId === 'buff_thorns')).toBe(true);
        expect(next.player.effects.some(e => e.effectId === 'buff_thorns')).toBe(false);
    });

    it("throws when skill is not in the enemy's rotation", () => {
        const enemy = { ...fixtureEnemy(), skills: [] as Card[] };
        const state: CombatState = {
            ...initializeCombat(fixturePlayer(), enemy),
            combatResources: { heart: 999, body: 999, mind: 999, fallacy: 999, paradox: 999 },
        };
        expect(() => executeCard(state, dotCard.id, lookup, 'enemy'))
            .toThrow(/not in the enemy's rotation/);
    });

    it('player-side default behaviour is unchanged when casterSide is omitted', () => {
        // Regression — pre-Phase-49 call sites omit the 4th arg and must
        // still get the player-cast pathway.
        mockSequentialRng(0.05);
        const state = fixtureState({ body: 3 });
        const enemyHpBefore = state.enemy.health;
        const { state: next } = executeCard(state, dotCard.id, lookup);

        expect(next.enemy.health).toBe(enemyHpBefore);
        expect(next.enemy.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
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
