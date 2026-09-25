/**
 * Hermetic E2E — Phase 32 part 1 (Harvest — REAP attacks MAXIMUM HP,
 * plan/archive/2026-09-25-trim-t4/plan/phases/phase_32_theme_deep_work.md §Part 1).
 *
 * Additive design (see brief's "Decisions made upfront"): REAP's existing
 * current-HP burst is UNCHANGED; REAP now ALSO permanently lowers
 * `enemy.maxHealth` by the same amount, in the same call — no clamp code
 * needed, `health <= maxHealth` holds automatically because both fields
 * drop by the identical amount. Covers:
 *
 *   1. `reap_all` (`miserere`) reduces both `health` and `maxHealth` by
 *      the reported burst.
 *   2. `reap` (single, `the-offertory-plate`) reduces both by the
 *      cost-derived erosion (`round(cost * REAP_EROSION_PER_SOUL)`) — a
 *      NEW effect for this card, which deals no current-HP damage
 *      otherwise.
 *   3. `health` never exceeds `maxHealth` after either verb.
 *   4. Erosion floors at 0 against a nearly-dead enemy (no negative
 *      `maxHealth`).
 *   5. The `max-hp-eroded` event fires with the correct `amount`/`newMax`.
 *   6. A full `COMBAT_SIM_POLICY_ORDER` sweep runs without crashing with a
 *      shrinking enemy ceiling (mirrors the momentum-wheel / THE STAKE
 *      cross-policy pattern from phase 31).
 *
 * Fixture/RNG conventions follow `card-effectiveness.engine.test.ts` /
 * `dot-trigger-clocks.engine.test.ts` (shared builder in
 * `src/test-utils/card-fixture.ts`, `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach). Cases 1-5 use the CLEAN fixture
 * (`buildFixtureState({ clean: true })`) with an explicit `souls`/`enemy`
 * override so the burst/erosion arithmetic is exact — no pre-applied
 * enemy DoTs to complicate the damage-instance clock math.
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
import { REAP_EROSION_PER_SOUL } from '../effects';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture (no pre-applied enemy effects) with `souls` and the enemy's
 *  health/maxHealth pinned so the erosion arithmetic is exact, plus the card
 *  under test staged in hand. */
function stateFor(cardId: string, souls: number, enemyHealth: number, enemyMaxHealth: number): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        souls,
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, health: enemyHealth, maxHealth: enemyMaxHealth, effects: [] },
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    // Spec 33: a PAID play must name its powering die — the fixture's wild die.
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
    return { events, after };
}

describe('Phase 32 part 1 — REAP attacks MAXIMUM HP', () => {
    describe("reap_all ('miserere')", () => {
        it('reduces both health and maxHealth by the reported burst, and never lets health exceed maxHealth', () => {
            const before = stateFor('miserere', 10, 500, 500);
            const { events, after } = playPaid(before);

            const fizzle = events.find(e => e.kind === 'effect-fizzled');
            expect(fizzle, 'unexpected fizzle').toBeUndefined();

            const [reaped] = findEvents(events, 'reaped');
            expect(reaped).toBeDefined();
            expect(reaped!.amount).toBeGreaterThan(0);
            const burst = reaped!.amount;

            const [eroded] = findEvents(events, 'max-hp-eroded');
            expect(eroded).toBeDefined();
            expect(eroded!.cardId).toBe('miserere');
            expect(eroded!.amount).toBe(burst);
            expect(eroded!.newMax).toBe(500 - burst);

            expect(after.enemy.maxHealth).toBe(500 - burst);
            expect(after.enemy.health).toBe(500 - burst);
            expect(after.enemy.health).toBeLessThanOrEqual(after.enemy.maxHealth);
        });

        it('erosion floors at 0 against a nearly-dead enemy (no negative maxHealth)', () => {
            // burstPerSoul 4 x 100 souls = 400, dwarfing the enemy's 5 HP.
            const before = stateFor('miserere', 100, 5, 5);
            const { events, after } = playPaid(before);

            const [eroded] = findEvents(events, 'max-hp-eroded');
            expect(eroded).toBeDefined();
            expect(eroded!.amount).toBeGreaterThan(5); // the attempted burst overkills
            expect(eroded!.newMax).toBe(0);

            expect(after.enemy.maxHealth).toBe(0);
            expect(after.enemy.health).toBe(0);
            expect(after.enemy.health).toBeLessThanOrEqual(after.enemy.maxHealth);
        });
    });

    describe("reap (single, 'the-offertory-plate')", () => {
        it('reduces both health and maxHealth by the cost-derived erosion — a NEW effect, no current-HP burst before this', () => {
            const before = stateFor('the-offertory-plate', 5, 500, 500);
            const { events, after } = playPaid(before);

            const fizzle = events.find(e => e.kind === 'effect-fizzled');
            expect(fizzle, 'unexpected fizzle').toBeUndefined();

            const cost = 3; // the-offertory-plate's specialMechanics[0].cost
            const expectedErosion = Math.round(cost * REAP_EROSION_PER_SOUL);
            expect(expectedErosion).toBe(6);

            const [reaped] = findEvents(events, 'reaped');
            expect(reaped).toBeDefined();
            expect(reaped!.soulsSpent).toBe(cost);

            const [eroded] = findEvents(events, 'max-hp-eroded');
            expect(eroded).toBeDefined();
            expect(eroded!.cardId).toBe('the-offertory-plate');
            expect(eroded!.amount).toBe(expectedErosion);
            expect(eroded!.newMax).toBe(500 - expectedErosion);

            expect(after.enemy.maxHealth).toBe(500 - expectedErosion);
            expect(after.enemy.health).toBe(500 - expectedErosion);
            expect(after.enemy.health).toBeLessThanOrEqual(after.enemy.maxHealth);
        });

        it('erosion floors at 0 against a nearly-dead enemy (no negative maxHealth)', () => {
            const before = stateFor('the-offertory-plate', 5, 2, 2);
            const { events, after } = playPaid(before);

            const [eroded] = findEvents(events, 'max-hp-eroded');
            expect(eroded).toBeDefined();
            expect(eroded!.amount).toBe(6); // round(cost 3 * REAP_EROSION_PER_SOUL)
            expect(eroded!.newMax).toBe(0);

            expect(after.enemy.maxHealth).toBe(0);
            expect(after.enemy.health).toBe(0);
        });

        it('fizzles (no erosion, no event) when Souls are insufficient', () => {
            const before = stateFor('the-offertory-plate', 1, 500, 500); // cost 2, only 1 Soul banked
            const { events, after } = playPaid(before);

            expect(events.some(e => e.kind === 'effect-fizzled')).toBe(true);
            expect(findEvents(events, 'max-hp-eroded')).toHaveLength(0);
            expect(after.enemy.maxHealth).toBe(500);
            expect(after.enemy.health).toBe(500);
        });
    });

    it('sim policies never crash across every policy and seed with a shrinking enemy ceiling (the late snapshot + the harvest package)', () => {
        // PROFANE CANON (2026-08-08): the choir's REAP cards are draft-path
        // rewards, not seated preset content — the sweep drives the late
        // campaign snapshot with the harvest package added on top.
        const harvestDeck = [...buildPresetDeck('apostate'), 'miserere', 'the-offertory-plate'];
        expect(harvestDeck.length).toBeGreaterThan(0);
        expect(harvestDeck).toContain('miserere');
        expect(harvestDeck).toContain('the-offertory-plate');

        function makePlayer(): Character {
            const p = deepClone(Player);
            p.knownCards = harvestDeck.slice();
            return p;
        }

        for (const policy of COMBAT_SIM_POLICY_ORDER) {
            for (const seed of [1, 2, 3, 11]) {
                const p = makePlayer();
                const e = deepClone(GraveLarva);
                const run = runOneEncounter(p, e, seed, policy, { deck: harvestDeck });
                expect(run.outcome).toBeDefined();
            }
        }
    });
});
