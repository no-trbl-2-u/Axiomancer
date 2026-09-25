/**
 * Spec 33 (Phase D6a) — combat render CORE, presenter contract.
 *
 * Pins the view-model surfaces the dice tray + Press Fate control read,
 * against the REAL engine + presenter:
 *   1. the CombatDieVM face axis (special / mana / miss) + the OVERHEAT `cracked`
 *      read, and that a MISS face is DEAD (never draggable);
 *   2. the Press-Fate VM (enabled / disabled + the loud refusal reason), mirroring
 *      the engine's `playSignatureSkill` reroll gate.
 * (The flag-OFF byte-identity pins were deleted with the flag, D7.)
 */

import { describe, expect, it } from '@jest/globals';
import {
    createCharacter, initializeCombatEncounter, rollEncounterDice,
} from '@mechanics';
import type { CombatEncounterState, CombatManaDie } from '@mechanics';

import { buildCombatViewModel } from '../combat-encounter.engine';
import { createMockEncounterEnemy } from '../../mocks/combat.mock';

const DECK = ['spoiled-poultice', 'spoiled-poultice', 'chilblain-watch', 'chilblain-watch', 'first-spadeful', 'first-spadeful'];

function openEncounter(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

/** A hand-crafted faced tray die (the gear roll shape). */
function facedDie(color: CombatManaDie['color'], face: 'special' | 'mana' | 'miss'): CombatManaDie {
    return { id: `u-${color}`, color, face, state: face === 'miss' ? 'locked' : 'available', temporary: false };
}


describe('CombatDieVM face axis', () => {
    it('maps special / mana / miss faces and marks a cracked die', () => {
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
        const s = openEncounter();
        s.dice = [facedDie('body', 'special'), facedDie('mind', 'mana'), facedDie('heart', 'miss')];
        const dice = buildCombatViewModel(s).dice;
        expect(dice.find(d => d.color === 'body')!.draggable).toBe(true);
        expect(dice.find(d => d.color === 'mind')!.draggable).toBe(true);
        expect(dice.find(d => d.color === 'heart')!.draggable).toBe(false);
    });
});

describe('Press Fate VM (reroll gate)', () => {
    function stateWithMiss(): CombatEncounterState {
        const s = openEncounter();
        s.dice = [facedDie('body', 'miss'), facedDie('mind', 'mana')];
        s.signatures = ['sig-press-the-point'];
        s.conviction = 3;
        return s;
    }

    it('is null when the loadout carries no reroll signature', () => {
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

describe('Press Fate signature rune (spec-33 reshape — owner call 2026-07-19)', () => {
    // Press Fate is cast from the rune column like any signature; its
    // rune must present the spec-33 truth (1◆, the FULL firing gate + reason),
    // never the printed legacy cost the engine no longer charges.
    function stateWithRune(): CombatEncounterState {
        const s = openEncounter();
        s.dice = [facedDie('body', 'miss'), facedDie('mind', 'mana')];
        s.signatures = ['sig-press-the-point'];
        s.conviction = 3;
        s.pressFateRound = undefined;
        return s;
    }

    it('the rune costs 1◆ and is castable when the full gate passes', () => {
        const rune = buildCombatViewModel(stateWithRune()).signatures.find(x => x.id === 'sig-press-the-point')!;
        expect(rune.cost).toBe(1);
        expect(rune.affordable).toBe(true);
        expect(rune.reason).toBeNull();
        expect(rune.description).toMatch(/re-roll every miss/i);
    });

    it('the rune refuses (with the reason) once pressed this round', () => {
        const s = stateWithRune();
        s.pressFateRound = s.round;
        const rune = buildCombatViewModel(s).signatures.find(x => x.id === 'sig-press-the-point')!;
        expect(rune.affordable).toBe(false);
        expect(rune.reason).toMatch(/already pressed/i);
    });

    it('the rune refuses (with the reason) when no live miss exists', () => {
        const s = stateWithRune();
        s.dice = [facedDie('body', 'mana')];
        const rune = buildCombatViewModel(s).signatures.find(x => x.id === 'sig-press-the-point')!;
        expect(rune.affordable).toBe(false);
        expect(rune.reason).toMatch(/no miss/i);
    });
});

describe('inspect modal — BOON die-gear gloss (owner playtest 2026-07-18)', () => {
    it('never rides a card inspect unprompted — a die-face rule is not card vocabulary', () => {
        // The D6a always-on BOON push is retired: the gloss surfaces only
        // when a card's OWN printed lines name it (via the printed sweep).
        const hand = buildCombatViewModel(openEncounter()).hand;
        expect(hand.length).toBeGreaterThan(0);
        for (const card of hand) {
            expect(card.detail.keywords.map(k => k.name)).not.toContain('BOON');
        }
    });
});
