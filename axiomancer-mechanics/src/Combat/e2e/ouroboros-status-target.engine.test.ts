/**
 * Hermetic E2E — Phase 32 part 4f (Echo — REPLAY_LAST targets the last spell
 * that LANDED A STATUS, plan/archive/2026-09-25-trim-t4/plan/phases/phase_32_theme_deep_work.md §Part 4f).
 *
 * Profane Canon (2026-08-08): the carrier moved — `ouroboros` is retired; the
 * library's `replay_last` card is now `open-every-grave` (REPLAY ×2 +
 * reprise 1). The TURNABOUT verb lost its library carrier entirely (the
 * engine mechanic survives for future cards), so the no-status play is a
 * SYNTHETIC sandbox fixture (`qa-turnabout`) per the carrier-less-verb
 * policy — the engine law under test is unchanged.
 *
 * Scope (see brief's Decisions): `lastSpellCardId` (`replay_last`'s target)
 * previously updated on EVERY PAID spell play, unconditionally — a play that
 * lands no status at all (a fizzle, a pure-mechanic burst like TURNABOUT, a
 * dieless no-op) could silently steal the echo away from the actual
 * status-landing spell the card's flavor text describes. The fix gates the
 * assignment on `landedOnEnemy` (an existing local computed from the merged
 * `allCardEvents`, which already includes any nested replay's own events) —
 * a no-status play leaves the prior status-landing spell in place.
 *
 * Covers:
 *   1. A no-status play (`qa-turnabout`, zero combatEffects) does NOT
 *      overwrite `lastSpellCardId` after a status-landing play (`the-vig`).
 *   2. A second status-landing play DOES update `lastSpellCardId` to itself
 *      (unchanged prior behavior — regression guard).
 *   3. End-to-end: the-vig -> qa-turnabout (no status) -> open-every-grave
 *      replays THE-VIG's statuses (not qa-turnabout's, which has none),
 *      proven via `effect-landed` events attributed to `open-every-grave`.
 *   4. Fresh combat starts with `lastSpellCardId: null`.
 *
 * Fixture/RNG conventions follow `charm-resolve-milestones.engine.test.ts`
 * (shared builder in `src/test-utils/card-fixture.ts`,
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { registerSandboxCards } from '../../Cards/cards.sandbox';
import { playCombatCard, initializeCombatEncounter } from '../combat.engine';
import { Player } from '../../Character/characters.mock';
import { GraveLarva } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { CombatEncounterState, CombatEvent } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

// Profane Canon: TURNABOUT has no library carrier any more — the engine verb
// lives on. A synthetic fixture card (mirroring the retired `turnabout`
// literal's mechanic line) keeps the "pure-mechanic burst, zero
// combatEffects" play under test.
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

/** CLEAN fixture, enemy stripped of pre-applied effects and a zeroed
 *  TURNABOUT ledger (so `qa-turnabout`'s burst legally fires on 0 rungs — a
 *  no-op, not a fizzle), the card under test staged in hand. The fixture's
 *  `knownCards` covers the library only, so the sandbox fixture id is added
 *  explicitly (executeCard's ownership gate). */
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

function playPaid(state: CombatEncounterState, uid = 'under-test'): { events: CombatEvent[]; after: CombatEncounterState } {
    mockSequentialRng(0.5); // neutral d20, no fumble/crit
    // Spec 33: a PAID play must name its powering die — the fixture's wild die.
    const { state: after, events } = playCombatCard(state, { uid }, true, 'fx-die');
    return { events, after };
}

/** Each PAID play spends the wild powering die (spec 33 — no drafted-die
 *  combo refresh). Re-readying it between chained test plays stands in for
 *  the next turn's fresh tray — the point under test is `lastSpellCardId`/
 *  replay targeting, not dice upkeep. */
function readyDie(state: CombatEncounterState): CombatEncounterState {
    return {
        ...state,
        dice: state.dice.map(d => (d.id === 'fx-die' ? { ...d, state: 'available' as const } : d)),
    };
}

describe('A no-status play never overwrites lastSpellCardId', () => {
    // BIG NUMBERS (2026-09-02): the-vig was rewritten to "RECOIL 3. Deal 9.
    // Afflict DOOM 5" — the MARK it used to carry is gone. It is still the
    // status-landing play this suite needs; only the status list moved.
    it('the-vig (lands DOOM) sets lastSpellCardId; a following qa-turnabout (no combatEffects) leaves it unchanged', () => {
        const first = stateFor('the-vig');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('the-vig');
        expect(firstResult.after.enemy.effects.some(e => e.effectId === 'debuff_creeping_doom')).toBe(true);

        const second: CombatEncounterState = {
            ...readyDie(firstResult.after),
            hand: [{ uid: 'under-test-2', cardId: 'qa-turnabout' }],
        };
        const secondResult = playPaid(second, 'under-test-2');

        // qa-turnabout fired (a legal 0-rung no-op burst) but landed no status.
        expect(secondResult.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(false);
        expect(secondResult.after.lastSpellCardId).toBe('the-vig'); // NOT overwritten to 'qa-turnabout'
    });
});

describe('A second status-landing play still updates lastSpellCardId (regression guard)', () => {
    it('the-vig then spoiled-poultice: lastSpellCardId moves to spoiled-poultice', () => {
        const first = stateFor('the-vig');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('the-vig');

        const second: CombatEncounterState = {
            ...readyDie(firstResult.after),
            hand: [{ uid: 'under-test-2', cardId: 'spoiled-poultice' }],
        };
        const secondResult = playPaid(second, 'under-test-2');

        expect(secondResult.events.some(e => e.kind === 'effect-landed' && e.target === 'enemy')).toBe(true);
        expect(secondResult.after.lastSpellCardId).toBe('spoiled-poultice');
    });
});

describe('End-to-end: open-every-grave replays the last STATUS-landing spell across an intervening no-status play', () => {
    it('the-vig -> qa-turnabout (no status) -> open-every-grave replays THE-VIG, not qa-turnabout', () => {
        const first = stateFor('the-vig');
        const firstResult = playPaid(first);
        expect(firstResult.after.lastSpellCardId).toBe('the-vig');

        const second: CombatEncounterState = {
            ...readyDie(firstResult.after),
            hand: [{ uid: 'under-test-2', cardId: 'qa-turnabout' }],
        };
        const secondResult = playPaid(second, 'under-test-2');
        expect(secondResult.after.lastSpellCardId).toBe('the-vig'); // still pinned

        // Ready the spent die before the 3rd play (see `readyDie`).
        const third: CombatEncounterState = {
            ...readyDie(secondResult.after),
            hand: [{ uid: 'under-test-3', cardId: 'open-every-grave' }],
        };
        const thirdResult = playPaid(third, 'under-test-3');

        // The replay (times: 2) re-lands the-vig's own printed statuses,
        // attributed under open-every-grave's own cardId by the outer
        // effect-landing loop — proof the target was the-vig, not the
        // no-status qa-turnabout (which has zero combatEffects and would
        // produce none of these).
        const landed = findEvents(thirdResult.events, 'effect-landed').filter(e => e.cardId === 'open-every-grave' && e.target === 'enemy');
        expect(landed.some(e => e.effectId === 'debuff_creeping_doom')).toBe(true);
    });
});

describe('Fresh combat starts with no replay target', () => {
    it('initializeCombatEncounter defaults lastSpellCardId to null', () => {
        const player = deepClone(Player);
        const enemy = deepClone(GraveLarva);
        const s = initializeCombatEncounter(player, enemy, ['spoiled-poultice'], 1);
        expect(s.lastSpellCardId).toBeNull();
    });
});
