/**
 * Hermetic E2E — Phase 39 (2026-08-08) precondition-width retune: OUROBOROS
 * (`replay_last`) only replays a status-landing spell that landed THIS TURN.
 *
 * Before this phase, `lastSpellCardId` never reset across turns — once ANY
 * spell had landed a status, ouroboros essentially never fizzled again for
 * the rest of the combat (measured 3-10% fizz, far under the ~25% doctrine
 * target the Card Ledger dashboard's dupCandidate/fizz-gate methodology
 * calls for). The fix pairs `lastSpellCardId` with a NEW `lastSpellRound`
 * stamp (set on the identical `landedOnEnemy` condition) and requires
 * `state.lastSpellRound === state.round` before REPLAY_LAST is eligible —
 * "the argument you just made THIS turn", not "ever this combat".
 *
 * Covers:
 *   1. A status-landing spell from a PRIOR round (round stamp behind the
 *      current round) is NOT a legal replay target — ouroboros fizzles.
 *   2. The identical setup, but the status-landing spell's round stamp
 *      matches the CURRENT round — ouroboros replays it (regression guard,
 *      matching `ouroboros-status-target.engine.test.ts`'s existing
 *      same-round coverage).
 *   3. `lastSpellRound` is written alongside `lastSpellCardId` on a REAL
 *      play (not just fixture-injected), on the identical `landedOnEnemy`
 *      gate — a no-status play (`turnabout`) updates neither field.
 *
 * Fixture/RNG conventions follow `ouroboros-status-target.engine.test.ts`
 * (shared builder in `src/test-utils/card-fixture.ts`,
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../combat.engine';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture, enemy stripped of pre-applied effects, the card under test
 *  staged in hand — mirrors `ouroboros-status-target.engine.test.ts`'s
 *  `stateFor`. */
function stateFor(cardId: string, overrides: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, effects: [] },
        ...overrides,
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true);
    return { events, after };
}

describe('ouroboros REPLAY_LAST — the replay target must have landed THIS round', () => {
    it('fizzles when lastSpellCardId is real but lastSpellRound is a PRIOR round', () => {
        // round 3, but the pinned replay target landed back on round 1 —
        // an intervening turn (or two) has passed since "the argument you
        // just made".
        const s = stateFor('ouroboros', {
            round: 3,
            lastSpellCardId: 'slippery-slope',
            lastSpellRound: 1,
        });
        const { events, after } = playPaid(s);

        const fizzle = events.find(e => e.kind === 'effect-fizzled' && e.cardId === 'ouroboros');
        expect(fizzle, 'ouroboros must fizzle: its pinned target landed a stale round ago').toBeDefined();
        expect(after.enemy.effects.length, 'a fizzled replay lands nothing').toBe(0);
    });

    it('replays when lastSpellRound matches the CURRENT round (regression guard)', () => {
        const s = stateFor('ouroboros', {
            round: 3,
            lastSpellCardId: 'slippery-slope',
            lastSpellRound: 3,
        });
        const { events, after } = playPaid(s);

        expect(events.some(e => e.kind === 'effect-fizzled' && e.cardId === 'ouroboros')).toBe(false);
        const landed = findEvents(events, 'effect-landed').filter(e => e.cardId === 'ouroboros' && e.target === 'enemy');
        // slippery-slope's own PAID line lands POISON — the replay (times: 2)
        // re-lands it, attributed to ouroboros.
        expect(landed.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(after.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });

    it('a real status-landing play writes lastSpellRound to the round it landed on', () => {
        const s = stateFor('slippery-slope', { round: 5, lastSpellCardId: null, lastSpellRound: undefined });
        const { after } = playPaid(s);
        expect(after.lastSpellCardId).toBe('slippery-slope');
        expect(after.lastSpellRound).toBe(5);
    });

    it('a no-status play (turnabout) leaves both lastSpellCardId and lastSpellRound untouched', () => {
        const s = stateFor('turnabout', { round: 5, lastSpellCardId: 'slippery-slope', lastSpellRound: 2, rungsDeniedTotal: 0 });
        const { events, after } = playPaid(s);

        expect(events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(false);
        expect(after.lastSpellCardId).toBe('slippery-slope'); // unchanged
        expect(after.lastSpellRound).toBe(2); // unchanged — NOT bumped to round 5
    });
});
