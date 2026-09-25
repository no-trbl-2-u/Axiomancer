/**
 * Hermetic E2E — Phase 33a (plan/archive/2026-09-25-trim-t4/plan/phases/phase_33a_reactive_verb_core.md):
 * PLEA/Premise enemy counterplay hooks.
 *
 * `CombatThreatEffect.swayCleanse` / `.premiseShed` let an authored threat
 * phase shed the player's live PLEA (charm/grace RELENT track) or
 * spendable Premise tally (peroration/oratory CONDEMN track) — the two
 * hooks Phase 33b's CAUTERIZE/Premise-shed/PLEA-cleanse enemy archetypes
 * need and didn't have (CAUTERIZE already works via the existing
 * `enemyCleanse` hook, shipped under WS9).
 *
 * Both hooks mirror `enemyCleanse`'s shape and site (same per-effect loop
 * in `resolveThreatPhase`, same `!doubtId` rider guard, same "fires only as
 * often as the authored phase recurs" implicit cooldown) but a simpler
 * guardrail, since `sway`/`premises` are scalars racing a fixed threshold,
 * not a list: flat amount, floored at 0, never touching the one-way
 * milestone flags (PLEA) or the lifetime counter (Premise).
 *
 * Fixture/RNG conventions follow `turnabout-ledger.engine.test.ts`'s direct
 * `resolveThreatPhase` harness — a single custom `CombatThreatPhase` on a
 * hand-built state, no bestiary authoring (that's Phase 33b's job).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { deepClone } from '../../Utils';
import { initializeCombatEncounter, rollEncounterDice, resolveThreatPhase } from '../combat.engine';
import { THREAT_RUNGS } from '../effects';
import { deriveIntentType } from '../combat.threat';
import type { CombatEncounterState, CombatEvent, CombatThreatPhase } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function makePlayer(): Character {
    const p = deepClone(Player);
    p.knownCards = [];
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

/** A non-boss enemy well above any test's sway/premise values, so
 *  `capitulateThreshold` (0.35×maxHealth, floored at 10) never trips
 *  RELENT mid-test. */
function makeEnemy(hp = 300): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-reactive-hooks-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: 2, body: 2, mind: 6 };
    return e;
}

function customPhase(effects: CombatThreatPhase['threatAction']['effects']): CombatThreatPhase[] {
    return [{
        index: 1, enemyStance: 'mind', isFinalPhase: true,
        threatAction: { description: 'counterplay probe', effects },
    }];
}

/** A state ready for a direct `resolveThreatPhase` call: one custom threat
 *  phase, starting `sway`/`premises`, and `staggerRungs` to drive denial
 *  (0 = the phase fires normally; `THREAT_RUNGS` = fully denied). */
function phaseState(
    effects: CombatThreatPhase['threatAction']['effects'],
    opts: { sway?: number; premises?: number; staggerRungs?: number } = {},
): CombatEncounterState {
    const s = initializeCombatEncounter(makePlayer(), makeEnemy(), undefined, 7);
    const opened = rollEncounterDice(s).state;
    return {
        ...opened,
        threatPhases: customPhase(effects),
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        staggerRungs: opts.staggerRungs ?? 0,
        sway: opts.sway ?? 0,
        premises: opts.premises ?? 0,
    };
}

describe('Phase 33a — swayCleanse', () => {
    it('reduces live sway by the authored amount, floored above 0', () => {
        // 10 - 3 (swayCleanse) = 7, then the turn-boundary SWAY_DECAY_PER_TURN
        // (unconditional, unrelated to this hook — see combat.engine.ts) takes
        // one more: 6.
        const res = resolveThreatPhase(phaseState([{ swayCleanse: 3 }], { sway: 10 }));
        expect(res.state.sway).toBe(6);
    });

    it('floors at exactly 0 when the authored amount exceeds current sway', () => {
        const res = resolveThreatPhase(phaseState([{ swayCleanse: 5 }], { sway: 2 }));
        expect(res.state.sway).toBe(0);
    });

    it('never resets the PLEA milestone-fired flags — only the raw counter moves', () => {
        const s = phaseState([{ swayCleanse: 3 }], { sway: 10 });
        const withMilestones: CombatEncounterState = {
            ...s, swayMilestoneWaveringFired: true, swayMilestoneFalteringFired: true,
        };
        const res = resolveThreatPhase(withMilestones);
        expect(res.state.sway).toBe(6); // 10 - 3 (swayCleanse) - 1 (turn-boundary decay)
        expect(res.state.swayMilestoneWaveringFired).toBe(true);
        expect(res.state.swayMilestoneFalteringFired).toBe(true);
    });

    it('emits threat-sway-cleansed with the actual amount removed', () => {
        const res = resolveThreatPhase(phaseState([{ swayCleanse: 5 }], { sway: 2 }));
        const fired = findEvents(res.state.log, 'threat-sway-cleansed');
        expect(fired).toHaveLength(1);
        expect(fired[0].amount).toBe(2); // floored at 0 — only 2 of the authored 5 actually left
    });

    it('does not fire the hook when the phase is fully denied (only the unrelated turn-boundary decay moves sway)', () => {
        const res = resolveThreatPhase(phaseState([{ swayCleanse: 5 }], { sway: 10, staggerRungs: THREAT_RUNGS }));
        expect(res.state.sway).toBe(9); // untouched by swayCleanse; -1 is SWAY_DECAY_PER_TURN
        expect(findEvents(res.state.log, 'threat-sway-cleansed')).toHaveLength(0);
    });

    it('is a no-op (no event) when starting sway is already 0', () => {
        const res = resolveThreatPhase(phaseState([{ swayCleanse: 5 }], { sway: 0 }));
        expect(res.state.sway).toBe(0);
        expect(findEvents(res.state.log, 'threat-sway-cleansed')).toHaveLength(0);
    });
});

describe('Phase 33a — premiseShed', () => {
    it('reduces the live spendable premises tally by the authored amount', () => {
        const res = resolveThreatPhase(phaseState([{ premiseShed: 2 }], { premises: 5 }));
        expect(res.state.premises).toBe(3);
    });

    it('floors at exactly 0 when the authored amount exceeds current premises', () => {
        const res = resolveThreatPhase(phaseState([{ premiseShed: 4 }], { premises: 1 }));
        expect(res.state.premises).toBe(0);
    });

    it('never touches premiseMilestoneTotal (the lifetime milestone-drip counter)', () => {
        const s = phaseState([{ premiseShed: 4 }], { premises: 5 });
        const withLifetime: CombatEncounterState = { ...s, premiseMilestoneTotal: 12 };
        const res = resolveThreatPhase(withLifetime);
        expect(res.state.premises).toBe(1);
        expect(res.state.premiseMilestoneTotal).toBe(12);
    });

    it('emits threat-premise-shed with the actual amount removed', () => {
        const res = resolveThreatPhase(phaseState([{ premiseShed: 4 }], { premises: 1 }));
        const fired = findEvents(res.state.log, 'threat-premise-shed');
        expect(fired).toHaveLength(1);
        expect(fired[0].amount).toBe(1);
    });

    it('does not fire when the phase is fully denied', () => {
        const res = resolveThreatPhase(phaseState([{ premiseShed: 4 }], { premises: 5, staggerRungs: THREAT_RUNGS }));
        expect(res.state.premises).toBe(5);
        expect(findEvents(res.state.log, 'threat-premise-shed')).toHaveLength(0);
    });
});

describe('Phase 33a — deriveIntentType classifies counterplay as debuff, not buff/pass', () => {
    it('swayCleanse alone -> debuff', () => {
        expect(deriveIntentType([{ swayCleanse: 3 }])).toBe('debuff');
    });

    it('premiseShed alone -> debuff', () => {
        expect(deriveIntentType([{ premiseShed: 2 }])).toBe('debuff');
    });

    it('regression: enemyCleanse alone now also reads as debuff (was buff pre-Phase-33a)', () => {
        expect(deriveIntentType([{ enemyCleanse: 1 }])).toBe('debuff');
    });

    it('a bare self-heal still reads as buff — unaffected by this phase', () => {
        expect(deriveIntentType([{ enemyHeal: 5 }])).toBe('buff');
    });

    it('damage + swayCleanse -> combo', () => {
        expect(deriveIntentType([{ damage: 4, swayCleanse: 3 }])).toBe('combo');
    });
});
