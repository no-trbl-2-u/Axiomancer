/**
 * Spec 33 (Phase D6a) — flag-on combat render CORE, presenter contract.
 *
 * Pins the three view-model surfaces the flag-on dice tray + Press Fate control
 * read, against the REAL engine + presenter:
 *   1. the CombatDieVM face axis (special / mana / miss) + the OVERHEAT `cracked`
 *      read, and that a MISS face is DEAD (never draggable);
 *   2. the Press-Fate VM (enabled / disabled + the loud refusal reason), mirroring
 *      the engine's `playSignatureSkill` reroll gate;
 *   3. FLAG-OFF is byte-identical — no `face` / `cracked` keys reach the tray VM,
 *      `pressFate` is null, and draggability is unchanged.
 */

import { afterEach, describe, expect, it } from '@jest/globals';
import {
    createCharacter, initializeCombatEncounter, rollEncounterDice, setUpgradeableDice,
} from '@mechanics';
import type { CombatEncounterState, CombatManaDie } from '@mechanics';

import { buildCombatViewModel } from '../combat-encounter.engine';
import { createMockEncounterEnemy } from '../../mocks/combat.mock';

const DECK = ['slippery-slope', 'slippery-slope', 'straw-mans-jab', 'straw-mans-jab', 'sketch-of-a-thought', 'sketch-of-a-thought'];

function openEncounter(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

/** A hand-crafted faced tray die (the flag-on gear roll shape). */
function facedDie(color: CombatManaDie['color'], face: 'special' | 'mana' | 'miss'): CombatManaDie {
    return { id: `u-${color}`, color, face, state: face === 'miss' ? 'locked' : 'available', temporary: false };
}

afterEach(() => setUpgradeableDice(false));

describe('CombatDieVM face axis (flag-on)', () => {
    it('maps special / mana / miss faces and marks a cracked die', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.dice = [
            facedDie('body', 'special'),
            facedDie('mind', 'mana'),
            facedDie('heart', 'miss'),
            facedDie('wild', 'miss'),
        ];
        // An OVERHEAT crack biting THIS turn forced the wild die all-miss.
        s.crackedDice = [{ color: 'wild', turn: s.turn }];
        const dice = buildCombatViewModel(s).dice;
        const by = (c: string) => dice.find(d => d.color === c)!;

        expect(by('body').face).toBe('special');
        expect(by('mind').face).toBe('mana');
        expect(by('heart').face).toBe('miss');
        expect(by('wild').face).toBe('miss');

        // Only the cracked color reads cracked.
        expect(by('wild').cracked).toBe(true);
        expect(by('heart').cracked).toBeUndefined();
        expect(by('body').cracked).toBeUndefined();
    });

    it('a MISS face is DEAD — never draggable; a live special/mana face is', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.dice = [facedDie('body', 'special'), facedDie('mind', 'mana'), facedDie('heart', 'miss')];
        const dice = buildCombatViewModel(s).dice;
        expect(dice.find(d => d.color === 'body')!.draggable).toBe(true);
        expect(dice.find(d => d.color === 'mind')!.draggable).toBe(true);
        expect(dice.find(d => d.color === 'heart')!.draggable).toBe(false);
    });
});

describe('CombatDieVM flag-OFF is byte-identical', () => {
    it('carries no face / cracked keys and pressFate is null', () => {
        const s = openEncounter(); // flag stays OFF
        const vm = buildCombatViewModel(s);
        for (const d of vm.dice) {
            expect(Object.prototype.hasOwnProperty.call(d, 'face')).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(d, 'cracked')).toBe(false);
        }
        expect(vm.pressFate).toBeNull();
    });

    it('the tray VM output is identical whether or not crackedDice/faces sit on state', () => {
        // Flag-off, the presenter must not read the spec-33 state fields at all:
        // a state carrying faces + cracks renders the SAME tray as one without.
        const bare = openEncounter();
        const loaded = openEncounter();
        loaded.dice = loaded.dice.map(d => ({ ...d, face: 'miss' as const }));
        loaded.crackedDice = [{ color: 'body', turn: loaded.turn }];
        loaded.pressFateRound = loaded.round;
        // Same roll (same seed) → compare the tray VM shape key-for-key.
        const a = buildCombatViewModel(bare).dice.map(d => Object.keys(d).sort());
        const b = buildCombatViewModel(loaded).dice.map(d => Object.keys(d).sort());
        expect(b).toEqual(a);
        expect(buildCombatViewModel(loaded).pressFate).toBeNull();
    });
});

describe('Press Fate VM (flag-on reroll gate)', () => {
    function stateWithMiss(): CombatEncounterState {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.dice = [facedDie('body', 'miss'), facedDie('mind', 'mana')];
        s.signatures = ['sig-press-the-point'];
        s.conviction = 3;
        return s;
    }

    it('is null flag-off', () => {
        const s = openEncounter();
        s.dice = [facedDie('body', 'miss')];
        s.signatures = ['sig-press-the-point'];
        expect(buildCombatViewModel(s).pressFate).toBeNull();
    });

    it('is null flag-on when the loadout carries no reroll signature', () => {
        setUpgradeableDice(true);
        const s = openEncounter();
        s.dice = [facedDie('body', 'miss')];
        s.signatures = [];
        expect(buildCombatViewModel(s).pressFate).toBeNull();
    });

    it('is ENABLED with a live miss, enough ◆, and unused this round', () => {
        const s = stateWithMiss();
        s.pressFateRound = undefined;
        const pf = buildCombatViewModel(s).pressFate!;
        expect(pf.enabled).toBe(true);
        expect(pf.reason).toBeNull();
        expect(pf.cost).toBe(1);
        expect(pf.signatureId).toBe('sig-press-the-point');
    });

    it('is DISABLED at 0 ◆ with the reason', () => {
        const s = stateWithMiss();
        s.conviction = 0;
        const pf = buildCombatViewModel(s).pressFate!;
        expect(pf.enabled).toBe(false);
        expect(pf.reason).toMatch(/Need 1/);
    });

    it('is DISABLED once already pressed this round', () => {
        const s = stateWithMiss();
        s.pressFateRound = s.round;
        const pf = buildCombatViewModel(s).pressFate!;
        expect(pf.enabled).toBe(false);
        expect(pf.reason).toMatch(/already pressed/i);
    });

    it('is DISABLED when no live miss face exists', () => {
        const s = stateWithMiss();
        s.dice = [facedDie('body', 'mana'), facedDie('mind', 'special')];
        s.pressFateRound = undefined;
        const pf = buildCombatViewModel(s).pressFate!;
        expect(pf.enabled).toBe(false);
        expect(pf.reason).toMatch(/no miss/i);
    });

    it('excludes a cracked miss die — a crack is not a Press-Fate target', () => {
        const s = stateWithMiss();
        s.dice = [facedDie('body', 'miss')];
        s.crackedDice = [{ color: 'body', turn: s.turn }];
        s.pressFateRound = undefined;
        const pf = buildCombatViewModel(s).pressFate!;
        expect(pf.enabled).toBe(false);
        expect(pf.reason).toMatch(/no miss/i);
    });
});

describe('inspect modal — SPECIAL die-gear gloss (owner playtest 2026-07-18)', () => {
    it('never rides a card inspect unprompted — a die-face rule is not card vocabulary', () => {
        // The D6a always-on SPECIAL push is retired: the gloss surfaces only
        // when a card's OWN printed lines name it (via the printed sweep).
        const on = openEncounter();
        setUpgradeableDice(true);
        const onHand = buildCombatViewModel(on).hand;
        expect(onHand.length).toBeGreaterThan(0);
        for (const card of onHand) {
            expect(card.detail.keywords.map(k => k.name)).not.toContain('SPECIAL');
        }

        setUpgradeableDice(false);
        const offHand = buildCombatViewModel(openEncounter()).hand;
        for (const card of offHand) {
            expect(card.detail.keywords.map(k => k.name)).not.toContain('SPECIAL');
        }
    });
});
