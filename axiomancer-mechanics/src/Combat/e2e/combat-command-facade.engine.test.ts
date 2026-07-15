/**
 * Hermetic E2E — CO-02 Combat Command Facade.
 *
 * Drives `dispatchCombatCommand` through the package's public Combat barrel and
 * proves:
 *   - direct-delegation equality for every command family (incl. RNG forwarding);
 *   - the composite `resolve-threat` equals endTurn + resolveThreatPhase;
 *   - a deterministic witness + precedence for every rejection reason;
 *   - rejections preserve state identity, command identity, and empty events;
 *   - a non-allowlisted engine fizzle stays an ACCEPTED delegated transition;
 *   - choice windows block unrelated commands;
 *   - the order-sensitive doctrine holds when driven through the facade;
 *   - the existing direct transition exports still compile / behave.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { mockSequentialRng, restoreOriginalRng } from '../../test-utils/rng';
import { deepClone } from '../../Utils';
import {
    // ─── the facade under test (public barrel) ───
    dispatchCombatCommand,
    // ─── direct transitions (must still export — evidence #11) ───
    rollEncounterDice, startTurn, draftStanceDie, playCombatCard, discardCombatCard,
    playSignatureSkill, placeStake, tapFateDie, endTurn, resolveThreatPhase,
    selectEncounterMercyChoice, selectCapitulationChoice, getCard,
} from '../index';
import type {
    CombatCommand, CombatCommandRejectionReason,
    CombatEncounterState, CombatEvent, CombatManaDie,
} from '../index';

// A distinctive constant RNG. Every rng-consuming transition is called with it
// both directly and through the facade; a facade that dropped the injected RNG
// would fall back to the (differently-stubbed) default and diverge.
const RNG = () => 0.13;

// Internal getRng()/Math.random paths are pinned to a DIFFERENT value than RNG,
// so a dropped-RNG bug produces observably different output.
function stub() { mockSequentialRng(0.5); }

// A fate-authored fixture card for the Fate-X power-source witness. Registered
// per-test so the trailing clearSandboxCards() never strips it mid-suite.
beforeEach(() => {
    clearSandboxCards();
    registerSandboxCards([
        {
            id: 'qa-fate-card', name: 'QA Fate Card', category: 'paradox',
            philosophicalAspect: 'mind', description: 'fate fixture', tier: 1,
            targetType: 'enemy', rank: 1, cardType: 'spell',
            combatEffects: [{ effectId: 'debuff_curse', appliedTo: 'opponent', duration: 2 }],
            fate: { rider: { bonusDuration: 2 }, recoilHp: 3 },
        },
        {
            id: 'qa-recoil-card', name: 'QA Recoil Card', category: 'fallacy',
            philosophicalAspect: 'body', description: 'chosen X fixture', tier: 1,
            targetType: 'enemy', rank: 1, cardType: 'spell',
            combatEffects: [],
            specialMechanics: [{ kind: 'recoil_x', min: 2, poisonPerX: 1 }],
        },
    ]);
});

afterEach(() => {
    clearSandboxCards();
    vi.restoreAllMocks();
    restoreOriginalRng();
});

/** A phase-play fixture with the drafted WILD die live. */
function playState(extra: Partial<CombatEncounterState> = {}): CombatEncounterState {
    return { ...buildFixtureState({ clean: true }), ...extra };
}

const die = (id: string, color: CombatManaDie['color'], state: CombatManaDie['state'] = 'available', extra: Partial<CombatManaDie> = {}): CombatManaDie =>
    ({ id, color, state, temporary: false, ...extra });

// ─────────────────────────────────────────────────────────────────────────────
// 1. Direct-delegation equality (table-driven) + RNG forwarding
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — direct-delegation equality', () => {
    it('open-encounter delegates to rollEncounterDice from a reveal entry (RNG forwarded)', () => {
        stub();
        const base = buildFixtureState({ clean: true });
        const revealed: CombatEncounterState = { ...base, phase: 'reveal', dice: [], draftedDieId: null, turnTakenThisPhase: false, turn: 0 };
        const direct = rollEncounterDice(deepClone(revealed), RNG);
        const viaFacade = dispatchCombatCommand(deepClone(revealed), { kind: 'open-encounter' }, RNG);

        expect(viaFacade.accepted).toBe(true);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        expect(direct.state.phase).toBe('phase-play'); // reveal entry really opened play
    });

    it('start-turn delegates to startTurn and the forwarded RNG drives the tray', () => {
        stub();
        const between: CombatEncounterState = { ...buildFixtureState({ clean: true }), dice: [], draftedDieId: null, turnTakenThisPhase: false };
        const direct = startTurn(deepClone(between), RNG);
        const viaFacade = dispatchCombatCommand(deepClone(between), { kind: 'start-turn' }, RNG);

        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        // The tray colors depend on the RNG, so equality above is load-bearing.
        const hot = startTurn(deepClone(between), () => 0.99).state.dice.map(d => d.color);
        const cold = startTurn(deepClone(between), () => 0.01).state.dice.map(d => d.color);
        expect(hot).not.toEqual(cold);
    });

    it('draft-die delegates to draftStanceDie and forwards bankUnpicked', () => {
        stub();
        const dice = [die('d0', 'body'), die('d1', 'heart')];
        const base = playState({ dice, draftedDieId: null, reserve: [] });
        const direct = draftStanceDie(deepClone(base), 'd0', { bankUnpicked: true });
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'draft-die', dieId: 'd0', bankUnpicked: true }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        // bankUnpicked really reaches the transition: a die was banked.
        expect(direct.events.some(e => e.kind === 'die-banked')).toBe(true);
        const noBank = dispatchCombatCommand(deepClone(base), { kind: 'draft-die', dieId: 'd0', bankUnpicked: false }, RNG);
        expect(noBank.events.some(e => e.kind === 'die-banked')).toBe(false);
    });

    it('discard-card delegates to discardCombatCard', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        const direct = discardCombatCard(deepClone(base), 'h');
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'discard-card', uid: 'h' }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
    });

    it('play-signature delegates to an RNG-consuming reroll signature', () => {
        stub();
        const base = playState({
            conviction: 8,
            signatures: ['sig-press-the-point'],
            dice: [die('keep', 'heart'), die('reroll', 'body', 'spent')],
        });
        const direct = playSignatureSkill(deepClone(base), 'sig-press-the-point', RNG);
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'play-signature', signatureId: 'sig-press-the-point' }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        expect(viaFacade.state.dice.find(d => d.id === 'reroll')?.color).toBe('heart');
        const differentRng = playSignatureSkill(deepClone(base), 'sig-press-the-point', () => 0.99);
        expect(differentRng.state.dice.find(d => d.id === 'reroll')?.color).not.toBe('heart');
    });

    it('place-stake delegates to placeStake', () => {
        stub();
        const base = playState({ conviction: 10 });
        const direct = placeStake(deepClone(base), 'heart', 4);
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'place-stake', color: 'heart', amount: 4 }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
    });

    it('tap-fate delegates to tapFateDie', () => {
        stub();
        const base = playState({ dice: [die('x0', 'x', 'locked')], draftedDieId: null, conviction: 0 });
        const direct = tapFateDie(deepClone(base), 'x0', 'conviction');
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'tap-fate', dieId: 'x0', choice: 'conviction' }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
    });

    it('choose-mercy delegates to selectMercyChoice', () => {
        stub();
        const base = playState({ mercyChoiceActive: true });
        const direct = selectEncounterMercyChoice(deepClone(base), 'spare');
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'choose-mercy', choice: 'spare' }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
    });

    it('choose-capitulation delegates to selectCapitulationChoice', () => {
        stub();
        const base = playState({ capitulationChoiceActive: true });
        const direct = selectCapitulationChoice(deepClone(base), 'continue');
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'choose-capitulation', choice: 'continue' }, RNG);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. play-card families — every live per-play choice is forwarded verbatim
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — play-card delegation across families', () => {
    const equalsDirect = (
        state: CombatEncounterState,
        card: { uid?: string; cardId?: string },
        useBottom: boolean,
        dieId: string | undefined,
        play: { chosenX?: number; reprisalCardId?: string; omenClaim?: { stance: 'heart' | 'body' | 'mind'; window: number } },
        command: Extract<CombatCommand, { kind: 'play-card' }>,
    ) => {
        const direct = playCombatCard(deepClone(state), card, useBottom, dieId, RNG, play);
        const viaFacade = dispatchCombatCommand(deepClone(state), command, RNG);
        expect(viaFacade.accepted).toBe(true);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        return direct;
    };

    it('FREE top action (no die)', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        equalsDirect(base, { uid: 'h' }, false, undefined, {},
            { kind: 'play-card', card: { uid: 'h' }, useBottom: false });
    });

    it('drafted powered play (Wild drafted die)', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        equalsDirect(base, { uid: 'h' }, true, undefined, {},
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true });
    });

    it('explicit Reserve die power source', () => {
        stub();
        const base = playState({
            hand: [{ uid: 'h', cardId: 'slippery-slope' }],
            reserve: [die('res0', 'wild', 'available', { pips: 0 })],
        });
        equalsDirect(base, { uid: 'h' }, true, 'res0', {},
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'res0' });
    });

    it('explicit floating die power source', () => {
        stub();
        const base = playState({
            hand: [{ uid: 'h', cardId: 'slippery-slope' }],
            dice: [die('fx-die', 'wild'), die('flt0', 'wild', 'available', { floating: true })],
            draftedDieId: 'fx-die',
        });
        equalsDirect(base, { uid: 'h' }, true, 'flt0', {},
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'flt0' });
    });

    it('Fate-X power source on a fate-authored card', () => {
        stub();
        const seed = buildFixtureState({ clean: true });
        const base: CombatEncounterState = {
            ...seed,
            player: { ...seed.player, knownCards: [...seed.player.knownCards, 'qa-fate-card'] },
            hand: [{ uid: 'h', cardId: 'qa-fate-card' }],
            dice: [die('fx-die', 'wild'), die('x0', 'x', 'locked')],
            draftedDieId: 'fx-die',
        };
        const direct = equalsDirect(base, { uid: 'h' }, true, 'x0', {},
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'x0' });
        expect(direct.events.some(e => e.kind === 'fate-powered')).toBe(true);
    });

    it('forwards chosenX to an active recoil_x mechanic', () => {
        stub();
        const seed = playState();
        const base = playState({
            player: { ...seed.player, knownCards: [...seed.player.knownCards, 'qa-recoil-card'] },
            hand: [{ uid: 'h', cardId: 'qa-recoil-card' }],
        });
        const direct = equalsDirect(base, { uid: 'h' }, true, undefined, { chosenX: 5 },
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, chosenX: 5 });
        expect(base.player.health - direct.state.player.health).toBe(5);
        expect(direct.state.enemy.effects.find(e => e.effectId === 'debuff_poison')?.intensity).toBe(5);
    });

    it('forwards reprisalCardId', () => {
        stub();
        const base = playState({
            hand: [{ uid: 'h', cardId: 'second-thoughts' }],
            discard: ['straw-mans-jab', 'the-overtake'],
        });
        const direct = equalsDirect(base, { uid: 'h' }, true, undefined, { reprisalCardId: 'straw-mans-jab' },
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, reprisalCardId: 'straw-mans-jab' });
        expect(direct.events.find(e => e.kind === 'reprised')).toMatchObject({ returned: ['straw-mans-jab'] });
    });

    it('forwards omenClaim', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'signs-and-portents' }] });
        equalsDirect(base, { uid: 'h' }, true, undefined, { omenClaim: { stance: 'body', window: 2 } },
            { kind: 'play-card', card: { uid: 'h' }, useBottom: true, omenClaim: { stance: 'body', window: 2 } });
    });

    it('mirrors direct cardRef truthiness when an empty uid accompanies a card id', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        equalsDirect(base, { uid: '', cardId: 'slippery-slope' }, false, undefined, {},
            { kind: 'play-card', card: { uid: '', cardId: 'slippery-slope' }, useBottom: false });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. resolve-threat composite
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — resolve-threat composite', () => {
    it('equals endTurn + resolveThreatPhase, banking events before threat events', () => {
        stub();
        const base = playState(); // drafted fx-die is available/non-X → endTurn banks it
        const ended = endTurn(deepClone(base));
        const resolved = resolveThreatPhase(deepClone(ended.state), RNG);
        const expectedEvents = [...ended.events, ...resolved.events];

        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'resolve-threat' }, RNG);
        expect(viaFacade.accepted).toBe(true);
        expect(viaFacade.state).toEqual(resolved.state);
        expect(viaFacade.events).toEqual(expectedEvents);

        const bankIdx = viaFacade.events.findIndex(e => e.kind === 'die-banked');
        const threatIdx = viaFacade.events.findIndex(e => e.kind === 'threat-fired');
        expect(bankIdx).toBeGreaterThanOrEqual(0);
        expect(threatIdx).toBeGreaterThan(bankIdx);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Rejections — one deterministic witness per reason + invariants
// ─────────────────────────────────────────────────────────────────────────────

interface RejectionCase {
    reason: CombatCommandRejectionReason;
    state: CombatEncounterState;
    command: CombatCommand;
}

function rejectionCases(): RejectionCase[] {
    const base = () => buildFixtureState({ clean: true });
    return [
        { reason: 'encounter-complete', state: playState({ finalOutcome: 'victory' }), command: { kind: 'start-turn' } },
        { reason: 'choice-pending', state: playState({ mercyChoiceActive: true }), command: { kind: 'start-turn' } },
        { reason: 'mercy-choice-unavailable', state: playState(), command: { kind: 'choose-mercy', choice: 'spare' } },
        { reason: 'capitulation-choice-unavailable', state: playState(), command: { kind: 'choose-capitulation', choice: 'accept' } },
        { reason: 'wrong-phase', state: playState(), command: { kind: 'open-encounter' } },
        { reason: 'turn-already-started', state: playState(), command: { kind: 'start-turn' } },
        { reason: 'turn-already-taken', state: playState({ dice: [], draftedDieId: null, turnTakenThisPhase: true }), command: { kind: 'start-turn' } },
        { reason: 'turn-not-started', state: playState({ dice: [], draftedDieId: null }), command: { kind: 'draft-die', dieId: 'x' } },
        { reason: 'die-already-drafted', state: playState(), command: { kind: 'draft-die', dieId: 'fx-die' } },
        { reason: 'die-not-found', state: playState({ dice: [die('d0', 'body')], draftedDieId: null }), command: { kind: 'draft-die', dieId: 'ghost' } },
        { reason: 'floating-die-cannot-be-drafted', state: playState({ dice: [die('flt', 'wild', 'available', { floating: true })], draftedDieId: null }), command: { kind: 'draft-die', dieId: 'flt' } },
        { reason: 'card-not-found', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] }), command: { kind: 'play-card', card: { uid: 'nope' }, useBottom: false } },
        { reason: 'card-definition-not-found', state: playState({ hand: [{ uid: 'h', cardId: 'not-a-real-card' }] }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: false } },
        { reason: 'powered-card-requires-die', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }], dice: [], draftedDieId: null }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true } },
        { reason: 'die-cannot-power-card', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }], dice: [die('d', 'wild', 'spent')], draftedDieId: 'd' }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true } },
        { reason: 'die-cannot-power-card', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }], reserve: [die('spent-reserve', 'wild', 'spent')] }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'spent-reserve' } },
        { reason: 'die-cannot-power-card', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }], reserve: [die('exhausted-reserve', 'wild', 'exhausted')] }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'exhausted-reserve' } },
        { reason: 'die-cannot-power-card', state: playState({ hand: [{ uid: 'h', cardId: 'qa-fate-card' }], dice: [die('fx-die', 'wild'), die('exhausted-x', 'x', 'exhausted')], draftedDieId: 'fx-die' }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'exhausted-x' } },
        { reason: 'die-not-found', state: playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] }), command: { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'ghost' } },
        { reason: 'signature-not-found', state: playState({ conviction: 8 }), command: { kind: 'play-signature', signatureId: 'nope' } },
        { reason: 'signature-not-found', state: playState({ conviction: 8, signatures: [] }), command: { kind: 'play-signature', signatureId: 'sig-read-opponent' } },
        { reason: 'insufficient-conviction', state: playState({ conviction: 0 }), command: { kind: 'play-signature', signatureId: 'sig-read-opponent' } },
        { reason: 'no-rerollable-dice', state: playState({ conviction: 10, signatures: ['sig-press-the-point'], dice: [die('w', 'wild')] }), command: { kind: 'play-signature', signatureId: 'sig-press-the-point' } },
        { reason: 'stake-already-placed', state: playState({ conviction: 10, stake: { color: 'heart', amount: 2 } }), command: { kind: 'place-stake', color: 'body', amount: 2 } },
        { reason: 'stake-requires-draft', state: playState({ conviction: 10, draftedDieId: null }), command: { kind: 'place-stake', color: 'body', amount: 2 } },
        { reason: 'insufficient-conviction', state: playState({ conviction: 0 }), command: { kind: 'place-stake', color: 'body', amount: 2 } },
        { reason: 'fate-already-tapped', state: playState({ turn: 3, fateTappedTurn: 3, dice: [die('x0', 'x', 'locked')] }), command: { kind: 'tap-fate', dieId: 'x0', choice: 'conviction' } },
        { reason: 'fate-die-not-found', state: playState({ turn: 3 }), command: { kind: 'tap-fate', dieId: 'x0', choice: 'conviction' } },
        { reason: 'fate-target-unavailable', state: playState({ turn: 3, dice: [die('x0', 'x', 'locked')] }), command: { kind: 'tap-fate', dieId: 'x0', choice: 'dot-tick' } },
        // resolve-threat wrong phase
        { reason: 'wrong-phase', state: { ...base(), phase: 'reveal', dice: [], draftedDieId: null }, command: { kind: 'resolve-threat' } },
    ];
}

describe('CO-02 — every rejection reason has a deterministic witness with preserved invariants', () => {
    it.each(rejectionCases())('rejects $reason with untouched state/command/events', ({ reason, state, command }) => {
        stub();
        const result = dispatchCombatCommand(state, command, RNG);
        expect(result.accepted).toBe(false);
        if (result.accepted) return;
        expect(result.reason).toBe(reason);
        expect(result.state).toBe(state);       // exact original object (identity)
        expect(result.command).toBe(command);   // exact command object (identity)
        expect(result.events).toEqual([]);       // empty events
        expect(result.events).toHaveLength(0);
    });

    it('covers all 23 declared rejection reasons', () => {
        const declared: CombatCommandRejectionReason[] = [
            'encounter-complete', 'choice-pending', 'wrong-phase', 'turn-already-started',
            'turn-already-taken', 'turn-not-started', 'die-already-drafted', 'die-not-found',
            'floating-die-cannot-be-drafted', 'card-not-found', 'card-definition-not-found',
            'powered-card-requires-die', 'die-cannot-power-card', 'signature-not-found',
            'insufficient-conviction', 'no-rerollable-dice', 'stake-already-placed',
            'stake-requires-draft', 'fate-already-tapped', 'fate-die-not-found',
            'fate-target-unavailable', 'mercy-choice-unavailable', 'capitulation-choice-unavailable',
        ];
        const witnessed = new Set(rejectionCases().map(c => c.reason));
        for (const r of declared) expect(witnessed.has(r)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Precedence — overlapping invalid states
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — global rejection precedence', () => {
    it('encounter-complete beats the choice-window law', () => {
        stub();
        const state = playState({ finalOutcome: 'mercy', mercyChoiceActive: true });
        const result = dispatchCombatCommand(state, { kind: 'choose-mercy', choice: 'spare' }, RNG);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('encounter-complete');
    });

    it('choice-pending beats a command phase check', () => {
        stub();
        // open-encounter would be wrong-phase in phase-play, but the pending
        // choice wins first.
        const state = playState({ capitulationChoiceActive: true });
        const result = dispatchCombatCommand(state, { kind: 'open-encounter' }, RNG);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('choice-pending');
    });

    it('start-turn: turn-already-started (live tray) beats turn-already-taken', () => {
        stub();
        const state = playState({ turnTakenThisPhase: true }); // dice + draft still live
        const result = dispatchCombatCommand(state, { kind: 'start-turn' }, RNG);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('turn-already-started');
    });

    it('powered play: existence (die-not-found) beats target legality (die-cannot-power-card)', () => {
        stub();
        const state = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        const result = dispatchCombatCommand(state, { kind: 'play-card', card: { uid: 'h' }, useBottom: true, dieId: 'ghost' }, RNG);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('die-not-found');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Fizzle boundary — non-allowlisted engine fizzles stay ACCEPTED
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — non-allowlisted engine fizzle remains an accepted delegated transition', () => {
    it('a unique enchantment already in play fizzles inside the accepted delegation', () => {
        stub();
        const base = playState({
            hand: [{ uid: 'h', cardId: 'venom-and-vein' }],
            persistentZone: ['venom-and-vein'],
        });
        const direct = playCombatCard(deepClone(base), { uid: 'h' }, true, undefined, RNG);
        const viaFacade = dispatchCombatCommand(deepClone(base), { kind: 'play-card', card: { uid: 'h' }, useBottom: true }, RNG);

        expect(viaFacade.accepted).toBe(true);
        expect(viaFacade.state).toEqual(direct.state);
        expect(viaFacade.events).toEqual(direct.events);
        expect(viaFacade.events.some(e => e.kind === 'effect-fizzled' && /already in play/.test(e.message))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Choice windows block unrelated commands
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — choice windows', () => {
    it('a pending mercy choice blocks a draft-die', () => {
        stub();
        const state = playState({ mercyChoiceActive: true, dice: [die('d0', 'body')], draftedDieId: null });
        const result = dispatchCombatCommand(state, { kind: 'draft-die', dieId: 'd0' }, RNG);
        expect(result.accepted).toBe(false);
        if (!result.accepted) expect(result.reason).toBe('choice-pending');
    });

    it('a pending capitulation choice does not block choose-capitulation', () => {
        stub();
        const state = playState({ capitulationChoiceActive: true });
        const result = dispatchCombatCommand(state, { kind: 'choose-capitulation', choice: 'continue' }, RNG);
        expect(result.accepted).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Order-sensitive doctrine, driven through the facade
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — order-sensitive status doctrine via the facade', () => {
    it('setup-before-payoff through the facade equals the direct transition sequence', () => {
        stub();
        const initial = playState({
            hand: [
                { uid: 'setup', cardId: 'slippery-slope' },
                { uid: 'payoff', cardId: 'second-thoughts' },
            ],
            dice: [die('fx-die', 'wild')],
            draftedDieId: 'fx-die',
        });

        // Direct sequence.
        const dSetup = playCombatCard(deepClone(initial), { uid: 'setup' }, false, undefined, RNG);
        const dPayoff = playCombatCard(deepClone(dSetup.state), { uid: 'payoff' }, true, 'fx-die', RNG);

        // Facade sequence.
        const fSetup = dispatchCombatCommand(deepClone(initial), { kind: 'play-card', card: { uid: 'setup' }, useBottom: false }, RNG);
        expect(fSetup.accepted).toBe(true);
        const fPayoff = dispatchCombatCommand(deepClone(fSetup.state), { kind: 'play-card', card: { uid: 'payoff' }, useBottom: true, dieId: 'fx-die' }, RNG);
        expect(fPayoff.accepted).toBe(true);

        expect(fSetup.state).toEqual(dSetup.state);
        expect(fPayoff.state).toEqual(dPayoff.state);
        expect([...fSetup.events, ...fPayoff.events]).toEqual([...dSetup.events, ...dPayoff.events]);
        const played = [...fSetup.events, ...fPayoff.events]
            .filter((e): e is Extract<CombatEvent, { kind: 'card-played' }> => e.kind === 'card-played')
            .map(e => e.cardId);
        expect(played).toEqual(['slippery-slope', 'second-thoughts']);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Existing direct transition exports still compile + behave (evidence #11)
// ─────────────────────────────────────────────────────────────────────────────

describe('CO-02 — existing direct transition exports intact', () => {
    it('the direct transitions remain callable and unchanged alongside the facade', () => {
        stub();
        const base = playState({ hand: [{ uid: 'h', cardId: 'slippery-slope' }] });
        expect(typeof getCard('slippery-slope')).toBe('object');
        const direct = playCombatCard(deepClone(base), { uid: 'h' }, false, undefined, RNG);
        expect(direct.events.some(e => e.kind === 'card-played')).toBe(true);
    });
});
