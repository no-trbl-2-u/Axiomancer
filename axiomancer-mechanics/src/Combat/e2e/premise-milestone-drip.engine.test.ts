/**
 * Hermetic E2E — Phase 32 part 4b (Oratory — milestone drip,
 * plan/archive/2026-09-25-trim-t4/plan/phases/phase_32_theme_deep_work.md §Part 4b).
 *
 * Scope (see brief's Decisions): every {@link PREMISE_MILESTONE_EVERY}rd
 * Premise the player has EVER gained THIS COMBAT — tracked by a new lifetime
 * counter, `CombatEncounterState.premiseMilestoneTotal` — pays
 * {@link PREMISE_MILESTONE_RUNGS} STAGGER rungs per milestone crossed. The
 * lifetime counter rides EVERY `gainPremises` call (own-card FREE/PAID lines,
 * borrowed FREE riders alike) and, unlike the spendable `premises` tally it
 * accrues alongside, does NOT reset when a Peroration pays off or CONDEMN
 * fires — a milestone already paid stays paid.
 *
 * Profane-canon refit (2026-08-08): the CHARGE depositor under test is now
 * `petty-indictment` (trial theme, the retired `exordium`/`videtur-quod`
 * seat). THE BIG NUMBERS REWRITE (2026-09-02) rescaled its deposits, so the
 * fixtures read the card's FREE/PAID Charge grants off the live library
 * rather than pinning them — the milestone engine itself is unchanged.
 *
 * Covers:
 *   1. Pure tier-crossing arithmetic (`premiseMilestonesCrossed`).
 *   2. A single Premise grant below the first tier accrues the lifetime
 *      counter but pays no dividend.
 *   3. Crossing the first tier (FREE-line `petty-indictment`) grants the
 *      printed STAGGER rungs and fires `premise-milestone` alongside
 *      `premise-gained`.
 *   4. The SAME accrual fires on the PAID-line `premise` specialMechanics
 *      path (`petty-indictment` played PAID).
 *   5. The lifetime counter does NOT reset when a Peroration payoff zeroes
 *      the spendable `premises` tally — a milestone banked before the payoff
 *      stays banked, and further grants keep crossing new tiers from where
 *      the lifetime counter left off.
 *   6. Per-combat scope: starts at 0 for a fresh combat.
 *   7. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the Threadbare preset
 *      deck (the campaign snapshot carrying the trial starter) runs without
 *      crashing (mirrors the TURNABOUT-ledger test's cross-policy pattern
 *      from Part 4a).
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
import { getCardById } from '../../Cards/cards.library';
import { playCombatCard } from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import { PREMISE_MILESTONE_EVERY, PREMISE_MILESTONE_RUNGS, premiseMilestonesCrossed } from '../effects';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

/** The depositor's live numbers, read off the library so a rescale of the
 *  card never falsifies the milestone engine's test. */
const DEPOSITOR = 'petty-indictment';
const DEPOSITOR_CARD = getCardById(DEPOSITOR)!;
const FREE_CHARGES = DEPOSITOR_CARD.free?.premises ?? 0;
const PAID_CHARGES = (DEPOSITOR_CARD.specialMechanics ?? [])
    .reduce((sum, m) => sum + (m.kind === 'premise' ? m.count : 0), 0);
/** The PAID line also prints its own STAGGER, which lands on top of the
 *  milestone dividend. */
const PAID_PRINTED_RUNGS = (DEPOSITOR_CARD.specialMechanics ?? [])
    .reduce((sum, m) => sum + (m.kind === 'stagger' ? m.rungs : 0), 0);
/** The declared-conclusion carrier's own rider STAGGER, which the payoff
 *  lands alongside the milestone dividend. */
const CLOSER_RIDER_RUNGS = (getCardById('the-black-cap')?.specialMechanics ?? [])
    .reduce((sum, m) => sum + (m.kind === 'peroration' ? (m.rider.stagger ?? 0) : 0), 0);

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
    // Spec 33: a PAID play must name its powering die — the fixture's wild die.
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
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

describe("petty-indictment — FREE-line milestone accrual", () => {
    it('a grant below the first tier accrues the lifetime counter but pays no dividend', () => {
        // Only meaningful while one FREE deposit cannot itself clear a tier.
        expect(FREE_CHARGES).toBeLessThan(PREMISE_MILESTONE_EVERY);
        const before = stateFor(DEPOSITOR, 0);
        const { events, after } = playFree(before);

        const [gained] = findEvents(events, 'premise-gained');
        expect(gained).toBeDefined();
        expect(gained!.amount).toBe(FREE_CHARGES);
        expect(after.premiseMilestoneTotal).toBe(FREE_CHARGES);
        expect(findEvents(events, 'premise-milestone')).toHaveLength(0);
        expect(after.staggerRungs ?? 0).toBe(before.staggerRungs ?? 0);
    });

    it('crossing the first tier grants the printed STAGGER rungs', () => {
        const before = stateFor(DEPOSITOR, PREMISE_MILESTONE_EVERY - FREE_CHARGES, { staggerRungs: 0 });
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

describe("petty-indictment — PAID-line milestone accrual (same funnel)", () => {
    it('the PAID `premise` specialMechanics path posts to the SAME lifetime counter', () => {
        const before = stateFor(DEPOSITOR, PREMISE_MILESTONE_EVERY - PAID_CHARGES, { staggerRungs: 0 });
        const { events, after } = playPaid(before);

        const [milestone] = findEvents(events, 'premise-milestone');
        expect(milestone).toBeDefined();
        expect(milestone!.tiersCrossed).toBe(1);
        expect(after.premiseMilestoneTotal).toBe(PREMISE_MILESTONE_EVERY);
        // The dividend rides ON TOP of the PAID line's own printed STAGGER.
        expect(after.staggerRungs).toBe(PREMISE_MILESTONE_RUNGS + PAID_PRINTED_RUNGS);
    });
});

describe('the lifetime counter survives a Peroration payoff resetting `premises`', () => {
    it('a milestone banked before the payoff stays banked, and new grants keep crossing tiers from there', () => {
        // A SYNTHETIC Peroration (`at: 6`, `concedeAt` deliberately unstaged:
        // this pins the payoff-reset path, not the CONDEMN alt-win, and it is
        // not the live `the-black-cap` threshold). Reaching it fires the rider
        // and zeroes the spendable `premises` tally. Stage the lifetime counter
        // one FREE grant short of its SECOND tier so the very card play that
        // pays off the Peroration also crosses it.
        const before = stateFor(DEPOSITOR, 2 * PREMISE_MILESTONE_EVERY - FREE_CHARGES, {
            premises: 6 - FREE_CHARGES,
            peroration: { cardId: 'the-black-cap', at: 6 },
            staggerRungs: 0,
        });
        const { events, after } = playFree(before);

        expect(events.some(e => e.kind === 'peroration-fired')).toBe(true);
        expect(after.premises).toBe(0); // the spendable tally reset...

        const [milestone] = findEvents(events, 'premise-milestone');
        expect(milestone).toBeDefined(); // ...but the lifetime counter kept climbing
        expect(milestone!.tiersCrossed).toBe(1);
        expect(after.premiseMilestoneTotal).toBe(2 * PREMISE_MILESTONE_EVERY);
        // Milestone dividend + the fired conclusion's own rider STAGGER.
        expect(after.staggerRungs).toBe(PREMISE_MILESTONE_RUNGS + CLOSER_RIDER_RUNGS);
    });
});

describe('premiseMilestoneTotal — per-combat scope', () => {
    it('starts at 0 for a fresh combat (initializeCombatEncounter)', () => {
        const s = buildFixtureState({ clean: true });
        expect(s.premiseMilestoneTotal).toBe(0);
    });

    it('sim policies never crash across every policy and seed with the counter live (Threadbare deck)', () => {
        const threadbareDeck = buildPresetDeck('threadbare');
        expect(threadbareDeck.length).toBeGreaterThan(0);
        // 2026-08-08: petty-indictment (the canon's starter CHARGE depositor)
        // keeps the milestone counter live in the seated deck.
        expect(threadbareDeck).toContain('petty-indictment');

        function makeSimPlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = threadbareDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makeSimPlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: threadbareDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
