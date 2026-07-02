/**
 * Hermetic E2E Tests — Character screen presenter (Spec 05)
 *
 * Drives `selectCharacterViewModel` end-to-end with real engine reads.
 * Every test is self-contained and deterministic (no network, no RNG,
 * no real timers). See docs/testing.md for the full standard.
 */

import { afterEach, describe, it, expect, jest } from '@jest/globals';
import {
    createGameStore,
    createCharacter,
    createNewGameState,
    applyEffect,
    effectsLibrary,
} from 'axiomancer-mechanics';

import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectCharacterViewModel,
    type CharacterViewModel,
} from '@/state/presenters/character.engine';

afterEach(() => {
    jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStore(playerOverrides: Partial<ReturnType<typeof createCharacter>> = {}) {
    const base = createCharacter({ name: 'Test Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
    const player = { ...base, ...playerOverrides };
    return createGameStore(createMemoryAdapter(), { player });
}

// ---------------------------------------------------------------------------
// Shape contract — every field present, of the documented type
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: shape contract', () => {
    it('returns a totally-shaped CharacterViewModel for a fresh game', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm: CharacterViewModel = selectCharacterViewModel(store.getState());

        expect(typeof vm.displayName).toBe('string');
        expect(typeof vm.subtitle).toBe('string');
        expect(typeof vm.level).toBe('number');
        expect(typeof vm.xp).toBe('number');
        expect(typeof vm.xpMax).toBe('number');
        expect(typeof vm.pendingPoints).toBe('number');
        expect(typeof vm.luck).toBe('number');
        expect(Array.isArray(vm.base)).toBe(true);
        expect(Array.isArray(vm.derived)).toBe(true);
        expect(Array.isArray(vm.saves)).toBe(true);
        expect(Array.isArray(vm.effects)).toBe(true);
        expect(Array.isArray(vm.equipment)).toBe(true);
        expect(Array.isArray(vm.skills)).toBe(true);
        expect(typeof vm.morale).toBe('number');
    });

    it('threads availableStatPoints onto vm.pendingPoints (Phase 73)', () => {
        const store = createGameStore(createMemoryAdapter());
        // Fresh game starts with availableStatPoints === 0 (no
        // pending levelup at boot). The mobile-side VM reads the
        // engine field with a `?? 0` fallback so older saves with
        // an absent field still resolve.
        const vm = selectCharacterViewModel(store.getState());
        expect(vm.pendingPoints).toBe(0);
    });

    describe('levelUpReady (Phase 73 follow-up — user-jot 2026-05-24)', () => {
        it('is false on a fresh game (xp 0 < threshold)', () => {
            const store = createGameStore(createMemoryAdapter());
            const vm = selectCharacterViewModel(store.getState());
            expect(vm.levelUpReady).toBe(false);
        });

        it('flips true the moment xp crosses experienceToNextLevel', () => {
            const store = createGameStore(createMemoryAdapter());
            const p = store.getState().player;
            store.setState({
                player: {
                    ...p,
                    experience: p.experienceToNextLevel,
                },
            });
            const vm = selectCharacterViewModel(store.getState());
            expect(vm.levelUpReady).toBe(true);
        });

        it('stays true when xp overshoots the threshold', () => {
            const store = createGameStore(createMemoryAdapter());
            const p = store.getState().player;
            store.setState({
                player: {
                    ...p,
                    experience: p.experienceToNextLevel + 50,
                },
            });
            const vm = selectCharacterViewModel(store.getState());
            expect(vm.levelUpReady).toBe(true);
        });

        it('flips back to false after the engine levelUp drains the XP', () => {
            const store = createGameStore(createMemoryAdapter());
            const p = store.getState().player;
            store.setState({
                player: { ...p, experience: p.experienceToNextLevel },
            });
            expect(selectCharacterViewModel(store.getState()).levelUpReady).toBe(true);
            // Drain via engine levelUp — applyLevelUps lifts xp under
            // the new threshold (or to 0 when xp exactly hit the
            // boundary).
            store.getState().levelUp();
            expect(selectCharacterViewModel(store.getState()).levelUpReady).toBe(false);
            // And the player picked up stat points.
            expect(selectCharacterViewModel(store.getState()).pendingPoints).toBeGreaterThan(0);
        });
    });

    it('exposes the three base stat rows keyed by stance', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        const stances = vm.base.map((r) => r.stanceKey).sort();
        expect(stances).toEqual(['body', 'heart', 'mind']);
        for (const row of vm.base) {
            expect(typeof row.label).toBe('string');
            expect(typeof row.value).toBe('number');
        }
    });

    it('every derived row has attack/skill/defense as numbers', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.derived).toHaveLength(3);
        for (const row of vm.derived) {
            expect(typeof row.label).toBe('string');
            expect(typeof row.attack).toBe('number');
            expect(typeof row.skill).toBe('number');
            expect(typeof row.defense).toBe('number');
        }
    });

    it('every derived row carries engine stat ids for tooltip wiring', () => {
        const store = createGameStore(createMemoryAdapter());
        const vm = selectCharacterViewModel(store.getState());
        const ids = vm.derived.flatMap((r) => [r.attackId, r.skillId, r.defenseId]);
        expect(ids).toEqual([
            'physicalAttack', 'physicalSkill', 'physicalDefense',
            'mentalAttack', 'mentalSkill', 'mentalDefense',
            'emotionalAttack', 'emotionalSkill', 'emotionalDefense',
        ]);
    });

    it('exposes six saves/tests rows (3 saves, 3 tests)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.saves).toHaveLength(6);
        const labels = vm.saves.map((s) => s.label);
        expect(labels).toContain('Body Save');
        expect(labels).toContain('Mind Save');
        expect(labels).toContain('Heart Save');
        expect(labels).toContain('Body Test');
        expect(labels).toContain('Mind Test');
        expect(labels).toContain('Heart Test');
    });

    it('exposes seven equipment slot rows in display order', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.equipment).toHaveLength(7);
        const names = vm.equipment.map((s) => s.name);
        // 'Trinket' (not 'Accessory') aligns the SELF tab with
        // the inventory dock's TRINKET chrome + chat 1's "HEAD,
        // WEAPON, HANDS, FEET, BODY, ARMOR, TRINKET" specimen.
        // Character-audit [3.0] fix 2026-05-22.
        expect(names).toEqual(['Head', 'Body', 'Hands', 'Feet', 'Weapon', 'Armor', 'Trinket']);
    });
});

// ---------------------------------------------------------------------------
// Happy path — engine values reflected in VM
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: happy path', () => {
    it('reflects player name as displayName', () => {
        const store = makeStore({ name: 'Iron Pilgrim' });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.displayName).toBe('Iron Pilgrim');
    });

    it('reflects player level', () => {
        const base = createCharacter({ name: 'Hero', level: 5, baseStats: { heart: 5, body: 5, mind: 5 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.level).toBe(5);
    });

    it('reflects experience and experienceToNextLevel as xp/xpMax', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        // Fresh character starts at 0 XP; next level threshold is EXPERIENCE_PER_LEVEL * level.
        expect(vm.xp).toBe(0);
        expect(vm.xpMax).toBeGreaterThan(0);
    });

    it('derives base stat values from player.baseStats', () => {
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 4, body: 8, mind: 6 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });

        const vm = selectCharacterViewModel(store.getState());

        const heartRow = vm.base.find((r) => r.stanceKey === 'heart')!;
        const bodyRow  = vm.base.find((r) => r.stanceKey === 'body')!;
        const mindRow  = vm.base.find((r) => r.stanceKey === 'mind')!;
        expect(heartRow.value).toBe(4);
        expect(bodyRow.value).toBe(8);
        expect(mindRow.value).toBe(6);
    });

    it('derived PHYSICAL row uses body base stat (attack == body)', () => {
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 10, mind: 1 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });

        const vm = selectCharacterViewModel(store.getState());

        const physical = vm.derived.find((r) => r.label === 'PHYSICAL')!;
        // STAT_MULTIPLIERS.ATTACK = 1, so physicalAttack = body * 1 = 10
        expect(physical.attack).toBe(10);
    });

    it('luck is the average of the three base stats', () => {
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 3, body: 6, mind: 9 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.luck).toBeCloseTo((3 + 6 + 9) / 3);
    });

    it('test values are formatted with a leading + for non-negative values', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        const tests = vm.saves.filter((s) => s.label.includes('Test'));
        for (const t of tests) {
            expect(t.value).toMatch(/^[+-]/);
        }
    });

    it('save values are plain integers (no + prefix)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        const saves = vm.saves.filter((s) => s.label.includes('Save'));
        for (const s of saves) {
            expect(s.value).toMatch(/^\d+$/);
        }
    });
});

// ---------------------------------------------------------------------------
// Boundary conditions
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: boundary conditions', () => {
    it('0 XP fresh character: xp = 0, xpMax > 0', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.xp).toBe(0);
        expect(vm.xpMax).toBeGreaterThan(0);
    });

    it('xp is always in [0, xpMax]', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.xp).toBeGreaterThanOrEqual(0);
        expect(vm.xp).toBeLessThanOrEqual(vm.xpMax);
    });

    it('character with no effects: effects array is empty', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.effects).toHaveLength(0);
    });

    it('character with no inventory: all equipment slots are null', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        for (const slot of vm.equipment) {
            expect(slot.item).toBeNull();
        }
    });
});

// ---------------------------------------------------------------------------
// Effects — mapping from engine ActiveEffect to CharacterEffectRow
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: effects', () => {
    it('maps a buff effect to kind="buff" and tint="buff"', () => {
        const buff = effectsLibrary.buffs[0];
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const { activeEffects } = applyEffect(base.effects, buff, 1);
        const player = { ...base, effects: activeEffects };
        const store = createGameStore(createMemoryAdapter(), { player });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.effects).toHaveLength(1);
        expect(vm.effects[0].kind).toBe('buff');
        expect(vm.effects[0].tint).toBe('buff');
        expect(vm.effects[0].name).toBe(buff.name);
        expect(typeof vm.effects[0].description).toBe('string');
    });

    it('threads the engine effectId onto vm.effects[i].effectId (Phase 74 walkthrough Tick 1)', () => {
        // The SELF tooltip wrapper needs the engine id to look up
        // the kind:'effect' tooltip content. Pin the threading.
        const buff = effectsLibrary.buffs[0];
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const { activeEffects } = applyEffect(base.effects, buff, 1);
        const player = { ...base, effects: activeEffects };
        const store = createGameStore(createMemoryAdapter(), { player });

        const vm = selectCharacterViewModel(store.getState());
        expect(vm.effects[0].effectId).toBe(buff.id);
    });

    it('maps a debuff effect to kind="debuff" and tint="debuff"', () => {
        const debuff = effectsLibrary.debuffs[0];
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const { activeEffects } = applyEffect(base.effects, debuff, 1);
        const player = { ...base, effects: activeEffects };
        const store = createGameStore(createMemoryAdapter(), { player });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.effects).toHaveLength(1);
        expect(vm.effects[0].kind).toBe('debuff');
        expect(vm.effects[0].tint).toBe('debuff');
    });

    it('preserves effect ordering from player.effects', () => {
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        let effects = base.effects;
        const usedBuffs = effectsLibrary.buffs.slice(0, 3);
        usedBuffs.forEach((buff, round) => {
            ({ activeEffects: effects } = applyEffect(effects, buff, round + 1));
        });
        const player = { ...base, effects };
        const store = createGameStore(createMemoryAdapter(), { player });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.effects).toHaveLength(3);
        usedBuffs.forEach((buff, i) => {
            expect(vm.effects[i].name).toBe(buff.name);
        });
    });

    it('effect duration matches activeEffect.remainingDuration', () => {
        const buff = effectsLibrary.buffs[0];
        const base = createCharacter({ name: 'Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const { activeEffects } = applyEffect(base.effects, buff, 1);
        const player = { ...base, effects: activeEffects };
        const store = createGameStore(createMemoryAdapter(), { player });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.effects[0].duration).toBe(activeEffects[0].remainingDuration);
        expect(vm.effects[0].intensity).toBe(activeEffects[0].intensity);
    });
});

// ---------------------------------------------------------------------------
// Invariants — VM is total + deep-frozen
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: invariants', () => {
    it('the returned VM is deep-frozen', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(Object.isFrozen(vm)).toBe(true);
        expect(Object.isFrozen(vm.base)).toBe(true);
        expect(Object.isFrozen(vm.derived)).toBe(true);
        expect(Object.isFrozen(vm.saves)).toBe(true);
        expect(Object.isFrozen(vm.equipment)).toBe(true);
    });

    it('the VM is total: no undefined fields for a fresh character', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        for (const [key, val] of Object.entries(vm)) {
            expect(val).not.toBeUndefined();
        }
    });
});

// ---------------------------------------------------------------------------
// Store lifecycle — mutation is reflected, selection is read-only
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: store lifecycle', () => {
    it('selecting the VM does not call adapter.save', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);
        const saveSpy = jest.spyOn(adapter, 'save');

        selectCharacterViewModel(store.getState());
        selectCharacterViewModel(store.getState());

        expect(saveSpy).not.toHaveBeenCalled();
    });

    it('VM reflects a mutated player after store state changes', () => {
        const adapter = createMemoryAdapter();
        const store = createGameStore(adapter);

        const before = selectCharacterViewModel(store.getState());
        const beforeName = before.displayName;

        // Mutate player name via internal state override (simulates Spec 06 upgrade)
        const newPlayer = { ...store.getState().player, name: 'Upgraded Hero' };
        store.setState({ player: newPlayer });

        const after = selectCharacterViewModel(store.getState());
        expect(after.displayName).toBe('Upgraded Hero');
        expect(after.displayName).not.toBe(beforeName);
    });
});

// ---------------------------------------------------------------------------
// createCharacter fixture — happy path with a known character
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: createCharacter fixture', () => {
    it('a level-7 character with meaningful stats produces correct derived values', () => {
        const base = createCharacter({
            name: 'WORM-EATEN PILGRIM',
            level: 7,
            baseStats: { heart: 12, body: 14, mind: 10 },
        });
        const store = createGameStore(createMemoryAdapter(), { player: base });

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.level).toBe(7);
        expect(vm.displayName).toBe('WORM-EATEN PILGRIM');

        const body = vm.base.find((r) => r.stanceKey === 'body')!;
        expect(body.value).toBe(14);

        const physical = vm.derived.find((r) => r.label === 'PHYSICAL')!;
        expect(physical.attack).toBe(14);   // body * ATTACK(1)
        expect(physical.defense).toBe(42);  // body * DEFENSE(3)

        // luck = avg(12, 14, 10) = 12
        expect(vm.luck).toBeCloseTo(12);
    });
});

// ---------------------------------------------------------------------------
// A11y wiring (AUDIT row [MED] /app/(tabs)/character — vm.a11y unused)
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: a11y block', () => {
    it('surfaces the full set of section labels the character screen wires', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        // Every section the screen renders has a matching a11y label so
        // the screen can wire `accessibilityLabel` without inventing
        // strings at the view layer (Hard Rule #8).
        expect(typeof vm.a11y.characterName).toBe('string');
        expect(typeof vm.a11y.level).toBe('string');
        expect(typeof vm.a11y.experience).toBe('string');
        expect(typeof vm.a11y.baseStats).toBe('string');
        expect(typeof vm.a11y.derivedStats).toBe('string');
        expect(typeof vm.a11y.saves).toBe('string');
        expect(typeof vm.a11y.equipment).toBe('string');
        expect(typeof vm.a11y.effects).toBe('string');
        // Crucible button label lives on the presenter (added when
        // wiring the a11y block onto the screen) so the screen has no
        // inline a11y literal for it either.
        expect(vm.a11y.crucibleOpen).toBe('Open Token Crucible.');
    });

    it('exposes a lowercase-ritual emptyEffectsMessage so the screen renders no literal', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        // Lowercase ritual register — view renders via
        // `textTransform: 'uppercase'`. No banned pronouns.
        expect(vm.emptyEffectsMessage).toBe('none at hand.');
    });
});

// ---------------------------------------------------------------------------
// Alignment slice (Phase 52, engine 0.10.0 Philosophy module)
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: alignment slice', () => {
    it('returns a totally-shaped alignment block for a fresh game (mid/mid/mid)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.alignment).toBeDefined();
        expect(typeof vm.alignment.cellName).toBe('string');
        expect(vm.alignment.cellName.length).toBeGreaterThan(0);
        expect(vm.alignment.axes).toHaveLength(3);
    });

    it('exposes the three axis rows in canonical display order: epistemology, outlook, scope', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        const keys = vm.alignment.axes.map((a) => a.axisKey);
        expect(keys).toEqual(['epistemology', 'outlook', 'scope']);
    });

    it('axis labels are uppercase mono tokens (no second-person archaic register)', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.alignment.axes.map((a) => a.label)).toEqual([
            'EPISTEMOLOGY',
            'OUTLOOK',
            'SCOPE',
        ]);
    });

    it('defaults every axis bucket to "mid" when the engine state carries defaultAlignment', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        for (const axis of vm.alignment.axes) {
            expect(axis.bucket).toBe('mid');
        }
    });

    it('threads explicit alignment values through bucketAxis (low / mid / high boundaries)', () => {
        const store = createGameStore(createMemoryAdapter());

        // Stamp a synthetic alignment onto the store directly. The
        // engine's reducers route alignment updates through dialogue /
        // map-event payloads; this test bypasses that to assert the
        // presenter's bucketing logic.
        const stateWithAlignment = {
            ...store.getState(),
            philosophicalAlignment: { epistemology: -50, outlook: 0, scope: 50 },
        };

        const vm = selectCharacterViewModel(stateWithAlignment as never);

        const byKey = Object.fromEntries(vm.alignment.axes.map((a) => [a.axisKey, a.bucket]));
        expect(byKey.epistemology).toBe('low');
        expect(byKey.outlook).toBe('mid');
        expect(byKey.scope).toBe('high');
    });

    it('a11y.alignment surfaces a screen-reader sentence including cell + axis values', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.a11y.alignment).toContain(vm.alignment.cellName);
        for (const axis of vm.alignment.axes) {
            // Each axis label appears lowercased in the a11y sentence.
            expect(vm.a11y.alignment.toLowerCase()).toContain(axis.label.toLowerCase());
            expect(vm.a11y.alignment).toContain(axis.bucket);
        }
    });
});

// ---------------------------------------------------------------------------
// Morale (Phase 92)
// ---------------------------------------------------------------------------

describe('selectCharacterViewModel: morale', () => {
    it('threads state.moralMeter onto vm.morale', () => {
        const store = createGameStore(createMemoryAdapter());
        // Fresh game starts with default morale from engine
        const fresh = selectCharacterViewModel(store.getState());
        const expectedFresh = store.getState().moralMeter;
        expect(fresh.morale).toBe(expectedFresh);

        // Modify morale and verify VM reflects the change
        store.setState({ moralMeter: -5 });
        const modified = selectCharacterViewModel(store.getState());
        expect(modified.morale).toBe(-5);
    });
});
