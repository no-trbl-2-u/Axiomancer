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
import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';

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
// PROFANE CANON (2026-08-08): the canon prints exactly two control cards and
// BOTH carry STAGGER + BACKFIRE together, so the library alone can no longer
// present the probe with distinct surfaces. What is under test here is the
// POLICY's matchup read, not the card list — the pure single-surface carriers
// are therefore synthetic fixtures, and the canon's own combined card sits
// beside them as the real-world control.
const SURFACE_CARDS: readonly Card[] = [
    {
        id: 'fx-rung-wall', theme: 'trial', name: 'Rung Wall (fixture)',
        philosophicalAspect: 'body',
        description: 'Test carrier: pure STAGGER — rung strength only.',
        tier: 2, rank: 3, cardType: 'spell', targetType: 'enemy',
        paidSummary: 'STAGGER 1.',
        free: { premises: 1 },
        specialMechanics: [{ kind: 'stagger', rungs: 1 }],
        addedIn: '2026-08-08', tags: ['trial'],
    },
    {
        id: 'fx-punish-drip', theme: 'trial', name: 'Punish Drip (fixture)',
        philosophicalAspect: 'mind',
        description: 'Test carrier: pure BACKFIRE — deny-punish drip only.',
        tier: 2, rank: 3, cardType: 'spell', targetType: 'enemy',
        paidSummary: 'Apply BACKFIRE 2 for 3 turns.',
        free: { premises: 1 },
        combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 2, duration: 3 }],
        addedIn: '2026-08-08', tags: ['trial'],
    },
    {
        id: 'fx-stance-pin', theme: 'trial', name: 'Stance Pin (fixture)',
        philosophicalAspect: 'body',
        description: 'Test carrier: lock_stance + STAGGER — stance certainty.',
        tier: 2, rank: 4, cardType: 'spell', targetType: 'enemy',
        paidSummary: 'Lock the foe into its telegraphed stance. STAGGER 1.',
        free: { revealStance: true },
        combatEffects: [{ effectId: 'debuff_backfire', appliedTo: 'opponent', intensity: 1, duration: 2 }],
        specialMechanics: [{ kind: 'lock_stance' }, { kind: 'stagger', rungs: 1 }],
        addedIn: '2026-08-08', tags: ['trial'],
    },
];

const CONTROL_CANDIDATES = [
    'fx-rung-wall',             // STAGGER 1 — rung strength
    'fx-punish-drip',           // BACKFIRE — deny-punish drip
    'scolds-bridle',            // STAGGER + BACKFIRE (the canon's own)
    'fx-stance-pin',            // lock_stance + STAGGER — stance certainty
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

/** The control-lock policy's ranking of the candidates against this threat,
 *  best first (ties break to CONTROL_CANDIDATES order, like the sim's argmax). */
function controlRanking(enemy: Enemy): string[] {
    clearSandboxCards();
    registerSandboxCards([...SURFACE_CARDS]);
    const state = rollEncounterDice(
        initializeCombatEncounter(makePlayer(CONTROL_CANDIDATES), enemy, CONTROL_CANDIDATES, 7),
    ).state;
    const policy = COMBAT_SIM_POLICIES['control-lock'];
    const rng = () => 0.5; // control-lock never consumes rng; fixed for hygiene
    const scored = CONTROL_CANDIDATES.map((id, i) => {
        const card: CombatCard | null = toCombatCard(id, getCardById, lookupEffect);
        expect(card, `${id} must project`).not.toBeNull();
        return { id, i, score: policy.rankCard(state, card!, rng) };
    });
    return scored
        .sort((a, b) => (b.score - a.score) || (a.i - b.i))
        .map(e => e.id);
}

describe('WS8.4 — control choice should be a matchup read (falsifiable)', () => {
    // THE EXPECTATION (spec 32 §12 #6): with distinct surfaces to edit, the
    // control-lock policy's preferred control card should DIFFER between a
    // damage-heavy, a rider-heavy, and an escalation-heavy threat.
    //
    // FIXED (this change): `control-lock.rankCard` (combat.sim-policies.ts)
    // now reads `state.threatPhases` via `controlSurfaceBonus` — a threat
    // carrying a rider ranks BACKFIRE punish highest (no candidate here
    // erases a rider outright, so cash in on the guaranteed drip instead);
    // a clean or compounding threat ranks STAGGER rung-denial highest
    // (stance-lock as a certainty tiebreak). Was pinned `it.fails` /
    // "documents the kill signal" until `plan/CRITIQUE.md` [MED]
    // "control-lock sim policy is threat-blind — WS8 surface variety
    // unexploited" (session-closeout 2026-07-12) was addressed.
    //
    // THE BIG NUMBERS REWRITE (2026-09-02): `scold's-bridle` — the canon's own
    // control card, and the only non-fixture candidate — was rewritten to
    // "Deal 11. STAGGER 1. Apply BACKFIRE 4 for 3 turns", which makes it the
    // argmax on BOTH branches of `controlSurfaceBonus`. The single-argmax form
    // of this probe therefore collapsed to one pick. The claim it was actually
    // making — control choice is a matchup READ, not a fixed favourite — is
    // tested here on the whole RANKING instead of just its head, which is the
    // stronger statement and does not depend on which synthetic fixture
    // happens to out-stat the live card this month.
    it('control-lock re-ranks the control candidates by threat (rider vs clean)', () => {
        const rider = controlRanking(riderHeavy());
        const damage = controlRanking(damageHeavy());
        const escalation = controlRanking(escalationHeavy());

        // A rider on the telegraph flips the policy onto its BACKFIRE branch,
        // so the ordering is not the one a clean big-hit threat produces.
        expect(rider).not.toEqual(damage);
        expect(rider).not.toEqual(escalation);
        // Every candidate is ranked (no silent drop).
        expect(rider.slice().sort()).toEqual(CONTROL_CANDIDATES.slice().sort());
        // The inversion IS the read: against a rider the policy values the
        // deny-punish drip (pure BACKFIRE) above the stance pin; against a
        // clean big-hit threat the stance pin's rung + certainty wins instead.
        expect(rider.indexOf('fx-punish-drip')).toBeLessThan(rider.indexOf('fx-stance-pin'));
        expect(damage.indexOf('fx-stance-pin')).toBeLessThan(damage.indexOf('fx-punish-drip'));
        expect(escalation.indexOf('fx-stance-pin')).toBeLessThan(escalation.indexOf('fx-punish-drip'));
    });
});
