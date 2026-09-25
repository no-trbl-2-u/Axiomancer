/**
 * Hermetic E2E — Phase 32 part 4c (Forge — OVERHEAT,
 * plan/phases/phase_32_theme_deep_work.md §Part 4c).
 *
 * OVERHEAT is the press-your-luck knob the source doc asked for
 * (2026-07-10-theme-identity.md §2, "Forge / foundry"): a Reserve die
 * already at the safe `RESERVE_PIP_CAP` can be pushed FURTHER, up to
 * `OVERHEAT_PIP_CEILING`, at a per-pip `OVERHEAT_BUST_CHANCE` risk. A die
 * still below the cap ripens for free — OVERHEAT only prices the overage.
 * A bust HALVES (floors) the targeted die's pips rather than zeroing them
 * (a partial setback, mirroring Quacks of Quedlinburg's "choose points or
 * coins, not both" — never a total wipeout).
 *
 * Covers:
 *   1. `overheatReserve` (pure function): a die below the cap ripens with
 *      NO risk regardless of the roll; a die AT the cap busts (halves) on
 *      a low roll and pushes past the cap on a high roll; a die at
 *      `OVERHEAT_PIP_CEILING` takes no further pushes (no risk, no
 *      change); multiple dice resolve independently in one call.
 *   2. The OVERHEAT card leg (`{ kind: 'overheat', pips: 1 }` riding
 *      alongside `guard`/`grant_pip`): an empty Reserve is a legal no-op
 *      (no fizzle); a Reserve die already at the cap pushes past it on a
 *      neutral roll; the same die busts (halves) on a low roll and fires
 *      `overheat-bust`. PROFANE CANON (2026-08-08): the library carrier
 *      (`half-step`, retired with the forge theme) moved out of the
 *      57-card canon — the verb stays engine-live, so a SYNTHETIC sandbox
 *      fixture mirroring half-step's exact shape carries the leg now.
 *   3. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on a canon preset
 *      deck (`pilgrim`) with the OVERHEAT fixture seated ×4 runs without
 *      crashing.
 *
 * Fixture/RNG conventions follow `turnabout-ledger.engine.test.ts` /
 * `akrasia-debt-ledger.engine.test.ts` (shared builder in
 * `src/test-utils/card-fixture.ts`, `mockSequentialRng(value)` — same
 * value on every `Math.random()` call this play, so a single pinned
 * value both drives (and, where relevant, is the ONLY thing that could
 * drive) the overheat roll deterministically; `vi.restoreAllMocks()` in
 * afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { Player } from '../../Character/characters.mock';
import type { Character } from '../../Character/types';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../combat.engine';
import { runOneEncounter } from '../combat.encounter.sim';
import { COMBAT_SIM_POLICY_ORDER } from '../combat.sim-policies';
import { buildPresetDeck } from '../combat.starter-deck-presets';
import {
    RESERVE_PIP_CAP, OVERHEAT_PIP_CEILING, OVERHEAT_BUST_CHANCE, overheatReserve,
} from '../combat.dice';
import type { CombatEncounterState, CombatEvent, CombatManaDie } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// PROFANE CANON (2026-08-08): `overheat` lost its library carrier (half-step,
// retired with the forge theme). The verb is still engine-live — this
// synthetic fixture mirrors the retired card's exact mechanic shape
// (guard 5 + grant_pip 2 + overheat 1, FREE pips 1) so the leg under test is
// the RULE, not any one card's tuning.
const OVERHEAT_CARD = 'qa-overheat-half-step';
registerSandboxCards([
    {
        id: OVERHEAT_CARD, name: 'QA Overheat (ex-Half-Step)',
        philosophicalAspect: 'body', description: 'overheat fixture', tier: 1,
        targetType: 'self', rank: 2, cardType: 'spell',
        free: { pips: 1 },
        specialMechanics: [
            { kind: 'guard', amount: 5 }, { kind: 'grant_pip', count: 2 },
            { kind: 'overheat', pips: 1 },
        ],
    },
]);

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function die(id: string, pips: number): CombatManaDie {
    return { id, color: 'heart', state: 'available', temporary: false, pips };
}

// ── Pure function: overheatReserve ───────────────────────────────────────────

describe('overheatReserve (pure)', () => {
    it('a die below RESERVE_PIP_CAP ripens with NO risk, regardless of the roll', () => {
        // rng() = 0 would bust every eligible die if this one were eligible —
        // it is not (below cap), so it must ripen unconditionally.
        const res = overheatReserve([die('d0', 0)], () => 0);
        expect(res.reserve[0]!.pips).toBe(1);
        expect(res.ripenedIds).toEqual(['d0']);
        expect(res.bustedIds).toEqual([]);
    });

    it('a die AT the cap busts (halves, floored) on a roll below OVERHEAT_BUST_CHANCE', () => {
        const res = overheatReserve([die('d0', RESERVE_PIP_CAP)], () => 0);
        expect(res.reserve[0]!.pips).toBe(Math.floor(RESERVE_PIP_CAP / 2));
        expect(res.bustedIds).toEqual(['d0']);
        expect(res.ripenedIds).toEqual([]);
    });

    it('a die AT the cap pushes past it on a roll at/above OVERHEAT_BUST_CHANCE', () => {
        const res = overheatReserve([die('d0', RESERVE_PIP_CAP)], () => OVERHEAT_BUST_CHANCE);
        expect(res.reserve[0]!.pips).toBe(RESERVE_PIP_CAP + 1);
        expect(res.ripenedIds).toEqual(['d0']);
        expect(res.bustedIds).toEqual([]);
    });

    it('a die at OVERHEAT_PIP_CEILING takes no further push — no risk, no change', () => {
        const res = overheatReserve([die('d0', OVERHEAT_PIP_CEILING)], () => 0);
        expect(res.reserve[0]!.pips).toBe(OVERHEAT_PIP_CEILING);
        expect(res.ripenedIds).toEqual([]);
        expect(res.bustedIds).toEqual([]);
    });

    it('multiple dice resolve independently in one call', () => {
        const res = overheatReserve(
            [die('below', 0), die('at-cap', RESERVE_PIP_CAP)],
            () => 0, // busts the eligible die; the below-cap die is unaffected by risk
        );
        const below = res.reserve.find(d => d.id === 'below')!;
        const atCap = res.reserve.find(d => d.id === 'at-cap')!;
        expect(below.pips).toBe(1);
        expect(atCap.pips).toBe(Math.floor(RESERVE_PIP_CAP / 2));
        expect(res.ripenedIds).toEqual(['below']);
        expect(res.bustedIds).toEqual(['at-cap']);
    });

    it('repeated successful pushes climb toward, but never past, the ceiling', () => {
        let reserve = [die('d0', RESERVE_PIP_CAP)];
        for (let i = 0; i < 10; i++) {
            reserve = overheatReserve(reserve, () => 1).reserve; // rng()=1 never busts
        }
        expect(reserve[0]!.pips).toBe(OVERHEAT_PIP_CEILING);
    });
});

// ── Card: the OVERHEAT fixture (ex-half-step) ────────────────────────────────

function stateFor(reserve: CombatManaDie[]): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        // The fixture's ownership gate lists only library ids — own the QA card too.
        player: { ...s.player, knownCards: [...s.player.knownCards, OVERHEAT_CARD] },
        reserve,
        hand: [{ uid: 'under-test', cardId: OVERHEAT_CARD }],
    };
}

function playPaid(state: CombatEncounterState, value: number): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(value); // same value on every Math.random() call this play
    // Powered by the fixture's wild tray die (spec 33: a paid play names its die).
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
    return { events, after };
}

describe("the OVERHEAT card leg (ex-half-step fixture)", () => {
    it('an empty Reserve is a legal no-op — no fizzle, no reserve dice created', () => {
        const before = stateFor([]);
        const { events, after } = playPaid(before, 0.5);
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(after.reserve ?? []).toEqual([]);
    });

    it('a Reserve die already at the cap pushes PAST it on a neutral (non-bust) roll', () => {
        const before = stateFor([die('r0', RESERVE_PIP_CAP)]);
        const { events, after } = playPaid(before, 0.5); // 0.5 >= OVERHEAT_BUST_CHANCE(0.35)
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        const finalDie = after.reserve?.find(d => d.id === 'r0');
        expect(finalDie?.pips).toBeGreaterThan(RESERVE_PIP_CAP);
        expect(findEvents(events, 'overheat-bust')).toEqual([]);
    });

    it('the same die busts (halves) on a roll below OVERHEAT_BUST_CHANCE, firing overheat-bust', () => {
        const before = stateFor([die('r0', RESERVE_PIP_CAP)]);
        const { events, after } = playPaid(before, 0); // 0 < OVERHEAT_BUST_CHANCE
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        const [busted] = findEvents(events, 'overheat-bust');
        expect(busted).toBeDefined();
        expect(busted!.dieId).toBe('r0');
        expect(busted!.cardId).toBe(OVERHEAT_CARD);
        const finalDie = after.reserve?.find(d => d.id === 'r0');
        expect(finalDie?.pips).toBe(busted!.pips);
        expect(finalDie?.pips).toBeLessThan(RESERVE_PIP_CAP);
    });
});

describe('OVERHEAT — per-combat / sim sweep', () => {
    it('sim policies never crash across every policy and seed (pilgrim deck, OVERHEAT live)', () => {
        // PROFANE CANON (2026-08-08): the foundry preset retired with the ten
        // theme presets; the sweep's whole point is OVERHEAT-live sims, so
        // seat the synthetic OVERHEAT fixture ×4 into a canon preset deck
        // (pilgrim, the 30-card mid snapshot) explicitly.
        const overheatDeck = buildPresetDeck('pilgrim')
            .map((id, i) => (i < 4 ? OVERHEAT_CARD : id));
        expect(overheatDeck.length).toBeGreaterThan(0);
        expect(overheatDeck).toContain(OVERHEAT_CARD);

        function makeSimPlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = overheatDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makeSimPlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: overheatDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
