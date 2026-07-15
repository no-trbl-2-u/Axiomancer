/**
 * CO-02 — Combat Command Facade.
 *
 * One typed, mechanics-owned dispatcher over the existing player-facing combat
 * transitions. It represents every current player intent as a closed
 * {@link CombatCommand} union and returns either the exact delegated transition
 * ({@link CombatTransition} state/events, wrapped `accepted: true`) or an
 * explicit machine-readable rejection ({@link CombatCommandRejectionReason},
 * with the ORIGINAL state object and empty events).
 *
 * The facade owns NO combat rules of its own — every accepted command delegates
 * to exactly one (or, for `resolve-threat`, the fixed two) existing transition,
 * forwarding the injected RNG to every RNG-consuming call. It converts ONLY the
 * enumerated pre-delegation conditions (see the fizzle boundary in the CO-02
 * packet) into rejections; every other card- or effect-specific engine fizzle
 * remains an accepted delegated transition with its original state/events. It
 * does not remove, rename, or alter any transition signature or behavior.
 */
import { getCardById } from '../Cards/cards.library';
import { hasRerollableDice } from './combat.dice';
import {
    draftStanceDie,
    discardCombatCard,
    endTurn,
    getCard,
    getDraftedDie,
    getSignatureSkill,
    placeStake,
    playCombatCard,
    playSignatureSkill,
    resolveThreatPhase,
    rollEncounterDice,
    selectCapitulationChoice,
    selectMercyChoice,
    startTurn,
    tapFateDie,
} from './combat.engine';
import type {
    CombatCard,
    CombatEncounterState,
    CombatEvent,
    CombatManaDie,
    CombatTransition,
    WheelStance,
} from './combat.encounter.types';
import { getActiveDotTotal } from './effect-modifiers';
import type { Stance } from './types';

/**
 * Every current player intent as a closed discriminated union. The shape of
 * each variant mirrors the delegated transition's live parameters exactly (see
 * the delegation map below), so no player choice is lost in translation.
 */
export type CombatCommand =
    | { kind: 'open-encounter' }
    | { kind: 'start-turn' }
    | { kind: 'draft-die'; dieId: string; bankUnpicked?: boolean }
    | {
        kind: 'play-card';
        card: { uid?: string; cardId?: string };
        useBottom: boolean;
        dieId?: string;
        chosenX?: number;
        reprisalCardId?: string;
        omenClaim?: { stance: Stance; window: number };
    }
    | { kind: 'discard-card'; uid: string }
    | { kind: 'play-signature'; signatureId: string }
    | { kind: 'place-stake'; color: WheelStance; amount: 2 | 4 | 6 }
    | { kind: 'tap-fate'; dieId: string; choice: 'dot-tick' | 'conviction' }
    | { kind: 'resolve-threat' }
    | { kind: 'choose-mercy'; choice: 'spare' | 'exploit' }
    | { kind: 'choose-capitulation'; choice: 'accept' | 'continue' };

/** Every machine-readable reason the facade can refuse a command with. */
export type CombatCommandRejectionReason =
    | 'encounter-complete'
    | 'choice-pending'
    | 'wrong-phase'
    | 'turn-already-started'
    | 'turn-already-taken'
    | 'turn-not-started'
    | 'die-already-drafted'
    | 'die-not-found'
    | 'floating-die-cannot-be-drafted'
    | 'card-not-found'
    | 'card-definition-not-found'
    | 'powered-card-requires-die'
    | 'die-cannot-power-card'
    | 'signature-not-found'
    | 'insufficient-conviction'
    | 'no-rerollable-dice'
    | 'stake-already-placed'
    | 'stake-requires-draft'
    | 'fate-already-tapped'
    | 'fate-die-not-found'
    | 'fate-target-unavailable'
    | 'mercy-choice-unavailable'
    | 'capitulation-choice-unavailable';

/**
 * The dispatch result. An accepted result carries the delegated transition's
 * state and event stream verbatim; a rejected result carries the EXACT original
 * state object, the exact command object, and an empty event tuple.
 */
export type CombatCommandResult =
    | { accepted: true; command: CombatCommand; state: CombatEncounterState; events: CombatEvent[] }
    | { accepted: false; command: CombatCommand; reason: CombatCommandRejectionReason; state: CombatEncounterState; events: [] };

function reject(
    command: CombatCommand,
    reason: CombatCommandRejectionReason,
    state: CombatEncounterState,
): CombatCommandResult {
    // The ORIGINAL state object (identity preserved), the exact command, no events.
    return { accepted: false, command, reason, state, events: [] };
}

function accept(command: CombatCommand, transition: CombatTransition): CombatCommandResult {
    return { accepted: true, command, state: transition.state, events: transition.events };
}

function assertNever(command: never): never {
    // Unreachable — the switch is exhaustive over CombatCommand. A new variant
    // makes this a compile-time error (the packet's exhaustiveness law), never a
    // silent runtime fallback.
    throw new Error(`unhandled combat command: ${JSON.stringify(command)}`);
}

/**
 * Classifies a powered (`useBottom`) play's effective power source EXACTLY as
 * {@link playCombatCard}'s `playBottomAction` resolves it, mapping the four
 * pre-delegation power-source fizzles onto explicit rejection reasons. Returns
 * `null` when the source resolves cleanly (the play is delegated as-is).
 *
 * Resolution order mirrors the engine: an absent/drafted-id `dieId` uses the
 * drafted die (else `powered-card-requires-die`); an explicit id resolves
 * against Reserve, then floating (available) tray dice, then a locked X die for
 * `fate`-authored cards only; anything else is `die-not-found` when the id is
 * absent from tray/Reserve entirely, else `die-cannot-power-card`. THE COLOR
 * LAW (non-Wild off-color) is `die-cannot-power-card` for every non-fate-X
 * source.
 */
function powerSourceRejection(
    state: CombatEncounterState,
    card: CombatCard,
    dieId: string | undefined,
): CombatCommandRejectionReason | null {
    const sourceCard = getCardById(card.id);
    const drafted = getDraftedDie(state);
    const reserve = state.reserve ?? [];

    // Default / explicit-drafted source: the drafted stance die powers the card.
    if (dieId === undefined || dieId === drafted?.id) {
        if (!drafted) return 'powered-card-requires-die';
        if (drafted.state !== 'available' || drafted.color === 'x') return 'die-cannot-power-card';
        if (drafted.color !== 'wild' && drafted.color !== card.stance) return 'die-cannot-power-card';
        return null;
    }

    // Explicit non-drafted source: Reserve, then floating tray die, then fate-X.
    const banked = reserve.find(d => d.id === dieId);
    const floating = state.dice.find(d => d.id === dieId && d.floating === true && d.state === 'available');
    const trayX = state.dice.find(d => d.id === dieId && d.color === 'x');

    let powering: CombatManaDie;
    let isFateX = false;
    if (banked?.state === 'available') {
        powering = banked;
    } else if (floating) {
        powering = floating;
    } else if (trayX?.state === 'locked' && sourceCard?.fate) {
        powering = trayX;
        isFateX = true;
    } else {
        const existsAnywhere = state.dice.some(d => d.id === dieId) || reserve.some(d => d.id === dieId);
        return existsAnywhere ? 'die-cannot-power-card' : 'die-not-found';
    }

    // THE COLOR LAW — a die powers only a card of its color; WILD is universal;
    // a fate-X play acts wild by definition and is exempt.
    if (!isFateX && powering.color !== 'wild' && powering.color !== card.stance) {
        return 'die-cannot-power-card';
    }
    return null;
}

/**
 * The single command entry point. Applies the global rejection precedence
 * (encounter-complete → choice-window law → command phase/window → turn
 * lifecycle → object existence → affordability → target legality), then
 * delegates the accepted command to exactly one existing transition (two, for
 * the `resolve-threat` composite), forwarding `rng` to every RNG-consuming
 * transition. `rng` omitted lets each delegated transition fall back to its own
 * default RNG (identical to calling it directly with no RNG argument).
 */
export function dispatchCombatCommand(
    state: CombatEncounterState,
    command: CombatCommand,
    rng?: () => number,
): CombatCommandResult {
    // 1. Encounter-complete wins over everything, including choice commands.
    if (state.phase === 'complete' || state.finalOutcome) {
        return reject(command, 'encounter-complete', state);
    }

    // 2. Choice-window law. Choice commands check ONLY their own window; every
    //    other command is refused while either choice is pending.
    if (command.kind === 'choose-mercy') {
        if (!state.mercyChoiceActive) return reject(command, 'mercy-choice-unavailable', state);
        return accept(command, selectMercyChoice(state, command.choice));
    }
    if (command.kind === 'choose-capitulation') {
        if (!state.capitulationChoiceActive) return reject(command, 'capitulation-choice-unavailable', state);
        return accept(command, selectCapitulationChoice(state, command.choice));
    }
    if (state.mercyChoiceActive || state.capitulationChoiceActive) {
        return reject(command, 'choice-pending', state);
    }

    // 3-7. Command phase/window → turn lifecycle → existence → affordability →
    //      target legality. First failure wins; otherwise delegate.
    switch (command.kind) {
        case 'open-encounter':
            if (state.phase !== 'reveal' && state.phase !== 'dice-roll') return reject(command, 'wrong-phase', state);
            return accept(command, rollEncounterDice(state, rng));

        case 'start-turn':
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            if (state.dice.length > 0 || state.draftedDieId !== null) return reject(command, 'turn-already-started', state);
            if (state.turnTakenThisPhase) return reject(command, 'turn-already-taken', state);
            return accept(command, startTurn(state, rng));

        case 'draft-die': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            if (state.draftedDieId !== null) return reject(command, 'die-already-drafted', state);
            if (state.dice.length === 0) return reject(command, 'turn-not-started', state);
            const die = state.dice.find(d => d.id === command.dieId);
            if (!die) return reject(command, 'die-not-found', state);
            if (die.floating) return reject(command, 'floating-die-cannot-be-drafted', state);
            return accept(command, draftStanceDie(state, command.dieId, { bankUnpicked: command.bankUnpicked }));
        }

        case 'play-card': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            const entry = command.card.uid
                ? state.hand.find(h => h.uid === command.card.uid)
                : state.hand.find(h => h.cardId === command.card.cardId);
            if (!entry) return reject(command, 'card-not-found', state);
            const card = getCard(entry.cardId);
            if (!card) return reject(command, 'card-definition-not-found', state);
            if (command.useBottom) {
                const powerReason = powerSourceRejection(state, card, command.dieId);
                if (powerReason) return reject(command, powerReason, state);
            }
            return accept(command, playCombatCard(
                state,
                command.card,
                command.useBottom,
                command.dieId,
                rng,
                { chosenX: command.chosenX, reprisalCardId: command.reprisalCardId, omenClaim: command.omenClaim },
            ));
        }

        case 'discard-card': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            if (!state.hand.some(h => h.uid === command.uid)) return reject(command, 'card-not-found', state);
            return accept(command, discardCombatCard(state, command.uid));
        }

        case 'play-signature': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            const skill = getSignatureSkill(command.signatureId);
            if (!skill || !state.signatures.includes(skill.id)) {
                return reject(command, 'signature-not-found', state);
            }
            if (state.conviction < skill.cost) return reject(command, 'insufficient-conviction', state);
            if (skill.kind === 'reroll' && !hasRerollableDice(state.dice)) return reject(command, 'no-rerollable-dice', state);
            return accept(command, playSignatureSkill(state, command.signatureId, rng));
        }

        case 'place-stake':
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            if (state.stake) return reject(command, 'stake-already-placed', state);
            if (state.draftedDieId === null) return reject(command, 'stake-requires-draft', state);
            if (state.conviction < command.amount) return reject(command, 'insufficient-conviction', state);
            return accept(command, placeStake(state, command.color, command.amount));

        case 'tap-fate': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            if (state.fateTappedTurn === state.turn) return reject(command, 'fate-already-tapped', state);
            const die = state.dice.find(d => d.id === command.dieId && d.color === 'x' && d.state !== 'spent');
            if (!die) return reject(command, 'fate-die-not-found', state);
            if (command.choice === 'dot-tick' && getActiveDotTotal(state.enemy.effects, state.round).perEffect.length === 0) {
                return reject(command, 'fate-target-unavailable', state);
            }
            return accept(command, tapFateDie(state, command.dieId, command.choice));
        }

        case 'resolve-threat': {
            if (state.phase !== 'phase-play') return reject(command, 'wrong-phase', state);
            const ended = endTurn(state);
            const resolved = resolveThreatPhase(ended.state, rng);
            return { accepted: true, command, state: resolved.state, events: [...ended.events, ...resolved.events] };
        }

        default:
            return assertNever(command);
    }
}
