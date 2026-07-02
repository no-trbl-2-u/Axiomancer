import { afterEach, describe, it, expect, vi } from 'vitest';
import { mockAlternatingRng } from '../../test-utils/rng';
import { createCharacter } from '../../Character';
import { createGameStore } from '../../Game/store';
import { createEventEmitter } from '../../Game/events';
import { nullAdapter } from '../../Game/persistence/null.adapter';
import { cardLibrary } from '../../Cards/cards.library';
import { consumableLibrary } from '../../Items/consumable.library';
import {
    devSetLevel, devSetStats, devLearnSkills,
    devGrantAllEquipment, devGrantAllConsumables, devGrantCurrency,
    devSetMoralMeter, devSetAlignment, devSpawnEnemy, devMaxOut,
} from '../dev-tools';

afterEach(() => { vi.restoreAllMocks(); });

function freshStore() {
    mockAlternatingRng();
    const player = createCharacter({
        name: 'Test', level: 1, baseStats: { heart: 5, body: 5, mind: 5 },
    });
    return createGameStore(nullAdapter, { player }, createEventEmitter());
}

describe('devSetLevel', () => {
    it('sets level up from 1 to 10', () => {
        const store = freshStore();
        const r = devSetLevel(store, 10);
        expect(r.ok).toBe(true);
        expect(store.getState().player.level).toBe(10);
    });

    it('sets level down from 10 to 3', () => {
        const store = freshStore();
        devSetLevel(store, 10);
        devSetLevel(store, 3);
        expect(store.getState().player.level).toBe(3);
    });

    it('clamps to minimum 1', () => {
        const store = freshStore();
        devSetLevel(store, -5);
        expect(store.getState().player.level).toBe(1);
    });
});

describe('devSetStats', () => {
    it('sets individual stats', () => {
        const store = freshStore();
        devSetStats(store, { heart: 20 });
        expect(store.getState().player.baseStats.heart).toBe(20);
        expect(store.getState().player.baseStats.body).toBe(5);
    });

    it('sets all stats at once', () => {
        const store = freshStore();
        devSetStats(store, { heart: 15, body: 12, mind: 18 });
        const { baseStats } = store.getState().player;
        expect(baseStats).toEqual({ heart: 15, body: 12, mind: 18 });
    });

    it('recomputes derivedStats', () => {
        const store = freshStore();
        const before = store.getState().player.derivedStats;
        devSetStats(store, { body: 20 });
        const after = store.getState().player.derivedStats;
        expect(after.physicalAttack).toBeGreaterThan(before.physicalAttack);
    });
});

describe('devLearnSkills', () => {
    it('learns all skills', () => {
        const store = freshStore();
        const r = devLearnSkills(store, 'all');
        expect(r.ok).toBe(true);
        const known = store.getState().player.knownSkills;
        for (const skill of cardLibrary) {
            expect(known).toContain(skill.id);
        }
    });

    it('learns specific skills', () => {
        const store = freshStore();
        devLearnSkills(store, ['mob-appeal', 'sorites-cascade']);
        const known = store.getState().player.knownSkills;
        expect(known).toContain('mob-appeal');
        expect(known).toContain('sorites-cascade');
    });

    it('does not duplicate already-known skills', () => {
        const store = freshStore();
        devLearnSkills(store, ['mob-appeal']);
        devLearnSkills(store, ['mob-appeal']);
        const count = store.getState().player.knownSkills.filter(id => id === 'mob-appeal').length;
        expect(count).toBe(1);
    });
});

describe('devGrantAllConsumables', () => {
    it('grants every consumable type', () => {
        const store = freshStore();
        const r = devGrantAllConsumables(store, 3);
        expect(r.ok).toBe(true);
        const inv = store.getState().player.inventory;
        for (const c of consumableLibrary) {
            expect(inv.some(i => i.id === c.id)).toBe(true);
        }
    });
});

describe('devGrantAllEquipment', () => {
    it('grants equipment at player level', () => {
        const store = freshStore();
        devSetLevel(store, 10);
        const r = devGrantAllEquipment(store);
        expect(r.ok).toBe(true);
        expect(store.getState().player.inventory.length).toBeGreaterThan(0);
    });
});

describe('devGrantCurrency', () => {
    it('adds currency', () => {
        const store = freshStore();
        devGrantCurrency(store, 500);
        expect(store.getState().player.currency).toBe(500);
    });

    it('stacks with existing currency', () => {
        const store = freshStore();
        devGrantCurrency(store, 100);
        devGrantCurrency(store, 200);
        expect(store.getState().player.currency).toBe(300);
    });
});

describe('devSetMoralMeter', () => {
    it('sets the moral meter', () => {
        const store = freshStore();
        devSetMoralMeter(store, 75);
        expect(store.getState().moralMeter).toBe(75);
    });

    it('clamps to [-100, 100]', () => {
        const store = freshStore();
        devSetMoralMeter(store, 200);
        expect(store.getState().moralMeter).toBe(100);
        devSetMoralMeter(store, -200);
        expect(store.getState().moralMeter).toBe(-100);
    });
});

describe('devSetAlignment', () => {
    it('sets all three axes', () => {
        const store = freshStore();
        devSetAlignment(store, { epistemology: 50, outlook: -30, scope: 80 });
        const a = store.getState().philosophicalAlignment;
        expect(a.epistemology).toBe(50);
        expect(a.outlook).toBe(-30);
        expect(a.scope).toBe(80);
    });

    it('clamps to [-100, 100]', () => {
        const store = freshStore();
        devSetAlignment(store, { epistemology: 999 });
        expect(store.getState().philosophicalAlignment.epistemology).toBe(100);
    });

    it('preserves unset axes', () => {
        const store = freshStore();
        devSetAlignment(store, { epistemology: 50 });
        const a = store.getState().philosophicalAlignment;
        expect(a.epistemology).toBe(50);
        expect(a.outlook).toBe(0);
    });
});

describe('devSpawnEnemy', () => {
    it('spawns an enemy into combat', () => {
        const store = freshStore();
        const r = devSpawnEnemy(store, 'wet-hound');
        expect(r.ok).toBe(true);
        expect(store.getState().combat).not.toBeNull();
    });
});

describe('devMaxOut', () => {
    it('maxes level, stats, skills, items, and currency', () => {
        const store = freshStore();
        const r = devMaxOut(store);
        expect(r.ok).toBe(true);
        const { player, } = store.getState();
        expect(player.level).toBe(20);
        expect(player.baseStats.heart).toBe(20);
        expect(player.knownSkills.length).toBe(cardLibrary.length);
        expect(player.inventory.length).toBeGreaterThan(0);
        expect(player.currency).toBeGreaterThanOrEqual(999);
    });
});
