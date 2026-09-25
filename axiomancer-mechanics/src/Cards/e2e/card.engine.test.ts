import { afterEach, describe, expect, it, vi } from 'vitest';

import { createCharacter } from '../../Character';
import { createEnemy } from '../../Enemy';
import { initializeCombat } from '../../Combat/combat.reducer';
import { mockSequentialRng } from '../../test-utils';
import { restoreOriginalRng } from '../../test-utils/rng';
import { executeCard } from '../card.engine';
import { Card } from '../types';
import { CombatState } from '../../Combat/types';

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
});

/**
 * Spec 32 v3 fixtures — these carry no damage magnitude (`basePower` is gone
 * from the schema; direct damage now lives in the combat-engine-owned `deal`
 * mechanic): the fallacy card applies a DoT, the paradox card a self-buff. Combat-engine-owned verbs (guard etc.) no-op here.
 */
const dotCard: Card = {
    id: 'sk_erode',
    name: 'Test Erosion',
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

const fixtureState = (): CombatState => initializeCombat(fixturePlayer(), fixtureEnemy());

const lookup = (id: string): Card | undefined =>
    [dotCard, buffCard, debuffCard].find(s => s.id === id);

describe('executeCard — no direct HP movement (spec 32 v3)', () => {
    it('an enemy-target card leaves HP untouched', () => {
        mockSequentialRng(0.05); // land the tiered resist roll
        const state = fixtureState();
        const enemyHpBefore = state.enemy.health;
        const { state: next } = executeCard(state, dotCard.id, lookup);

        // HP falls to DoT ticks / payoffs / drips / reflect — never to the play.
        expect(next.enemy.health).toBe(enemyHpBefore);
        // But the affliction lands — the efficient path.
        expect(next.enemy.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
    });

    it('a self-target card no longer heals from stats; it lands its buff', () => {
        mockSequentialRng(0.5);
        const player = fixturePlayer();
        const state = initializeCombat({ ...player, health: player.maxHealth - 10 }, fixtureEnemy());
        const hpBefore = state.player.health;
        const { state: next } = executeCard(state, buffCard.id, lookup);

        expect(next.player.health).toBe(hpBefore); // no stat-scaled self-heal
        expect(next.player.effects.some(e => e.effectId === 'buff_thorns')).toBe(true);
    });
});

describe('executeCard — debuff (effect application)', () => {
    it('routes the effect through the resist pipeline and lands it on the enemy', () => {
        // Tier 2 debuff resist roll → land guaranteed by stubbing nat-2 (low resist roll).
        mockSequentialRng(0.05);
        const state = fixtureState();
        const { state: next, events } = executeCard(state, debuffCard.id, lookup);

        expect(next.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(events.find(e => e.kind === 'effect-applied')).toBeDefined();
    });
});

describe('executeCard — guards', () => {
    it('throws when card is not known', () => {
        const state = fixtureState();
        const player = { ...state.player, knownCards: [] };
        expect(() => executeCard({ ...state, player }, dotCard.id, lookup))
            .toThrow(/not known/);
    });

    it('throws when card id is unknown', () => {
        const state = fixtureState();
        const player = { ...state.player, knownCards: ['sk_unknown'] };
        expect(() => executeCard({ ...state, player }, 'sk_unknown', () => undefined))
            .toThrow(/not found/);
    });

    it('accepts a card owned via combatRewardCards but not knownCards', () => {
        // Reward-pool pickups enter the deck without joining knownCards (they
        // bypass the learning gate). The player-caster guard must treat them as
        // owned — otherwise playing a dealt reward card crashes combat.
        mockSequentialRng(0.05);
        const state = fixtureState();
        const player = { ...state.player, knownCards: [], combatRewardCards: [dotCard.id] };
        expect(() => executeCard({ ...state, player }, dotCard.id, lookup))
            .not.toThrow();
    });
});

describe('executeCard — Phase 49 casterSide=enemy', () => {
    it("routes an enemy-rotation card's status onto the player, HP untouched", () => {
        mockSequentialRng(0.05);
        const enemy = { ...fixtureEnemy(), cards: [dotCard] };
        const state: CombatState = initializeCombat(fixturePlayer(), enemy);
        const playerHpBefore = state.player.health;

        const { state: next } = executeCard(state, dotCard.id, lookup, 'enemy');

        // Spec 32 v3: the play itself never moves HP — the DoT does the work.
        expect(next.player.health).toBe(playerHpBefore);
        expect(next.enemy.health).toBe(state.enemy.health);
        // targetType 'enemy' is relative to the CASTER: the debuff lands on the player.
        expect(next.player.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
    });

    it("routes a self-target buff onto the enemy when casterSide='enemy'", () => {
        mockSequentialRng(0.5);
        const enemyLow = { ...fixtureEnemy(), cards: [buffCard] };
        enemyLow.health = Math.max(1, enemyLow.health - 10);
        const state: CombatState = initializeCombat(fixturePlayer(), enemyLow);
        const enemyHpBefore = state.enemy.health;
        const playerHpBefore = state.player.health;

        const { state: next } = executeCard(state, buffCard.id, lookup, 'enemy');

        // No stat-scaled heal any more — the buff is the whole payload.
        expect(next.enemy.health).toBe(enemyHpBefore);
        expect(next.player.health).toBe(playerHpBefore);
        expect(next.enemy.effects.some(e => e.effectId === 'buff_thorns')).toBe(true);
        expect(next.player.effects.some(e => e.effectId === 'buff_thorns')).toBe(false);
    });

    it("throws when card is not in the enemy's rotation", () => {
        const enemy = { ...fixtureEnemy(), cards: [] as Card[] };
        const state: CombatState = initializeCombat(fixturePlayer(), enemy);
        expect(() => executeCard(state, dotCard.id, lookup, 'enemy'))
            .toThrow(/not in the enemy's rotation/);
    });

    it('player-side default behaviour is unchanged when casterSide is omitted', () => {
        // Regression — pre-Phase-49 call sites omit the 4th arg and must
        // still get the player-cast pathway.
        mockSequentialRng(0.05);
        const state = fixtureState();
        const enemyHpBefore = state.enemy.health;
        const { state: next } = executeCard(state, dotCard.id, lookup);

        expect(next.enemy.health).toBe(enemyHpBefore);
        expect(next.enemy.effects.some(e => e.effectId === 'debuff_bleed')).toBe(true);
    });
});
