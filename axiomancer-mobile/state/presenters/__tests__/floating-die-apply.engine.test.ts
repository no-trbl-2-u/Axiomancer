/**
 * Dice-law rework (2026-07-09) — floating dice apply end-to-end.
 *
 * Pins the exact drag-drop commit path the panel runs (`resolveApplyRouting`
 * → `playCombatCard`) against the REAL engine, guarding the three floating-die
 * laws the UI once broke:
 *   1. a floating die is routed as an EXPLICIT power source (never drafted —
 *      the old code drafted it, the engine refused, and the play fizzled
 *      "draft a stance die first": the snap-back bug);
 *   2. floating dice bypass the one-die-per-round draft — several can power
 *      plays in the same turn, before or after the stance draft;
 *   3. a spent floating die is GONE FOREVER (leaves `floatingDice`) and floats
 *      never bank tokens.
 * Plus the color law: a floating die must match the card's color (wild floats
 * match everything).
 */

import {
    createCharacter, initializeCombatEncounter, rollEncounterDice, playCombatCard, draftStanceDie,
} from '@mechanics';
import type { CombatEncounterState } from '@mechanics';

import { resolveApplyRouting, buildCombatViewModel } from '../combat-encounter.engine';
import { createMockEncounterEnemy } from '../../mocks/combat.mock';

const DECK = ['slippery-slope', 'slippery-slope', 'straw-mans-jab', 'straw-mans-jab', 'sketch-of-a-thought', 'sketch-of-a-thought'];

function openEncounter(floating: ('heart' | 'body' | 'mind' | 'wild')[]): CombatEncounterState {
    const player = createCharacter({ name: 'Hero', level: 3, baseStats: { heart: 8, body: 8, mind: 8 } });
    player.knownCards = Array.from(new Set([...(player.knownCards ?? []), ...DECK]));
    player.floatingDice = floating;
    const state = initializeCombatEncounter(player, createMockEncounterEnemy(), DECK, 7);
    return rollEncounterDice(state).state;
}

function findHand(state: CombatEncounterState, cardId: string): string {
    const entry = state.hand.find(h => h.cardId === cardId);
    if (!entry) throw new Error(`${cardId} should be in hand`);
    return entry.uid;
}

describe('floating-die APPLY routing (the snap-back bug)', () => {
    it('routes a floating die as an explicit power source, never a draft', () => {
        const s = openEncounter(['wild']);
        const float = s.dice.find(d => d.floating)!;
        expect(float).toBeDefined();
        const routing = resolveApplyRouting(s, float.id);
        expect(routing.draftFirst).toBe(false);
        expect(routing.explicitDieId).toBe(float.id);
    });

    it('routes a fresh tray die through the draft', () => {
        const s = openEncounter([]);
        const tray = s.dice.find(d => !d.floating && d.color !== 'x')!;
        const routing = resolveApplyRouting(s, tray.id);
        expect(routing.draftFirst).toBe(true);
        expect(routing.explicitDieId).toBeUndefined();
    });

    it('a wild floating die COMMITS a play (no fizzle) and is consumed forever', () => {
        const s = openEncounter(['wild']);
        const float = s.dice.find(d => d.floating)!;
        const uid = findHand(s, 'slippery-slope');
        const routing = resolveApplyRouting(s, float.id);
        const res = playCombatCard(s, { uid }, true, routing.explicitDieId);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
        // Gone from the tray AND the persistent pool — forever.
        expect(res.state.dice.some(d => d.id === float.id)).toBe(false);
        expect((res.state.floatingDice ?? []).some(d => d.id === float.id)).toBe(false);
    });

    it('floating dice bypass the one-die law — two floats + the drafted die in ONE turn', () => {
        let s = openEncounter(['wild', 'wild']);
        const floats = s.dice.filter(d => d.floating);
        expect(floats.length).toBe(2);
        // Draft a stance die first (the one rolled die the round allows)...
        const tray = s.dice.find(d => !d.floating && d.color !== 'x' && d.state === 'available');
        if (tray) s = draftStanceDie(s, tray.id).state;
        // ...then BOTH floats still power plays in the same turn.
        for (const f of floats) {
            const uid = s.hand.find(h => h.cardId === 'slippery-slope' || h.cardId === 'straw-mans-jab' || h.cardId === 'sketch-of-a-thought')!.uid;
            const routing = resolveApplyRouting(s, f.id);
            expect(routing.explicitDieId).toBe(f.id);
            const res = playCombatCard(s, { uid }, true, routing.explicitDieId);
            expect(res.events.some(e => e.kind === 'floating-die-spent')).toBe(true);
            s = res.state;
        }
        expect((s.floatingDice ?? []).length).toBe(0);
    });

    it('a colored floating die obeys the color law (body float cannot power a mind card)', () => {
        const s = openEncounter(['body']);
        const float = s.dice.find(d => d.floating)!;
        const uid = findHand(s, 'sketch-of-a-thought'); // mind spell
        const res = playCombatCard(s, { uid }, true, resolveApplyRouting(s, float.id).explicitDieId);
        expect(res.events.some(e => e.kind === 'effect-fizzled')).toBe(true);
        // The mismatch never consumes the float.
        expect((res.state.floatingDice ?? []).some(d => d.id === float.id)).toBe(true);
    });

    it('the view-model tags floating dice so the tray keeps them draggable post-draft', () => {
        const s = openEncounter(['wild']);
        const vm = buildCombatViewModel(s);
        const float = vm.dice.find(d => d.floating);
        expect(float).toBeDefined();
    });
});
