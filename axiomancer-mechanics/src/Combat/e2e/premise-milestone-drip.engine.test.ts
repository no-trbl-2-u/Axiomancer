/**
 * Hermetic E2E — Phase 32 part 4b (Oratory — milestone drip,
 * plan/phases/phase_32_theme_deep_work.md §Part 4b).
 *
 * Scope (see brief's Decisions): every {@link PREMISE_MILESTONE_EVERY}rd
 * Premise the player has EVER gained THIS COMBAT — tracked by a new lifetime
 * counter, `CombatEncounterState.premiseMilestoneTotal` — pays
 * {@link PREMISE_MILESTONE_RUNGS} STAGGER rungs per milestone crossed. The
 * lifetime counter rides EVERY `gainPremises` call (own-card FREE/PAID lines,
 * borrowed FREE riders alike) and, unlike the spendable `premises` tally it
 * accrues alongside, does NOT reset when a Peroration pays off or CONCEDE
 * fires — a milestone already paid stays paid.
 *
 * Covers:
 *   1. Pure tier-crossing arithmetic (`premiseMilestonesCrossed`).
 *   2. A single Premise grant below the first tier accrues the lifetime
 *      counter but pays no dividend.
 *   3. Crossing the first tier (FREE-line `exordium`) grants the printed
 *      STAGGER rungs and fires `premise-milestone` alongside `premise-gained`.
 *   4. The SAME accrual fires on the PAID-line `premise` specialMechanics
 *      path (`exordium` played PAID).
 *   5. The lifetime counter does NOT reset when a Peroration payoff zeroes
 *      the spendable `premises` tally — a milestone banked before the payoff
 *      stays banked, and further grants keep crossing new tiers from where
 *      the lifetime counter left off.
 *   6. Per-combat scope: starts at 0 for a fresh combat.
 *   7. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the Oratory preset
 *      deck runs without crashing (mirrors the TURNABOUT-ledger test's
 *      cross-policy pattern from Part 4a).
 *
 * Fixture/RNG conventions follow `akrasia-debt-ledger.engine.test.ts` /
 * `turnabout-ledger.engine.test.ts` (shared builder in
 * `src/test-utils/card-fixture.ts`, `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import { PREMISE_MILESTONE_EVERY, PREMISE_MILESTONE_RUNGS, premiseMilestonesCrossed } from '../effects';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture (no pre-applied enemy effects) with `premiseMilestoneTotal`
 *  (and, optionally, the spendable `premises` tally / a live Peroration)
 *  pinned, and the card under test staged in hand. */
function stateFor(
    cardId: string,
    premiseMilestoneTotal: number,
    extra: Partial<CombatEncounterState> = {},
): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        premiseMilestoneTotal,
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, effects: [] },
        ...extra,
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true);
    return { events, after };
}

function playFree(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5);
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, false);
    return { events, after };
}

describe('Phase 32 part 4b — pure tier-crossing arithmetic', () => {
    it('PREMISE_MILESTONE_EVERY is a small, documented tier size', () => {
        expect(PREMISE_MILESTONE_EVERY).toBeGreaterThan(0);
    });

    it('no crossing within the same tier', () => {
        expect(premiseMilestonesCrossed(0, PREMISE_MILESTONE_EVERY - 1)).toBe(0);
    });

    it('crossing exactly one tier boundary', () => {
        expect(premiseMilestonesCrossed(PREMISE_MILESTONE_EVERY - 1, PREMISE_MILESTONE_EVERY)).toBe(1);
    });

    it('a single grant can cross multiple tiers at once', () => {
        expect(premiseMilestonesCrossed(0, PREMISE_MILESTONE_EVERY * 3)).toBe(3);
    });

    it('never negative — a same-or-shrinking total crosses nothing new', () => {
        expect(premiseMilestonesCrossed(10, 5)).toBe(0);
    });
});

describe("exordium ('exordium') — FREE-line milestone accrual", () => {
    it('a grant below the first tier accrues the lifetime counter but pays no dividend', () => {
        const before = stateFor('exordium', 0);
        const { events, after } = playFree(before);

        const [gained] = findEvents(events, 'premise-gained');
        expect(gained).toBeDefined();
        expect(gained!.amount).toBe(1);
        expect(after.premiseMilestoneTotal).toBe(1);
        expect(findEvents(events, 'premise-milestone')).toHaveLength(0);
        expect(after.staggerRungs ?? 0).toBe(before.staggerRungs ?? 0);
    });

    it('crossing the first tier grants the printed STAGGER rungs', () => {
        const before = stateFor('exordium', PREMISE_MILESTONE_EVERY - 1, { staggerRungs: 0 });
        const { events, after } = playFree(before);

        const [milestone] = findEvents(events, 'premise-milestone');
        expect(milestone).toBeDefined();
        expect(milestone!.tiersCrossed).toBe(1);
        expect(milestone!.rungs).toBe(PREMISE_MILESTONE_RUNGS);
        expect(milestone!.total).toBe(PREMISE_MILESTONE_EVERY);
        expect(after.premiseMilestoneTotal).toBe(PREMISE_MILESTONE_EVERY);
        expect(after.staggerRungs).toBe(PREMISE_MILESTONE_RUNGS);
    });
});

describe("exordium ('exordium') — PAID-line milestone accrual (same funnel)", () => {
    it('the PAID `premise` specialMechanics path posts to the SAME lifetime counter', () => {
        const before = stateFor('exordium', PREMISE_MILESTONE_EVERY - 1, { staggerRungs: 0 });
        const { events, after } = playPaid(before);

        const [milestone] = findEvents(events, 'premise-milestone');
        expect(milestone).toBeDefined();
        expect(milestone!.tiersCrossed).toBe(1);
        expect(after.premiseMilestoneTotal).toBe(PREMISE_MILESTONE_EVERY);
        expect(after.staggerRungs).toBe(PREMISE_MILESTONE_RUNGS);
    });
});

describe('the lifetime counter survives a Peroration payoff resetting `premises`', () => {
    it('a milestone banked before the payoff stays banked, and new grants keep crossing tiers from there', () => {
        // `the-closing-word` declares a Peroration at 6 Premises (`peroration.at`);
        // reaching it fires the rider and zeroes the spendable `premises` tally.
        // Stage the lifetime counter one grant short of its SECOND tier so the
        // very card play that pays off the Peroration also crosses it.
        const before = stateFor('exordium', 2 * PREMISE_MILESTONE_EVERY - 1, {
            premises: 5,
            peroration: { cardId: 'the-closing-word', at: 6 },
            staggerRungs: 0,
        });
        const { events, after } = playFree(before);

        expect(events.some(e => e.kind === 'peroration-fired')).toBe(true);
        expect(after.premises).toBe(0); // the spendable tally reset...

        const [milestone] = findEvents(events, 'premise-milestone');
        expect(milestone).toBeDefined(); // ...but the lifetime counter kept climbing
        expect(milestone!.tiersCrossed).toBe(1);
        expect(after.premiseMilestoneTotal).toBe(2 * PREMISE_MILESTONE_EVERY);
        expect(after.staggerRungs).toBe(PREMISE_MILESTONE_RUNGS);
    });
});

describe('premiseMilestoneTotal — per-combat scope', () => {
    it('starts at 0 for a fresh combat (initializeCombatEncounter)', () => {
        const s = buildFixtureState({ clean: true });
        expect(s.premiseMilestoneTotal).toBe(0);
    });

    it('sim policies never crash across every policy and seed with the counter live (Oratory deck)', () => {
        const oratoryDeck = buildPresetDeck('oratory');
        expect(oratoryDeck.length).toBeGreaterThan(0);
        expect(oratoryDeck).toContain('exordium');

        function makeSimPlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = oratoryDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makeSimPlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: oratoryDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
