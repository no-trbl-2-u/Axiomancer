/**
 * Combat-overhaul doctrine characterization.
 *
 * These tests freeze the existing card/die role boundary before architecture
 * changes: cards are combat actions; dice may power those actions but cannot
 * independently damage or apply status.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildFixtureState } from '../../test-utils/card-fixture';
import { mockSequentialRng, restoreOriginalRng } from '../../test-utils/rng';
import { draftStanceDie, playCombatCard } from '../combat.engine';
import type { CombatEncounterState, CombatEvent, CombatManaDie } from '../combat.encounter.types';

const CARD_ID = 'slippery-slope';
const CARD_UID = 'doctrine-card';

function cardEvent(events: CombatEvent[]): Extract<CombatEvent, { kind: 'card-played' }> | undefined {
    return events.find((event): event is Extract<CombatEvent, { kind: 'card-played' }> => (
        event.kind === 'card-played'
    ));
}

function stateWithCard(extra: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const state = buildFixtureState({ clean: true });
    return {
        ...state,
        hand: [{ uid: CARD_UID, cardId: CARD_ID }],
        ...extra,
    };
}

afterEach(() => {
    vi.restoreAllMocks();
    restoreOriginalRng();
});

describe('combat-overhaul doctrine — cards act and dice only power', () => {
    it('resolves a FREE card with no die and attributes the action to that card', () => {
        mockSequentialRng(0.5);
        const before = stateWithCard({ dice: [], draftedDieId: null });

        const transition = playCombatCard(before, { uid: CARD_UID }, false);
        const played = cardEvent(transition.events);

        expect(played).toMatchObject({
            kind: 'card-played',
            cardId: CARD_ID,
            useBottom: false,
            dieId: null,
        });
        expect(transition.events.some(event => event.kind === 'die-spent')).toBe(false);
        expect(transition.state.hand).not.toContainEqual({ uid: CARD_UID, cardId: CARD_ID });
    });

    it('refuses a powered card when no die exists to power it', () => {
        mockSequentialRng(0.5);
        const before = stateWithCard({ dice: [], draftedDieId: null });

        const transition = playCombatCard(before, { uid: CARD_UID }, true);

        expect(transition.events).toContainEqual({
            kind: 'effect-fizzled',
            cardId: CARD_ID,
            effectId: '',
            message: 'draft a stance die first',
        });
        expect(cardEvent(transition.events)).toBeUndefined();
        expect(transition.state.enemy).toEqual(before.enemy);
    });

    it('drafting a die alone changes no enemy VITAE or status state', () => {
        const dice: CombatManaDie[] = [
            { id: 'body-choice', color: 'body', state: 'available', temporary: false },
            { id: 'mind-choice', color: 'mind', state: 'available', temporary: false },
        ];
        const before = stateWithCard({ dice, draftedDieId: null });
        const enemyHealth = before.enemy.health;
        const enemyEffects = before.enemy.effects;

        const transition = draftStanceDie(before, 'body-choice');

        expect(transition.state.enemy.health).toBe(enemyHealth);
        expect(transition.state.enemy.effects).toEqual(enemyEffects);
        expect(transition.events.some(event => (
            event.kind === 'damage-dealt' || event.kind === 'effect-landed'
        ))).toBe(false);
    });

    it('binds a powered play receipt to both the card and its die', () => {
        mockSequentialRng(0.5);
        const die: CombatManaDie = {
            id: 'power-source',
            color: 'wild',
            state: 'available',
            temporary: false,
        };
        const before = stateWithCard({ dice: [die], draftedDieId: die.id });

        const transition = playCombatCard(before, { uid: CARD_UID }, true, die.id);
        const played = cardEvent(transition.events);

        expect(played).toMatchObject({
            kind: 'card-played',
            cardId: CARD_ID,
            useBottom: true,
            dieId: die.id,
        });
        const dieResolution = transition.events.find(event => (
            (event.kind === 'die-spent' || event.kind === 'die-refreshed')
            && event.dieId === die.id
        ));
        expect(dieResolution).toMatchObject({
            kind: 'die-refreshed',
            dieId: die.id,
            color: die.color,
        });
    });
});
