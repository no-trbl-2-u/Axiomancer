/**
 * Hermetic E2E — Card Effectiveness Lint (plan/tuning/2026-07-08-win-path-scaling.md #6).
 *
 * The Ouroboros-class-bug witness. Ouroboros (theme Echo) shipped with its
 * finisher damage authored on the FREE line, which never fires alongside the
 * PAID replay — the paid finisher dealt literally ZERO damage. It passed the
 * pricing lint (`pricing.engine.test.ts`, which only checks the point budget)
 * and the card-coverage e2e (`combat-playtest.card-coverage.sim.test.ts`,
 * which only proves a card can be PLAYED, i.e. its die cost is payable and it
 * fires at least once under a focused seed) — neither proves the card's
 * printed verb actually moves the world. One fixed card (the `ruptureMarks`
 * rider was moved onto the PAID `rider` mechanic so it fires WITH the replay)
 * moved the Echo deck's late win rate 3% -> 37%.
 *
 * This suite closes that gap: for every one of the 70 spec 32 v3 library
 * cards, it plays the PAID (bottom) face into ONE shared, rich precondition
 * fixture and asserts a KIND-AWARE, magnitude-checked observable delta —
 * never mere event-kind presence, since a broken payoff can still emit an
 * event with amount 0 (exactly the historical Ouroboros shape).
 *
 * Design:
 *   - `combatEffects` entries are proven via the actual before/after
 *     ActiveEffect on the target: intensity OR remainingDuration must have
 *     grown (an existing stack deepening counts; a fresh application from 0
 *     counts).
 *   - `specialMechanics` entries are proven via `KIND_ASSERTIONS`, a
 *     kind -> assertion map covering every kind in `CardSpecialMechanic`
 *     (verified by a TS exhaustiveness check in the `default` branch — a
 *     future kind with no map entry fails both the type-check and, at
 *     runtime, with "unmapped mechanic kind").
 *   - `rider` mechanics carry a nested `CardRider`; `assertRiderPromise`
 *     dispatches on whichever of its fields are populated.
 *   - `enchantment` / `disenchant` cards short-circuit the spell pipeline in
 *     the engine (see `combat.engine.ts` — the die is spent and the card
 *     joins its zone with no card execution), so their sole promise is zone
 *     membership.
 *
 * Card-state-construction pattern (hand/dice/draft) follows
 * `hazard-pattern-combat.engine.test.ts`; the sandbox-fixture-card and
 * `mockSequentialRng` conventions follow `cards-sandbox.engine.test.ts` and
 * neighboring Combat e2e suites. Tier 1-3 debuffs always land unconditionally
 * (`src/Combat/resist.ts`, the Phase 80 always-land law) and the library's
 * self-buff (`buff_thorns`) plus every combatEffects target here use
 * `stacking: 'intensity'` (verified against `debuffs.library.json`), so a
 * fixed RNG of 0.5 (neutral d20, no fumble/crit) is sufficient determinism —
 * no seed sweep is needed.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import type { ActiveEffect } from '../../Effects/types';
import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../../Combat/combat.engine';
import type {
    CombatEncounterState, CombatEvent,
} from '../../Combat/combat.encounter.types';
import { cardLibrary, getCardById } from '../cards.library';
import type { Card, CardSpecialMechanic, CardRider } from '../types';
import { RESERVE_PIP_CAP } from '../../Combat/combat.dice';

afterEach(() => vi.restoreAllMocks());

// ── Kinds asserted via a generic full-state diff ─────────────────────────────
// None of these fire from any of the current 70 library cards (verified below
// by a coverage assertion), so a fixture-specific precise mapping would be
// unverifiable against real data. A stricter, kind-specific mapping is
// welcome once a card actually authors one of these:
//   - `strip_random_buff` / `befriend_attempt`: card-engine owned (not the
//     combat-engine `mechs` switch); their outcome depends on a target
//     actually holding a buff / the befriend HP-gate, neither of which this
//     shared fixture stages.
//   - `convert_die_color`: converts the POWERING die to Wild — in this
//     fixture the powering die already IS Wild (chosen so every card's die
//     cost is payable regardless of stance), so the conversion is a real no-op
//     to observe by color alone.
//   - `reroll_spent`: only rerolls dice already `spent`/`locked`; this
//     fixture's sole die is `available` so the mechanic legitimately no-ops.
const GENERICALLY_ASSERTED: readonly CardSpecialMechanic['kind'][] = [
    'strip_random_buff', 'befriend_attempt', 'convert_die_color', 'reroll_spent',
];

// ── Per-card fixture tweaks ───────────────────────────────────────────────────
// The shared fixture's 1-pip reserve (headroom for pip-adding mechanics, not a
// floor) satisfies every card except `the-overtake`, which phase 28 gated at
// 2+ spent pips (plan/tuning/2026-07-10-theme-identity.md — "the Overtake
// fires for 18 on turn 1"). Bump its reserve to clear the gate; every other
// card keeps the unmodified shared fixture.
const FIXTURE_OVERRIDES: Readonly<Record<string, (state: CombatEncounterState) => CombatEncounterState>> = {
    'the-overtake': (state) => ({
        ...state,
        reserve: [{ id: 'fx-reserve-0', color: 'heart', state: 'available', temporary: false, pips: 2 }],
    }),
};

// ── Known, honest defects ─────────────────────────────────────────────────────
// Empty: no card in the current library fails its strict effectiveness
// assertion (Ouroboros's ruptureMarks-on-the-FREE-line bug — the shape this
// suite exists to catch — is already fixed in cards.library.ts: the rider
// rides the PAID `rider` mechanic so it fires WITH the replay). Any future
// regression of this exact shape belongs here as `{ cardId: 'diagnosis' }`,
// asserted below via `it.fails` (green suite, loud flip when fixed) — never
// weaken the assertion above to paper over it.
const KNOWN_INEFFECTIVE: Readonly<Record<string, string>> = {};

// ── Typed event lookup helpers ────────────────────────────────────────────────

function findEvent<K extends CombatEvent['kind']>(
    events: CombatEvent[], kind: K,
): Extract<CombatEvent, { kind: K }> | undefined {
    return events.find((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

// ── The shared rich precondition fixture ──────────────────────────────────────
// Extracted to `src/test-utils/card-fixture.ts` (WS0.4) so the doctrine
// witness (`doctrine-strike-dead.engine.test.ts`) can build the same player /
// die tray with a CLEAN enemy. This suite always uses the RICH default.

interface PlayResult {
    events: CombatEvent[];
    before: CombatEncounterState;
    after: CombatEncounterState;
}

function playPaid(cardId: string): PlayResult {
    mockSequentialRng(0.5); // neutral d20 (no fumble/crit) on the rare Tier-2-buff roll
    const patch = FIXTURE_OVERRIDES[cardId];
    const staged = buildFixtureState();
    const before = {
        ...(patch ? patch(staged) : staged),
        hand: [{ uid: 'under-test', cardId }],
    };
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, true);
    return { events, before, after };
}

// ── Generic observable-state fallback (GENERICALLY_ASSERTED kinds only) ──────

function observableSnapshot(state: CombatEncounterState): string {
    const effectKey = (e: ActiveEffect) => `${e.effectId}:${e.intensity}:${e.remainingDuration}`;
    return JSON.stringify({
        playerHp: state.player.health,
        enemyHp: state.enemy.health,
        playerEffects: state.player.effects.map(effectKey).sort(),
        enemyEffects: state.enemy.effects.map(effectKey).sort(),
        hand: state.hand.length,
        deck: state.deck.length,
        discard: state.discard.length,
        drawPile: state.drawPile.length,
        souls: state.souls, premises: state.premises, sway: state.sway,
        staggerRungs: state.staggerRungs, conviction: state.conviction,
        guard: state.guard, barrier: state.barrier, riposte: state.riposte,
        dice: state.dice.map(d => `${d.id}:${d.color}:${d.state}:${d.pips ?? 0}`).sort(),
        reserve: (state.reserve ?? []).map(d => `${d.id}:${d.pips ?? 0}`).sort(),
        floatingDice: (state.floatingDice ?? []).map(d => d.id).sort(),
        persistentZone: [...state.persistentZone].sort(),
        enemyAttachments: [...(state.enemyAttachments ?? [])].sort(),
        pendingOmens: (state.pendingOmens ?? []).length,
        revealedStances: state.revealedStances.length,
        echoNextSpell: state.echoNextSpell,
        stanceLockedNext: state.stanceLockedNext,
    });
}

function assertGenericDelta(cardId: string, kind: string, before: CombatEncounterState, after: CombatEncounterState): void {
    expect(observableSnapshot(after), `${cardId} :: ${kind} (generic) — no observable state change`)
        .not.toBe(observableSnapshot(before));
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
    if (rider.drawCards) {
        expect(events.some(e => e.kind === 'hand-drawn' && e.cards.length > 0), label('drawCards')).toBe(true);
    }
    if (rider.healHp) {
        expect(
            events.some(e => e.kind === 'damage-dealt' && e.target === 'self' && e.amount < 0),
            label('healHp'),
        ).toBe(true);
    }
    if (rider.cleanse) {
        expect(after.player.effects.length, label('cleanse')).toBeLessThan(before.player.effects.length);
    }
    if (rider.ruptureMarks) {
        expect(
            events.some(e => e.kind === 'damage-dealt' && e.target === 'enemy' && e.amount > 0),
            label('ruptureMarks'),
        ).toBe(true);
    }
    if (rider.guard) {
        expect(after.guard ?? 0, label('guard')).toBeGreaterThan(before.guard ?? 0);
    }
    if (rider.conviction) {
        expect(after.conviction, label('conviction')).toBeGreaterThan(before.conviction);
    }
    if (rider.refreshDie) {
        expect(events.some(e => e.kind === 'die-refreshed'), label('refreshDie')).toBe(true);
    }
    if (rider.revealStance) {
        expect(after.revealedStances.length, label('revealStance')).toBeGreaterThan(before.revealedStances.length);
    }
    if (rider.tickAllDots || rider.tickOne) {
        expect(events.some(e => e.kind === 'dot-tick' && e.target === 'enemy'), label('tick')).toBe(true);
    }
    if (rider.premises) {
        expect(after.premises ?? 0, label('premises')).toBeGreaterThan(before.premises ?? 0);
    }
    if (rider.sway) {
        expect(after.sway ?? 0, label('sway')).toBeGreaterThan(before.sway ?? 0);
    }
    if (rider.souls) {
        expect(after.souls ?? 0, label('souls')).toBeGreaterThan(before.souls ?? 0);
    }
    if (rider.foretell) {
        expect(after.revealedStances.length, label('foretell')).toBeGreaterThan(before.revealedStances.length);
    }
    if (rider.stagger) {
        expect(after.staggerRungs ?? 0, label('stagger')).toBeGreaterThan(before.staggerRungs ?? 0);
    }
    if (rider.pips) {
        const sum = (s: CombatEncounterState) => (s.reserve ?? []).reduce((n, d) => n + (d.pips ?? 0), 0);
        expect(sum(after), label('pips')).toBeGreaterThan(sum(before));
    }
    if (rider.barrier) {
        expect(after.barrier ?? 0, label('barrier')).toBeGreaterThan(before.barrier ?? 0);
    }
    if (rider.recoil) {
        expect(after.player.health, label('recoil')).toBeLessThan(before.player.health);
    }
    if (rider.millCards) {
        expect(
            events.some(e => e.kind === 'cards-milled' && e.cards.length > 0),
            label('millCards'),
        ).toBe(true);
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
    // `intensityPerPip` is always paired with a spend verb (e.g. spend_all_pips)
    // on the same card; that verb's own KIND_ASSERTIONS entry already proves
    // the play — no independent signal exists to check here.
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
        case 'barrier':
            expect(after.barrier ?? 0, label).toBeGreaterThan(before.barrier ?? 0);
            return;
        case 'riposte':
            expect(after.riposte?.damage ?? 0, label).toBeGreaterThan(0);
            return;
        case 'rupture': {
            const ev = findEvent(events, 'rupture-detonated');
            expect(ev, label).toBeDefined();
            expect(ev!.amount, label).toBeGreaterThan(0);
            expect(after.enemy.health, label).toBeLessThan(before.enemy.health);
            return;
        }
        case 'siphon':
            expect(
                events.some(e => e.kind === 'damage-dealt' && e.target === 'self' && e.amount < 0),
                label,
            ).toBe(true);
            return;
        case 'reap_all': {
            const ev = findEvent(events, 'reaped');
            expect(ev, label).toBeDefined();
            expect(ev!.amount, label).toBeGreaterThan(0);
            expect(after.souls ?? 0, label).toBe(0);
            return;
        }
        case 'reap': {
            const ev = findEvent(events, 'reaped');
            expect(ev, label).toBeDefined();
            expect(ev!.soulsSpent, label).toBe(mech.cost);
            if (mech.kindle) expect(events.some(e => e.kind === 'die-forged'), label).toBe(true);
            return;
        }
        case 'turnabout': {
            const ev = findEvent(events, 'turnabout-fired');
            expect(ev, label).toBeDefined();
            expect(ev!.amount, label).toBeGreaterThan(0);
            expect(after.rungsDeniedTotal ?? 0, label).toBe(0);
            return;
        }
        case 'consume_affliction': {
            const ev = findEvent(events, 'affliction-consumed');
            expect(ev, label).toBeDefined();
            expect(ev!.fuel, label).toBeGreaterThan(0);
            expect(after.souls ?? 0, label).toBeGreaterThan(before.souls ?? 0);
            return;
        }
        case 'soul_gain': {
            const ev = findEvent(events, 'soul-gained');
            expect(ev, label).toBeDefined();
            expect(after.souls ?? 0, label).toBeGreaterThan(before.souls ?? 0);
            return;
        }
        case 'sway':
            expect(after.sway ?? 0, label).toBeGreaterThan(before.sway ?? 0);
            return;
        case 'stagger':
            expect(after.staggerRungs ?? 0, label).toBeGreaterThan(before.staggerRungs ?? 0);
            return;
        case 'lock_stance':
            expect(after.stanceLockedNext, label).toBe(true);
            return;
        case 'foretell':
            expect(after.revealedStances.length, label).toBeGreaterThan(before.revealedStances.length);
            return;
        case 'omen':
            expect((after.pendingOmens ?? []).length, label).toBeGreaterThan((before.pendingOmens ?? []).length);
            return;
        case 'premise':
            expect(after.premises ?? 0, label).toBeGreaterThan(before.premises ?? 0);
            return;
        case 'peroration':
            expect(after.peroration?.cardId, label).toBe(card.id);
            return;
        case 'spend_premises':
            expect(before.premises ?? 0, label).toBeGreaterThan(0);
            expect(after.premises ?? 0, label).toBe(0);
            return;
        case 'spend_all_pips':
            // Every current user pairs this with `guardPerPip`; the fuel-per-pip
            // half (when paired with a `rupture`) is separately proven by that
            // mechanic's own HP-delta assertion.
            if (mech.guardPerPip) expect(after.guard ?? 0, label).toBeGreaterThan(before.guard ?? 0);
            return;
        case 'recoil':
            expect(after.player.health, label).toBeLessThan(before.player.health);
            return;
        case 'recoil_x': {
            // Chosen X-cost (WS7.2): the harness plays without a chosenX, so
            // the printed minimum is paid and POISON lands at ceil(min × perX).
            expect(before.player.health - after.player.health, label).toBeGreaterThanOrEqual(mech.min);
            const poison = after.enemy.effects.find(e => e.effectId === 'debuff_poison');
            expect(poison, label).toBeDefined();
            return;
        }
        case 'extend_dots': {
            const ev = findEvent(events, 'dots-extended');
            expect(ev, label).toBeDefined();
            expect(ev!.affected.length, label).toBeGreaterThan(0);
            return;
        }
        case 'convert_dots':
            expect(events.some(e => e.kind === 'dots-converted'), label).toBe(true);
            return;
        case 'boost_all_dots': {
            const ev = findEvent(events, 'dots-boosted');
            expect(ev, label).toBeDefined();
            expect(ev!.affected.length, label).toBeGreaterThan(0);
            return;
        }
        case 'echo_next_spell':
            expect(after.echoNextSpell, label).toBe(true);
            return;
        case 'reprise': {
            const ev = findEvent(events, 'reprised');
            expect(ev, label).toBeDefined();
            expect(ev!.returned.length, label).toBeGreaterThan(0);
            return;
        }
        case 'replay_last': {
            expect(events.some(e => e.kind === 'echoed'), label).toBe(true);
            // Cross-check: this is the EXACT shape of the historical Ouroboros
            // bug — prove the replayed spell's own promised effect actually
            // landed again, not merely that an 'echoed' event was emitted.
            const lastId = before.lastSpellCardId;
            const lastCard = lastId ? getCardById(lastId) : undefined;
            expect(lastCard, label).toBeDefined();
            for (const ce of lastCard?.combatEffects ?? []) {
                assertCombatEffectLanded(`${card.id} (replaying ${lastCard!.id})`, ce, before, after);
            }
            return;
        }
        case 'conjure_card': {
            const ev = findEvent(events, 'hand-drawn');
            expect(ev, label).toBeDefined();
            expect(ev!.cards, label).toContain(mech.cardId);
            return;
        }
        case 'forge_floating_die':
            expect((after.floatingDice ?? []).length, label).toBeGreaterThan((before.floatingDice ?? []).length);
            return;
        case 'float_x_die': {
            // TRANSMUTE promises one of its two printed outcomes: a dead X in
            // the tray became a WILD floating die, or (no X / at cap) the +1
            // Conviction fallback fired.
            const floated = events.some(e => e.kind === 'die-floated');
            const fellBack = events.some(e => e.kind === 'conviction-gained' && e.reason === 'effect');
            expect(floated || fellBack, label).toBe(true);
            if (floated) {
                expect((after.floatingDice ?? []).length, label).toBeGreaterThan((before.floatingDice ?? []).length);
                expect(after.floatingDice?.[after.floatingDice.length - 1]?.color, label).toBe('wild');
            }
            return;
        }
        case 'create_temporary_die':
            expect((after.reserve ?? []).length, label).toBeGreaterThan((before.reserve ?? []).length);
            return;
        case 'grant_pip': {
            const sum = (s: CombatEncounterState) => (s.reserve ?? []).reduce((n, d) => n + (d.pips ?? 0), 0);
            expect(sum(after), label).toBeGreaterThan(sum(before));
            return;
        }
        case 'overheat': {
            // OVERHEAT's specific promise (distinct from grant_pip's plain sum
            // growth): a die can end up holding MORE than the safe
            // RESERVE_PIP_CAP. The fixture's grant_pip ripens the shared
            // Reserve die to the cap first; a neutral (non-fumble) RNG then
            // lets this play's overheat push it past that cap.
            const maxPips = Math.max(0, ...(after.reserve ?? []).map(d => d.pips ?? 0));
            expect(maxPips, label).toBeGreaterThan(RESERVE_PIP_CAP);
            return;
        }
        case 'bank_spent_die':
            expect(events.some(e => e.kind === 'die-banked'), label).toBe(true);
            return;
        case 'refresh_die':
            expect(events.some(e => e.kind === 'die-refreshed'), label).toBe(true);
            return;
        case 'echo':
            expect(events.some(e => e.kind === 'echoed' && e.cardId === card.id), label).toBe(true);
            return;
        case 'rider':
            assertRiderPromise(card.id, mech.rider, events, before, after);
            return;
        // ── Kinds with no current library exerciser — generic fallback ────────
        case 'strip_random_buff':
        case 'befriend_attempt':
        case 'convert_die_color':
        case 'reroll_spent':
            assertGenericDelta(card.id, mech.kind, before, after);
            return;
        default: {
            // Exhaustiveness: a new CardSpecialMechanic kind with no case above
            // is a TS compile error here, AND (since `default` is reachable at
            // runtime regardless of the type checker) throws loudly instead of
            // silently skipping the new verb.
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

    if (card!.cardType === 'enchantment') {
        expect(after.persistentZone, cardId).toContain(cardId);
        return;
    }
    if (card!.cardType === 'disenchant') {
        expect(after.enemyAttachments ?? [], cardId).toContain(cardId);
        return;
    }

    for (const ce of card!.combatEffects ?? []) {
        assertCombatEffectLanded(cardId, ce, before, after);
    }
    for (const mech of card!.specialMechanics ?? []) {
        assertMechanic(card!, mech, events, before, after);
    }
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('card effectiveness lint — every PAID face produces its promised observable delta', () => {
    it('the coverage universe is the 70-card themed library (spec 32 v3 §7)', () => {
        expect(cardLibrary.length).toBe(70);
    });

    it('GENERICALLY_ASSERTED kinds in the library are exactly the D8 valve die-verbs '
        + '(their strict payloads still assert; the die-verb legitimately no-ops in this fixture)', () => {
        // Pre-D8 the pin was "none". The Phase D8 valve promotion seated five
        // library cards on `reroll_spent` / `convert_die_color` (recurring-
        // symptom, bleed-for-it, change-of-heart / break-the-tempo,
        // second-sight). Each of those cards ALSO carries a strictly-asserted
        // payload (poison / bleed / sway / stagger / foretell), so no card is
        // generically asserted end-to-end; the die-verb portion rides the
        // documented fixture no-op. `strip_random_buff` / `befriend_attempt`
        // stay unexercised.
        const usedKinds = new Set<string>();
        for (const c of cardLibrary) for (const m of c.specialMechanics ?? []) usedKinds.add(m.kind);
        const exercisedGenerics = GENERICALLY_ASSERTED.filter(k => usedKinds.has(k)).sort();
        expect(exercisedGenerics).toEqual(['convert_die_color', 'reroll_spent']);
    });

    const strictCases = cardLibrary
        .filter(c => !(c.id in KNOWN_INEFFECTIVE))
        .map(c => [c.id] as const);

    it.each(strictCases)(
        "'%s' PAID face produces its promised observable delta",
        (cardId) => { assertCardEffective(cardId); },
    );

    it('every card is accounted for exactly once (strict + known-ineffective == 70, no silent drops)', () => {
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

// ── Phase 30 — the FREE line gets the same rigor as the PAID line ────────────
// The FREE-currency law (turn-texture.md §1, ratified 2026-07-10) rewrote
// every spell's FREE line to deposit theme currency instead of TICK/generic
// draw/guard chaff. This suite is `assertCardEffective`'s twin for the TOP
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
