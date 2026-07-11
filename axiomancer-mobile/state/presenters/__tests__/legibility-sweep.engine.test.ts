/**
 * Phase 28 (Show the Engine legibility sweep) — presenter coverage for the
 * mobile-side surfaces: the Premise/CONCEDE VM, discard-pile names (the
 * REPRISE picker's data source), the live rupture-burst card face, the
 * `needsReprisalChoice` flag, and the wall-math intent projection.
 */

import { describe, it, expect } from '@jest/globals';
import { createCharacter, initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import type { CombatEncounterState } from '@mechanics';

import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';

// Fallback deck — any playable spell works; these three exercise the three
// surfaces under test (rupture face, reprise mechanic, plain filler).
const DECK = ['resonance-detonation', 'second-thoughts', 'slippery-slope'];

function openState(): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

describe('CombatViewModel.peroration — the Premise track + CONCEDE beat (phase 28)', () => {
    it('is inactive with no declared Peroration', () => {
        const vm = buildCombatViewModel(openState());
        expect(vm.peroration.active).toBe(false);
        expect(vm.peroration.premises).toBe(0);
    });

    it('surfaces the declared card, tally, and tier-floored CONCEDE threshold', () => {
        let s = openState();
        // createMockEncounterEnemy is difficulty 'elite' -> CONCEDE_PREMISES_ELITE (10)
        // floors the-closing-word's authored concedeAt (8).
        s = { ...s, premises: 3, peroration: { cardId: 'the-closing-word', at: 6, concedeAt: 8 } };
        const vm = buildCombatViewModel(s);
        expect(vm.peroration.active).toBe(true);
        expect(vm.peroration.premises).toBe(3);
        expect(vm.peroration.at).toBe(6);
        expect(vm.peroration.concedeAt).toBe(10); // tier-floored, not the raw 8
        expect(vm.peroration.cardName).toBe('The Closing Word');
    });
});

describe('CombatViewModel.discardCards — the REPRISE picker data source (phase 28)', () => {
    it('resolves discard-pile ids to display names', () => {
        let s = openState();
        s = { ...s, discard: ['straw-mans-jab', 'the-overtake'] };
        const vm = buildCombatViewModel(s);
        expect(vm.discardCards).toEqual([
            { id: 'straw-mans-jab', name: 'Straw Man\'s Jab' },
            { id: 'the-overtake', name: 'The Overtake' },
        ]);
    });
});

describe('CombatCardVM.needsReprisalChoice (phase 28)', () => {
    it('is true for a reprise-mechanic card, false otherwise', () => {
        let s = openState();
        s = {
            ...s,
            hand: [
                { uid: 'u-reprise', cardId: 'second-thoughts' },
                { uid: 'u-plain', cardId: 'slippery-slope' },
            ],
        };
        const vm = buildCombatViewModel(s);
        const reprise = vm.hand.find(c => c.uid === 'u-reprise')!;
        const plain = vm.hand.find(c => c.uid === 'u-plain')!;
        expect(reprise.needsReprisalChoice).toBe(true);
        expect(plain.needsReprisalChoice).toBe(false);
    });
});

describe('CombatCardVM rupture face — live projected burst (phase 28)', () => {
    it('shows a real projected number, not the qualitative "detonate" word', () => {
        let s = openState();
        s = { ...s, hand: [{ uid: 'u-rupture', cardId: 'resonance-detonation' }] };
        const vm = buildCombatViewModel(s);
        const card = vm.hand.find(c => c.uid === 'u-rupture')!;
        expect(card.face.kind).toBe('rupture');
        expect(card.face.heroText).toMatch(/^\d+$/);
    });
});

describe('CombatIntentVM.wallMath — the telegraph readout (phase 28)', () => {
    it('is present with sane defaults on a fresh encounter', () => {
        const vm = buildCombatViewModel(openState());
        expect(vm.enemy.intent.wallMath).toBeDefined();
        expect(typeof vm.enemy.intent.wallMath.willDeny).toBe('boolean');
        expect(vm.enemy.intent.wallMath.netDamage).toBeLessThanOrEqual(vm.enemy.intent.wallMath.projectedDamage);
    });
});
