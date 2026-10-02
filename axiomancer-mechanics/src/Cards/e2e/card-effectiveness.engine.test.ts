/**
 * Hermetic E2E — Card Effectiveness Lint.
 *
 * The Ouroboros-class-bug witness: a card once shipped its finisher damage
 * on the FREE line, which never fires alongside the PAID play, so the paid
 * finisher dealt literally ZERO damage while every other lint stayed green.
 *
 * This suite closes that gap: for every library card, it plays the PAID (bottom) face into ONE shared, rich precondition
 * fixture and asserts a KIND-AWARE, magnitude-checked observable delta —
 * never mere event-kind presence, since a broken payoff can still emit an
 * event with amount 0 (exactly the historical Ouroboros shape).
 *
 * Design:
 *   - `combatEffects` entries are proven via the actual before/after
 *     ActiveEffect on the target: intensity OR remainingDuration must have
 *     grown (an existing stack deepening counts; a fresh application from 0
 *     counts).
 *   - `specialMechanics` entries are proven per kind in `assertMechanic`,
 *     whose `default` branch is a TS exhaustiveness check — a future kind
 *     with no case fails both the type-check and, at runtime, with
 *     "unmapped mechanic kind".
 *   - The FREE line (`CardRider`) is proven field by field in
 *     `assertRiderPromise`.
 *
 * Card-state-construction pattern (hand/dice/draft) follows
 * `hazard-pattern-combat.engine.test.ts`; the sandbox-fixture-card and
 * `mockSequentialRng` conventions follow `cards-sandbox.engine.test.ts` and
 * neighboring Combat e2e suites. Tier 1-3 debuffs always land unconditionally
 * (`src/Combat/resist.ts`, the always-land law) and every
 * combatEffects target here uses
 * `stacking: 'intensity'` (verified against `debuffs.library.json`), so a
 * fixed RNG of 0.5 (neutral d20, no fumble/crit) is sufficient determinism —
 * no seed sweep is needed.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../../Combat/combat.engine';
import type {
    CombatEncounterState, CombatEvent,
} from '../../Combat/combat.encounter.types';
import { cardLibrary, getCardById } from '../cards.library';
import type { Card, CardSpecialMechanic, CardRider } from '../types';

afterEach(() => vi.restoreAllMocks());

// ── Known, honest defects ─────────────────────────────────────────────────────
// Empty: no card in the current library fails its strict effectiveness
// assertion. Any future regression of the Ouroboros shape belongs here as
// `{ cardId: 'diagnosis' }`, asserted below via `it.fails` (green suite, loud
// flip when fixed) — never weaken the assertion above to paper over it.
const KNOWN_INEFFECTIVE: Readonly<Record<string, string>> = {};

// ── The shared rich precondition fixture ──────────────────────────────────────
// Lives in `src/test-utils/card-fixture.ts` (WS0.4) so other suites can build
// the same player / die tray. This suite always uses the RICH default.

interface PlayResult {
    events: CombatEvent[];
    before: CombatEncounterState;
    after: CombatEncounterState;
}

function playPaid(cardId: string): PlayResult {
    mockSequentialRng(0.5); // neutral d20 (no fumble/crit) on the rare Tier-2-buff roll
    const before = { ...buildFixtureState(), hand: [{ uid: 'under-test', cardId }] };
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, true, 'fx-die');
    return { events, before, after };
}

// ── combatEffects: proven via the actual before/after ActiveEffect ───────────

function assertCombatEffectLanded(
    cardId: string,
    ce: NonNullable<Card['combatEffects']>[number],
    before: CombatEncounterState,
    after: CombatEncounterState,
): void {
    const side = ce.appliedTo === 'self' ? 'player' : 'enemy';
    const beforeAe = before[side].effects.find(a => a.effectId === ce.effectId);
    const afterAe = after[side].effects.find(a => a.effectId === ce.effectId);
    const label = `${cardId} :: combatEffects ${ce.effectId} (${side})`;
    expect(afterAe, `${label} — missing after play`).toBeDefined();
    const grew = afterAe!.intensity > (beforeAe?.intensity ?? 0)
        || afterAe!.remainingDuration > (beforeAe?.remainingDuration ?? 0);
    expect(
        grew,
        `${label} — did not deepen (intensity ${beforeAe?.intensity ?? 0}->${afterAe!.intensity}, `
        + `duration ${beforeAe?.remainingDuration ?? 0}->${afterAe!.remainingDuration})`,
    ).toBe(true);
}

// ── rider (CardRider) field-by-field assertion ────────────────────────────────

function assertRiderPromise(
    cardId: string, rider: CardRider, events: CombatEvent[],
    before: CombatEncounterState, after: CombatEncounterState,
): void {
    const label = (field: string) => `${cardId} :: rider.${field}`;
    if (rider.damage) {
        expect(
            events.some(e => e.kind === 'damage-dealt' && e.target === 'enemy' && e.amount > 0),
            label('damage'),
        ).toBe(true);
        expect(after.enemy.health, label('damage')).toBeLessThan(before.enemy.health);
    }
    if (rider.guard) {
        expect(after.guard ?? 0, label('guard')).toBeGreaterThan(before.guard ?? 0);
    }
    if (rider.applyEffect) {
        const side = rider.applyEffect.to === 'self' ? 'player' : 'enemy';
        const id = rider.applyEffect.effectId;
        const beforeAe = before[side].effects.find(a => a.effectId === id);
        const afterAe = after[side].effects.find(a => a.effectId === id);
        expect(afterAe, label('applyEffect')).toBeDefined();
        const grew = afterAe!.intensity > (beforeAe?.intensity ?? 0)
            || afterAe!.remainingDuration > (beforeAe?.remainingDuration ?? 0);
        expect(grew, label('applyEffect')).toBe(true);
    }
}

// ── specialMechanics: kind -> assertion ───────────────────────────────────────

function assertMechanic(
    card: Card, mech: CardSpecialMechanic, events: CombatEvent[],
    before: CombatEncounterState, after: CombatEncounterState,
): void {
    const label = `${card.id} :: ${mech.kind}`;
    switch (mech.kind) {
        case 'guard':
            expect(after.guard ?? 0, label).toBeGreaterThan(before.guard ?? 0);
            return;
        case 'deal': {
            // DEAL must actually move the foe's VITAE and say so in the log.
            const hits = events.filter(e => e.kind === 'damage-dealt' && e.target === 'enemy');
            expect(hits.length, `${label}: no damage-dealt event`).toBeGreaterThan(0);
            expect(after.enemy.health, label).toBeLessThan(before.enemy.health);
            return;
        }
        default: {
            // Exhaustiveness: a new CardSpecialMechanic kind with no case above
            // is a TS compile error here, AND throws loudly at runtime instead
            // of silently skipping the new verb.
            const exhaustive: never = mech;
            throw new Error(`unmapped mechanic kind: ${(exhaustive as CardSpecialMechanic).kind}`);
        }
    }
}

// ── Per-card driver ────────────────────────────────────────────────────────────

function assertCardEffective(cardId: string): void {
    const card = getCardById(cardId);
    expect(card, cardId).toBeDefined();
    const { events, before, after } = playPaid(cardId);

    // Sanity net: the shared fixture is deliberately rich enough that no
    // verb should ever fizzle. A fizzle here means either the fixture is
    // missing a precondition (fix the fixture / add a FIXTURE_OVERRIDES
    // entry) or the card is genuinely broken (move it to KNOWN_INEFFECTIVE).
    const fizzle = events.find(e => e.kind === 'effect-fizzled');
    expect(fizzle, `${cardId}: unexpected fizzle`).toBeUndefined();

    for (const ce of card!.combatEffects ?? []) {
        assertCombatEffectLanded(cardId, ce, before, after);
    }
    for (const mech of card!.specialMechanics ?? []) {
        assertMechanic(card!, mech, events, before, after);
    }
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('card effectiveness lint — every PAID face produces its promised observable delta', () => {

    const strictCases = cardLibrary
        .filter(c => !(c.id in KNOWN_INEFFECTIVE))
        .map(c => [c.id] as const);

    it.each(strictCases)(
        "'%s' PAID face produces its promised observable delta",
        (cardId) => { assertCardEffective(cardId); },
    );

    it('every card is accounted for exactly once (strict + known-ineffective == library, no silent drops)', () => {
        expect(strictCases.length + Object.keys(KNOWN_INEFFECTIVE).length).toBe(cardLibrary.length);
    });
});

// KNOWN_INEFFECTIVE is empty today (see the constant's comment above), but the
// harness stays in place: `it.fails` keeps the suite green while making a
// future regression of this exact bug shape loud (the test starts PASSING,
// i.e. `it.fails` itself fails, the moment someone "fixes" the assertion
// instead of the card).
describe.each(Object.entries(KNOWN_INEFFECTIVE))(
    'KNOWN_INEFFECTIVE — %s',
    (cardId, diagnosis) => {
        it.fails(`'${cardId}' still fails its effectiveness assertion (${diagnosis}) — flip this when fixed`, () => {
            assertCardEffective(cardId);
        });
    },
);

// ── The FREE line gets the same rigor as the PAID line ──────────────────────
// Under the FREE-currency law (turn-texture.md §1) every spell's FREE line
// deposits theme currency. This suite is `assertCardEffective`'s twin for the TOP
// (dieless) action: it reuses the exact same `assertRiderPromise` dispatch
// table, so a FREE line that authors a rider field with no real engine
// promise fails here the same way a broken PAID mechanic fails above.
// Enchant/disenchant cards are excluded — their FREE line is engine-derived
// (a timed instance of the persistent passive), never an authored `card.free`.

function playFree(cardId: string): PlayResult {
    mockSequentialRng(0.5);
    const staged = buildFixtureState();
    const before = { ...staged, hand: [{ uid: 'under-test', cardId }] };
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, false);
    return { events, before, after };
}

function assertFreeCardEffective(cardId: string): void {
    const card = getCardById(cardId);
    expect(card, cardId).toBeDefined();
    expect(card!.free, `${cardId}: no authored FREE rider`).toBeDefined();
    const { events, before, after } = playFree(cardId);
    const fizzle = events.find(e => e.kind === 'effect-fizzled');
    expect(fizzle, `${cardId} (FREE): unexpected fizzle`).toBeUndefined();
    assertRiderPromise(cardId, card!.free!, events, before, after);
}

describe('card effectiveness lint — every authored FREE line produces its promised observable delta', () => {
    const freeSpells = cardLibrary.filter(c => c.cardType === 'spell' && c.free);

    it('every spell authors a FREE rider (spec §2 FREE/PAID anatomy)', () => {
        expect(freeSpells.length).toBe(cardLibrary.filter(c => c.cardType === 'spell').length);
    });

    it.each(freeSpells.map(c => [c.id] as const))(
        "'%s' FREE face produces its promised observable delta",
        (cardId) => { assertFreeCardEffective(cardId); },
    );
});
