/**
 * Hermetic E2E — Phase 32 part 3 (Akrasia — DEBT ledger,
 * plan/phases/phase_32_theme_deep_work.md §Part 3), refitted to the Profane
 * Canon library (2026-08-08): the debt theme's RECOIL carriers are now
 * `promissory-cut` (PAID recoil 3 + draw 2; FREE recoil 1 + draw 1) and
 * `the-vig`; the old Akrasia cards (`self-flagellant`, `pact-of-akrasia`)
 * are retired.
 *
 * Scope (see brief's Decisions): "blood paid" is RECOIL only — the `recoil`
 * mechanic, `CardRider.recoil` (both the FREE and PAID lines), and
 * `fate.recoilHp` — NOT self-inflicted DoT ticks and NOT self-MARK (no HP
 * loss at all: MARK's payload carries no `damageOverTime`). Every
 * `AKRASIA_DEBT_TIER_HP` HP paid THIS COMBAT crosses one ledger tier;
 * crossing a tier WHILE FALLEN grants `AKRASIA_DEBT_TIER_GUARD` GUARD per
 * tier crossed (the ledger's payoff). The ledger itself always accrues
 * regardless of FALLEN — only the PAYOFF is gated. No cash-out/reset path
 * exists yet (Absolution-fork follow-up).
 *
 * Covers:
 *   1. Pure tier-crossing arithmetic (`akrasiaDebtTiersCrossed`).
 *   2. A single RECOIL mechanic play (`promissory-cut` PAID) posts to the
 *      ledger without yet crossing a tier.
 *   3. Crossing a tier WHILE FALLEN grants the printed GUARD payoff.
 *   4. Crossing a tier while NOT FALLEN still accrues the ledger but grants
 *      no GUARD (the payoff, not the ledger, is FALLEN-gated).
 *   5. The FREE-line `CardRider.recoil` path (`promissory-cut` FREE) posts to
 *      the SAME ledger as the PAID-mechanic path.
 *   6. A full `COMBAT_SIM_POLICY_ORDER` sweep with the Pilgrim preset deck
 *      (the campaign snapshot carrying the debt core) runs without crashing
 *      (mirrors the reap-erosion test's cross-policy pattern from Part 1).
 *
 * Fixture/RNG conventions follow `reap-max-hp-erosion.engine.test.ts` (shared
 * builder in `src/test-utils/card-fixture.ts`, `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach). The CLEAN fixture already carries two
 * distinct self-debuffs on the player (`debuff_mark` + `debuff_bleed`) —
 * FALLEN is true by default; tests that need NOT-FALLEN explicitly clear
 * `player.effects`.
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
import { AKRASIA_DEBT_TIER_HP, AKRASIA_DEBT_TIER_GUARD, akrasiaDebtTiersCrossed } from '../effects';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// The RECOIL carrier under test. Its printed blood prices are read off the
// live library rather than pinned — THE BIG NUMBERS REWRITE rescales cards
// freely, and what this suite guards is the LEDGER, not the card's numbers.
const CUT = 'promissory-cut'; // PAID: RECOIL + draw 2 / conviction 2. FREE: RECOIL + draw 1.
const CUT_CARD = getCardById(CUT)!;
const CUT_PAID_RECOIL = (CUT_CARD.specialMechanics ?? [])
    .reduce((sum, m) => sum + (m.kind === 'recoil' ? m.hp : 0), 0);
const CUT_FREE_RECOIL = CUT_CARD.free?.recoil ?? 0;

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture (no pre-applied enemy effects) with `akrasiaDebt` pinned and
 *  the card under test staged in hand. `fallen` toggles the player's two
 *  self-debuffs (present by default in the fixture) on/off. */
function stateFor(cardId: string, akrasiaDebt: number, fallen = true): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        akrasiaDebt,
        hand: [{ uid: 'under-test', cardId }],
        player: { ...s.player, effects: fallen ? s.player.effects : [] },
        enemy: { ...s.enemy, effects: [] },
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

describe('Phase 32 part 3 — pure tier-crossing arithmetic', () => {
    it('AKRASIA_DEBT_TIER_HP is a small, documented tier size', () => {
        expect(AKRASIA_DEBT_TIER_HP).toBeGreaterThan(0);
    });

    it('no crossing within the same tier', () => {
        expect(akrasiaDebtTiersCrossed(0, AKRASIA_DEBT_TIER_HP - 1)).toBe(0);
    });

    it('crosses exactly one tier at the boundary', () => {
        expect(akrasiaDebtTiersCrossed(AKRASIA_DEBT_TIER_HP - 1, AKRASIA_DEBT_TIER_HP)).toBe(1);
    });

    it('a single large payment can cross multiple tiers at once', () => {
        expect(akrasiaDebtTiersCrossed(0, AKRASIA_DEBT_TIER_HP * 3)).toBe(3);
    });

    it('never returns a negative crossing count (a same-or-shrinking total)', () => {
        expect(akrasiaDebtTiersCrossed(10, 10)).toBe(0);
        expect(akrasiaDebtTiersCrossed(10, 4)).toBe(0);
    });
});

describe("RECOIL mechanic play ('promissory-cut' PAID) posts to the ledger", () => {
    it('accrues the printed RECOIL HP without crossing a tier from a zero ledger', () => {
        const before = stateFor(CUT, 0);
        const { events, after } = playPaid(before);

        const [paid] = findEvents(events, 'debt-paid');
        expect(paid).toBeDefined();
        expect(paid!.amount).toBe(CUT_PAID_RECOIL); // the card's printed RECOIL
        expect(paid!.total).toBe(CUT_PAID_RECOIL);
        expect(after.akrasiaDebt).toBe(CUT_PAID_RECOIL);

        // One PAID play cannot itself clear a tier — no payoff yet.
        expect(CUT_PAID_RECOIL).toBeLessThan(AKRASIA_DEBT_TIER_HP);
        expect(findEvents(events, 'debt-tier-payoff')).toHaveLength(0);
    });

    it('crossing a tier WHILE FALLEN grants the printed GUARD payoff', () => {
        const before = stateFor(CUT, AKRASIA_DEBT_TIER_HP - 1, true); // one short of the tier
        const guardBefore = before.guard ?? 0;
        const { events, after } = playPaid(before);

        const expected = AKRASIA_DEBT_TIER_HP - 1 + CUT_PAID_RECOIL;
        const [paid] = findEvents(events, 'debt-paid');
        expect(paid!.total).toBe(expected);
        expect(after.akrasiaDebt).toBe(expected);

        const [payoff] = findEvents(events, 'debt-tier-payoff');
        expect(payoff).toBeDefined();
        expect(payoff!.tiersCrossed).toBe(1);
        expect(payoff!.guard).toBe(1 * AKRASIA_DEBT_TIER_GUARD);
        expect(payoff!.total).toBe(expected);
        expect(after.guard).toBe(guardBefore + AKRASIA_DEBT_TIER_GUARD);
    });

    it('crossing a tier while NOT FALLEN still accrues the ledger but grants no GUARD', () => {
        const before = stateFor(CUT, AKRASIA_DEBT_TIER_HP - 1, false); // same crossing, no FALLEN
        const guardBefore = before.guard ?? 0;
        const { events, after } = playPaid(before);

        const expected = AKRASIA_DEBT_TIER_HP - 1 + CUT_PAID_RECOIL;
        const [paid] = findEvents(events, 'debt-paid');
        expect(paid!.total).toBe(expected);
        expect(after.akrasiaDebt).toBe(expected); // the ledger itself is unconditional

        expect(findEvents(events, 'debt-tier-payoff')).toHaveLength(0);
        expect(after.guard).toBe(guardBefore); // the PAYOFF is FALLEN-gated
    });
});

describe("FREE-line CardRider.recoil ('promissory-cut' FREE) posts to the SAME ledger", () => {
    it('the FREE line\'s printed RECOIL posts to akrasiaDebt (its own rider is a draw, not guard)', () => {
        const before = stateFor(CUT, 0);
        const guardBefore = before.guard ?? 0;
        const { events, after } = playFree(before);

        const [paid] = findEvents(events, 'debt-paid');
        expect(paid).toBeDefined();
        expect(paid!.amount).toBe(CUT_FREE_RECOIL); // promissory-cut's FREE recoil: 1
        expect(paid!.total).toBe(CUT_FREE_RECOIL);
        expect(after.akrasiaDebt).toBe(CUT_FREE_RECOIL);

        // 1 HP doesn't cross the 6-HP tier — no ledger payoff, and the card's
        // own FREE rider (DRAW 1) grants no guard either.
        expect(findEvents(events, 'debt-tier-payoff')).toHaveLength(0);
        expect(after.guard).toBe(guardBefore);
    });

    it('a FREE-line recoil that crosses a tier while FALLEN also pays the ledger GUARD', () => {
        const before = stateFor(CUT, AKRASIA_DEBT_TIER_HP - 1, true); // 5 -> 6 crosses
        const guardBefore = before.guard ?? 0;
        const { events, after } = playFree(before);

        const [payoff] = findEvents(events, 'debt-tier-payoff');
        expect(payoff).toBeDefined();
        expect(payoff!.tiersCrossed).toBe(1);
        expect(after.akrasiaDebt).toBe(AKRASIA_DEBT_TIER_HP);
        // The card's FREE line prints no guard of its own — the delta IS the
        // ledger's tier payoff.
        expect(after.guard).toBe(guardBefore + AKRASIA_DEBT_TIER_GUARD);
    });
});

describe('akrasiaDebt ledger — per-combat scope', () => {
    it('starts at 0 for a fresh combat (initializeCombatEncounter)', () => {
        const s = buildFixtureState({ clean: true });
        // buildFixtureState doesn't override akrasiaDebt, so this is the raw
        // initializeCombatEncounter value threaded straight through.
        expect(s.akrasiaDebt).toBe(0);
    });

    it('sim policies never crash across every policy and seed while the ledger accrues (Pilgrim deck)', () => {
        const pilgrimDeck = buildPresetDeck('pilgrim');
        expect(pilgrimDeck.length).toBeGreaterThan(0);
        // promissory-cut (PAID recoil 3 / FREE recoil 1) is the mid-campaign
        // snapshot's own RECOIL carrier (the debt core arrives with PILGRIM_ADDED).
        expect(pilgrimDeck).toContain(CUT);

        function makePlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = pilgrimDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makePlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: pilgrimDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
