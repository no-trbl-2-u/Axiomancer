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
import { draftStanceDie, playCombatCard, resolveThreatPhase } from '../combat.engine';
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

describe('combat-overhaul doctrine — order-sensitive card puzzle', () => {
    const fixedRng = () => 0.5;
    const effectIntensity = (state: CombatEncounterState, effectId: string) => (
        state.enemy.effects.find(effect => effect.effectId === effectId)?.intensity ?? 0
    );
    const playedCards = (events: CombatEvent[]) => events
        .filter((event): event is Extract<CombatEvent, { kind: 'card-played' }> => event.kind === 'card-played')
        .map(event => event.cardId);
    const cardDamage = (events: CombatEvent[], cardId: string) => events
        .filter((event): event is Extract<CombatEvent, { kind: 'damage-dealt' }> => (
            event.kind === 'damage-dealt' && event.cardId === cardId
        ))
        .reduce((total, event) => total + event.amount, 0);

    it('makes setup before payoff stronger than the reverse order from the same state', () => {
        mockSequentialRng(0.5);
        const initial = {
            ...buildFixtureState({ clean: true }),
            hand: [
                { uid: 'setup', cardId: 'slippery-slope' },
                { uid: 'payoff', cardId: 'second-thoughts' },
            ],
        };
        const setup = playCombatCard(initial, { uid: 'setup' }, false);
        const setupPayoff = playCombatCard(setup.state, { uid: 'payoff' }, true, 'fx-die');
        const payoff = playCombatCard(initial, { uid: 'payoff' }, true, 'fx-die');
        const payoffSetup = playCombatCard(payoff.state, { uid: 'setup' }, false);

        expect({
            enemyHealth: setupPayoff.state.enemy.health,
            mark: effectIntensity(setupPayoff.state, 'debuff_mark'),
            payoffDamage: cardDamage(setupPayoff.events, 'second-thoughts'),
        }).toEqual({ enemyHealth: 999, mark: 0, payoffDamage: 1 });
        expect({
            enemyHealth: payoffSetup.state.enemy.health,
            mark: effectIntensity(payoffSetup.state, 'debuff_mark'),
            payoffDamage: cardDamage(payoff.events, 'second-thoughts'),
        }).toEqual({ enemyHealth: 1000, mark: 1, payoffDamage: 0 });
        expect(playedCards([...setup.events, ...setupPayoff.events])).toEqual(['slippery-slope', 'second-thoughts']);
        expect(playedCards([...payoff.events, ...payoffSetup.events])).toEqual(['second-thoughts', 'slippery-slope']);
        expect([...setup.events, ...setupPayoff.events, ...payoff.events, ...payoffSetup.events]
            .some(event => event.kind === 'effect-fizzled')).toBe(false);
    });

    it('only absorbs the first threat when defense is played before it resolves', () => {
        const base = buildFixtureState({ clean: true });
        const initial = {
            ...base,
            player: { ...base.player, health: 100, effects: [] },
            hand: [{ uid: 'brace', cardId: 'brace-for-impact' }],
        };
        const defend = playCombatCard(initial, { uid: 'brace' }, false);
        const defendThreat = resolveThreatPhase(defend.state, fixedRng);
        const threat = resolveThreatPhase(initial, fixedRng);
        const threatDefend = playCombatCard(threat.state, { uid: 'brace' }, false);

        expect({
            playerHealth: defendThreat.state.player.health,
            barrier: defendThreat.state.barrier,
            absorbed: defendThreat.events
                .filter(event => event.kind === 'barrier-absorbed')
                .reduce((total, event) => total + event.amount, 0),
        }).toEqual({ playerHealth: 97, barrier: 0, absorbed: 2 });
        expect({
            playerHealth: threatDefend.state.player.health,
            barrier: threatDefend.state.barrier,
            absorbed: threat.events
                .filter(event => event.kind === 'barrier-absorbed')
                .reduce((total, event) => total + event.amount, 0),
        }).toEqual({ playerHealth: 95, barrier: 2, absorbed: 0 });
        expect(defend.events.some(event => event.kind === 'card-played' && event.cardId === 'brace-for-impact')).toBe(true);
        expect(threatDefend.events.some(event => event.kind === 'card-played' && event.cardId === 'brace-for-impact')).toBe(true);
        expect(defendThreat.events.some(event => event.kind === 'threat-fired')).toBe(true);
        expect(threat.events.some(event => event.kind === 'threat-fired')).toBe(true);
        expect([defend.state.guard, initial.guard, threat.state.guard]).toEqual([0, 0, 0]);
    });

    it('preserves a die through status refresh only when the status card is played first', () => {
        mockSequentialRng(0.5);
        const initial = {
            ...buildFixtureState({ clean: true }),
            hand: [
                { uid: 'status', cardId: 'slippery-slope' },
                { uid: 'brace', cardId: 'brace-for-impact' },
            ],
        };
        const status = playCombatCard(initial, { uid: 'status' }, true, 'fx-die');
        const statusBrace = playCombatCard(status.state, { uid: 'brace' }, true, 'fx-die');
        const brace = playCombatCard(initial, { uid: 'brace' }, true, 'fx-die');
        const braceStatus = playCombatCard(brace.state, { uid: 'status' }, true, 'fx-die');

        expect({
            played: playedCards([...status.events, ...statusBrace.events]),
            enemyHealth: statusBrace.state.enemy.health,
            poison: effectIntensity(statusBrace.state, 'debuff_poison'),
            guard: statusBrace.state.guard,
            dieResolution: [...status.events, ...statusBrace.events]
                .filter(event => event.kind === 'die-refreshed' || event.kind === 'die-spent')
                .map(event => event.kind),
        }).toEqual({
            played: ['slippery-slope', 'brace-for-impact'],
            enemyHealth: 998,
            poison: 1,
            guard: 11,
            dieResolution: ['die-refreshed', 'die-spent'],
        });
        expect({
            played: playedCards([...brace.events, ...braceStatus.events]),
            enemyHealth: braceStatus.state.enemy.health,
            poison: effectIntensity(braceStatus.state, 'debuff_poison'),
            guard: braceStatus.state.guard,
        }).toEqual({ played: ['brace-for-impact'], enemyHealth: 1000, poison: 0, guard: 11 });
        expect(braceStatus.events).toContainEqual({
            kind: 'effect-fizzled',
            cardId: 'slippery-slope',
            effectId: '',
            message: 'the drafted die is spent or blocked — end the turn',
        });
    });
});
