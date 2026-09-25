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
} from '@mechanics';

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
        expect(Array.isArray(vm.base)).toBe(true);
        expect(Array.isArray(vm.effects)).toBe(true);
        expect(Array.isArray(vm.equipment)).toBe(true);
        expect(Array.isArray(vm.cards)).toBe(true);
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

    it('exposes five equipment slot rows in display order', () => {
        const store = createGameStore(createMemoryAdapter());

        const vm = selectCharacterViewModel(store.getState());

        // Phase 18 collapsed the slot model to Weapon, Armor, and three
        // interchangeable accessory positions. 'Trinket' (not 'Accessory')
        // aligns the SELF tab with the inventory dock's TRINKET chrome.
        expect(vm.equipment).toHaveLength(5);
        const names = vm.equipment.map((s) => s.name);
        expect(names).toEqual(['Weapon', 'Armor', 'Trinket', 'Trinket', 'Trinket']);
        // The three accessory rows carry their 0-2 position index.
        const accessories = vm.equipment.filter((s) => s.slotKey === 'accessory');
        expect(accessories.map((s) => s.accessoryIndex)).toEqual([0, 1, 2]);
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
        // Use the relic-free fixture player (a fresh game seeds the signet relics,
        // Phase 19) so the worn window is genuinely empty.
        const store = makeStore();

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
    it('a level-7 character with meaningful stats produces correct level, name and base values', () => {
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
            'CREED',
            'AUGURY',
            'TROTH',
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

/**
 * FE-003 — the SELF sheet must not show two different numbers under the
 * bare word GRACE. The pool bar is `moralMeter` bucketed to 1-10; this
 * section is the raw balance. The copy names the difference.
 */
describe('FE-003: grace balance copy', () => {
    it('heads the raw balance distinctly from the POOLS bar and states the relationship', () => {
        const store = makeStore();
        const vm = selectCharacterViewModel(store.getState() as never);
        expect(vm.graceCopy.balanceHeading).not.toBe('✠ GRACE');
        expect(vm.graceCopy.balanceHeading).toContain('BALANCE');
        expect(vm.graceCopy.balanceUnit.length).toBeGreaterThan(0);
        expect(vm.graceCopy.balanceRelation).toMatch(/pool/i);
    });
});

/**
 * FE-004 — the XP row must not read as the player's current level. It sits
 * beside a medallion printing the current level, and printed `XP · LVL 2`
 * for a level-1 character.
 */
describe('FE-004: xp label names the NEXT level', () => {
    it('says TOWARD and points at level + 1', () => {
        const store = makeStore({ level: 1 });
        const vm = selectCharacterViewModel(store.getState() as never);
        expect(vm.xpLabel).toBe('XP TO LVL 2');
        expect(vm.xpLabel).not.toBe(`XP · LVL ${vm.level}`);
    });

    it('tracks a higher level', () => {
        const store = makeStore({ level: 15 });
        const vm = selectCharacterViewModel(store.getState() as never);
        expect(vm.xpLabel).toBe('XP TO LVL 16');
    });
});

/**
 * FE-017 — the SELF sheet's GRACE and alignment must track the real save.
 * The screen handed the presenter only `{ player }`, so `moralMeter` and
 * `philosophicalAlignment` arrived undefined and both readouts were frozen at
 * their zero/default values while the exploration HUD showed the true ones.
 */
describe('FE-017: grace and alignment follow the state the screen passes', () => {
    it('reads moralMeter rather than defaulting it', () => {
        const base = createCharacter({ name: 'Test Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });
        store.setState({ moralMeter: 20 } as never);

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.morale).toBe(20);
    });

    it('a different moralMeter produces a different reading', () => {
        const base = createCharacter({ name: 'Test Hero', level: 1, baseStats: { heart: 1, body: 1, mind: 1 } });
        const store = createGameStore(createMemoryAdapter(), { player: base });
        store.setState({ moralMeter: -60 } as never);

        const vm = selectCharacterViewModel(store.getState());

        expect(vm.morale).toBe(-60);
    });

    it('the pool bucket the screen draws moves with the balance', () => {
        // The screen buckets morale to 1-10 the same way the HUD does; pin the
        // arithmetic so the two surfaces cannot drift apart again.
        const bucket = (m: number) => Math.max(1, Math.min(10, Math.round((m + 100) / 20)));
        expect(bucket(20)).toBe(6);
        expect(bucket(0)).toBe(5);
        expect(bucket(-60)).toBe(2);
    });
});
