/**
 * Hermetic E2E Tests — Character module (Spec 01 + Spec 05 Q3 fold-in)
 *
 * Drives the Character module's public surface — `createCharacter`,
 * `equipItem`, `unequipItem` — through the library entry points without
 * going through combat. Equipment ↔ combat integration is already covered by
 * `src/Items/e2e/equipment.engine.test.ts`; this suite focuses on
 * character-level invariants:
 *
 *   1. Health / xp derivation contracts from `createCharacter`.
 *   2. Default fields and option pass-through.
 *   3. Spec 05 Q3 option A: starting `equipment`'s `maxHp` line is folded
 *      into `maxHealth` at create-time (Phase 20: equipment applies NO effects).
 *   4. `equipItem` slot replacement keeps `effects` untouched and refolds
 *      the worn `maxHp` delta onto `maxHealth`.
 *   5. `unequipItem` on an empty slot is a referential no-op.
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
} from '../equipment.reducer';
import {
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

const armorMaxHpSmall = (): Equipment => ({
    id: 'test-armor-maxhp-small',
    name: 'Test Cuirass',
    description: '+2 max VITAE.',
    category: 'equipment',
    slot: 'armor',
    statModifiers: [{ stat: 'maxHp', value: 2 }],
});

const armorMaxHpLarge = (): Equipment => ({
    id: 'test-armor-maxhp-large',
    name: 'Test Robe',
    description: '+5 max VITAE.',
    category: 'equipment',
    slot: 'armor',
    statModifiers: [{ stat: 'maxHp', value: 5 }],
});

/** VITAE of the bare `buildBaseStats()` player (no worn maxHp). */
const bareMaxHealth = (): number =>
    PLAYER_VITAE_BASE + (3 + 4 + 2) * RESOURCE_MULTIPLIERS.HEALTH_PER_STAT;

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
    it('folds a worn maxHp modifier into maxHealth at create-time', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({ equipment: [armorMaxHpSmall()] });
        // bare VITAE + 2 from the worn armor, seeded full.
        expect(ch.maxHealth).toBe(bareMaxHealth() + 2);
        expect(ch.health).toBe(bareMaxHealth() + 2);
        // baseStats stay raw — fold-in is on maxHealth, not base.
        expect(ch.baseStats).toEqual(buildBaseStats());
        expect(ch.equipment.armor?.id).toBe('test-armor-maxhp-small');
    });

    it('Phase 20 — a passiveEffects item applies NO ActiveEffect (equipment is stat-only)', () => {
        mockSequentialRng(0.5);
        const ch = buildPlayer({ equipment: [armorWithPassive()] });
        expect(ch.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);
    });
});

// ─── equipItem / unequipItem — slot replacement and effect tracking ─────────

describe('equipItem — slot replacement', () => {
    it('replaces the existing occupant and refolds the worn maxHp delta', () => {
        mockSequentialRng(0.5);
        const start = buildPlayer({ equipment: [armorMaxHpSmall()] });
        // Before: bare VITAE + 2 from the worn armor.
        expect(start.maxHealth).toBe(bareMaxHealth() + 2);

        // Swap to the +5 armor: the +2 comes off, the +5 goes on.
        const next = equipItem(start, armorMaxHpLarge());
        expect(next.equipment.armor?.id).toBe('test-armor-maxhp-large');
        expect(next.maxHealth).toBe(bareMaxHealth() + 5);
        // Original character is unmutated.
        expect(start.maxHealth).toBe(bareMaxHealth() + 2);
    });

    it('Phase 20 — equipping/swapping never adds equipment effects and leaves unrelated effects untouched', () => {
        const prior = armorWithPassive();
        const replacement = armorMaxHpSmall();
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

    it('removes the slot (equipment never added effects — Phase 20)', () => {
        mockSequentialRng(0.5);
        const start = buildPlayer({ equipment: [armorWithPassive()] });
        expect(start.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);

        const stripped = unequipItem(start, 'armor');
        expect(stripped.equipment.armor).toBeNull();
        expect(stripped.effects.some(e => e.sourceId === 'test-armor-with-passive')).toBe(false);
    });
});

// ─── allocateStatPoint — Spec 06 Q3 + Q8 ──────────────────────────────────────

describe('allocateStatPoint', () => {
    it('decrements the pool, raises baseStat, and re-derives maxHealth', () => {
        mockSequentialRng(0.5);
        const before = buildPlayer({});
        // Seed available points so the allocation succeeds.
        const seeded = { ...before, availableStatPoints: 2 };
        const after = allocateStatPoint(seeded, 'body');

        expect(after.availableStatPoints).toBe(1);
        expect(after.baseStats.body).toBe(before.baseStats.body + 1);
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
