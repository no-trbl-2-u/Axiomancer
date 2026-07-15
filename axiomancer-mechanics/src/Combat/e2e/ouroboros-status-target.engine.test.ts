/**
 * Hermetic E2E — Phase 32 part 4f (Echo — Ouroboros targets the last spell
 * that LANDED A STATUS, plan/phases/phase_32_theme_deep_work.md §Part 4f).
 *
 * Scope (see brief's Decisions): `lastSpellCardId` (ouroboros's `replay_last`
 * target) previously updated on EVERY PAID spell play, unconditionally — a
 * play that lands no status at all (a fizzle, a pure-mechanic burst like
 * TURNABOUT, a dieless no-op) could silently steal the echo away from the
 * actual status-landing spell the card's flavor text describes. The fix
 * gates the assignment on `landedOnEnemy` (an existing local computed from
 * the merged `allCardEvents`, which already includes any nested replay's own
 * events) — a no-status play leaves the prior status-landing spell in place.
 *
 * Covers:
 *   1. A no-status play (`turnabout`, zero combatEffects) does NOT overwrite
 *      `lastSpellCardId` after a status-landing play (`refrain`).
 *   2. A second status-landing play DOES update `lastSpellCardId` to itself
 *      (unchanged prior behavior — regression guard).
 *   3. End-to-end: refrain -> turnabout (no status) -> ouroboros replays
 *      REFRAIN's statuses (not turnabout's, which has none), proven via
 *      `effect-landed` events attributed to `ouroboros`.
 *   4. Fresh combat starts with `lastSpellCardId: null`.
 *
 * Fixture/RNG conventions follow `charm-resolve-milestones.engine.test.ts`
 * (shared builder in `src/test-utils/card-fixture.ts`,
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard, initializeCombatEncounter } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture, enemy stripped of pre-applied effects and a zeroed
 *  TURNABOUT ledger (so `turnabout`'s burst legally fires on 0 rungs — a
 *  no-op, not a fizzle), the card under test staged in hand. */
function stateFor(cardId: string, overrides: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, effects: [] },
        ...overrides,
    };
}

function playPaid(state: CombatEncounterState, uid = 'under-test'): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    const { state: after, events } = playCombatCard(state, { uid }, true);
    return { events, after };
}

/** A no-status play (e.g. `turnabout`) does not "meaningfully land", so it
 *  does not refresh the drafted die per the combo-chain rule. Re-drafting
 *  between chained test plays stands in for the next turn's real draft — the
 *  point under test is `lastSpellCardId`/replay targeting, not chain upkeep. */
function redraft(state: CombatEncounterState): CombatEncounterState {
    return {
        ...state,
        dice: state.dice.map(d => (d.id === state.draftedDieId ? { ...d, state: 'available' as const } : d)),
    };
}

describe('A no-status play never overwrites lastSpellCardId', () => {
    it('refrain (lands MARK + POISON) sets lastSpellCardId; a following turnabout (no combatEffects) leaves it unchanged', () => {
        const first = stateFor('refrain');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('refrain');
        expect(firstResult.after.enemy.effects.some(e => e.effectId === 'debuff_mark')).toBe(true);
        expect(firstResult.after.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);

        const second: CombatEncounterState = {
            ...firstResult.after,
            hand: [{ uid: 'under-test-2', cardId: 'turnabout' }],
        };
        const secondResult = playPaid(second, 'under-test-2');

        // turnabout fired (a legal 0-rung no-op burst) but landed no status.
        expect(secondResult.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(false);
        expect(secondResult.after.lastSpellCardId).toBe('refrain'); // NOT overwritten to 'turnabout'
    });
});

describe('A second status-landing play still updates lastSpellCardId (regression guard)', () => {
    it('refrain then slippery-slope: lastSpellCardId moves to slippery-slope', () => {
        const first = stateFor('refrain');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('refrain');

        const second: CombatEncounterState = {
            ...firstResult.after,
            hand: [{ uid: 'under-test-2', cardId: 'slippery-slope' }],
        };
        const secondResult = playPaid(second, 'under-test-2');

        expect(secondResult.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(true);
        expect(secondResult.after.lastSpellCardId).toBe('slippery-slope');
    });
});

describe('End-to-end: ouroboros replays the last STATUS-landing spell across an intervening no-status play', () => {
    it('refrain -> turnabout (no status) -> ouroboros replays REFRAIN, not turnabout', () => {
        const first = stateFor('refrain');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('refrain');

        const second: CombatEncounterState = {
            ...firstResult.after,
            hand: [{ uid: 'under-test-2', cardId: 'turnabout' }],
        };
        const secondResult = playPaid(second, 'under-test-2');
        expect(secondResult.after.lastSpellCardId).toBe('refrain'); // still pinned

        // turnabout landed no status, so the combo-chain refresh did not
        // fire (see `redraft`'s doc comment) — redraft before the 3rd play.
        const third: CombatEncounterState = {
            ...redraft(secondResult.after),
            hand: [{ uid: 'under-test-3', cardId: 'ouroboros' }],
        };
        const thirdResult = playPaid(third, 'under-test-3');

        // The replay (times: 2) re-lands refrain's own printed statuses,
        // attributed under ouroboros's own cardId by the outer effect-landing
        // loop — proof the target was refrain, not the no-status turnabout
        // (which has zero combatEffects and would produce none of these).
        const landed = findEvents(thirdResult.events, 'effect-landed').filter(e => e.cardId === 'ouroboros' && e.target === 'enemy');
        expect(landed.some(e => e.effectId === 'debuff_mark')).toBe(true);
        expect(landed.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });
});

describe('Fresh combat starts with no replay target', () => {
    it('initializeCombatEncounter defaults lastSpellCardId to null', () => {
        const player = deepClone(Player);
        const enemy = deepClone(GraveLarva);
        const s = initializeCombatEncounter(player, enemy, ['slippery-slope'], 1);
        expect(s.lastSpellCardId).toBeNull();
    });
});
