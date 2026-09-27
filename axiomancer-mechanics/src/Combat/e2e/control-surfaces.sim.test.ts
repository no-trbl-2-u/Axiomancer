/**
 * WS8 — control statuses edit DISTINCT threat surfaces (spec 32 §12,
 * ratified 2026-07-11 #6).
 *
 * Engine coverage for the WS8.2 re-payloads, each on its own surface:
 *       EXHAUSTION → telegraph damage (`outgoingThreatDamageMulPct`)
 *       BLIND      → rider suppression (`suppressesThreatRiders`)
 *       ROOT       → stance LOCK (`lockedStance`, the `lock_stance` twin)
 *       CONFUSION  → stance BLUR (`blursStanceHints`, player-borne fog)
 *
 * The WS8.4 probe (control-lock's matchup read of STAGGER / BACKFIRE /
 * lock_stance cards) was deleted with the card purge (P1, 2026-09-27): no
 * surviving card prints those verbs.
 */

import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { effectsLibrary } from '../../Effects/effects.library';
import type { ActiveEffect, Effect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
    isPhaseStanceRevealed, revealedCurrentStance, isStanceReadoutBlurred,
} from '../combat.engine';
import { getOutgoingThreatDamageMult } from '../effects';
import type { CombatEncounterState, CombatThreatPhase } from '../combat.encounter.types';

afterEach(() => { vi.restoreAllMocks(); });

// Post-Phase-30 merge 2026-07-12: the zero-producer sweep deleted the WS8.2
// re-payloaded control vocabulary (exhaustion/blind/root/confusion) — the
// surface shapes live on as test-only fixtures registered into the shared
// registry (the same lookup the threat engine reads).
const SURFACE_FIXTURES: Effect[] = [
    { id: 'test_exhaustion', name: 'test exhaustion', description: 'threat-damage -25%/stack', type: 'debuff', category: 'stat', duration: 3, stacking: 'intensity', tier: 2, payload: { outgoingThreatDamageMulPct: -25 } },
    { id: 'test_blind', name: 'test blind', description: 'rider suppress', type: 'debuff', category: 'control', duration: 2, stacking: 'none', tier: 2, payload: { suppressesThreatRiders: true } },
    { id: 'test_root', name: 'test root', description: 'stance lock', type: 'debuff', category: 'control', duration: 2, stacking: 'none', tier: 2, payload: { defenseModifier: -2, lockedStance: true } },
    { id: 'test_confusion_blur', name: 'test stance blur', description: 'blursStanceHints', type: 'debuff', category: 'control', duration: 3, stacking: 'none', tier: 2, payload: { blursStanceHints: true, advantageModifier: { grantDisadvantage: ['body', 'mind', 'heart'] } } },
];
beforeAll(() => { for (const e of SURFACE_FIXTURES) effectsLibrary.registry.set(e.id, e); });
afterAll(() => { for (const e of SURFACE_FIXTURES) effectsLibrary.registry.delete(e.id); });

const ae = (effectId: string, intensity = 1, remainingDuration = 4, tier: 1 | 2 | 3 = 2): ActiveEffect =>
    ({ effectId, intensity, remainingDuration, appliedAt: 1, tier });

function makePlayer(cards: string[], effects: ActiveEffect[] = []): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = effects;
    return p;
}

function makeEnemy(
    hp: number,
    threatSequence?: CombatThreatPhase[],
    effects: ActiveEffect[] = [],
): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-surface-fixture';
    e.health = hp; e.maxHealth = hp; e.effects = effects;
    if (threatSequence) {
        (e as Enemy & { threatSequence?: CombatThreatPhase[] }).threatSequence = threatSequence;
    }
    return e;
}

/** Authored fixture phase (explicit `threatSequence` path — no budget scaling). */
function phase(
    index: number,
    enemyStance: 'heart' | 'body' | 'mind',
    effects: Array<{ damage?: number; effectId?: string; intensity?: number; enemyHeal?: number }>,
    isFinalPhase = false,
): CombatThreatPhase {
    return {
        index, enemyStance, isFinalPhase,
        threatAction: { description: `fixture phase ${index}`, effects },
        stanceHint: 'a fixture tell',
    };
}

// ─── WS8.2 — each re-payloaded control edits its OWN surface ─────────────────

describe('WS8.2 — EXHAUSTION owns the telegraph-DAMAGE surface', () => {
    it('getOutgoingThreatDamageMult reads -25%/stack, clamped, exactly 1 unmarked', () => {
        const bearer = (fx: ActiveEffect[]) => ({ ...deepClone(GraveLarva), effects: fx });
        expect(getOutgoingThreatDamageMult(bearer([]))).toBe(1);
        expect(getOutgoingThreatDamageMult(bearer([ae('test_exhaustion', 1)]))).toBe(0.75);
        expect(getOutgoingThreatDamageMult(bearer([ae('test_exhaustion', 2)]))).toBe(0.5);
        // clamp floor 0.1 — even absurd stacks never fully zero the telegraph.
        expect(getOutgoingThreatDamageMult(bearer([ae('test_exhaustion', 8)]))).toBe(0.1);
    });

    it('softens the landed telegraph hit without denying the turn', () => {
        mockSequentialRng(0.05);
        const seq = [phase(1, 'mind', [{ damage: 10 }], true)];
        const hpLoss = (fx: ActiveEffect[]): { loss: number; fired: boolean } => {
            const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, seq, fx), undefined, 7);
            const state = rollEncounterDice(base).state;
            const res = resolveThreatPhase(state);
            return {
                loss: state.player.health - res.state.player.health,
                fired: res.events.some(e => e.kind === 'threat-fired'),
            };
        };
        const clean = hpLoss([]);
        const softened = hpLoss([ae('test_exhaustion', 1)]);
        expect(clean.fired).toBe(true);
        expect(softened.fired).toBe(true);       // softer, never a deny by itself
        expect(softened.loss).toBeGreaterThan(0);
        expect(softened.loss).toBeLessThan(clean.loss);
    });
});

describe('WS8.2 — BLIND owns the RIDER surface (the phase rider cannot land)', () => {
    const seq = [phase(1, 'mind', [{ damage: 10 }, { effectId: 'debuff_poison', intensity: 2 }], true)];

    it('suppresses the telegraphed threatEffectId while active; damage still lands', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(
            makePlayer([]), makeEnemy(300, seq, [ae('test_blind', 1, 2)]), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'threat-fired')).toBe(true);
        expect(res.state.player.health).toBeLessThan(200);            // the hit landed
        expect(res.state.player.effects.some(e => e.effectId === 'debuff_poison')).toBe(false);
        const fizzled = res.events.find(e => e.kind === 'effect-fizzled') as
            { cardId: string; effectId: string } | undefined;
        expect(fizzled).toBeDefined();                                // honestly logged
        expect(fizzled!.cardId).toBe('test_blind');
        expect(fizzled!.effectId).toBe('debuff_poison');
    });

    it('without BLIND the same rider lands (isolation control)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, seq), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        expect(res.state.player.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });
});

describe('WS8.2 — ROOT owns the STANCE surface (LOCK: the next phase keeps this stance)', () => {
    const seq = [
        phase(1, 'body', [{ damage: 6 }]),
        phase(2, 'mind', [{ damage: 8 }], true),
    ];

    it('locks the phase advance to the current stance and reveals it', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(
            makePlayer([]), makeEnemy(300, seq, [ae('test_root', 1, 2)]), undefined, 7);
        const state = rollEncounterDice(base).state;
        const res = resolveThreatPhase(state);
        expect(res.events.some(e => e.kind === 'stance-locked')).toBe(true);
        expect(res.state.threatPhases[1].enemyStance).toBe('body');   // held, not 'mind'
        expect(res.state.revealedStances).toContain(1);               // certainty granted
    });

    it('without ROOT the authored swap happens (isolation control)', () => {
        mockSequentialRng(0.05);
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300, seq), undefined, 7);
        const res = resolveThreatPhase(rollEncounterDice(base).state);
        expect(res.events.some(e => e.kind === 'stance-locked')).toBe(false);
        expect(res.state.threatPhases[1].enemyStance).toBe('mind');
    });
});

describe('WS8.2 — CONFUSION owns the STANCE surface (BLUR: player-borne fog)', () => {
    it('fogs every revealed stance while the player carries it; knowledge returns after', () => {
        const base = initializeCombatEncounter(makePlayer([]), makeEnemy(300), undefined, 7);
        const state = rollEncounterDice(base).state;
        const idx = Math.min(state.currentPhaseIndex, state.threatPhases.length - 1);
        const revealed: CombatEncounterState = { ...state, revealedStances: [idx] };
        expect(isPhaseStanceRevealed(revealed, idx)).toBe(true);
        expect(isStanceReadoutBlurred(revealed)).toBe(false);

        const blurred: CombatEncounterState = {
            ...revealed,
            player: { ...revealed.player, effects: [ae('test_confusion_blur', 1, 3)] },
        };
        expect(isStanceReadoutBlurred(blurred)).toBe(true);           // mobile readout flag
        expect(isPhaseStanceRevealed(blurred, idx)).toBe(false);      // the fog wins…
        expect(revealedCurrentStance(blurred)).toBeNull();
        // …but the underlying knowledge survives the blur's expiry.
        expect(isPhaseStanceRevealed(revealed, idx)).toBe(true);
    });
});
