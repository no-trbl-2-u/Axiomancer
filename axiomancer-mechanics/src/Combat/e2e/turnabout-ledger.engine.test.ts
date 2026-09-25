/**
 * Hermetic E2E — Phase 32 part 4a (Control — TURNABOUT,
 * plan/archive/2026-09-25-trim-t4/plan/phases/phase_32_theme_deep_work.md §Part 4a).
 *
 * Scope (see brief's Decisions): `rungsDeniedTotal` accrues in
 * `resolveThreatPhase`, at the EXACT same expression BACKFIRE's per-phase
 * drip already reads (`rungsForBackfire = hindered ? rungsTotal : rungsLost`)
 * — a phase where nothing was denied contributes 0, so plain accumulation
 * needs no extra gating. The `turnabout` card mechanic CONSUMES the whole
 * ledger for a `burstPerRung`-per-rung burst, then zeroes it in the SAME
 * call (unlike Souls/`akrasiaDebt`, which only ever grow).
 *
 * Covers:
 *   1. A fully denied threat phase accrues `rungsTotal` (THREAT_RUNGS) rungs.
 *   2. A non-denied phase (0 STAGGER rungs) accrues 0 — the ledger stays flat.
 *   3. A partial rung loss (weakened, not denied) accrues only the rungs
 *      actually lost.
 *   4. Accrual is additive — a prior bank carries forward across phases.
 *   5. The `turnabout` card (`turnabout`) banks the full ledger as burst,
 *      then resets it to 0 in the same play.
 *   6. A second `turnabout` play after the reset is a legal no-op (banks 0,
 *      does not fizzle) — mirrors `reap_all`'s "always fires" precedent.
 *   7. Per-combat scope: starts at 0 for a fresh combat.
 *   8. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the late campaign
 *      snapshot (plus the TURNABOUT fixture) runs without crashing.
 *
 * Fixture/RNG conventions follow `akrasia-debt-ledger.engine.test.ts` /
 * `reap-max-hp-erosion.engine.test.ts` (shared builder in
 * `src/test-utils/card-fixture.ts`, `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach). The direct `resolveThreatPhase`
 * harness (cases 1-4) follows `themed-decks.engine.test.ts`'s
 * "partial rung loss" pattern (a single custom threat phase, `staggerRungs`
 * set directly on state).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import {
    playCombatCard, initializeCombatEncounter, rollEncounterDice, resolveThreatPhase,
} from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import { THREAT_RUNGS } from '../effects';
import type { CombatEncounterState, CombatEvent, CombatThreatPhase } from '../combat.encounter.types';
import { registerSandboxCards, clearSandboxCards } from '../../Cards/cards.sandbox';
import type { Card } from '../../Cards/types';

afterEach(() => { vi.restoreAllMocks(); clearSandboxCards(); });

/**
 * TURNABOUT fixture. The verb survived the Profane-Canon rework as an ENGINE
 * mechanic but lost its library carrier (`turnabout`, the control capstone)
 * with the spec-32 library; the ledger and its cash-out are still live and
 * still under test, so the carrier moved into the fixture.
 * Provenance: cards.library.ts @ a69eab56.
 */
const FIXTURE_TURNABOUT: Card = {
    id: 'turnabout',
    theme: 'vigil',
    name: 'Turnabout (fixture)',
    philosophicalAspect: 'mind',
    description: 'Test carrier for TURNABOUT — cash the whole denial ledger.',
    tier: 3, rank: 6, cardType: 'spell',
    targetType: 'enemy',
    paidSummary: 'BACKFIRE ALL — 1.5 damage per rung this fight has denied.',
    free: { revealStance: true },
    specialMechanics: [{ kind: 'turnabout', burstPerRung: 1.5 }],
    addedIn: '2026-08-08',
    tags: ['vigil', 'payoff'],
};

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function makePlayer(cards: string[]): Character {
    const p = deepClone(Player);
    p.knownCards = cards.slice();
    p.baseStats = { heart: 8, body: 8, mind: 8 };
    p.health = 200; p.maxHealth = 200; p.effects = [];
    return p;
}

/** A non-boss enemy — `computeRungDenial`'s `naturalRungsTotal` is the plain
 *  `THREAT_RUNGS`, not `THREAT_RUNGS_BOSS`. */
function makeEnemy(hp: number): Enemy {
    const e = deepClone(GraveLarva);
    e.id = 'enemy-turnabout-dummy';
    e.health = hp; e.maxHealth = hp; e.effects = [];
    e.baseStats = { heart: 2, body: 2, mind: 6 };
    return e;
}

function customPhases(count: number, damage = 6): CombatThreatPhase[] {
    return Array.from({ length: count }, (_, i) => ({
        index: i + 1, enemyStance: 'mind' as const, isFinalPhase: i === count - 1,
        threatAction: { description: 'turnabout probe', effects: [{ damage }] },
    }));
}

/** A state ready for a direct `resolveThreatPhase` call: a single custom
 *  threat phase, `staggerRungs` set to drive denial (full == THREAT_RUNGS,
 *  partial == 1, none == 0), and an optional pre-existing ledger bank. */
function phaseState(staggerRungs: number, rungsDeniedTotal = 0): CombatEncounterState {
    const s = initializeCombatEncounter(makePlayer([]), makeEnemy(300), undefined, 7);
    const opened = rollEncounterDice(s).state;
    return {
        ...opened,
        threatPhases: customPhases(1),
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
        staggerRungs,
        rungsDeniedTotal,
    };
}

describe('Phase 32 part 4a — TURNABOUT ledger accrual (resolveThreatPhase)', () => {
    it('a fully denied phase accrues rungsTotal (THREAT_RUNGS) rungs', () => {
        const res = resolveThreatPhase(phaseState(THREAT_RUNGS));
        expect(res.state.rungsDeniedTotal).toBe(THREAT_RUNGS);
    });

    it('a non-denied phase (0 STAGGER rungs) accrues 0 — the ledger stays flat', () => {
        const res = resolveThreatPhase(phaseState(0));
        expect(res.state.rungsDeniedTotal).toBe(0);
    });

    it('a partial rung loss (weakened, not denied) accrues only the rungs actually lost', () => {
        const res = resolveThreatPhase(phaseState(1)); // 1 of THREAT_RUNGS(2) lost
        expect(res.state.rungsDeniedTotal).toBe(1);
    });

    it('accrual is additive across phases — a prior bank carries forward', () => {
        const res = resolveThreatPhase(phaseState(THREAT_RUNGS, 5));
        expect(res.state.rungsDeniedTotal).toBe(5 + THREAT_RUNGS);
    });
});

/** CLEAN fixture (no pre-applied enemy effects) with `rungsDeniedTotal`
 *  pinned and the card under test staged in hand. */
function stateFor(cardId: string, rungsDeniedTotal: number): CombatEncounterState {
    registerSandboxCards([FIXTURE_TURNABOUT]);
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        rungsDeniedTotal,
        hand: [{ uid: 'under-test', cardId }],
        // The fixture owns the library; the sandbox carrier needs adding.
        player: { ...s.player, knownCards: [...s.player.knownCards, cardId] },
        enemy: { ...s.enemy, effects: [] },
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    // Spec 33: a PAID play must name its powering die — the fixture's wild die.
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
    return { events, after };
}

describe("TURNABOUT card ('turnabout') cashes the ledger", () => {
    it('banks the full ledger as burst, then resets it to 0 in the same play', () => {
        const before = stateFor('turnabout', 20);
        const { events, after } = playPaid(before);

        const fizzle = events.find(e => e.kind === 'effect-fizzled');
        expect(fizzle, 'unexpected fizzle').toBeUndefined();

        const [fired] = findEvents(events, 'turnabout-fired');
        expect(fired).toBeDefined();
        expect(fired!.rungsSpent).toBe(20);
        // The exact multiplier depends on the read/vuln state (not asserted
        // here — that's `cards.pricing.ts`'s / the engine's own arithmetic);
        // what this test pins is the LEDGER behavior: a real, positive burst
        // computed from the banked rungs, applied 1:1 as direct enemy-HP loss.
        expect(fired!.amount).toBeGreaterThan(0);

        expect(after.rungsDeniedTotal).toBe(0);
        expect(before.enemy.health - after.enemy.health).toBe(fired!.amount);
    });

    it('a second TURNABOUT play after the ledger resets is a legal no-op — banks 0, never fizzles', () => {
        const before = stateFor('turnabout', 0);
        const { events, after } = playPaid(before);

        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        const [fired] = findEvents(events, 'turnabout-fired');
        expect(fired).toBeDefined();
        expect(fired!.rungsSpent).toBe(0);
        expect(fired!.amount).toBe(0);
        expect(after.enemy.health).toBe(before.enemy.health);
        expect(after.rungsDeniedTotal).toBe(0);
    });
});

describe('rungsDeniedTotal ledger — per-combat scope', () => {
    it('starts at 0 for a fresh combat (initializeCombatEncounter)', () => {
        const s = buildFixtureState({ clean: true });
        expect(s.rungsDeniedTotal).toBe(0);
    });

    it('sim policies never crash across every policy and seed with the ledger live (the vigil wall + TURNABOUT)', () => {
        registerSandboxCards([FIXTURE_TURNABOUT]);
        // PROFANE CANON (2026-08-08): no preset seats a TURNABOUT carrier —
        // the late campaign snapshot (the canon's STAGGER/denial deck) drives
        // the sweep with the fixture capstone added on top.
        const standstillDeck = [...buildPresetDeck('apostate'), 'turnabout'];
        expect(standstillDeck.length).toBeGreaterThan(0);
        expect(standstillDeck).toContain('turnabout');

        function makeSimPlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = standstillDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makeSimPlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: standstillDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
