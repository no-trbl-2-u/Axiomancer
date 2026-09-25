/**
 * Hermetic E2E Tests — Character module (Spec 01 + Spec 05 Q3 fold-in)
 *
 * Drives the Character module's public surface — `createCharacter`,
 * `equipItem`, `unequipItem`, `getEquipmentModifiers` — through the
 * library entry points without going through combat. Equipment ↔ combat
 * integration is already covered by `src/Items/e2e/equipment.engine.test.ts`;
 * this suite focuses on character-level invariants:
 *
 *   1. Stat / health / xp derivation contracts from `createCharacter`.
 *   2. Default fields and option pass-through.
 *   3. Spec 05 Q3 option A: starting `equipment` is folded into `derivedStats`
 *      at create-time (Phase 20: equipment applies NO effects).
 *   4. `equipItem` slot replacement keeps `effects` untouched and recomputes
 *      `derivedStats`.
 *   5. `unequipItem` on an empty slot is a referential no-op.
 *   6. `getEquipmentModifiers` aggregates flat + multiplier modifiers
 *      across slots (multiplier convention: store m−1 in `statMultBonus`).
 *
 * Hermetic: no Math.random, no I/O. All inputs constructed inline.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { createCharacter, allocateStatPoint } from '../index';
import { emptyLoadout } from '../types';
import { mockSequentialRng } from '../../test-utils/rng';
import {
    equipItem,
    unequipItem,
    getEquipmentModifiers,
} from '../equipment.reducer';
import {
    STAT_MULTIPLIERS,
    RESOURCE_MULTIPLIERS,
    PLAYER_VITAE_BASE,
    EXPERIENCE_PER_LEVEL,
} from '../../Game/game-mechanics.constants';
import type { Equipment } from '../../Items/types';

// ─── Test cleanup ─────────────────────────────────────────────────────────────

afterEach(() => {
    vi.restoreAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const buildBaseStats = () => ({ heart: 4, body: 3, mind: 2 });

const buildPlayer = (overrides: Partial<Parameters<typeof createCharacter>[0]> = {}) =>
    createCharacter({
        name: 'Tester',
        level: 1,
        baseStats: buildBaseStats(),
        ...overrides,
    });

const armorFlatBody = (): Equipment => ({
    id: 'test-armor-flat-body',
    name: 'Test Cuirass',
    description: 'Adds flat body.',
    category: 'equipment',
    slot: 'armor',
    statModifiers: [{ stat: 'body', value: 2 }],
});

const armorMultBody = (): Equipment => ({
    id: 'test-armor-mult-body',
    name: 'Test Robe',
    description: '+50% body multiplier.',
    category: 'equipment',
    slot: 'armor',
    statModifiers: [{ stat: 'body', value: 1.5, isMultiplier: true }],
});

const weaponFlatPhysAtk = (): Equipment => ({
    id: 'test-weapon-flat-physatk',
    name: 'Test Blade',
    description: '+4 physicalAttack.',
    category: 'equipment',
    slot: 'weapon',
    statModifiers: [{ stat: 'physicalAttack', value: 4 }],
});

/** Real effect from the library so passiveEffects round-trip via lookupEffect. */
const armorWithPassive = (): Equipment => ({
    id: 'test-armor-with-passive',
    name: 'Aegis of Body',
    description: 'Passive body buff while worn.',
    category: 'equipment',
    slot: 'armor',
});

// ─── createCharacter — derivation + defaults ─────────────────────────────────

describe('createCharacter — derivation contracts', () => {
    it('computes derivedStats from baseStats via STAT_MULTIPLIERS', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer();
        // physical → body, mental → mind, emotional → heart.
        expect(ch.derivedStats.physicalAttack).toBe(3 * STAT_MULTIPLIERS.ATTACK);
        expect(ch.derivedStats.physicalDefense).toBe(3 * STAT_MULTIPLIERS.DEFENSE);
        expect(ch.derivedStats.emotionalDefense).toBe(4 * STAT_MULTIPLIERS.DEFENSE);
        // luck = average(body, heart, mind) = (3+4+2)/3 = 3.
        expect(ch.derivedStats.luck).toBe(3);
    });

    it('computes nonCombatStats (saves and tests) via STAT_MULTIPLIERS', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer();
        expect(ch.nonCombatStats.physicalSave).toBe(3 * STAT_MULTIPLIERS.SAVE);
        expect(ch.nonCombatStats.physicalTest).toBe(3 * STAT_MULTIPLIERS.TEST);
        expect(ch.nonCombatStats.emotionalSave).toBe(4 * STAT_MULTIPLIERS.SAVE);
        expect(ch.nonCombatStats.mentalTest).toBe(2 * STAT_MULTIPLIERS.TEST);
    });

    it('sets VITAE = PLAYER_VITAE_BASE + sum(body, heart, mind) × HEALTH_PER_STAT and seeds it full', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({ level: 3 });
        const expected = PLAYER_VITAE_BASE + (3 + 4 + 2) * RESOURCE_MULTIPLIERS.HEALTH_PER_STAT;
        expect(ch.maxHealth).toBe(expected);
        expect(ch.health).toBe(expected);
    });

    it('seeds xp at the floor of the current level and the next-level threshold', () => {
        mockSequentialRng(0.5);
        const lvl1 = buildPlayer({ level: 1 });
        expect(lvl1.experience).toBe(0);
        expect(lvl1.experienceToNextLevel).toBe(1 * EXPERIENCE_PER_LEVEL);

        mockSequentialRng(0.5);
        const lvl5 = buildPlayer({ level: 5 });
        expect(lvl5.experience).toBe(4 * EXPERIENCE_PER_LEVEL);
        expect(lvl5.experienceToNextLevel).toBe(5 * EXPERIENCE_PER_LEVEL);
    });
});

describe('createCharacter — defaults and option pass-through', () => {
    it('defaults optional fields when omitted', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer();
        expect(ch.inventory).toEqual([]);
        expect(ch.currency).toBe(0);
        expect(ch.equipment).toEqual(emptyLoadout());
        expect(ch.effects).toEqual([]);
        expect(ch.knownCards).toEqual([]);
        // Spec 06 Q3 — points start at zero; level-ups add STAT_POINTS_PER_LEVEL.
        expect(ch.availableStatPoints).toBe(0);
    });

    it('passes through explicit option values verbatim', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({
            currency: 42,
            knownCards: ['card-a', 'card-b'],
        });
        expect(ch.currency).toBe(42);
        expect(ch.knownCards).toEqual(['card-a', 'card-b']);
    });
});

describe('createCharacter — Spec 05 Q3 starting equipment fold-in', () => {
    it('folds a flat base-stat modifier into derivedStats at create-time', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({ equipment: [armorFlatBody()] });
        // body 3 + 2 = 5 → physicalAttack = 5 × STAT_MULTIPLIERS.ATTACK.
        expect(ch.derivedStats.physicalAttack).toBe(5 * STAT_MULTIPLIERS.ATTACK);
        expect(ch.derivedStats.physicalDefense).toBe(5 * STAT_MULTIPLIERS.DEFENSE);
        // heart/mind untouched.
        expect(ch.derivedStats.emotionalAttack).toBe(4 * STAT_MULTIPLIERS.ATTACK);
        expect(ch.derivedStats.mentalAttack).toBe(2 * STAT_MULTIPLIERS.ATTACK);
        // baseStats stay raw — fold-in is on derived, not base.
        expect(ch.baseStats).toEqual(buildBaseStats());
        expect(ch.equipment.armor?.id).toBe('test-armor-flat-body');
    });

    it('Phase 20 — a passiveEffects item applies NO ActiveEffect (equipment is stat-only)', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({ equipment: [armorWithPassive()] });
        expect(ch.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);
    });
});

// ─── equipItem / unequipItem — slot replacement and effect tracking ─────────

describe('equipItem — slot replacement', () => {
    it('replaces the existing occupant and recomputes derivedStats', () => {
        mockSequentialRng(0.5);
        const start = buildPlayer({ equipment: [armorFlatBody()] });
        // Before: body 3 + 2 flat = 5 effective → physicalAttack 5.
        expect(start.derivedStats.physicalAttack).toBe(5 * STAT_MULTIPLIERS.ATTACK);

        // Swap to multiplier armor: body 3 × (1 + 0.5) = 4.5 → physicalAttack 4.5.
        const next = equipItem(start, armorMultBody());
        expect(next.equipment.armor?.id).toBe('test-armor-mult-body');
        expect(next.derivedStats.physicalAttack).toBe(4.5 * STAT_MULTIPLIERS.ATTACK);
        // Original character is unmutated.
        expect(start.derivedStats.physicalAttack).toBe(5 * STAT_MULTIPLIERS.ATTACK);
    });

    it('Phase 20 — equipping/swapping never adds equipment effects and leaves unrelated effects untouched', () => {
        const prior = armorWithPassive();
        const replacement = armorFlatBody();
        mockSequentialRng(0.5);
        const start = buildPlayer({ equipment: [prior] });
        // The passive item added no effect in the first place.
        expect(start.effects.some(e => e.sourceId === prior.id)).toBe(false);

        // Inject an unrelated combat effect that must survive the swap untouched.
        const seeded = {
            ...start,
            effects: [
                {
                    effectId: 'debuff_mark',
                    remainingDuration: 5,
                    intensity: 1,
                    appliedAt: 0,
                    tier: 1 as const,
                    sourceId: 'other-source',
                },
            ],
        };

        const next = equipItem(seeded, replacement);
        // Equip doesn't touch Character.effects at all now.
        expect(next.effects.some(e => e.sourceId === prior.id)).toBe(false);
        expect(next.effects.some(e => e.sourceId === 'other-source')).toBe(true);
    });
});

describe('unequipItem', () => {
    it('returns the same character reference when the slot is empty', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer();
        expect(unequipItem(ch, 'armor')).toBe(ch);
    });

    it('removes the slot and restores derivedStats (equipment never added effects — Phase 20)', () => {
        mockSequentialRng(0.5);
        const start = buildPlayer({ equipment: [armorWithPassive()] });
        expect(start.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);

        const stripped = unequipItem(start, 'armor');
        expect(stripped.equipment.armor).toBeNull();
        // Body modifier was zero on this armor (passive only), so derivedStats
        // returns to the bare-base-stat shape.
        expect(stripped.derivedStats.physicalAttack).toBe(3 * STAT_MULTIPLIERS.ATTACK);
        expect(stripped.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);
    });
});

// ─── getEquipmentModifiers — aggregation contract ────────────────────────────

describe('getEquipmentModifiers', () => {
    it('returns empty aggregates when no equipment is worn', () => {
        const agg = getEquipmentModifiers(emptyLoadout());
        expect(agg.statFlat.size).toBe(0);
        expect(agg.statMultBonus.size).toBe(0);
    });

    it('sums flat modifiers for the same stat across multiple slots', () => {
        const agg = getEquipmentModifiers({
            weapon: weaponFlatPhysAtk(), // +4 physicalAttack flat
            armor: armorFlatBody(),      // +2 body flat
            accessories: [],
        });
        expect(agg.statFlat.get('body')).toBe(2);
        expect(agg.statFlat.get('physicalAttack')).toBe(4);
        expect(agg.statMultBonus.size).toBe(0);
    });

    it('stores multipliers as (value − 1) in statMultBonus', () => {
        const agg = getEquipmentModifiers({ weapon: null, armor: armorMultBody(), accessories: [] }); // 1.5
        expect(agg.statMultBonus.get('body')).toBeCloseTo(0.5);
        expect(agg.statFlat.size).toBe(0);
    });

    it('keeps flat and multiplier streams independent for the same stat', () => {
        // The aggregator walks every worn piece regardless of slot kind, so the
        // second body-modifying piece rides an accessory position here.
        const agg = getEquipmentModifiers({
            weapon: null,
            armor:  armorFlatBody(),        // +2 body flat
            accessories: [armorMultBody()], // +50% body multiplier
        });
        expect(agg.statFlat.get('body')).toBe(2);
        expect(agg.statMultBonus.get('body')).toBeCloseTo(0.5);
    });
});

// ─── allocateStatPoint — Spec 06 Q3 + Q8 ──────────────────────────────────────

describe('allocateStatPoint', () => {
    it('decrements the pool, raises baseStat, and re-derives derived/non-combat/maxHealth', () => {
        mockSequentialRng(0.5);
        const before = buildPlayer({});
        // Seed available points so the allocation succeeds.
        const seeded = { ...before, availableStatPoints: 2 };
        const after = allocateStatPoint(seeded, 'body');

        expect(after.availableStatPoints).toBe(1);
        expect(after.baseStats.body).toBe(before.baseStats.body + 1);
        // derived stats follow the body increase via STAT_MULTIPLIERS.DEFENSE = 3.
        expect(after.derivedStats.physicalDefense).toBe(
            (before.baseStats.body + 1) * STAT_MULTIPLIERS.DEFENSE,
        );
        // non-combat stats also fold body changes (physicalSave = body × SAVE).
        expect(after.nonCombatStats.physicalSave).toBe(
            (before.baseStats.body + 1) * STAT_MULTIPLIERS.SAVE,
        );
        // maxHealth depends on (body, heart) averages; raising body bumps it.
        expect(after.maxHealth).toBeGreaterThan(before.maxHealth);
        // HP grows by exactly the maxHealth delta — not a free heal.
        const delta = after.maxHealth - before.maxHealth;
        expect(after.health).toBe(before.health + delta);
    });

    it('is a no-op when availableStatPoints is zero', () => {
        mockSequentialRng(0.5);
        const before = buildPlayer({});
        expect(before.availableStatPoints).toBe(0);
        const after = allocateStatPoint(before, 'heart');
        expect(after).toBe(before);
    });

    it('routes heart / body / mind to the matching base stat', () => {
        mockSequentialRng(0.5);
        const seeded = { ...buildPlayer({}), availableStatPoints: 3 };
        const afterHeart = allocateStatPoint(seeded, 'heart');
        const afterBody  = allocateStatPoint(seeded, 'body');
        const afterMind  = allocateStatPoint(seeded, 'mind');
        expect(afterHeart.baseStats.heart).toBe(seeded.baseStats.heart + 1);
        expect(afterBody.baseStats.body).toBe(seeded.baseStats.body + 1);
        expect(afterMind.baseStats.mind).toBe(seeded.baseStats.mind + 1);
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Phase 35 — Character.id stability
//
// Pins that every Character ships with a non-empty `id`, that callers can
// override the auto-gen by supplying `id` explicitly (mirrors how fixtures
// will want to pin ActiveEffect.sourceId), and that two auto-generated ids
// don't collide across back-to-back createCharacter calls. Closes
// Knowledge-Gaps Q12.
// ────────────────────────────────────────────────────────────────────────────

describe('createCharacter — id field (Phase 35)', () => {
    it('auto-generates a non-empty id when none is supplied', () => {
        mockSequentialRng(0.5);
        const p = buildPlayer({});
        expect(typeof p.id).toBe('string');
        expect(p.id.length).toBeGreaterThan(0);
        expect(p.id).toMatch(/^char-/);
    });

    it('respects an explicit id when supplied', () => {
        mockSequentialRng(0.5);
        const p = buildPlayer({ id: 'fixture-player' });
        expect(p.id).toBe('fixture-player');
    });

    it('produces distinct auto-generated ids for back-to-back creations', () => {
        mockSequentialRng(0.5);
        const a = buildPlayer({});
        mockSequentialRng(0.6);
        const b = buildPlayer({});
        mockSequentialRng(0.7);
        const c = buildPlayer({});
        expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    });

    it('round-trips through structured clone unchanged', () => {
        mockSequentialRng(0.5);
        const original = buildPlayer({ id: 'reincarnate-1' });
        const roundTripped = JSON.parse(JSON.stringify(original)) as typeof original;
        expect(roundTripped.id).toBe('reincarnate-1');
    });
});
