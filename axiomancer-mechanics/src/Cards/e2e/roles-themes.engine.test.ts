/**
 * Hermetic E2E — the WS4 theme-role sandbox sets
 * (plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md, WS4.1
 * forge + WS4.2 bulwark by the Themes A agent; WS4.3 charm + WS4.4 harvest by
 * the Themes B agent; ratified constraints: spec 32 §12 "Ratified 2026-07-11"
 * items 4-5).
 *
 * Pinned here:
 *   1. REGISTRY — `roles-forge` / `roles-bulwark` / `roles-charm` /
 *      `roles-harvest` exist, carry exactly the ratified cards (no
 *      `consume_defense` — item 4 rejected it; no Steadfast Regard /
 *      Crescendo of Affection — item 4 keeps them CONDITIONAL on
 *      post-Phase-26/27 telemetry; no max-HP REAP — that is Phase 32's own
 *      item), and every spell prices inside its printed rank band
 *      (`scoreCard` is the court).
 *   2. SLAG RUNOFF (WS4.1) — RIPEN lands pips while there is room; every pip
 *      with NO room (Reserve at `RESERVE_PIP_CAP`, or empty) converts into a
 *      Kindling Ember on the foe (the KINDLE-species drill, WS10.3).
 *   3. INGOT OF RUIN (WS4.1) — the uncapped ALL-spender: MARK ×1 per 2 pips
 *      spent (spec 32 §12 item 5 — no flat floor/cap), then the payoff-class
 *      closer (`ruptureMarks` — fires the WS3 'payoff' clock, NOT the dead
 *      TICK keyword) cashes every MARK. Doctrine witness: on a clean board
 *      (no pips beyond its own, no marks) it chips NOTHING.
 *   4. GRIT BETWEEN STONES (WS4.2) — non-reactive Nettle Sting + Guard + the
 *      payoff-class mark closer.
 *   5. THE UNMOVED MOVER (WS4.2) — the first combat-ledger condition card:
 *      the CardSynergy state predicate `enemy-dealt-no-damage-last-round`
 *      reads `enemyDamageLastRound` (spec 32 §12 item 4 ledger); rider fires
 *      ONLY while the ledger is 0, and prices at the threshold ×0.5 discount.
 *   6. A SWEETER POISON (WS4.3) — PLEA + the RUPTURE-class mark closer +
 *      MARK ×2 planted AFTER the closer (rider order = engine order): the
 *      closer cashes PRE-EXISTING marks only. Doctrine witness: on a clean
 *      board the closer is silence — the card's own fresh marks never
 *      self-cash (no strike in disguise).
 *   7. THE LONG LEDGER (WS4.4) — two payoff-class DoT fires (each
 *      `consume_affliction` advances the WS3 'payoff' clock and ticks the
 *      picked affliction's ENTIRE remaining fuel NOW), then the short Bleed
 *      is booked AFTER them (rider-carried — the ledger never eats its own
 *      fresh line). Doctrine witness: on a clean board both consumes fizzle
 *      and the card chips NOTHING.
 *   8. SEEDCORN SACRIFICE (WS4.4) — REAP 2 → sow a heavy short Bleed + draw:
 *      the printed Soul cost is real (fizzles underfunded, applying nothing).
 *
 * Fixture + RNG conventions follow card-effectiveness.engine.test.ts:
 * `buildFixtureState()` (rich board; `{ clean: true }` for the doctrine
 * witness), `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` in afterEach.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard } from '../../Combat/combat.engine';
import { RESERVE_PIP_CAP } from '../../Combat/combat.dice';
import type { CombatEncounterState, CombatEvent } from '../../Combat/combat.encounter.types';
import { getCardById } from '../cards.library';
import {
    ROLES_FORGE_CARDS, ROLES_BULWARK_CARDS, ROLES_CHARM_CARDS, ROLES_HARVEST_CARDS,
    applyFixtureCards,
} from '../../test-utils/retired-verb-cards';
import { clearSandboxCards } from '../cards.sandbox';
import { checkStatePredicate } from '../synergy-predicates';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

/** PROFANE CANON (2026-08-08): the four `roles-*` sandbox SETS died with the
 *  spec-32 library; their carriers survive as synthetic fixtures so the WS4
 *  theme-role verbs stay under test. */
const FORGE_SET = { cards: ROLES_FORGE_CARDS, overrides: [] as const };
const BULWARK_SET = { cards: ROLES_BULWARK_CARDS, overrides: [] as const };
const CHARM_SET = { cards: ROLES_CHARM_CARDS, overrides: [] as const };
const HARVEST_SET = { cards: ROLES_HARVEST_CARDS, overrides: [] as const };
const ALL_ROLE_SETS = [FORGE_SET, BULWARK_SET, CHARM_SET, HARVEST_SET] as const;
const ROLE_CARD_IDS = [
    'slag-runoff', 'ingot-of-ruin', 'grit-between-stones', 'the-unmoved-mover',
    'a-sweeter-poison', 'the-long-ledger', 'seedcorn-sacrifice',
] as const;

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

function playerEffect(state: CombatEncounterState, effectId: string) {
    return state.player.effects.find(ae => ae.effectId === effectId);
}

/** Builds a fixture with `cardId` in hand AND owned (the executeCard
 *  ownership gate reads `knownCards`; sandbox ids are not library ids). */
function fixtureWith(
    cardId: string,
    options: { clean?: boolean } = {},
    mutate: (s: CombatEncounterState) => CombatEncounterState = s => s,
): CombatEncounterState {
    const base = buildFixtureState(options);
    return mutate({
        ...base,
        player: { ...base.player, knownCards: [...base.player.knownCards, ...ROLE_CARD_IDS] },
        hand: [{ uid: 'under-test', cardId }],
    });
}

function play(before: CombatEncounterState, paid: boolean): {
    after: CombatEncounterState; events: CombatEvent[];
} {
    mockSequentialRng(0.5);
    // Spec 33: a PAID play names its powering die (the fixture's wild die).
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, paid, paid ? 'fx-die' : undefined);
    expect(
        events.find(e => e.kind === 'effect-fizzled'),
        'the play fizzled',
    ).toBeUndefined();
    return { after, events };
}

// ─── 1. Registry + pricing (the promotion contract) ──────────────────────────

describe('roles-* theme sets — registry shape and rank-band honesty', () => {
    it('roles-forge carries exactly Slag Runoff + Ingot of Ruin (cards only, no overrides)', () => {
        expect(FORGE_SET.cards.map(c => c.id)).toEqual(['slag-runoff', 'ingot-of-ruin']);
        expect(FORGE_SET.overrides ?? []).toHaveLength(0);
    });

    it('roles-bulwark carries exactly Grit Between Stones + The Unmoved Mover (no consume_defense — §12 item 4)', () => {
        expect(BULWARK_SET.cards.map(c => c.id)).toEqual(['grit-between-stones', 'the-unmoved-mover']);
        expect(BULWARK_SET.overrides ?? []).toHaveLength(0);
        // The rejected alternative stays rejected: no card reaches for a
        // defense-consuming verb of any spelling.
        for (const card of BULWARK_SET.cards) {
            for (const m of card.specialMechanics ?? []) {
                expect(m.kind, `${card.id}: consume_defense was ratified OUT`).not.toMatch(/consume_defense/);
            }
        }
    });

    it('roles-charm carries exactly A Sweeter Poison — the CONDITIONAL pair is NOT built (§12 item 4)', () => {
        expect(CHARM_SET.cards.map(c => c.id)).toEqual(['a-sweeter-poison']);
        expect(CHARM_SET.overrides ?? []).toHaveLength(0);
        // Steadfast Regard / Crescendo of Affection stay conditional on the
        // post-Phase-26/27 re-baseline still showing the charm late hole —
        // neither the cards nor their vocabulary (decay-pause, swayScaling)
        // may appear before that telemetry lands.
        expect(CHARM_SET.cards.some(c => /steadfast|crescendo/i.test(c.name))).toBe(false);
    });

    it('roles-harvest carries exactly The Long Ledger + Seedcorn Sacrifice — no max-HP REAP (Phase 32\'s own item)', () => {
        expect(HARVEST_SET.cards.map(c => c.id)).toEqual(['the-long-ledger', 'seedcorn-sacrifice']);
        expect(HARVEST_SET.overrides ?? []).toHaveLength(0);
        // Phase 32's ratified harvest rework (REAP attacks max HP +
        // travelling Souls) is NOT duplicated here: no reap_all capstone, and
        // no verb reaches for maxHealth.
        for (const card of HARVEST_SET.cards) {
            for (const m of card.specialMechanics ?? []) {
                expect(m.kind, `${card.id}: the REAP capstone is Phase 32's item`).not.toBe('reap_all');
            }
        }
    });

    it('applying a set makes its cards resolvable through getCardById', () => {
        for (const set of ALL_ROLE_SETS) applyFixtureCards(set.cards);
        for (const id of ROLE_CARD_IDS) {
            expect(getCardById(id), id).toBeDefined();
        }
    });

    it('no TICK vocabulary anywhere in the sets (TICK is ratified dead)', () => {
        for (const card of ALL_ROLE_SETS.flatMap(s => s.cards)) {
            expect(card.free?.tickOne, `${card.id}: FREE tickOne`).toBeUndefined();
            expect(card.free?.tickAllDots, `${card.id}: FREE tickAllDots`).toBeUndefined();
            for (const m of card.specialMechanics ?? []) {
                if (m.kind === 'rider') {
                    expect(m.rider.tickOne, `${card.id}: PAID tickOne`).toBeUndefined();
                    expect(m.rider.tickAllDots, `${card.id}: PAID tickAllDots`).toBeUndefined();
                }
            }
        }
    });
});

// ─── 2. Slag Runoff — pips land while there is room; overflow becomes Ember ──

describe('slag-runoff (WS4.1) — RIPEN whose overflow converts to Kindling Ember', () => {
    beforeEach(() => { applyFixtureCards(ROLES_FORGE_CARDS); });

    it('FREE: ripens the Reserve by 1 pip (forge currency deposit)', () => {
        const before = fixtureWith('slag-runoff');
        const { after, events } = play(before, false);
        expect(reservePips(after)).toBe(reservePips(before) + 1);
        expect(findEvent(events, 'die-ripened')).toBeDefined();
    });

    it('PAID with partial room: 1 pip lands (to the cap), the other becomes Ember i1', () => {
        // Fixture Reserve: one die at 1 pip, RESERVE_PIP_CAP = 2 — the first
        // wave lands, the second finds the die full and overflows.
        const before = fixtureWith('slag-runoff');
        expect(reservePips(before)).toBe(1);
        const { after, events } = play(before, true);

        expect(reservePips(after)).toBe(RESERVE_PIP_CAP);
        const ember = enemyEffect(after, 'debuff_kindling_ember');
        expect(ember, 'overflow pip must land as an Ember').toBeDefined();
        expect(ember!.intensity).toBe(1);
        const overflowed = findEvent(events, 'pips-overflowed');
        expect(overflowed).toBeDefined();
        expect(overflowed!.pips).toBe(1);
    });

    it('PAID with an empty Reserve: the whole grant overflows — Ember i2', () => {
        const before = fixtureWith('slag-runoff', {}, s => ({ ...s, reserve: [] }));
        const { after, events } = play(before, true);

        const ember = enemyEffect(after, 'debuff_kindling_ember');
        expect(ember, 'full overflow must land as Ember').toBeDefined();
        expect(ember!.intensity).toBe(2);
        expect(findEvent(events, 'pips-overflowed')!.pips).toBe(2);
        expect(findEvent(events, 'die-ripened')).toBeUndefined();
    });

    it('PAID with full room: both pips land, NO Ember (the conversion is overflow-only)', () => {
        const before = fixtureWith('slag-runoff', {}, s => ({
            ...s,
            reserve: [{ id: 'fx-reserve-0', color: 'heart', state: 'available', temporary: false, pips: 0 }],
        }));
        const { after, events } = play(before, true);

        expect(reservePips(after)).toBe(2);
        expect(enemyEffect(after, 'debuff_kindling_ember')).toBeUndefined();
        expect(findEvent(events, 'pips-overflowed')).toBeUndefined();
    });
});

// ─── 3. Ingot of Ruin — the uncapped ALL-spender + payoff-class closer ───────

describe('ingot-of-ruin (WS4.1) — spend ALL pips → MARK per 2 → mark detonation', () => {
    beforeEach(() => { applyFixtureCards(ROLES_FORGE_CARDS); });

    it('PAID (rich board): ripens once, spends every pip, lands MARK, closer cashes ALL marks', () => {
        // Fixture: Reserve die at 1 pip → grant_pip 1 → 2 pips banked →
        // spend_all_pips collects 2 → floor(2/2) = +1 MARK (3 → 4 stacks) →
        // ruptureMarks 3 fires the 'payoff' clock and detonates 4 stacks.
        const before = fixtureWith('ingot-of-ruin');
        const hpBefore = before.enemy.health;
        expect(enemyEffect(before, 'debuff_mark')!.intensity).toBe(3);

        const { after, events } = play(before, true);

        // Every pip spent; the bank is empty.
        expect(reservePips(after)).toBe(0);
        // The MARK conversion is evented in real units (1 stack for 2 pips).
        const cashed = events.find(
            (e): e is Extract<CombatEvent, { kind: 'pips-cashed' }> =>
                e.kind === 'pips-cashed' && e.bonus === 'mark',
        );
        expect(cashed, 'pips-cashed (mark) event').toBeDefined();
        expect(cashed!.pips).toBe(2);
        expect(cashed!.amount).toBe(1);
        // The closer consumed EVERY mark (fixture 3 + fresh 1) …
        expect(enemyEffect(after, 'debuff_mark')).toBeUndefined();
        // … and the detonation landed: ≥ 3 HP × 4 stacks (clock ticks on the
        // enemy's damage-instance DoTs may add more — never less).
        expect(hpBefore - after.enemy.health).toBeGreaterThanOrEqual(12);
    });

    it('DOCTRINE witness (clean board): 1 self-made pip → 0 marks → the closer chips NOTHING', () => {
        // Clean fixture: no enemy effects, Reserve pip zeroed. The card's own
        // grant_pip 1 banks a single pip — floor(1/2) = 0 marks — and
        // ruptureMarks finds no stacks: the enemy's HP must not move (a
        // payoff with zero fuel is silence, not a strike in disguise).
        const before = fixtureWith('ingot-of-ruin', { clean: true });
        const hpBefore = before.enemy.health;

        const { after, events } = play(before, true);

        expect(after.enemy.health).toBe(hpBefore);
        expect(enemyEffect(after, 'debuff_mark')).toBeUndefined();
        expect(events.find(e => e.kind === 'pips-cashed' && e.bonus === 'mark')).toBeUndefined();
    });

    it('the MARK-per-pips conversion is UNCAPPED (spec 32 §12 item 5): 8 banked pips = 4 stacks', () => {
        const fatDie = (id: string, pips: number) =>
            ({ id, color: 'heart' as const, state: 'available' as const, temporary: false, pips });
        // 2 Reserve dice at 2 pips + a floating die at 3 pips = 7 banked;
        // grant_pip 1 ripens nothing (both Reserve dice at cap) … so seed the
        // floating bank instead: 7 + 0 → spend collects 7 → floor(7/2) = 3.
        // Use an 8-pip floating bank for the clean arithmetic: 8 + 1 granted
        // pip on the empty-Reserve path is impossible — keep Reserve pips at
        // cap so the grant is pure overflow-less no-op.
        const before = fixtureWith('ingot-of-ruin', {}, s => ({
            ...s,
            reserve: [fatDie('fx-r0', RESERVE_PIP_CAP), fatDie('fx-r1', RESERVE_PIP_CAP)],
            floatingDice: [{ ...fatDie('fx-f0', 4), color: 'wild' as const, floating: true }],
        }));
        const { events } = play(before, true);
        const cashed = events.find(
            (e): e is Extract<CombatEvent, { kind: 'pips-cashed' }> =>
                e.kind === 'pips-cashed' && e.bonus === 'mark',
        );
        expect(cashed).toBeDefined();
        expect(cashed!.pips).toBe(2 * RESERVE_PIP_CAP + 4); // 8 — every bank contributes
        expect(cashed!.amount).toBe(4);                     // 8 ÷ 2, no flat cap
    });
});

// ─── 4. Grit Between Stones — non-reactive sting + payoff-class closer ───────

describe('grit-between-stones (WS4.2) — Nettle Sting + Guard + mark detonation', () => {
    beforeEach(() => { applyFixtureCards(ROLES_BULWARK_CARDS); });

    it('PAID: lands the sting (non-reactive DoT), raises Guard, cashes every MARK', () => {
        const before = fixtureWith('grit-between-stones');
        const hpBefore = before.enemy.health;
        const { after } = play(before, true);

        const sting = enemyEffect(after, 'debuff_nettle_sting');
        expect(sting, 'Nettle Sting must land without the enemy attacking').toBeDefined();
        expect(sting!.intensity).toBeGreaterThanOrEqual(2);
        expect(after.guard).toBeGreaterThan(before.guard ?? 0);
        // The payoff-class closer: all 3 fixture MARK stacks consumed,
        // ≥ 2 HP per stack landed.
        expect(enemyEffect(after, 'debuff_mark')).toBeUndefined();
        expect(hpBefore - after.enemy.health).toBeGreaterThanOrEqual(6);
    });

    it('FREE: the theme deposit — Barrier 2 (post-Phase-30 brick), nothing touches the enemy', () => {
        const before = fixtureWith('grit-between-stones');
        const { after } = play(before, false);
        expect(after.barrier ?? 0).toBe((before.barrier ?? 0) + 2);
        expect(enemyEffect(after, 'debuff_nettle_sting')).toBeUndefined();
    });
});

// ─── 5. The Unmoved Mover — the enemyDamageLastRound ledger condition ────────

describe('the-unmoved-mover (WS4.2) — the combat-ledger state predicate', () => {
    beforeEach(() => { applyFixtureCards(ROLES_BULWARK_CARDS); });

    it('checkStatePredicate reads the ledger exactly (0 = unmoved; absent = vacuous truth)', () => {
        const p = { kind: 'enemy-dealt-no-damage-last-round' } as const;
        expect(checkStatePredicate(p, { enemyDamageLastRound: 0 })).toBe(true);
        expect(checkStatePredicate(p, {})).toBe(true);
        expect(checkStatePredicate(p, { enemyDamageLastRound: 1 })).toBe(false);
    });

    it('PAID while UNMOVED (ledger 0): Barrier lands AND the rider fires — THORNS i2 self + Guard 4', () => {
        const before = fixtureWith('the-unmoved-mover');
        expect(before.enemyDamageLastRound ?? 0).toBe(0); // fresh encounter — no prior hit
        expect(playerEffect(before, 'buff_thorns')).toBeUndefined();

        const { after, events } = play(before, true);

        expect(after.barrier).toBeGreaterThan(before.barrier ?? 0);
        const thorns = playerEffect(after, 'buff_thorns');
        expect(thorns, 'UNMOVED rider must lay THORNS on the player').toBeDefined();
        expect(thorns!.intensity).toBe(2);
        // riderGuard is unscaled real units: exactly +4 over the FREE-less play.
        expect(after.guard).toBe((before.guard ?? 0) + 4);
        const fired = events.find(
            (e): e is Extract<CombatEvent, { kind: 'die-bonus-fired' }> =>
                e.kind === 'die-bonus-fired' && e.riderText.startsWith('UNMOVED'),
        );
        expect(fired, 'the printed condition line must be evented').toBeDefined();
    });

    it('PAID after the enemy landed damage last round: Barrier only — the rider stays silent', () => {
        const before = fixtureWith('the-unmoved-mover', {}, s => ({ ...s, enemyDamageLastRound: 5 }));
        const { after, events } = play(before, true);

        expect(after.barrier).toBeGreaterThan(before.barrier ?? 0);
        expect(playerEffect(after, 'buff_thorns')).toBeUndefined();
        expect(after.guard).toBe(before.guard ?? 0);
        expect(events.find(
            e => e.kind === 'die-bonus-fired' && e.riderText.startsWith('UNMOVED'),
        )).toBeUndefined();
    });

    it('FREE: Barrier 2 (post-Phase-30 brick), no condition evaluation on the dieless face', () => {
        const before = fixtureWith('the-unmoved-mover');
        const { after } = play(before, false);
        expect(after.barrier ?? 0).toBe((before.barrier ?? 0) + 2);
        expect(playerEffect(after, 'buff_thorns')).toBeUndefined();
    });
});

// ─── 6. A Sweeter Poison — PLEA + the RUPTURE-class closer + the late plant ──

describe('a-sweeter-poison (WS4.3) — PLEA + mark closer; MARK ×2 planted AFTER it', () => {
    beforeEach(() => { applyFixtureCards(ROLES_CHARM_CARDS); });

    it('PAID (rich board): PLEA +3; the closer cashes exactly the 3 PRE-EXISTING marks; MARK ×2 lands after', () => {
        const before = fixtureWith('a-sweeter-poison');
        const hpBefore = before.enemy.health;
        expect(enemyEffect(before, 'debuff_mark')!.intensity).toBe(3);

        const { after, events } = play(before, true);

        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 3);
        // The closer consumed the fixture's 3 stacks at 2 HP each — the burst
        // event carries the exact figure (2 × 3 × vulnMult 1), which proves
        // the card's own fresh marks were NOT part of the detonation (rider
        // order is engine order: closer first, plant second).
        const burst = events.find(
            (e): e is Extract<CombatEvent, { kind: 'damage-dealt' }> =>
                e.kind === 'damage-dealt' && e.cardId === 'a-sweeter-poison' && e.target === 'enemy',
        );
        expect(burst, 'the mark detonation must be evented').toBeDefined();
        expect(burst!.amount).toBe(6);
        expect(hpBefore - after.enemy.health).toBeGreaterThanOrEqual(6);
        // The fresh plant is exactly the card's own ×2 — the next play's fuel.
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(2);
    });

    it('DOCTRINE witness (clean board): no pre-existing marks → the closer is silence; sway + plant still land', () => {
        const before = fixtureWith('a-sweeter-poison', { clean: true });
        const hpBefore = before.enemy.health;

        const { after, events } = play(before, true);

        // A payoff with zero standing fuel chips NOTHING — the card's own
        // fresh marks never self-cash (no strike in disguise).
        expect(after.enemy.health).toBe(hpBefore);
        expect(after.sway ?? 0).toBe(3);
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(2);
        expect(events.find(
            e => e.kind === 'damage-dealt' && e.cardId === 'a-sweeter-poison' && e.target === 'enemy',
        )).toBeUndefined();
    });

    it('FREE: the charm deposit — PLEA 2 + heal 2, board untouched', () => {
        const before = fixtureWith('a-sweeter-poison');
        const { after } = play(before, false);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 2);
        expect(after.player.health).toBe(before.player.health + 2);
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(3); // fixture marks intact
    });
});

// ─── 7. The Long Ledger — two payoff-class DoT fires + the late-booked Bleed ─

describe('the-long-ledger (WS4.4) — consume_affliction ×2 (the WS3 payoff clock) + a short Bleed after', () => {
    beforeEach(() => { applyFixtureCards(ROLES_HARVEST_CARDS); });

    it('PAID (rich board): TWO payoff-class fires — both fixture DoTs consumed at full remaining fuel; the fresh Bleed books after', () => {
        const before = fixtureWith('the-long-ledger');
        const hpBefore = before.enemy.health;

        const { after, events } = play(before, true);

        const consumed = events.filter(
            (e): e is Extract<CombatEvent, { kind: 'affliction-consumed' }> =>
                e.kind === 'affliction-consumed',
        );
        expect(consumed).toHaveLength(2);
        // Fuel-greedy pick: poison (the larger pending account) first, then bleed.
        expect(consumed.map(c => c.effectId)).toEqual(['debuff_poison', 'debuff_bleed']);
        for (const c of consumed) expect(c.fuel, `${c.effectId} fuel`).toBeGreaterThan(0);
        // The realized fuel landed as HP NOW (damage-instance clock cascades
        // may add more — never less).
        expect(hpBefore - after.enemy.health)
            .toBeGreaterThanOrEqual(consumed.reduce((n, c) => n + Math.round(c.fuel), 0));
        // The old accounts are closed; the standing bleed is the card's OWN
        // fresh i1 entry, booked AFTER the consumes — never eaten by them.
        expect(enemyEffect(after, 'debuff_poison')).toBeUndefined();
        const freshBleed = enemyEffect(after, 'debuff_bleed');
        expect(freshBleed, 'the fresh entry must book').toBeDefined();
        expect(freshBleed!.intensity).toBe(1);
        // MARK is not a DoT and both fires found DoT fuel — it stays standing.
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(3);
        // The consumes print NO Soul yield — the yield-for-tempo trade is real.
        expect(after.souls ?? 0).toBe(before.souls ?? 0);
    });

    it('DOCTRINE witness (clean board): both fires fizzle, the Bleed still books, the enemy is NOT chipped', () => {
        const before = fixtureWith('the-long-ledger', { clean: true });
        const hpBefore = before.enemy.health;
        mockSequentialRng(0.5);
        const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, true, 'fx-die');

        expect(events.filter(e => e.kind === 'effect-fizzled')).toHaveLength(2);
        expect(after.enemy.health).toBe(hpBefore);
        const bleed = enemyEffect(after, 'debuff_bleed');
        expect(bleed, 'the fresh entry must still book').toBeDefined();
        expect(bleed!.intensity).toBe(1);
    });

    it('FREE: the harvest deposit — SOUL 1, board untouched', () => {
        const before = fixtureWith('the-long-ledger');
        const { after } = play(before, false);
        expect(after.souls ?? 0).toBe((before.souls ?? 0) + 1);
        expect(enemyEffect(after, 'debuff_poison')!.intensity).toBe(3);
        expect(enemyEffect(after, 'debuff_bleed')!.intensity).toBe(3);
    });
});

// ─── 8. Seedcorn Sacrifice — REAP 2 → sow a Bleed + draw (the flywheel) ──────

describe('seedcorn-sacrifice (WS4.4) — the funded REAP sows next season', () => {
    beforeEach(() => { applyFixtureCards(ROLES_HARVEST_CARDS); });

    it('PAID (funded): spends exactly 2 Souls, sows Bleed +3 intensity, draws 1', () => {
        const before = fixtureWith('seedcorn-sacrifice');
        const bleedBefore = enemyEffect(before, 'debuff_bleed')!.intensity;

        const { after, events } = play(before, true);

        expect(after.souls ?? 0).toBe((before.souls ?? 0) - 2);
        const reaped = findEvent(events, 'reaped');
        expect(reaped, 'the REAP spend must be evented').toBeDefined();
        expect(reaped!.soulsSpent).toBe(2);
        expect(enemyEffect(after, 'debuff_bleed')!.intensity).toBe(bleedBefore + 3);
        const drawn = findEvent(events, 'hand-drawn');
        expect(drawn, 'the rider draw must fire').toBeDefined();
        expect(drawn!.cards).toHaveLength(1);
    });

    it('UNDERFUNDED witness (clean board, 0 Souls): the REAP fizzles — nothing sown, nothing drawn, no chip', () => {
        const before = fixtureWith('seedcorn-sacrifice', { clean: true });
        expect(before.souls ?? 0).toBe(0);
        const hpBefore = before.enemy.health;
        mockSequentialRng(0.5);
        const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, true, 'fx-die');

        const fizzle = events.find(e => e.kind === 'effect-fizzled') as { message?: string } | undefined;
        expect(fizzle, 'underfunded REAP must fizzle').toBeDefined();
        // …and it is the REAP that fizzled, not the powering die (spec 33).
        expect(fizzle!.message ?? '').not.toMatch(/choose a die|cannot power/);
        expect(after.souls ?? 0).toBe(0);
        expect(enemyEffect(after, 'debuff_bleed')).toBeUndefined();
        expect(findEvent(events, 'hand-drawn')).toBeUndefined();
        expect(after.enemy.health).toBe(hpBefore);
    });

    it('FREE: the weak deposit + kicker — SOUL 1 and DRAW 1 (the ratified weak-deposit amendment shape)', () => {
        const before = fixtureWith('seedcorn-sacrifice');
        const { after, events } = play(before, false);
        expect(after.souls ?? 0).toBe((before.souls ?? 0) + 1);
        expect(findEvent(events, 'hand-drawn')).toBeDefined();
        expect(enemyEffect(after, 'debuff_bleed')!.intensity).toBe(3); // board untouched
        expect(after.player.health).toBe(before.player.health);
    });
});
