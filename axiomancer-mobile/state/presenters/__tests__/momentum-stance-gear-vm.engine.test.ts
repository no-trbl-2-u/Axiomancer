/**
 * Spec 33 (Phase D6b) — the momentum/stance chips + stance-check telegraph +
 * die-gear rail, presenter contract.
 *
 * Pins the four flag-on view-model surfaces against the REAL engine + presenter:
 *   1. the Momentum-V2 chain chip (color/length + the LOUD break-to-null + surge);
 *   2. the player current-stance chip (a stance, or a clear "no stance");
 *   3. the open stance-check telegraph (punishes/yields + all three resolution
 *      outcomes: punished / yielded / none);
 *   4. the die-gear rail + payload-only inspection VM (face table, payload, upgrade).
 * Plus FLAG-OFF byte-identical — none of these keys reach the VM (the three-node
 * momentum wheel + threat readout render key-for-key unchanged).
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import {
    createCharacter, initializeCombatEncounter, rollEncounterDice, setUpgradeableDice,
    DEFAULT_DIE_GEAR,
} from '@mechanics';
import type { CombatEncounterState } from '@mechanics';

import { buildCombatViewModel } from '../combat-encounter.engine';
import { createMockEncounterEnemy } from '../../mocks/combat.mock';

const DECK = ['slippery-slope', 'slippery-slope', 'straw-mans-jab', 'straw-mans-jab', 'sketch-of-a-thought', 'sketch-of-a-thought'];

function openEncounter(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

afterEach(() => setUpgradeableDice(false));

// ── §3 Momentum-V2 chain chip ────────────────────────────────────────────────

describe('Momentum-V2 chain chip (flag-on)', () => {
    it('maps a live chain to { color, length, next }', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = { color: 'heart', length: 2 };
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.color).toBe('heart');
        expect(m.length).toBe(2);
        expect(m.next).toBe('body');           // chain order heart → body → mind
        expect(m.surgeAt).toBe(3);
        expect(m.broke).toBe(false);
        expect(m.surged).toBe(false);
        expect(m.a11y).toMatch(/Momentum 2 of 3/);
    });

    it('an empty chain (never broken) reads neither broke nor surged', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = null;
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.color).toBeNull();
        expect(m.length).toBe(0);
        expect(m.broke).toBe(false);
        expect(m.surged).toBe(false);
        expect(m.a11y).toMatch(/No momentum/);
    });

    it('a break-to-null renders LOUD (broke=true) from the log', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = null;
        s.log = [...s.log, { kind: 'momentum-broken', by: 'body' }];
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.broke).toBe(true);
        expect(m.surged).toBe(false);
        expect(m.a11y).toMatch(/BROKEN/);
    });

    it('a surge renders celebratory (surged=true) from the log', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = null;
        s.log = [...s.log, { kind: 'momentum-surged', dieId: 'surge-1-0' }];
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.surged).toBe(true);
        expect(m.broke).toBe(false);
        expect(m.a11y).toMatch(/SURGED/);
    });

    it('a break/surge transient DECAYS at the next turn roll — loud for its turn only', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = null;
        s.log = [
            ...s.log,
            { kind: 'momentum-broken', by: 'body' },
            { kind: 'turn-dice-rolled', turn: s.turn + 1, dice: [] },
        ];
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.broke).toBe(false);
        expect(m.surged).toBe(false);
        expect(m.a11y).toMatch(/No momentum/);
    });

    it('derives the PLAYED sequence for the lit nodes (chain, play order)', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = { color: 'body', length: 2 };   // heart was played, then body
        expect(buildCombatViewModel(s).momentumV2!.chain).toEqual(['heart', 'body']);
        s.momentumV2 = { color: 'heart', length: 2 };  // cyclic entry: mind, then heart
        expect(buildCombatViewModel(s).momentumV2!.chain).toEqual(['mind', 'heart']);
        s.momentumV2 = { color: 'mind', length: 1 };
        expect(buildCombatViewModel(s).momentumV2!.chain).toEqual(['mind']);
        s.momentumV2 = null;
        expect(buildCombatViewModel(s).momentumV2!.chain).toEqual([]);
    });

    it('a live chain formed after an old break does NOT read broke', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.momentumV2 = { color: 'mind', length: 1 };
        s.log = [
            ...s.log,
            { kind: 'momentum-broken', by: 'body' },
            { kind: 'momentum-advanced', color: 'mind', length: 1 },
        ];
        const m = buildCombatViewModel(s).momentumV2!;
        expect(m.broke).toBe(false);
        expect(m.color).toBe('mind');
    });
});

// ── §2 player current-stance chip ────────────────────────────────────────────

describe('player current-stance chip (flag-on)', () => {
    it('renders the current stance from the last paid card', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.playerStance = 'body';
        const chip = buildCombatViewModel(s).playerStance!;
        expect(chip.stance).toBe('body');
        expect(chip.label).toBe('BODY');
        expect(chip.glyph).not.toBe('—');
    });

    it('renders a clear "no stance" when null', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.playerStance = null;
        const chip = buildCombatViewModel(s).playerStance!;
        expect(chip.stance).toBeNull();
        expect(chip.label).toBe('NO STANCE');
        expect(chip.a11y).toMatch(/No stance/);
    });
});

// ── §5 stance-check telegraph ────────────────────────────────────────────────

describe('stance-check telegraph (flag-on)', () => {
    function stateWithCheck(): CombatEncounterState {
        setUpgradeableDice(true);
        const s = openEncounter();
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        s.threatPhases[idx] = { ...s.threatPhases[idx], stanceCheck: { punishes: 'body', yields: 'mind' } };
        return s;
    }

    it('telegraphs punishes/yields openly with the multipliers', () => {
        const s = stateWithCheck();
        const sc = buildCombatViewModel(s).enemy.intent.stanceCheck!;
        expect(sc.punishes).toBe('body');
        expect(sc.yields).toBe('mind');
        expect(sc.punishesText).toMatch(/Punishes BODY ×1\.5/);
        expect(sc.yieldsText).toMatch(/Yields to MIND ×0\.5 \+1◆/);
    });

    it('previews the live outcome against the player stance', () => {
        const s = stateWithCheck();
        s.playerStance = 'body';
        expect(buildCombatViewModel(s).enemy.intent.stanceCheck!.live).toBe('punished');
        s.playerStance = 'mind';
        expect(buildCombatViewModel(s).enemy.intent.stanceCheck!.live).toBe('yielded');
        s.playerStance = 'heart';
        expect(buildCombatViewModel(s).enemy.intent.stanceCheck!.live).toBe('none');
        s.playerStance = null;
        expect(buildCombatViewModel(s).enemy.intent.stanceCheck!.live).toBe('none');
    });

    it('surfaces the PUNISHED resolution from the event log', () => {
        const s = stateWithCheck();
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        s.log = [...s.log, { kind: 'stance-check-resolved', phaseIndex: idx, outcome: 'punished', stance: 'body' }];
        const res = buildCombatViewModel(s).enemy.intent.stanceCheck!.resolution!;
        expect(res.outcome).toBe('punished');
        expect(res.text).toMatch(/Punished ×1\.5/);
    });

    it('surfaces the YIELDED resolution (×0.5 +1◆) from the event log', () => {
        const s = stateWithCheck();
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        s.log = [...s.log, { kind: 'stance-check-resolved', phaseIndex: idx, outcome: 'yielded', stance: 'mind' }];
        const res = buildCombatViewModel(s).enemy.intent.stanceCheck!.resolution!;
        expect(res.outcome).toBe('yielded');
        expect(res.text).toMatch(/Yielded ×0\.5 \+1◆/);
    });

    it('surfaces the NONE resolution from the event log', () => {
        const s = stateWithCheck();
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        s.log = [...s.log, { kind: 'stance-check-resolved', phaseIndex: idx, outcome: 'none', stance: null }];
        const res = buildCombatViewModel(s).enemy.intent.stanceCheck!.resolution!;
        expect(res.outcome).toBe('none');
        expect(res.text).toMatch(/No stance check/);
    });

    it('is null when the phase carries no check', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        const idx = Math.min(s.currentPhaseIndex, s.threatPhases.length - 1);
        s.threatPhases[idx] = { ...s.threatPhases[idx], stanceCheck: undefined };
        expect(buildCombatViewModel(s).enemy.intent.stanceCheck).toBeNull();
    });
});

// ── §6 die-gear rail + inspection ────────────────────────────────────────────

describe('die-gear rail + payload-only inspection (flag-on)', () => {
    it('renders 4 stock slots (heart/body/mind/wild) from the default gear', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        const rail = buildCombatViewModel(s).dieGear!;
        expect(rail.slots.map(x => x.color)).toEqual(['heart', 'body', 'mind', 'wild']);
        const heart = rail.slots[0];
        expect(heart.specialFaces).toBe(DEFAULT_DIE_GEAR.heart.specialFaces);
        expect(heart.manaFaces).toBe(DEFAULT_DIE_GEAR.heart.manaFaces);
        expect(heart.missFaces).toBe(6 - heart.specialFaces - heart.manaFaces);
        expect(heart.faceTable).toMatch(/special .* mana .* miss/);
        expect(heart.payload).toBe(`+${DEFAULT_DIE_GEAR.heart.specialConviction} ◆`);
        expect(heart.upgraded).toBe(false);
    });

    it('marks an UPGRADED slot from the state rail', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.dieGear = { body: { dieColor: 'body', specialFaces: 2, manaFaces: 3, specialConviction: 3 } };
        const rail = buildCombatViewModel(s).dieGear!;
        const body = rail.slots.find(x => x.color === 'body')!;
        expect(body.specialFaces).toBe(2);
        expect(body.manaFaces).toBe(3);
        expect(body.missFaces).toBe(1);
        expect(body.payload).toBe('+3 ◆');
        expect(body.upgraded).toBe(true);
        // Untouched slots stay stock.
        expect(rail.slots.find(x => x.color === 'heart')!.upgraded).toBe(false);
    });
});

// ── flag-OFF byte-identical ──────────────────────────────────────────────────

describe('flag-OFF byte-identical', () => {
    it('none of the D6b keys reach the VM and the old momentum wheel is unchanged', () => {
        const s = openEncounter(); // flag stays OFF
        const vm = buildCombatViewModel(s);
        expect(vm.momentumV2).toBeNull();
        expect(vm.playerStance).toBeNull();
        expect(vm.dieGear).toBeNull();
        // the three-node wheel VM shape is unchanged.
        expect(Object.keys(vm.momentum).sort()).toEqual(['charged', 'lit']);
        // the threat readout carries no stanceCheck key.
        expect(Object.prototype.hasOwnProperty.call(vm.enemy.intent, 'stanceCheck')).toBe(false);
    });

    it('the intent VM keys are identical whether or not spec-33 state sits on it', () => {
        const bare = openEncounter();
        const loaded = openEncounter();
        const idx = Math.min(loaded.currentPhaseIndex, loaded.threatPhases.length - 1);
        loaded.threatPhases[idx] = { ...loaded.threatPhases[idx], stanceCheck: { punishes: 'body', yields: 'mind' } };
        loaded.playerStance = 'body';
        loaded.momentumV2 = { color: 'heart', length: 2 };
        loaded.dieGear = { body: { dieColor: 'body', specialFaces: 2, manaFaces: 3, specialConviction: 3 } };
        const a = Object.keys(buildCombatViewModel(bare).enemy.intent).sort();
        const b = Object.keys(buildCombatViewModel(loaded).enemy.intent).sort();
        expect(b).toEqual(a);
    });
});
