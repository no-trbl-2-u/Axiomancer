/**
 * Hermetic E2E — Phase 39 (2026-08-08) precondition-width retune: REPLAY_LAST
 * only replays a status-landing spell that landed THIS TURN.
 *
 * Profane Canon (2026-08-08): the carrier moved — `ouroboros` is retired; the
 * library's `replay_last` card is now `open-every-grave` (REPLAY ×2 +
 * reprise 1). `slippery-slope`'s role (weak poison starter) is now
 * `spoiled-poultice`. TURNABOUT lost its library carrier (engine verb
 * survives), so the no-status play is a SYNTHETIC sandbox fixture
 * (`qa-turnabout`) per the carrier-less-verb policy.
 *
 * Before this phase, `lastSpellCardId` never reset across turns — once ANY
 * spell had landed a status, the replay card essentially never fizzled again
 * for the rest of the combat (measured 3-10% fizz, far under the ~25%
 * doctrine target the Card Ledger dashboard's dupCandidate/fizz-gate
 * methodology calls for). The fix pairs `lastSpellCardId` with a NEW
 * `lastSpellRound` stamp (set on the identical `landedOnEnemy` condition)
 * and requires `state.lastSpellRound === state.round` before REPLAY_LAST is
 * eligible — "the argument you just made THIS turn", not "ever this combat".
 *
 * Covers:
 *   1. A status-landing spell from a PRIOR round (round stamp behind the
 *      current round) is NOT a legal replay target — open-every-grave fizzles.
 *   2. The identical setup, but the status-landing spell's round stamp
 *      matches the CURRENT round — open-every-grave replays it (regression
 *      guard, matching `ouroboros-status-target.engine.test.ts`'s existing
 *      same-round coverage).
 *   3. `lastSpellRound` is written alongside `lastSpellCardId` on a REAL
 *      play (not just fixture-injected), on the identical `landedOnEnemy`
 *      gate — a no-status play (`qa-turnabout`) updates neither field.
 *
 * Fixture/RNG conventions follow `ouroboros-status-target.engine.test.ts`
 * (shared builder in `src/test-utils/card-fixture.ts`,
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { playCombatCard } from '../combat.engine';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// Profane Canon: TURNABOUT has no library carrier any more — a synthetic
// fixture (mirroring the retired `turnabout` literal's mechanic line) keeps
// the "pure-mechanic burst, zero combatEffects" play under test.
registerSandboxCards([
    {
        id: 'qa-turnabout', name: 'QA Turnabout',
        philosophicalAspect: 'mind', description: 'carrier-less TURNABOUT fixture',
        tier: 3, rank: 6, cardType: 'spell', targetType: 'enemy',
        specialMechanics: [{ kind: 'turnabout', burstPerRung: 1.5 }],
    },
]);

function findEvents<K extends CombatEvent['kind']>(events: CombatEvent[], kind: K): Extract<CombatEvent, { kind: K }>[] {
    return events.filter((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** CLEAN fixture, enemy stripped of pre-applied effects, the card under test
 *  staged in hand — mirrors `ouroboros-status-target.engine.test.ts`'s
 *  `stateFor` (including the sandbox fixture's ownership-gate entry). */
function stateFor(cardId: string, overrides: Partial<CombatEncounterState> = {}): CombatEncounterState {
    const s = buildFixtureState({ clean: true });
    return {
        ...s,
        player: { ...s.player, knownCards: [...s.player.knownCards, 'qa-turnabout'] },
        hand: [{ uid: 'under-test', cardId }],
        enemy: { ...s.enemy, effects: [] },
        ...overrides,
    };
}

function playPaid(state: CombatEncounterState): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    // Spec 33: a PAID play must name its powering die — the fixture's wild die.
    const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
    return { events, after };
}

describe('open-every-grave REPLAY_LAST — the replay target must have landed THIS round', () => {
    it('fizzles when lastSpellCardId is real but lastSpellRound is a PRIOR round', () => {
        // round 3, but the pinned replay target landed back on round 1 —
        // an intervening turn (or two) has passed since "the argument you
        // just made".
        const s = stateFor('open-every-grave', {
            round: 3,
            lastSpellCardId: 'spoiled-poultice',
            lastSpellRound: 1,
        });
        const { events, after } = playPaid(s);

        const fizzle = events.find(e => e.kind === 'effect-fizzled' && e.cardId === 'open-every-grave');
        expect(fizzle, 'open-every-grave must fizzle: its pinned target landed a stale round ago').toBeDefined();
        expect(after.enemy.effects.length, 'a fizzled replay lands nothing').toBe(0);
    });

    it('replays when lastSpellRound matches the CURRENT round (regression guard)', () => {
        const s = stateFor('open-every-grave', {
            round: 3,
            lastSpellCardId: 'spoiled-poultice',
            lastSpellRound: 3,
        });
        const { events, after } = playPaid(s);

        expect(events.some(e => e.kind === 'effect-fizzled' && e.cardId === 'open-every-grave' && e.message === 'no prior spell to replay')).toBe(false);
        const landed = findEvents(events, 'effect-landed').filter(e => e.cardId === 'open-every-grave' && e.target === 'enemy');
        // spoiled-poultice's own PAID line lands POISON — the replay
        // (times: 2) re-lands it, attributed to open-every-grave.
        expect(landed.some(e => e.effectId === 'debuff_poison')).toBe(true);
        expect(after.enemy.effects.some(e => e.effectId === 'debuff_poison')).toBe(true);
    });

    it('a real status-landing play writes lastSpellRound to the round it landed on', () => {
        const s = stateFor('spoiled-poultice', { round: 5, lastSpellCardId: null, lastSpellRound: undefined });
        const { after } = playPaid(s);
        expect(after.lastSpellCardId).toBe('spoiled-poultice');
        expect(after.lastSpellRound).toBe(5);
    });

    it('a no-status play (qa-turnabout) leaves both lastSpellCardId and lastSpellRound untouched', () => {
        const s = stateFor('qa-turnabout', { round: 5, lastSpellCardId: 'spoiled-poultice', lastSpellRound: 2, rungsDeniedTotal: 0 });
        const { events, after } = playPaid(s);

        expect(events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(false);
        expect(after.lastSpellCardId).toBe('spoiled-poultice'); // unchanged
        expect(after.lastSpellRound).toBe(2); // unchanged — NOT bumped to round 5
    });
});
