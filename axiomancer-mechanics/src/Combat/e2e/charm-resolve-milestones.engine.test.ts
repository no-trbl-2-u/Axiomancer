/**
 * Hermetic E2E — Phase 32 part 4e (Charm — Resolve milestones,
 * plan/phases/phase_32_theme_deep_work.md §Part 4e).
 *
 * Scope (see brief's Decisions): SWAY crossing a NAMED FRACTIONAL WAYPOINT
 * of the enemy's LIVE `capitulateThreshold` ("resolve") pays a small
 * one-time dividend, engine-side, at the SINGLE `gainSway` insertion point
 * every SWAY source funnels through (mirrors `gainPremises` in Part 4b):
 *   - Wavering (SWAY_WAVERING_FRACTION of resolve) lands one stack of
 *     RAPPORT on the enemy (Charm's own rapport-building idiom).
 *   - Faltering (SWAY_FALTERING_FRACTION of resolve) grants a small bonus
 *     SWAY nudge, unscaled by buff_grace_momentum.
 * Each milestone fires AT MOST ONCE per combat and NEVER un-fires or claws
 * back a dividend already paid, even if the enemy's live resolve later
 * shrinks below the threshold that was crossed.
 *
 * Covers:
 *   1. Pure threshold arithmetic (`swayResolveMilestoneThresholds`).
 *   2. Crossing Wavering only (RAPPORT lands, Faltering stays unfired).
 *   3. Crossing BOTH Wavering and Faltering in one gain (a single played
 *      card's sway pushes the running total past both waypoints at once).
 *   4. A shrinking live resolve after Wavering already fired does not
 *      re-fire it or claw back the RAPPORT stack already landed.
 *   5. Per-combat, per-enemy reset (`initializeCombatEncounter` starts both
 *      flags false).
 *   6. A full `COMBAT_SIM_POLICY_ORDER` × seed sweep on the `grace` (Charm)
 *      preset deck runs without crashing.
 *
 * Fixture/RNG conventions follow `akrasia-debt-ledger.engine.test.ts`
 * (shared builder in `src/test-utils/card-fixture.ts`,
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach).
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
import { buildPresetDeck } from '../combat.deck-presets';
import { capitulateThreshold, swayResolveMilestoneThresholds, SWAY_FALTERING_BONUS } from '../effects';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture with a small, deterministic enemy HP pool (maxHealth = health
 *  = 40 -> capitulateThreshold(enemy) = round(0.35 * 40) = 14 exactly, no
 *  clamp from the current-health min()), `sway` pinned, and the card under
 *  test staged in hand. */
function stateFor(cardId: string, sway: number, overrides: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        sway,
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, maxHealth: 40, health: 40, effects: [] },
        ...overrides,
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true);
    return { events, after };
}

describe('Phase 32 part 4e — pure resolve-milestone threshold arithmetic', () => {
    it('resolve 14 (maxHealth 40) yields Wavering 6 / Faltering 11', () => {
        const resolve = capitulateThreshold({ health: 40, maxHealth: 40 });
        expect(resolve).toBe(14);
        expect(swayResolveMilestoneThresholds(resolve)).toEqual({ wavering: 6, faltering: 11 });
    });

    it('Wavering is always strictly below Faltering, which is always below (or at) resolve', () => {
        for (const resolve of [10, 14, 35, 100, 525]) {
            const { wavering, faltering } = swayResolveMilestoneThresholds(resolve);
            expect(wavering).toBeLessThan(faltering);
            expect(faltering).toBeLessThanOrEqual(resolve);
        }
    });

    it('floors at 1 even for the tiny CAPITULATE_MIN resolve floor (10)', () => {
        const { wavering, faltering } = swayResolveMilestoneThresholds(0);
        expect(wavering).toBeGreaterThanOrEqual(1);
        expect(faltering).toBeGreaterThanOrEqual(1);
    });
});

describe('Crossing Wavering only', () => {
    it('a gain that clears Wavering but not Faltering lands one RAPPORT stack and fires exactly one milestone event', () => {
        // heart-of-the-matter carries its OWN { kind: 'echo' } mechanic, which
        // self-doubles its printed sway (6 -> 12, `echoFactor` in
        // combat.engine.ts — see the card's own "// pts" comment). resolve =
        // 35 (maxHealth 100) -> wavering 16 / faltering 28. Pre-seeded sway 5
        // + the 12-point gain = 17: clears wavering (16), stays under
        // faltering (28).
        const before = stateFor('heart-of-the-matter', 5, {
            enemy: { ...buildFixtureState({ clean: true }).enemy, maxHealth: 100, health: 100, effects: [] },
        });
        const resolve = capitulateThreshold(before.enemy);
        expect(resolve).toBe(35);
        const { wavering, faltering } = swayResolveMilestoneThresholds(resolve);
        expect(wavering).toBe(16);
        expect(faltering).toBe(28);

        const { events, after } = playPaid(before);

        const [gained] = findEvents(events, 'sway-gained');
        expect(gained.amount).toBe(12); // self-echoed 6 -> 12
        const milestones = findEvents(events, 'sway-milestone');
        expect(milestones).toHaveLength(1);
        expect(milestones[0]).toMatchObject({ milestone: 'wavering', threshold: wavering, effectId: 'debuff_rapport', intensity: 1 });
        expect(after.sway).toBe(17); // 5 + 12, no Faltering bonus yet
        expect(after.swayMilestoneWaveringFired).toBe(true);
        expect(after.swayMilestoneFalteringFired).toBeFalsy();

        const rapport = after.enemy.effects.find(e => e.effectId === 'debuff_rapport');
        expect(rapport).toBeDefined();
        expect(rapport!.intensity).toBe(1);
    });
});

describe('Crossing BOTH Wavering and Faltering in one gain', () => {
    it('a single played card that jumps the running total past both waypoints fires both milestone events in one gainSway call', () => {
        // resolve = 20 (maxHealth 57: round(0.35 x 57) = 20) -> wavering 9 /
        // faltering 16. Pre-seeded sway 5 (below wavering) + heart-of-the-
        // matter's self-echoed 12-point gain = 17: clears BOTH waypoints in
        // this one gainSway call.
        const before = stateFor('heart-of-the-matter', 5, {
            enemy: { ...buildFixtureState({ clean: true }).enemy, maxHealth: 57, health: 57, effects: [] },
        });
        const resolve = capitulateThreshold(before.enemy);
        expect(resolve).toBe(20);
        const { wavering, faltering } = swayResolveMilestoneThresholds(resolve);
        expect(wavering).toBe(9);
        expect(faltering).toBe(16);

        const { events, after } = playPaid(before);

        const milestones = findEvents(events, 'sway-milestone');
        expect(milestones).toHaveLength(2);
        expect(milestones.map(m => m.milestone).sort()).toEqual(['faltering', 'wavering']);

        const waveringEvt = milestones.find(m => m.milestone === 'wavering')!;
        expect(waveringEvt).toMatchObject({ threshold: 9, effectId: 'debuff_rapport', intensity: 1 });

        const falteringEvt = milestones.find(m => m.milestone === 'faltering')!;
        expect(falteringEvt).toMatchObject({ threshold: 16, bonus: SWAY_FALTERING_BONUS });

        // 5 (pre-seed) + 12 (self-echoed card) + 2 (Faltering bonus) = 19;
        // still below the resolve (20), so this does NOT also trip the
        // capitulation offer — keeps the milestone assertions isolated from
        // that separate (pre-existing) check.
        expect(after.sway).toBe(19);
        expect(after.swayMilestoneWaveringFired).toBe(true);
        expect(after.swayMilestoneFalteringFired).toBe(true);
        expect(after.phase).not.toBe('mercy-choice');

        const rapportStacks = after.enemy.effects.filter(e => e.effectId === 'debuff_rapport');
        expect(rapportStacks).toHaveLength(1);
        expect(rapportStacks[0].intensity).toBe(1);
    });
});

describe('A shrinking live resolve never re-fires or claws back an already-crossed milestone', () => {
    it('Wavering stays fired (and its RAPPORT stack stays landed) even after the enemy\'s resolve later shrinks below the crossed threshold', () => {
        // First play crosses Wavering only (mirrors the "Wavering only" case
        // above): resolve 35 (maxHealth 100), wavering 16, faltering 28.
        const bigEnemy = { ...buildFixtureState({ clean: true }).enemy, maxHealth: 100, health: 100, effects: [] };
        const first = stateFor('heart-of-the-matter', 13, { enemy: bigEnemy });
        const firstResult = playPaid(first);
        expect(firstResult.after.swayMilestoneWaveringFired).toBe(true);
        expect(firstResult.after.swayMilestoneFalteringFired).toBeFalsy();
        const rapportAfterFirst = firstResult.after.enemy.effects.find(e => e.effectId === 'debuff_rapport');
        expect(rapportAfterFirst!.intensity).toBe(1);

        // Now shrink the enemy's HP pool drastically (its live resolve falls
        // well below the ALREADY-crossed Wavering threshold of 16) and play
        // a second small sway card. Wavering must NOT fire again (no second
        // RAPPORT stack, no second 'wavering' milestone event, no clawback
        // of the stack already on the enemy).
        const shrunkEnemy = { ...firstResult.after.enemy, maxHealth: 20, health: 20 };
        const shrunkResolve = capitulateThreshold(shrunkEnemy);
        expect(shrunkResolve).toBeLessThan(16); // below the already-crossed Wavering threshold

        const second: CombatEncounterState = {
            ...firstResult.after,
            enemy: shrunkEnemy,
            hand: [{ uid: 'under-test-2', cardId: 'soft-word' }],
        };
        mockSequentialRng(0.5);
        const { events, state: after } = playCombatCard(second, { uid: 'under-test-2' }, true);

        const milestones = findEvents(events, 'sway-milestone');
        expect(milestones.filter(m => m.milestone === 'wavering')).toHaveLength(0); // no re-fire
        expect(after.swayMilestoneWaveringFired).toBe(true); // still true — never un-crossed
        const rapportStacks = after.enemy.effects.filter(e => e.effectId === 'debuff_rapport');
        expect(rapportStacks).toHaveLength(1);
        expect(rapportStacks[0].intensity).toBe(1); // unchanged — no clawback, no double-stack
    });
});

describe('Per-combat, per-enemy reset', () => {
    it('starts false for a fresh combat (initializeCombatEncounter)', () => {
        const s = buildFixtureState({ clean: true });
        expect(s.swayMilestoneWaveringFired).toBe(false);
        expect(s.swayMilestoneFalteringFired).toBe(false);
    });

    it('sim policies never crash across every policy and seed while resolve milestones fire (grace preset deck)', () => {
        const graceDeck = buildPresetDeck('grace');
        expect(graceDeck.length).toBeGreaterThan(0);
        expect(graceDeck).toContain('soft-word'); // the theme's own sway carrier

        function makePlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = graceDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makePlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: graceDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
