/**
 * Phase R4 — the signature kit (D47, `plan/revamp/relics.md`), one signature
 * since R7e2 (D72): The Open Hand opens the mercy choice on a foe that can be
 * befriended once it is low enough.
 */

import { describe, it, expect } from 'vitest';

import { Player } from '../Character/characters.mock';
import { BrineHag, FloatEye, TheDoorwarden } from '../Enemy/enemy.library';
import type { Enemy } from '../Enemy/types';
import {
    initializeCombatEncounter, rollEncounterDice, playSignatureSkill, selectMercyChoice,
} from './combat.engine';
import {
    SIGNATURE_SKILL_LIST, SIGNATURE_COST, getSignatureSkill, signatureCastBlock,
} from './combat.signature';
import type { CombatEncounterState } from './combat.encounter.types';

const OPEN_HAND = 'sig-disarming-plea';

function encounter(enemy: Enemy, hpFrac = 1, conviction = SIGNATURE_COST): CombatEncounterState {
    let s = initializeCombatEncounter(Player, enemy, ['grey-strike', 'grey-ward', 'grey-word'], 1);
    s = rollEncounterDice(s).state;
    const health = Math.floor(s.enemy.maxHealth * hpFrac);
    return { ...s, conviction, enemy: { ...s.enemy, health } };
}

describe('R4 — the signature kit', () => {
    it('is The Open Hand alone, a mercy signature at the flat cost', () => {
        expect(SIGNATURE_SKILL_LIST.map(s => s.id)).toEqual([OPEN_HAND]);
        const sig = getSignatureSkill(OPEN_HAND)!;
        expect(sig.kind).toBe('mercy');
        expect(sig.cost).toBe(SIGNATURE_COST);
    });

    it('an unknown id resolves to nothing', () => {
        expect(getSignatureSkill('sig-unknown')).toBeUndefined();
    });
});

describe('R4 — The Open Hand is the befriend', () => {
    it('opens the mercy choice on the Brine Hag at or below 30% VITAE', () => {
        const s = encounter(BrineHag, 0.3);
        const r = playSignatureSkill(s, OPEN_HAND);
        expect(r.events.some(e => e.kind === 'signature-cast')).toBe(true);
        expect(r.events.some(e => e.kind === 'mercy-opened')).toBe(true);
        expect(r.state.mercyChoiceActive).toBe(true);
        expect(r.state.phase).toBe('mercy-choice');
        expect(r.state.conviction).toBe(0);
        expect(r.state.enemy.health).toBe(s.enemy.health); // no damage, no QUARTER
        expect(r.state.enemy.effects).toEqual(s.enemy.effects);
    });

    it('sparing the befriended Brine Hag ends the fight in mercy', () => {
        const opened = playSignatureSkill(encounter(BrineHag, 0.2), OPEN_HAND).state;
        const spared = selectMercyChoice(opened, 'spare');
        expect(spared.state.finalOutcome).toBe('mercy');
    });

    it('refuses above the Brine Hag\'s gate and spends nothing', () => {
        const s = encounter(BrineHag, 0.9);
        expect(signatureCastBlock(s, getSignatureSkill(OPEN_HAND)!)).toMatch(/not yet low enough/);
        const r = playSignatureSkill(s, OPEN_HAND);
        expect(r.state.conviction).toBe(SIGNATURE_COST);
        expect(r.state.mercyChoiceActive).toBeFalsy();
        expect(r.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
    });

    it.each([
        ['Float-Eye', FloatEye],
        ['the Doorwarden', TheDoorwarden],
    ])('refuses on %s, which cannot be befriended', (_name, enemy) => {
        const s = encounter(enemy, 0.05);
        expect(signatureCastBlock(s, getSignatureSkill(OPEN_HAND)!)).toMatch(/will not be befriended/);
        const r = playSignatureSkill(s, OPEN_HAND);
        expect(r.state.conviction).toBe(SIGNATURE_COST);
        expect(r.state.mercyChoiceActive).toBeFalsy();
    });

    it('names the Conviction shortfall first', () => {
        const s = encounter(BrineHag, 0.1, SIGNATURE_COST - 1);
        expect(signatureCastBlock(s, getSignatureSkill(OPEN_HAND)!)).toBe(`Need ${SIGNATURE_COST} ◆ Conviction`);
    });
});
