/**
 * Hermetic E2E — phase 28 (Show the Engine legibility sweep). Covers the
 * mechanics-side additions: per-card rupture projection, the Overtake 2-pip
 * gate, the shared rung-denial fix (getDisruptMeter.willDeny), the REPRISE
 * songbook player choice, the wall-math projection, and the tu-quoque
 * color-match data fix. Seeded RNG only; no disk / network / TTY.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import type { ActiveEffect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, draftStanceDie, playCombatCard,
    projectRupture, projectRuptureBurst, projectIncomingThreat, getDisruptMeter,
} from '../combat.engine';
import type { CombatDieColor, CombatEncounterState } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

const ae = (effectId: string, intensity = 1, remainingDuration = 4): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier: 2 });

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

function makeEnemy(hp: number, stance: 'heart' | 'body' | 'mind' = 'mind', effects: ActiveEffect[] = []): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-test-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    e.baseStats = { heart: stance === 'heart' ? 6 : 2, body: stance === 'body' ? 6 : 2, mind: stance === 'mind' ? 6 : 2 };
    return e;
}

/** Forces this turn's draft pool to known colors (deterministic reads). */
function setDice(state: CombatEncounterState, colors: CombatDieColor[]): CombatEncounterState {
    const turn = state.turn || 1;
    const dice = colors.map((c, i) => ({
        id: `t${turn}-d${i}`, color: c,
        state: c === 'x' ? ('locked' as const) : ('available' as const), temporary: false,
    }));
    return { ...state, dice, draftedDieId: null, turn };
}

/** Opens phase-play, forces the pool, and drafts die 0 (color `die`). */
function openAndDraft(player: Character, enemy: Enemy, deck: string[], die: CombatDieColor, seed = 7): CombatEncounterState {
    let state = initializeCombatEncounter(player, enemy, deck, seed);
    state = rollEncounterDice(state).state;
    state = setDice(state, [die, 'x']);
    state = draftStanceDie(state, state.dice[0].id).state;
    return state;
}

describe('projectRuptureBurst — per-card-accurate rupture preview (phase 28)', () => {
    const PLAIN = 'peroratio-interrupta'; // no bonusPct/fuelPerPip
    const BONUS = 'resonance-detonation'; // bonusPct 0.5, no fuelPerPip
    const PIP_FED = 'the-overtake';       // fuelPerPip 3.5, bonusPct 0.5

    it('matches projectRupture for a card with no card-specific rupture mechanic', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openAndDraft(makePlayer([PLAIN]), makeEnemy(300, 'mind', enemyEffects), [PLAIN], 'mind');
        const card = state.hand.find(h => h.cardId === PLAIN)!;
        expect(projectRuptureBurst(state, { uid: card.uid, id: PLAIN } as never)).toBe(projectRupture(state));
    });

    it('adds bonusPct for resonance-detonation (undershoots without it)', () => {
        mockSequentialRng(0.05);
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openAndDraft(makePlayer([BONUS]), makeEnemy(900, 'mind', enemyEffects), [BONUS], 'mind');
        const card = state.hand.find(h => h.cardId === BONUS)!;
        const flat = projectRupture(state);
        const perCard = projectRuptureBurst(state, { uid: card.uid, id: BONUS } as never);
        expect(perCard).toBeGreaterThan(flat);
        expect(perCard).toBe(Math.round(flat * 1.5));
    });

    it('incorporates fuelPerPip × banked reserve/floating pips for the-overtake', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([PIP_FED]), makeEnemy(900, 'mind', []), [PIP_FED], 'mind');
        const card = state.hand.find(h => h.cardId === PIP_FED)!;
        const noPips = projectRuptureBurst(state, { uid: card.uid, id: PIP_FED } as never);
        state = { ...state, reserve: [{ id: 'r0', color: 'mind', state: 'available', temporary: false, pips: 4 }] };
        const withPips = projectRuptureBurst(state, { uid: card.uid, id: PIP_FED } as never);
        expect(withPips).toBeGreaterThan(noPips);
    });
});

describe('Overtake 2-pip gate (phase 28)', () => {
    // the-overtake is philosophicalAspect 'body' — powering it requires a body die.
    const OVERTAKE = 'the-overtake';

    it('fizzles the rupture payoff below 2 spent pips (no HP loss from the mechanic)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer([OVERTAKE]), makeEnemy(900, 'mind', []), [OVERTAKE], 'body');
        const hpBefore = state.enemy.health;
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === OVERTAKE)!.uid }, true);
        const fizzle = res.events.find(e => e.kind === 'effect-fizzled') as { message: string } | undefined;
        const detonated = res.events.find(e => e.kind === 'rupture-detonated');
        expect(fizzle?.message).toBe('needs 2+ spent pips to detonate');
        expect(detonated).toBeUndefined();
        expect(res.state.enemy.health).toBe(hpBefore);
    });

    it('fires normally at 2+ spent pips', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([OVERTAKE]), makeEnemy(900, 'mind', []), [OVERTAKE], 'body');
        state = { ...state, reserve: [{ id: 'r0', color: 'body', state: 'available', temporary: false, pips: 2 }] };
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === OVERTAKE)!.uid }, true);
        const detonated = res.events.find(e => e.kind === 'rupture-detonated');
        expect(detonated).toBeDefined();
    });

    it('does not affect a plain rupture card (no fuelPerPip) below 2 pips', () => {
        mockSequentialRng(0.05);
        const RUP = 'peroratio-interrupta';
        const enemyEffects = [ae('debuff_poison', 2, 4)];
        const state = openAndDraft(makePlayer([RUP]), makeEnemy(300, 'mind', enemyEffects), [RUP], 'mind');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === RUP)!.uid }, true);
        expect(res.events.find(e => e.kind === 'rupture-detonated')).toBeDefined();
        expect(res.events.find(e => e.kind === 'effect-fizzled')).toBeUndefined();
    });
});

describe('getDisruptMeter.willDeny — STAGGER-rung denial (phase 28 fix)', () => {
    it('reports willDeny=true when accumulated STAGGER alone denies the turn (previously false)', () => {
        // GraveLarva is 'simple' difficulty -> THREAT_RUNGS (2), no boss growth.
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const state = { ...base, staggerRungs: 2 }; // rungsLost (2) >= rungsTotal (2)
        const meter = getDisruptMeter(state);
        expect(meter.pips).toBeLessThan(meter.threshold);   // no distinct-control deny
        expect(meter.rollPenalty).toBe(0);                  // no roll-penalty deny
        expect(meter.willDeny).toBe(true);
    });

    it('reports willDeny=false with no denial path active', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const meter = getDisruptMeter(base);
        expect(meter.willDeny).toBe(false);
    });
});

describe('REPRISE songbook choice (phase 28)', () => {
    const REPRISE_CARD = 'second-thoughts'; // count: 1, mind aspect

    it('returns the player-chosen discard card, not the argmax pick', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([REPRISE_CARD]), makeEnemy(300, 'mind', []), [REPRISE_CARD], 'mind');
        // A low-rank and a high-rank card in discard — argmax would pick the high-rank one.
        state = { ...state, discard: ['straw-mans-jab', 'the-overtake'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true, undefined, undefined, { reprisalCardId: 'straw-mans-jab' });
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['straw-mans-jab']);
    });

    it('falls back to the highest-rank auto-pick when no choice is given', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([REPRISE_CARD]), makeEnemy(300, 'mind', []), [REPRISE_CARD], 'mind');
        state = { ...state, discard: ['straw-mans-jab', 'the-overtake'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true);
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised).toBeDefined();
        expect(reprised!.returned).toEqual(['the-overtake']); // higher rank (5 vs 1)
    });

    it('falls back to auto-pick when the chosen id is not in the discard pile', () => {
        mockSequentialRng(0.05);
        let state = openAndDraft(makePlayer([REPRISE_CARD]), makeEnemy(300, 'mind', []), [REPRISE_CARD], 'mind');
        state = { ...state, discard: ['straw-mans-jab', 'the-overtake'] };
        const uid = state.hand.find(h => h.cardId === REPRISE_CARD)!.uid;
        const res = playCombatCard(state, { uid }, true, undefined, undefined, { reprisalCardId: 'not-in-discard' });
        const reprised = res.events.find(e => e.kind === 'reprised') as { returned: string[] } | undefined;
        expect(reprised!.returned).toEqual(['the-overtake']);
    });
});

describe('projectIncomingThreat — wall-math readout (phase 28)', () => {
    it('nets the projected hit against current guard/barrier', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const rawOnly = projectIncomingThreat(base);
        expect(rawOnly.willDeny).toBe(false);
        expect(rawOnly.netDamage).toBeLessThanOrEqual(rawOnly.projectedDamage);

        const guarded = { ...base, guard: 9999 };
        const withGuard = projectIncomingThreat(guarded);
        expect(withGuard.netDamage).toBe(0);
    });

    it('projects 0 net damage when the turn will be denied', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const denied = { ...base, staggerRungs: 2 }; // rung-denied (THREAT_RUNGS = 2)
        const projection = projectIncomingThreat(denied);
        expect(projection.willDeny).toBe(true);
        expect(projection.projectedDamage).toBe(0);
        expect(projection.netDamage).toBe(0);
    });

    it('projected damage drops once a live modifier (partial rung loss) is in play', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, 'mind', []), undefined, 7);
        const baseline = projectIncomingThreat(base);
        const partiallyStaggered = { ...base, staggerRungs: 1 }; // 1 of 2 rungs lost, not denied
        const projection = projectIncomingThreat(partiallyStaggered);
        expect(projection.willDeny).toBe(false);
        expect(projection.rawDamage).toBe(baseline.rawDamage); // the raw face value is unmodified…
        expect(projection.projectedDamage).toBeLessThan(baseline.projectedDamage); // …but the live projection isn't
    });
});

describe('tu-quoque color-match fix (phase 28)', () => {
    it('the die-bonus rider fires on a heart-color powering die (was body)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer(['tu-quoque']), makeEnemy(300, 'mind', []), ['tu-quoque'], 'heart');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === 'tu-quoque')!.uid }, true);
        expect(res.events.find(e => e.kind === 'die-bonus-fired')).toBeDefined();
    });

    it('does not fire on a body-color powering die (the old, dead color)', () => {
        mockSequentialRng(0.05);
        const state = openAndDraft(makePlayer(['tu-quoque']), makeEnemy(300, 'mind', []), ['tu-quoque'], 'body');
        const res = playCombatCard(state, { uid: state.hand.find(h => h.cardId === 'tu-quoque')!.uid }, true);
        expect(res.events.find(e => e.kind === 'die-bonus-fired')).toBeUndefined();
    });
});
