/**
 * WS8 — control statuses edit DISTINCT threat surfaces (spec 32 §12,
 * ratified 2026-07-11 #6).
 *
 * Two halves:
 *
 *  1. Engine coverage for the WS8.2 re-payloads, each on its own surface:
 *       EXHAUSTION → telegraph damage (`outgoingThreatDamageMulPct`)
 *       BLIND      → rider suppression (`suppressesThreatRiders`)
 *       ROOT       → stance LOCK (`lockedStance`, the `lock_stance` twin)
 *       CONFUSION  → stance BLUR (`blursStanceHints`, player-borne fog)
 *
 *  2. The WS8.4 FALSIFIABLE probe: three authored fixture threats
 *     (damage-heavy / rider-heavy / escalation-heavy); run the control-lock
 *     policy's card ranking against each and ask whether its preferred
 *     control card DIFFERS by threat. The doctrine says control play should
 *     be a matchup read, not a fixed rotation.
 *
 *     KILL SIGNAL (documented below, not rigged around): if the policy picks
 *     the same card — historically "the biggest Roll penalty" — against
 *     every threat, the surface variety exists in the DATA but not in the
 *     DECISION. That is the honest current state: `control-lock.rankCard`
 *     never reads the threat phases, so its pick is threat-blind.
 */

import { describe, it, expect, afterEach, afterAll, beforeAll, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import type { Enemy } from '../../Enemy/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { effectsLibrary } from '../../Effects/effects.library';
import type { ActiveEffect, Effect } from '../../Effects/types';
import {
    initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
    isPhaseStanceRevealed, revealedCurrentStance, isStanceReadoutBlurred,
} from '../combat.engine';
import { toCombatCard } from '../combat.cards';
import { getOutgoingThreatDamageMult } from '../effects';
import { COMBAT_SIM_POLICIES } from '../combat.sim-policies';
import type {
    CombatEncounterState, CombatThreatPhase, CombatCard,
} from '../combat.encounter.types';

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

// ─── WS8.4 — the falsifiable probe: does control CHOICE track the threat? ────

// The library's control-class candidates (control theme, spec 32 v3):
// STAGGER walls, BACKFIRE punishes, and the lock_stance pin — after WS8.2
// these genuinely edit different surfaces (rung strength / engine drip /
// stance certainty).
const CONTROL_CANDIDATES = [
    'zenos-half-step',          // STAGGER 1 — rung strength
    'red-herring',              // BACKFIRE — deny-punish drip
    'undistributed-middle',     // STAGGER + BACKFIRE
    'arrow-paradox',            // lock_stance + STAGGER — stance certainty
    'paralysis-of-analysis',    // STAGGER 2 + acute BACKFIRE — the payoff wall
];

/** Damage-heavy: big clean hits, no riders — deny/soften is worth the most. */
const damageHeavy = () => makeEnemy(300, [
    phase(1, 'body', [{ damage: 18 }]),
    phase(2, 'body', [{ damage: 24 }], true),
]);

/** Rider-heavy: chip damage, the STATUS is the threat — rider erasure rules. */
const riderHeavy = () => makeEnemy(300, [
    phase(1, 'mind', [{ damage: 3 }, { effectId: 'debuff_poison', intensity: 3 }]),
    phase(2, 'mind', [{ damage: 3 }, { effectId: 'debuff_curse', intensity: 2 }], true),
]);

/** Escalation-heavy: starts soft, compounds — early denial buys the most time. */
const escalationHeavy = () => makeEnemy(300, [
    phase(1, 'heart', [{ damage: 4 }]),
    phase(2, 'heart', [{ damage: 10, enemyHeal: 6 }]),
    phase(3, 'heart', [{ damage: 22, enemyHeal: 10 }], true),
]);

/** The control-lock policy's preferred candidate against this threat. */
function preferredControlCard(enemy: Enemy): string {
    const state = rollEncounterDice(
        initializeCombatEncounter(makePlayer(CONTROL_CANDIDATES), enemy, CONTROL_CANDIDATES, 7),
    ).state;
    const policy = COMBAT_SIM_POLICIES['control-lock'];
    const rng = () => 0.5; // control-lock never consumes rng; fixed for hygiene
    let best: CombatCard | null = null;
    let bestScore = -Infinity;
    for (const id of CONTROL_CANDIDATES) {
        const card = toCombatCard(id, getCardById, lookupEffect);
        expect(card, `${id} must project`).not.toBeNull();
        const score = policy.rankCard(state, card!, rng);
        if (score > bestScore) { bestScore = score; best = card; }
    }
    return best!.id;
}

describe('WS8.4 — control choice should be a matchup read (falsifiable)', () => {
    // THE EXPECTATION (spec 32 §12 #6): with distinct surfaces to edit, the
    // control-lock policy's preferred control card should DIFFER between a
    // damage-heavy, a rider-heavy, and an escalation-heavy threat.
    //
    // KILL SIGNAL — CONFIRMED as of 2026-07-11 and documented via `it.fails`:
    // `control-lock.rankCard` (combat.sim-policies.ts) scores candidates by
    // control-class membership + new-status + DoT preview and NEVER reads
    // `state.threatPhases`, so it prefers the same card against all three
    // fixtures (the modern analogue of "the biggest Roll penalty is always
    // picked"). The data now carries surface variety; the decision layer does
    // not exploit it. When a threat-aware ranking ships, this `it.fails`
    // will start FAILING (because the body passes) — promote it to a plain
    // `it` in that change.
    it.fails('preferred control card differs by threat (damage / rider / escalation)', () => {
        const picks = new Set([
            preferredControlCard(damageHeavy()),
            preferredControlCard(riderHeavy()),
            preferredControlCard(escalationHeavy()),
        ]);
        expect(picks.size).toBeGreaterThan(1);
    });

    it('documents the kill signal: today the pick is threat-blind (same card, all threats)', () => {
        const picks = [
            preferredControlCard(damageHeavy()),
            preferredControlCard(riderHeavy()),
            preferredControlCard(escalationHeavy()),
        ];
        // Pinned so the moment the policy becomes threat-aware, this fails
        // loudly alongside the it.fails flip above — both must move together.
        expect(new Set(picks).size).toBe(1);
    });
});
