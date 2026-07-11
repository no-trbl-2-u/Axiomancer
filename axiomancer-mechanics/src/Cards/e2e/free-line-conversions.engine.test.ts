/**
 * Hermetic E2E — the WS2.2 FREE-line conversions (Phase 30 down-payment,
 * plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md).
 *
 * The `free-line-conversions` sandbox set patches the 8 WS1.5 dead-FREE-line
 * offenders onto the RATIFIED Phase 30 shape
 * (plan/tuning/2026-07-10-turn-texture.md §1, owner decision 2026-07-10):
 * Option A — the FREE line deposits the theme's NAMED currency — plus the
 * weak-deposit `DRAW 1`-class kicker amendment. This suite pins the contract:
 *
 *   1. COVERAGE — the set covers exactly the 8 offenders, as overrides only
 *      (no new cards), and the library literals stay untouched.
 *   2. LAW — every converted FREE line carries ≥1 theme-currency verb; no
 *      generic-draw-ALONE line; TICK is dead (no tickOne survives).
 *   3. EFFECTIVENESS — with the set applied, each converted FREE (top) face
 *      produces its promised kind-aware observable delta (magnitude-checked,
 *      same convention as card-effectiveness.engine.test.ts).
 *   4. BUDGET — each conversion's FREE share of the card's total points
 *      lands in the 25-35% window (`Card.free` budget law, types.ts).
 *
 * Fixture + RNG conventions follow card-effectiveness.engine.test.ts:
 * `buildFixtureState()` (rich board), `mockSequentialRng(0.5)`,
 * `vi.restoreAllMocks()` in afterEach.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard, CONVICTION_CAP } from '../../Combat/combat.engine';
import type { CombatEncounterState, CombatEvent } from '../../Combat/combat.encounter.types';
import { cardLibrary, getCardById } from '../cards.library';
import { SANDBOX_CARD_SETS, applySandboxSet } from '../cards.sandbox-sets';
import { clearSandboxCards } from '../cards.sandbox';
import { scoreCard, scoreRider } from '../cards.pricing';
import type { Card, CardRider } from '../types';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

const SET = SANDBOX_CARD_SETS['free-line-conversions']!;

/** The WS1.5 offender list — all eight dead-FREE-line cards. */
const OFFENDERS = [
    'cassandras-burden', 'common-ground', 'disarming-smile', 'glimpse',
    'half-step', 'refrain', 'sketch-of-a-thought', 'slippery-slope',
] as const;

/** Rider fields that count as a THEME-CURRENCY deposit under the ratified
 *  law (Option A). Generic utility (drawCards, conviction, healHp, guard,
 *  cleanse…) never satisfies the law alone. */
function hasThemeCurrencyVerb(free: CardRider): boolean {
    return Boolean(
        free.applyEffect        // named-state seed (MARK / RAPPORT …)
        || free.pips            // forge: RIPEN the Reserve
        || free.foretell        // oracle: PORTENT
        || free.sway            // charm: the CAPITULATE track
        || free.premises        // peroration tally
        || free.souls,          // harvest bank
    );
}

// ─── Shared helpers (kind-aware convention of the main effectiveness lint) ───

function findEvent<K extends CombatEvent['kind']>(
    events: CombatEvent[], kind: K,
): Extract<CombatEvent, { kind: K }> | undefined {
    return events.find((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function reservePips(state: CombatEncounterState): number {
    return (state.reserve ?? []).reduce((n, d) => n + (d.pips ?? 0), 0);
}

function enemyEffect(state: CombatEncounterState, effectId: string) {
    return state.enemy.effects.find(ae => ae.effectId === effectId);
}

/** Plays `cardId`'s FREE (top, dieless) face from a fresh rich fixture. */
function playFree(cardId: string): {
    before: CombatEncounterState; after: CombatEncounterState; events: CombatEvent[];
} {
    mockSequentialRng(0.5);
    const before = { ...buildFixtureState(), hand: [{ uid: 'under-test', cardId }] };
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, false);
    expect(
        events.find(e => e.kind === 'effect-fizzled'),
        `${cardId}: FREE face fizzled`,
    ).toBeUndefined();
    return { before, after, events };
}

// ─── 1. Coverage — exactly the WS1.5 offender list, overrides only ───────────

describe('free-line-conversions set — covers the WS1.5 offenders, library untouched', () => {
    it('patches exactly the 8 offender ids, and mints no new cards', () => {
        expect(SET.cards).toHaveLength(0);
        const patched = (SET.overrides ?? []).map(o => o.cardId).sort();
        expect(patched).toEqual([...OFFENDERS].sort());
    });

    it('every patch swaps ONLY the free line (promotion edits stay post-Phase-26)', () => {
        for (const { cardId, patch } of SET.overrides ?? []) {
            expect(Object.keys(patch), `${cardId}: patch must be free-only`).toEqual(['free']);
            expect(patch.free, `${cardId}: patch.free missing`).toBeDefined();
        }
    });

    it('the library literals are untouched while the sandbox is empty', () => {
        for (const { cardId, patch } of SET.overrides ?? []) {
            const base = cardLibrary.find(c => c.id === cardId)!;
            expect(base, cardId).toBeDefined();
            expect(getCardById(cardId)!.free, `${cardId}: sandbox leak`).toEqual(base.free);
            expect(base.free, `${cardId}: literal edited (WS2.2 is sandbox-only)`)
                .not.toEqual(patch.free);
        }
    });

    it('applying the set makes the merged free line live through getCardById', () => {
        applySandboxSet('free-line-conversions');
        for (const { cardId, patch } of SET.overrides ?? []) {
            expect(getCardById(cardId)!.free, cardId).toEqual(patch.free);
        }
    });
});

// ─── 2. The FREE-currency law (ratified Option A + kicker amendment) ─────────

describe('every conversion obeys the ratified FREE-currency law', () => {
    it.each((SET.overrides ?? []).map(o => [o.cardId, o.patch.free!] as const))(
        "'%s' deposits theme currency, never draws alone, never TICKs",
        (_cardId, free) => {
            expect(hasThemeCurrencyVerb(free)).toBe(true);          // deposit present
            expect(free.tickOne).toBeUndefined();                    // TICK is dead
            expect(free.tickAllDots).toBeUndefined();                // (both spellings)
        },
    );
});

// ─── 3. Effectiveness — each converted FREE face delivers on the board ───────

describe('converted FREE lines are effective (rich fixture, kind-aware deltas)', () => {
    beforeEach(() => { applySandboxSet('free-line-conversions'); });

    it('slippery-slope: plants a 1-round MARK seed and draws its kicker card', () => {
        const { before, after, events } = playFree('slippery-slope');
        const markBefore = enemyEffect(before, 'debuff_mark')!;
        const markAfter = enemyEffect(after, 'debuff_mark')!;
        expect(markAfter.intensity).toBeGreaterThan(markBefore.intensity);
        const drawn = findEvent(events, 'hand-drawn');
        expect(drawn, 'DRAW 1 kicker').toBeDefined();
        expect(drawn!.cards).toHaveLength(1);
    });

    it.each([['sketch-of-a-thought'], ['half-step']])(
        '%s: FREE ripens the Reserve by 1 pip',
        (cardId) => {
            const { before, after, events } = playFree(cardId);
            expect(reservePips(after), `${cardId}: reserve pips`).toBe(reservePips(before) + 1);
            expect(findEvent(events, 'die-ripened'), `${cardId}: die-ripened event`).toBeDefined();
        },
    );

    it.each([['glimpse'], ['cassandras-burden']])(
        '%s: FREE foretells 2 (peek + reorder, stance revealed)',
        (cardId) => {
            const { events } = playFree(cardId);
            const foretold = findEvent(events, 'foretold');
            expect(foretold, `${cardId}: foretold event`).toBeDefined();
            expect(foretold!.count, `${cardId}: FORETELL depth`).toBe(2);
        },
    );

    it('refrain: lays the MARK seed and banks its Conviction kicker', () => {
        const { before, after } = playFree('refrain');
        const markBefore = enemyEffect(before, 'debuff_mark')!;
        const markAfter = enemyEffect(after, 'debuff_mark')!;
        expect(markAfter.intensity).toBeGreaterThan(markBefore.intensity);
        expect(after.conviction).toBe(Math.min(CONVICTION_CAP, before.conviction + 1));
    });

    it('disarming-smile: FREE deposits SWAY 2 on the CAPITULATE track', () => {
        const { before, after } = playFree('disarming-smile');
        expect(after.sway).toBe((before.sway ?? 0) + 2);
    });

    it('common-ground: lays a RAPPORT foundation and a SWAY-1 deposit', () => {
        const { before, after } = playFree('common-ground');
        expect(enemyEffect(before, 'debuff_rapport')).toBeUndefined();
        const rapport = enemyEffect(after, 'debuff_rapport');
        expect(rapport, 'rapport seed missing').toBeDefined();
        expect(rapport!.intensity).toBeGreaterThanOrEqual(1);
        expect(after.sway).toBe((before.sway ?? 0) + 1);
    });
});

// ─── 4. Budget — FREE share lands in the 25-35% window ───────────────────────

describe('budget law — each conversion prices FREE at 25-35% of total points', () => {
    beforeEach(() => { applySandboxSet('free-line-conversions'); });

    it.each([...OFFENDERS].map(id => [id] as const))(
        "'%s' converted FREE share is in [0.25, 0.35]",
        (cardId) => {
            const card: Card = getCardById(cardId)!;
            const freePts = scoreRider(card.free);
            const total = scoreCard(card);
            const share = freePts / total;
            expect(share, `${cardId}: FREE ${freePts.toFixed(2)} / total ${total.toFixed(2)}`)
                .toBeGreaterThanOrEqual(0.25);
            expect(share, `${cardId}: FREE ${freePts.toFixed(2)} / total ${total.toFixed(2)}`)
                .toBeLessThanOrEqual(0.35);
        },
    );

    it('the pre-conversion library FREE lines sat OUTSIDE the window or off-currency (the offense)', () => {
        // Control leg: the conversion is a real change — for each offender the
        // ORIGINAL free line either under-deposits (<25% share) or spends its
        // budget on generic utility (draw/tick/guard-alone, no theme verb).
        for (const id of OFFENDERS) {
            const base = cardLibrary.find(c => c.id === id)!;
            const share = scoreRider(base.free) / scoreCard(base);
            const offCurrency = !hasThemeCurrencyVerb(base.free ?? {});
            expect(
                share < 0.25 || offCurrency,
                `${id}: original FREE line is neither under-window (${share.toFixed(2)}) nor off-currency`,
            ).toBe(true);
        }
    });
});
