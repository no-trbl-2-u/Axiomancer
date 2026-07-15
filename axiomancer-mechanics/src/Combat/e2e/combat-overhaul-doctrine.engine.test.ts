/**
 * Combat-overhaul doctrine characterization.
 *
 * These tests freeze the existing card/die role boundary before architecture
 * changes: cards are combat actions; dice may power those actions but cannot
 * independently damage or apply status.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearSandboxCards, registerSandboxOverride } from '../../Cards/cards.sandbox';
import { createCharacter } from '../../Character';
import { GraveLarva } from '../../Enemy/enemy.library';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { mockSequentialRng, restoreOriginalRng } from '../../test-utils/rng';
import { deepClone } from '../../Utils';
import { runOneEncounter } from '../combat.encounter.sim';
import { draftStanceDie, playCombatCard } from '../combat.engine';
import type { CombatEncounterState, CombatEvent, CombatManaDie } from '../combat.encounter.types';

const CARD_ID = 'slippery-slope';
const CARD_UID = 'doctrine-card';
const CAUSALITY_SEED = 20260708;
const CAUSALITY_DECK = Array<string>(5).fill(CARD_ID);

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

function causalityActors() {
    const player = createCharacter({
        name: 'CO-01B',
        level: 20,
        baseStats: { heart: 10, body: 10, mind: 10 },
        knownCards: [CARD_ID],
        equipment: [],
    });
    player.health = 200;
    player.maxHealth = 200;

    const enemy = deepClone(GraveLarva);
    enemy.id = 'co01b-enemy';
    enemy.health = 40;
    enemy.maxHealth = 40;
    enemy.effects = [];
    enemy.baseStats = { heart: 2, body: 2, mind: 2 };

    return { player, enemy };
}

function summarizeCausalityRun(run: ReturnType<typeof runOneEncounter>) {
    return {
        outcome: run.outcome,
        rounds: run.rounds,
        plays: run.plays,
        poweredPlays: run.cardUsage[CARD_ID]?.bottomPlays ?? 0,
        statusPlays: run.statusPlays,
        dotHpDamage: run.dotHpDamage,
        playerHpTaken: run.playerHpTaken,
    };
}

function runStatusCausalityPair() {
    clearSandboxCards();
    const options = {
        deck: CAUSALITY_DECK,
        focusCardIds: [CARD_ID],
    };

    try {
        const normalActors = causalityActors();
        const normal = runOneEncounter(
            normalActors.player,
            normalActors.enemy,
            CAUSALITY_SEED,
            'greedy',
            options,
        );

        registerSandboxOverride(CARD_ID, {
            free: {},
            combatEffects: [],
        });
        const strippedActors = causalityActors();
        const stripped = runOneEncounter(
            strippedActors.player,
            strippedActors.enemy,
            CAUSALITY_SEED,
            'greedy',
            options,
        );

        return {
            normal: summarizeCausalityRun(normal),
            stripped: summarizeCausalityRun(stripped),
            delta: {
                rounds: normal.rounds - stripped.rounds,
                plays: normal.plays - stripped.plays,
                poweredPlays: (normal.cardUsage[CARD_ID]?.bottomPlays ?? 0)
                    - (stripped.cardUsage[CARD_ID]?.bottomPlays ?? 0),
                statusPlays: normal.statusPlays - stripped.statusPlays,
                dotHpDamage: normal.dotHpDamage - stripped.dotHpDamage,
                playerHpTaken: normal.playerHpTaken - stripped.playerHpTaken,
            },
        };
    } finally {
        clearSandboxCards();
    }
}

afterEach(() => {
    clearSandboxCards();
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

describe('combat-overhaul doctrine — status causality baseline', () => {
    it('records the current seeded delta when card status payloads are stripped', () => {
        const first = runStatusCausalityPair();
        const repeated = runStatusCausalityPair();

        expect(repeated).toEqual(first);
        expect(first).toEqual({
            normal: {
                outcome: 'victory',
                rounds: 3,
                plays: 11,
                poweredPlays: 3,
                statusPlays: 3,
                dotHpDamage: 40,
                playerHpTaken: 13,
            },
            stripped: {
                outcome: 'defeat',
                rounds: 10,
                plays: 50,
                poweredPlays: 10,
                statusPlays: 0,
                dotHpDamage: 0,
                playerHpTaken: 200,
            },
            delta: {
                rounds: -7,
                plays: -39,
                poweredPlays: -7,
                statusPlays: 3,
                dotHpDamage: 40,
                playerHpTaken: -187,
            },
        });
    });
});
