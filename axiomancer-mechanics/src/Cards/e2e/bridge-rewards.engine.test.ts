/**
 * Hermetic E2E — the WS6.2 cross-theme bridge rewards
 * (plan/archive/2026-09-25-trim-t4/plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md §WS6;
 * sandbox set `bridge-rewards` in cards.sandbox-sets.ts).
 *
 * Pinned here:
 *   1. REGISTRY — `bridge-rewards` carries exactly the six ratified pairings
 *      (one card each), every spell prices inside its printed rank band, the
 *      authored `// pts:` arithmetic matches `scoreCard`, no TICK vocabulary
 *      (ratified dead), and none of the ids leak into the pinned 70-card
 *      `COMBAT_REWARD_POOL` (they reach reward screens ONLY via the WS6.1
 *      harness sandbox hook).
 *   2. BARBED COMPLIMENT (affliction↔charm) — one breath, both bars: MARK
 *      stacks (affliction fuel) AND PLEA on the RELENT bar.
 *   3. THE POURED RAMPART (forge↔bulwark) — pips → GUARD: RIPEN 1, then
 *      `spend_all_pips.guardPerPip 2` pours the WHOLE bank into Guard over a
 *      small Barrier footing; the bank reads 0 after.
 *   4. INTEREST ON THE FLESH (akrasia↔harvest) — the nearest buildable shape
 *      of "self-affliction expiry → Souls" (no player-side expiry-yield hook
 *      exists): the self-Bleed is the printed cost, SOUL ×3 is booked NOW,
 *      MARK ×2 marks the debtor. Doctrine witness: applying it chips NOTHING.
 *   5. ENTERED INTO EVIDENCE (oracle↔peroration) — FORETELL confirm →
 *      Premise: the OMEN's rider carries `premises: 2` through the
 *      phase-boundary resolution (hit → tally +2; miss → nothing).
 *   6. STOLEN CADENCE (control↔echo) — nearest buildable shape of "STAGGER'd
 *      rung → REPRISE fuel" (no rungs-denied ledger): STAGGER 1 + REPRISE 1
 *      together on one card.
 *   7. UNBROKEN COUNTENANCE (bulwark↔charm) — unbroken GUARD → PLEA via the
 *      ratified `enemy-dealt-no-damage-last-round` ledger predicate: rider
 *      PLEA ×4 + heal 2 fires ONLY while the ledger reads 0.
 *
 * Fixture + RNG conventions follow roles-themes.engine.test.ts:
 * `buildFixtureState()` (rich board; `{ clean: true }` for witnesses),
 * `mockSequentialRng(0.5)`, `vi.restoreAllMocks()` + `clearSandboxCards()`
 * in afterEach.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard, resolveThreatPhase } from '../../Combat/combat.engine';
import { COMBAT_REWARD_POOL } from '../../Combat/combat.rewards';
import type {
    CombatEncounterState, CombatEvent, CombatThreatPhase,
} from '../../Combat/combat.encounter.types';
import { getCardById } from '../cards.library';
import { BRIDGE_REWARD_CARDS, applyFixtureCards } from '../../test-utils/retired-verb-cards';
import { clearSandboxCards } from '../cards.sandbox';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

/** PROFANE CANON (2026-08-08): the `bridge-rewards` sandbox SET died with
 *  the spec-32 library; its carriers survive as synthetic fixtures so the
 *  cross-theme splash grammar stays under test. */
const BRIDGE_CARDS = BRIDGE_REWARD_CARDS;
const BRIDGE_CARD_IDS = [
    'barbed-compliment', 'the-poured-rampart', 'interest-on-the-flesh',
    'entered-into-evidence', 'stolen-cadence', 'unbroken-countenance',
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
        player: { ...base.player, knownCards: [...base.player.knownCards, ...BRIDGE_CARD_IDS] },
        hand: [{ uid: 'under-test', cardId }],
    });
}

function play(before: CombatEncounterState, paid: boolean): {
    after: CombatEncounterState; events: CombatEvent[];
} {
    mockSequentialRng(0.5);
    // A PAID line names its powering die (spec 33 — no implicit default):
    // the fixture's single WILD tray die.
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, paid, paid ? 'fx-die' : undefined);
    expect(
        events.find(e => e.kind === 'effect-fizzled'),
        'the play fizzled',
    ).toBeUndefined();
    return { after, events };
}

/** One-shot custom threat phases (controlled stances, small damage) — the
 *  themed-decks OMEN convention. */
function customPhases(stances: ('heart' | 'body' | 'mind')[], damage = 4): CombatThreatPhase[] {
    return stances.map((s, i) => ({
        index: i + 1, enemyStance: s, isFinalPhase: i === stances.length - 1,
        threatAction: { description: 'bridge probe', effects: [{ damage }] },
    }));
}

// ─── 1. Registry + pricing (the promotion contract) ──────────────────────────

describe('bridge-rewards — registry shape and rank-band honesty', () => {
    it('carries exactly the six pairing cards, in pairing order, no overrides', () => {
        expect(BRIDGE_CARDS.map(c => c.id)).toEqual([...BRIDGE_CARD_IDS]);
        expect([]).toHaveLength(0);
    });

    it('every bridge declares a parent theme and stays OUT of the pinned reward pool', () => {
        for (const card of BRIDGE_CARDS) {
            expect(card.theme, `${card.id}: theme`).toBeDefined();
            expect(COMBAT_REWARD_POOL, `${card.id} leaked into the pinned 70`).not.toContain(card.id);
        }
    });

    it('no TICK vocabulary anywhere in the set (TICK is ratified dead)', () => {
        for (const card of BRIDGE_CARDS) {
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

    it('applying the set makes every bridge resolvable through getCardById', () => {
        applyFixtureCards(BRIDGE_CARDS);
        for (const id of BRIDGE_CARD_IDS) expect(getCardById(id), id).toBeDefined();
    });
});

// ─── 2. Barbed Compliment — MARK for the affliction engine, PLEA for the bar ─

describe('barbed-compliment (affliction↔charm) — one breath, both parents fed', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    /** The fixture's current phase stance is BODY, which a HEART card READS
     *  for advantage (+1 landed intensity — honest, but not what this lint
     *  pins). Neutralize the read so the assertions are the card's printed
     *  numbers: heart vs heart = neutral. */
    const neutralRead = (s: CombatEncounterState): CombatEncounterState => ({
        ...s,
        threatPhases: s.threatPhases.map(p => ({ ...p, enemyStance: 'heart' as const })),
    });

    it('PAID (neutral read): MARK +2 deepens the affliction fuel AND PLEA +2 presses the bar', () => {
        const before = fixtureWith('barbed-compliment', {}, neutralRead);
        expect(enemyEffect(before, 'debuff_mark')!.intensity).toBe(3);

        const { after, events } = play(before, true);

        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(5);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 2);
        expect(findEvent(events, 'sway-gained')).toBeDefined();
    });

    it('FREE: the seed deposit — MARK +1 and PLEA +1, nothing else moves', () => {
        const before = fixtureWith('barbed-compliment', {}, neutralRead);
        const { after } = play(before, false);
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(4);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 1);
    });
});

// ─── 3. The Poured Rampart — pips poured into GUARD over a Barrier footing ───

describe('the-poured-rampart (forge↔bulwark) — spend the whole bank as wall', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    it('PAID (rich board): RIPEN 1 → 2 banked pips → Guard +4 (2/pip), bank empty, Barrier up', () => {
        // Fixture Reserve: one die at 1 pip → grant_pip 1 ripens it to 2 →
        // spend_all_pips collects 2 → guardPerPip 2 → +4 Guard, evented.
        const before = fixtureWith('the-poured-rampart');
        expect(reservePips(before)).toBe(1);

        const { after, events } = play(before, true);

        expect(reservePips(after)).toBe(0);
        const cashed = events.find(
            (e): e is Extract<CombatEvent, { kind: 'pips-cashed' }> =>
                e.kind === 'pips-cashed' && e.bonus === 'guard',
        );
        expect(cashed, 'pips-cashed (guard) event').toBeDefined();
        expect(cashed!.pips).toBe(2);
        expect(cashed!.amount).toBe(4);
        expect(after.guard).toBe((before.guard ?? 0) + 4);
        expect(after.barrier).toBeGreaterThanOrEqual((before.barrier ?? 0) + 3);
    });

    it('PAID (clean board): the self-made pip still pours — Guard +2 from 1 pip', () => {
        const before = fixtureWith('the-poured-rampart', { clean: true });
        expect(reservePips(before)).toBe(0);

        const { after, events } = play(before, true);

        const cashed = events.find(
            (e): e is Extract<CombatEvent, { kind: 'pips-cashed' }> =>
                e.kind === 'pips-cashed' && e.bonus === 'guard',
        );
        expect(cashed).toBeDefined();
        expect(cashed!.pips).toBe(1);
        expect(cashed!.amount).toBe(2);
        expect(after.guard).toBe(2);
        expect(reservePips(after)).toBe(0);
    });

    it('FREE: the forge deposit — RIPEN 1, no wall', () => {
        const before = fixtureWith('the-poured-rampart');
        const { after, events } = play(before, false);
        expect(reservePips(after)).toBe(reservePips(before) + 1);
        expect(findEvent(events, 'die-ripened')).toBeDefined();
        expect(after.guard).toBe(before.guard ?? 0);
    });
});

// ─── 4. Interest on the Flesh — the loan booked up front ─────────────────────

describe('interest-on-the-flesh (akrasia↔harvest) — self-Bleed cost, Souls now', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    it('PAID: the self-Bleed books on the player, SOUL ×3 banks, MARK ×2 lands on the foe', () => {
        const before = fixtureWith('interest-on-the-flesh');
        expect(playerEffect(before, 'debuff_bleed')!.intensity).toBe(2); // fixture Fallen pair

        const { after, events } = play(before, true);

        expect(playerEffect(after, 'debuff_bleed')!.intensity).toBe(3); // +1: the printed cost
        expect(after.souls ?? 0).toBe((before.souls ?? 0) + 3);
        const gained = findEvent(events, 'soul-gained');
        expect(gained).toBeDefined();
        expect(gained!.reason).toBe('granted');
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(5); // fixture 3 + 2
    });

    it('DOCTRINE witness (clean board): pure bookkeeping — the enemy is NOT chipped', () => {
        const before = fixtureWith('interest-on-the-flesh', { clean: true });
        const hpBefore = before.enemy.health;

        const { after } = play(before, true);

        expect(after.enemy.health).toBe(hpBefore); // MARK is not a DoT; no strike in disguise
        expect(after.souls ?? 0).toBe(3);
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(2);
        expect(playerEffect(after, 'debuff_bleed'), 'the cost is real on any board').toBeDefined();
    });

    it('FREE: the harvest deposit + the akrasia salve — SOUL 1 and heal 3, no cost paid', () => {
        const before = fixtureWith('interest-on-the-flesh');
        const { after } = play(before, false);
        expect(after.souls ?? 0).toBe((before.souls ?? 0) + 1);
        expect(after.player.health).toBe(before.player.health + 3);
        expect(playerEffect(after, 'debuff_bleed')!.intensity).toBe(2); // untouched
    });
});

// ─── 5. Entered into Evidence — the confirmed prophecy becomes a Premise ─────

describe('entered-into-evidence (oracle↔peroration) — OMEN confirm deposits CHARGE ×2', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    /** Fixture with controlled phases: current phase 0, prediction lands on
     *  phase 1 (the card's WILD-powered omen predicts its own stance, MIND). */
    function omenFixture(nextStance: 'heart' | 'body' | 'mind'): CombatEncounterState {
        return fixtureWith('entered-into-evidence', {}, s => ({
            ...s,
            threatPhases: customPhases(['mind', nextStance]),
            threatMarks: ['pending', 'pending'],
            currentPhaseIndex: 0,
        }));
    }

    it('PAID: FORETELL 2 reads the deck and the OMEN is declared for the next phase (MIND)', () => {
        const before = omenFixture('mind');
        const { after, events } = play(before, true);

        expect(findEvent(events, 'foretold')).toBeDefined();
        const declared = findEvent(events, 'omen-declared');
        expect(declared).toBeDefined();
        expect(declared!.stance).toBe('mind'); // wild die → the card's own stance
        expect(declared!.phaseIndex).toBe(1);
        expect(after.pendingOmens).toHaveLength(1);
    });

    it('CONFIRM: the prediction comes true at the boundary → CHARGE ×2 joins the tally', () => {
        const before = omenFixture('mind');
        const premisesBefore = before.premises ?? 0;
        const { after: played } = play(before, true);

        const res = resolveThreatPhase(played);

        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(true);
        const gained = res.events.find(
            (e): e is Extract<CombatEvent, { kind: 'premise-gained' }> => e.kind === 'premise-gained',
        );
        expect(gained, 'the omen rider must deposit Premises').toBeDefined();
        expect(gained!.amount).toBe(2);
        expect(res.state.premises ?? 0).toBe(premisesBefore + 2);
        expect(res.state.omenHits).toBe(1);
    });

    it('MISS: the future disobeys → no Premise, no hit', () => {
        const before = omenFixture('heart');
        const premisesBefore = before.premises ?? 0;
        const { after: played } = play(before, true);

        const res = resolveThreatPhase(played);

        expect(res.events.some(e => e.kind === 'omen-missed')).toBe(true);
        expect(res.events.some(e => e.kind === 'omen-hit')).toBe(false);
        expect(res.state.premises ?? 0).toBe(premisesBefore);
        expect(res.state.omenHits ?? 0).toBe(0);
    });

    it('FREE: the twin deposits — CHARGE 1 and FORETELL 1', () => {
        const before = fixtureWith('entered-into-evidence');
        const { after, events } = play(before, false);
        const gained = findEvent(events, 'premise-gained');
        expect(gained).toBeDefined();
        expect(gained!.amount).toBe(1);
        expect(after.premises ?? 0).toBe((before.premises ?? 0) + 1);
        expect(findEvent(events, 'foretold')).toBeDefined();
    });
});

// ─── 6. Stolen Cadence — a beat stolen, a beat replayed ──────────────────────

describe('stolen-cadence (control↔echo) — STAGGER 1 + REPRISE 1 on one card', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    it('PAID: steals a rung from the next action AND returns the best discard to hand', () => {
        const before = fixtureWith('stolen-cadence');
        expect(before.discard.length).toBeGreaterThan(0); // reprise fodder

        const { after, events } = play(before, true);

        const staggered = findEvent(events, 'staggered');
        expect(staggered, 'the stolen beat must be evented').toBeDefined();
        expect(staggered!.rungs).toBe(1);
        expect(after.staggerRungs ?? 0).toBe((before.staggerRungs ?? 0) + 1);

        const reprised = findEvent(events, 'reprised');
        expect(reprised, 'the refrain must return').toBeDefined();
        expect(reprised!.returned).toHaveLength(1);
        expect(after.hand.map(h => h.cardId)).toContain(reprised!.returned[0]);
    });

    it('FREE: the deposit — MARK +1 on the foe and +1 Conviction (no silent rider)', () => {
        const before = fixtureWith('stolen-cadence');
        const { after } = play(before, false);
        expect(enemyEffect(after, 'debuff_mark')!.intensity).toBe(4); // fixture 3 + 1
        expect(after.conviction ?? 0).toBe((before.conviction ?? 0) + 1);
        expect(after.staggerRungs ?? 0).toBe(before.staggerRungs ?? 0); // stagger is PAID-only
    });
});

// ─── 7. Unbroken Countenance — the unbroken wall persuades ───────────────────

describe('unbroken-countenance (bulwark↔charm) — the no-damage ledger gates the PLEA surge', () => {
    beforeEach(() => { applyFixtureCards(BRIDGE_CARDS); });

    it('PAID while UNBROKEN (ledger 0): Guard up, PLEA +6 (2 paid + 4 rider), 2 HP composed back', () => {
        const before = fixtureWith('unbroken-countenance');
        expect(before.enemyDamageLastRound ?? 0).toBe(0); // fresh encounter

        const { after, events } = play(before, true);

        expect(after.guard).toBeGreaterThanOrEqual((before.guard ?? 0) + 8);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 6);
        expect(after.player.health).toBe(before.player.health + 2);
        const fired = events.find(
            (e): e is Extract<CombatEvent, { kind: 'die-bonus-fired' }> =>
                e.kind === 'die-bonus-fired' && e.riderText.startsWith('UNMOVED'),
        );
        expect(fired, 'the printed condition line must be evented').toBeDefined();
    });

    it('PAID after the enemy drew blood last round: the base line only — PLEA +2, no heal', () => {
        const before = fixtureWith('unbroken-countenance', {}, s => ({ ...s, enemyDamageLastRound: 5 }));
        const { after, events } = play(before, true);

        expect(after.guard).toBeGreaterThanOrEqual((before.guard ?? 0) + 8);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 2);
        expect(after.player.health).toBe(before.player.health);
        expect(events.find(
            e => e.kind === 'die-bonus-fired' && e.riderText.startsWith('UNMOVED'),
        )).toBeUndefined();
    });

    it('FREE: the twin deposits — Guard 2 and PLEA 2, no condition on the dieless face', () => {
        const before = fixtureWith('unbroken-countenance');
        const { after } = play(before, false);
        expect(after.guard).toBe((before.guard ?? 0) + 2);
        expect(after.sway ?? 0).toBe((before.sway ?? 0) + 2);
        expect(after.player.health).toBe(before.player.health);
    });
});
