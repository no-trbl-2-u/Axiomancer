/**
 * Hermetic E2E — WS5.2 + WS5.3: the sequencing-grammar microset
 * (plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md §WS5;
 * spec 32 §12 "Ratified 2026-07-11" item 4 supplies the ledgers).
 *
 * Pinned here:
 *   1. REGISTRY — `sequencing-microset` carries exactly the six condition
 *      cards, spread 2×3 across peroration / echo / akrasia, two per
 *      condition family (opening / closing-play / after-cost), every spell
 *      priced inside its printed rank band. Face-term note (historical,
 *      WS5.2-era): at authoring time OPENING was the microset's one shared
 *      face term, deliberately card-local and unregistered; THE BIG NUMBERS
 *      REWRITE (2026-09-02) later promoted `opening`/`finale` to real
 *      registry keywords (AMBUSH/FINALE, `docs/keyword-atlas.md` § "turn
 *      shape") alongside FLOW/REQUIEM, and `combat.cards.ts`'s
 *      `statePredicateText` was fixed 2026-09-07 (`/adjust-keywords` pass 2)
 *      to actually print those names — this fixture set's own cards still
 *      never shipped to the live library, so only the assertions below
 *      (which pin the live function's output) needed updating.
 *   2. PREDICATES — the four new `SynergyStatePredicate` kinds read the
 *      spec-32-§12-item-4 ledgers exactly (pre-this-play state: the counter
 *      not yet incremented, the played card still in hand, this play's own
 *      recoil not yet posted).
 *   3. GATES — each card's condition rider fires when its turn-shape holds
 *      and stays silent otherwise (fire/silent pairs in real units).
 *   4. WS5.3 FALSIFIABLE TEST — a fixed 5-card hand (2 microset cards)
 *      against a 3-die tray, all legal play orders resolved against three
 *      authored threat stances:
 *        (a) ≥ 2 orders produce materially different end states
 *            (HP + status vector + resource deltas), and
 *        (b) the argmax order differs across at least two of the three
 *            threats.
 *      (b) failing — ONE dominant order across all stances — is the
 *      parent's KILL CONDITION for the microset: report it, do not rig
 *      fixtures (the failure message says exactly that).
 *
 * Enumeration bound (WS5.3 "die-assignment × order tuples, deduped by
 * outcome-relevant prefix"): the tray is three IDENTICAL wild floating dice
 * (0 pips), so every die-assignment bijection is outcome-equivalent — the
 * 60 × 3! assignment×order tuples dedupe to the P(5,3) = 60 ordered card
 * triples under the canonical assignment "k-th play ← k-th die".
 *
 * Fixture + RNG conventions follow roles-themes.engine.test.ts:
 * `buildFixtureState()`, `mockSequentialRng(0.5)`, `vi.restoreAllMocks()`
 * in afterEach.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard, resolveThreatPhase } from '../../Combat/combat.engine';
import { getPendingDotTotal } from '../../Combat/effects';
import { statePredicateText } from '../../Combat/combat.cards';
import type {
    CombatEncounterState, CombatEvent, CombatThreatEffect, CombatThreatPhase,
} from '../../Combat/combat.encounter.types';
import type { ActiveEffect } from '../../Effects/types';
import { lookupEffect } from '../../Effects';
import { SEQUENCING_MICROSET_CARDS, applyFixtureCards } from '../../test-utils/retired-verb-cards';
import { clearSandboxCards } from '../cards.sandbox';
import { scoreCard } from '../cards.pricing';
import { rankToRarity } from '../types';
import { checkStatePredicate } from '../synergy-predicates';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

/** PROFANE CANON (2026-08-08): the `sequencing-microset` sandbox SET died
 *  with the spec-32 library; its carriers survive as synthetic fixtures so the
 *  turn-shape predicate grammar stays under test. */
const SEQ_CARDS = SEQUENCING_MICROSET_CARDS;
const MICROSET_IDS = [
    'captatio-benevolentiae', 'in-medias-res', 'coda',
    'dying-echo', 'wages-of-weakness', 'answered-in-kind',
] as const;

/** The pricing lint's rank bands (pricing.engine.test.ts) — sandbox cards are
 *  not in the library sweep, so the promotion contract is pinned here. */
const RANK_BANDS: Record<'common' | 'uncommon' | 'rare', [number, number]> = {
    common: [1.5, 7.5],
    uncommon: [4.5, 13],
    rare: [7, 19],
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

function findEvent<K extends CombatEvent['kind']>(
    events: CombatEvent[], kind: K,
): Extract<CombatEvent, { kind: K }> | undefined {
    return events.find((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

function conditionEvent(events: CombatEvent[], textPrefix: string) {
    return events.find(
        (e): e is Extract<CombatEvent, { kind: 'die-bonus-fired' }> =>
            e.kind === 'die-bonus-fired' && e.riderText.startsWith(textPrefix),
    );
}

function enemyEffect(state: CombatEncounterState, effectId: string) {
    return state.enemy.effects.find(ae => ae.effectId === effectId);
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
        player: { ...base.player, knownCards: [...base.player.knownCards, ...MICROSET_IDS] },
        hand: [{ uid: 'under-test', cardId }],
    });
}

function play(before: CombatEncounterState, paid: boolean): {
    after: CombatEncounterState; events: CombatEvent[];
} {
    mockSequentialRng(0.5);
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, paid);
    expect(
        events.find(e => e.kind === 'effect-fizzled'),
        'the play fizzled',
    ).toBeUndefined();
    return { after, events };
}

// ─── 1. Registry + pricing (the promotion contract) ──────────────────────────

describe('sequencing-microset — registry shape and rank-band honesty', () => {
    it('carries exactly the six cards, 2 × 3 themes, 2 per condition family', () => {
        expect(SEQ_CARDS.map(c => c.id)).toEqual([...MICROSET_IDS]);

        const themes = SEQ_CARDS.map(c => c.theme);
        // Canon re-slug (2026-08-08): peroration -> trial, echo -> grave, akrasia -> debt.
        for (const theme of ['trial', 'grave', 'debt'] as const) {
            expect(themes.filter(t => t === theme), theme).toHaveLength(2);
        }

        const kinds = SEQ_CARDS.map(c => c.synergy?.statePredicate?.kind);
        expect(kinds.filter(k => k === 'opening')).toHaveLength(2);
        expect(kinds.filter(k => k === 'finale')).toHaveLength(2);
        // The after-cost pair: one reads the RECOIL ledger, one the
        // enemy-damage rollover (the two ratified §12-item-4 cost ledgers).
        expect(kinds.filter(k => k === 'recoil-paid-this-turn')).toHaveLength(1);
        expect(kinds.filter(k => k === 'enemy-drew-blood')).toHaveLength(1);

        // Every condition rides the ONE conditional gate (CardSynergy), and
        // every rider is priced (scoreCard applies the threshold ×0.5).
        for (const card of SEQ_CARDS) {
            expect(card.synergy?.statePredicate, `${card.id}: statePredicate`).toBeDefined();
            expect(card.synergy?.rider, `${card.id}: rider`).toBeDefined();
        }
    });

    it.each(SEQ_CARDS.map(c => [c.id, c] as const))(
        '%s prices inside its printed rank band',
        (_id, card) => {
            const [lo, hi] = RANK_BANDS[rankToRarity(card.rank)];
            const pts = scoreCard(card);
            expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — below ${lo}`)
                .toBeGreaterThanOrEqual(lo);
            expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — above ${hi}`)
                .toBeLessThanOrEqual(hi);
        },
    );

    it('the authored // pts arithmetic matches scoreCard (regression anchors)', () => {
        const byId = (id: string) => SEQ_CARDS.find(c => c.id === id)!;
        expect(scoreCard(byId('captatio-benevolentiae'))).toBeCloseTo(4.125, 2);
        expect(scoreCard(byId('in-medias-res'))).toBeCloseTo(6.535, 2); // spec 33 D4: poison i1 d2 at the 1.83 cadence
        expect(scoreCard(byId('coda'))).toBeCloseTo(8.0, 2);
        expect(scoreCard(byId('dying-echo'))).toBeCloseTo(5.885, 2); // spec 33 D4: poison i1 d2 at the 1.83 cadence
        expect(scoreCard(byId('wages-of-weakness'))).toBeCloseTo(9.0, 2);
        expect(scoreCard(byId('answered-in-kind'))).toBeCloseTo(6.25, 2); // post-Phase-30: FREE self-mark seed + heal kicker
    });

    it('face terms: AMBUSH and FINALE print as registry keywords; RECOIL/BLOOD conditions stay lowercase glosses', () => {
        // Fixed 2026-09-07 (/adjust-keywords pass 2): `opening`/`finale` are
        // registry keywords (AMBUSH/FINALE) since THE BIG NUMBERS REWRITE
        // (2026-09-02); the print text now matches FLOW/REQUIEM's shape.
        expect(statePredicateText({ kind: 'opening', maxPriorSpells: 0 }))
            .toBe('AMBUSH (your first spell this turn)');
        expect(statePredicateText({ kind: 'opening', maxPriorSpells: 1 }))
            .toBe('AMBUSH (within your first 2 spells this turn)');
        expect(statePredicateText({ kind: 'finale', cardsLeftAtMost: 2 }))
            .toBe('FINALE 2 (2 or fewer cards left in hand after this)');
        // The remaining two conditions have no registry keyword and still
        // open lowercase (RECOIL inside a gloss is existing vocabulary, not new).
        for (const text of [
            statePredicateText({ kind: 'recoil-paid-this-turn' }),
            statePredicateText({ kind: 'enemy-drew-blood' }),
        ]) {
            expect(text).toMatch(/^[a-z]/);
        }
    });

    it('no TICK vocabulary anywhere in the set (TICK is ratified dead)', () => {
        for (const card of SEQ_CARDS) {
            expect(card.free?.tickOne, `${card.id}: FREE tickOne`).toBeUndefined();
            expect(card.free?.tickAllDots, `${card.id}: FREE tickAllDots`).toBeUndefined();
            expect(card.synergy?.rider?.tickOne, `${card.id}: rider tickOne`).toBeUndefined();
            expect(card.synergy?.rider?.tickAllDots, `${card.id}: rider tickAllDots`).toBeUndefined();
        }
    });

    it('every effect id on the six cards resolves in the Effects library', () => {
        for (const card of SEQ_CARDS) {
            for (const ce of card.combatEffects ?? []) {
                expect(lookupEffect(ce.effectId), `${card.id} -> ${ce.effectId}`).toBeDefined();
            }
            const riderApply = card.synergy?.rider?.applyEffect;
            if (riderApply) {
                expect(lookupEffect(riderApply.effectId), `${card.id} rider -> ${riderApply.effectId}`).toBeDefined();
            }
        }
    });
});

// ─── 2. The four new state predicates read the ledgers exactly ───────────────

describe('checkStatePredicate — the WS5 turn-shape predicates', () => {
    it('opening: at most maxPriorSpells PAID spells already resolved (absent = 0)', () => {
        const first = { kind: 'opening', maxPriorSpells: 0 } as const;
        expect(checkStatePredicate(first, { spellsPlayedThisTurn: 0 })).toBe(true);
        expect(checkStatePredicate(first, {})).toBe(true); // vacuous: nothing played
        expect(checkStatePredicate(first, { spellsPlayedThisTurn: 1 })).toBe(false);

        const second = { kind: 'opening', maxPriorSpells: 1 } as const;
        expect(checkStatePredicate(second, { spellsPlayedThisTurn: 1 })).toBe(true);
        expect(checkStatePredicate(second, { spellsPlayedThisTurn: 2 })).toBe(false);
    });

    it('finale: the eval-time hand still contains the played card (length − 1 ≤ N)', () => {
        const p = { kind: 'finale', cardsLeftAtMost: 2 } as const;
        expect(checkStatePredicate(p, { hand: [1, 2, 3] })).toBe(true);   // 2 left after
        expect(checkStatePredicate(p, { hand: [1, 2, 3, 4] })).toBe(false); // 3 left after
        expect(checkStatePredicate(p, { hand: [1] })).toBe(true);         // the last card
        expect(checkStatePredicate(p, {})).toBe(true); // vacuous (engine always has a hand)
    });

    it('recoil-paid-this-turn: a PRIOR blood price this turn (absent/0 = false)', () => {
        const p = { kind: 'recoil-paid-this-turn' } as const;
        expect(checkStatePredicate(p, { recoilPaidThisTurn: 4 })).toBe(true);
        expect(checkStatePredicate(p, { recoilPaidThisTurn: 0 })).toBe(false);
        expect(checkStatePredicate(p, {})).toBe(false);
    });

    it('enemy-drew-blood: either damage ledger nonzero (the rollover is the live leg)', () => {
        const p = { kind: 'enemy-drew-blood' } as const;
        expect(checkStatePredicate(p, { enemyDamageLastRound: 5 })).toBe(true);
        expect(checkStatePredicate(p, { enemyDamageThisTurn: 3 })).toBe(true);
        expect(checkStatePredicate(p, { enemyDamageLastRound: 0, enemyDamageThisTurn: 0 })).toBe(false);
        expect(checkStatePredicate(p, {})).toBe(false);
    });

    // EVENTIDE (`/adjust-keywords` pass 11) — a fifth turn-shape predicate,
    // added later than the WS5.2 batch above: a PARITY read on the draw
    // pile rather than a turn-position/ledger-cost read. Vacuously TRUE on
    // a bare view (0 % 2 === 0), same convention as opening/finale.
    it('eventide: true while the draw pile holds an EVEN number of cards (absent = vacuously true)', () => {
        const p = { kind: 'eventide' } as const;
        expect(checkStatePredicate(p, { drawPile: [] })).toBe(true);
        expect(checkStatePredicate(p, {})).toBe(true);
        expect(checkStatePredicate(p, { drawPile: [1, 2] })).toBe(true);
        expect(checkStatePredicate(p, { drawPile: [1, 2, 3, 4] })).toBe(true);
        expect(checkStatePredicate(p, { drawPile: [1] })).toBe(false);
        expect(checkStatePredicate(p, { drawPile: [1, 2, 3] })).toBe(false);
    });

    it('statePredicateText(eventide) prints the registry word with its rule', () => {
        expect(statePredicateText({ kind: 'eventide' }))
            .toBe('EVENTIDE (an even number of cards left in your draw pile)');
    });
});

// ─── 2b. EVENTIDE end to end against the real library card ───────────────────

describe('the-even-bell (live library card) — EVENTIDE fire/silent, real units', () => {
    it('fires THORNS 6 for 3 turns on an even draw pile, stays silent on odd', () => {
        const evenFrom = fixtureWith('the-even-bell', { clean: true },
            s => ({ ...s, drawPile: ['spoiled-poultice', 'spoiled-poultice'] }));
        const evenPlay = play(evenFrom, true);
        const oddFrom = fixtureWith('the-even-bell', { clean: true },
            s => ({ ...s, drawPile: ['spoiled-poultice'] }));
        const oddPlay = play(oddFrom, true);

        expect(conditionEvent(evenPlay.events, 'EVENTIDE'), 'EVENTIDE must fire on an even draw pile').toBeDefined();
        expect(conditionEvent(oddPlay.events, 'EVENTIDE')).toBeUndefined();

        const evenThorns = evenPlay.after.player.effects.find(e => e.effectId === 'buff_thorns');
        expect(evenThorns?.intensity).toBe(6);
        expect(oddPlay.after.player.effects.find(e => e.effectId === 'buff_thorns')).toBeUndefined();

        // GUARD lands identically either way — EVENTIDE only gates the
        // rider, not the card's own specialMechanics line (read/die scaling
        // applies equally to both plays, so compare them to each other
        // rather than pinning an absolute post-scaling number here).
        expect(evenPlay.after.guard).toBe(oddPlay.after.guard);
        expect(evenPlay.after.guard).toBeGreaterThan(0);
    });
});

// ─── 3. Per-card condition gates (fire / silent, real units) ─────────────────

describe('sequencing-microset — condition gates', () => {
    beforeEach(() => { applyFixtureCards(SEQ_CARDS); });

    it('captatio-benevolentiae: AMBUSH fires as the FIRST spell (+5 Guard, +1 Premise), silent afterwards', () => {
        // Fixture default: spellsPlayedThisTurn 0 → this IS the opening.
        const firedFrom = fixtureWith('captatio-benevolentiae', { clean: true });
        const fired = play(firedFrom, true);
        const silentFrom = fixtureWith('captatio-benevolentiae', { clean: true },
            s => ({ ...s, spellsPlayedThisTurn: 1 }));
        const silent = play(silentFrom, true);

        // The PAID line lands on both faces (guard mech + CHARGE 1); the
        // rider is worth EXACTLY +5 unscaled Guard and +1 Premise on top.
        expect((fired.after.premises ?? 0) - (firedFrom.premises ?? 0)).toBe(2);
        expect((silent.after.premises ?? 0) - (silentFrom.premises ?? 0)).toBe(1);
        expect((fired.after.guard ?? 0) - (silent.after.guard ?? 0)).toBe(5);
        expect(conditionEvent(fired.events, 'AMBUSH'), 'the printed condition must be evented').toBeDefined();
        expect(conditionEvent(silent.events, 'AMBUSH')).toBeUndefined();
    });

    it('in-medias-res: AMBUSH (≤1 prior spell) deepens its own poison and draws; silent at 2', () => {
        const asSecond = play(fixtureWith('in-medias-res', { clean: true },
            s => ({ ...s, spellsPlayedThisTurn: 1 })), true);
        const asThird = play(fixtureWith('in-medias-res', { clean: true },
            s => ({ ...s, spellsPlayedThisTurn: 2 })), true);

        // bonusIntensity 1 applies to the statuses THIS play lands.
        expect(enemyEffect(asSecond.after, 'debuff_poison')!.intensity).toBe(2);
        expect(enemyEffect(asThird.after, 'debuff_poison')!.intensity).toBe(1);
        expect(findEvent(asSecond.events, 'hand-drawn'), 'the rider draw must fire').toBeDefined();
        expect(findEvent(asThird.events, 'hand-drawn')).toBeUndefined();
    });

    it('coda: the closing play (≤2 left after) refills — REPRISE 1 + draw 2; silent in a full hand', () => {
        // fixtureWith puts ONLY coda in hand → 0 cards left after → fires.
        const fired = play(fixtureWith('coda', { clean: true }), true);
        expect(conditionEvent(fired.events, 'FINALE 2')).toBeDefined();
        const drawn = findEvent(fired.events, 'hand-drawn');
        expect(drawn, 'the finale draw must fire').toBeDefined();
        expect(drawn!.cards).toHaveLength(2);

        // Four cards in hand → 3 left after → silent (the reprise still runs).
        const silent = play(fixtureWith('coda', { clean: true }, s => ({
            ...s,
            hand: [
                { uid: 'under-test', cardId: 'coda' },
                { uid: 'f1', cardId: 'unction-of-boils' },
                { uid: 'f2', cardId: 'unction-of-boils' },
                { uid: 'f3', cardId: 'unction-of-boils' },
            ],
        })), true);
        expect(conditionEvent(silent.events, 'FINALE 2')).toBeUndefined();
        expect(findEvent(silent.events, 'hand-drawn')).toBeUndefined();
    });

    it('dying-echo: the last note rings loudest — +2 intensity, +1 turn when played as the closing card', () => {
        const fired = play(fixtureWith('dying-echo', { clean: true }), true);
        const silent = play(fixtureWith('dying-echo', { clean: true }, s => ({
            ...s,
            hand: [
                { uid: 'under-test', cardId: 'dying-echo' },
                { uid: 'f1', cardId: 'unction-of-boils' },
                { uid: 'f2', cardId: 'unction-of-boils' },
                { uid: 'f3', cardId: 'unction-of-boils' },
            ],
        })), true);

        const loud = enemyEffect(fired.after, 'debuff_poison')!;
        const quiet = enemyEffect(silent.after, 'debuff_poison')!;
        expect(loud.intensity).toBe(3);  // i1 + bonusIntensity 2
        expect(quiet.intensity).toBe(1);
        expect(loud.remainingDuration - quiet.remainingDuration).toBe(1); // bonusDuration 1
        expect(conditionEvent(fired.events, 'FINALE 2')).toBeDefined();
        expect(conditionEvent(silent.events, 'FINALE 2')).toBeUndefined();
    });

    it('wages-of-weakness: fires only when a PRIOR play paid RECOIL — second bleed + 3 HP back', () => {
        const firedFrom = fixtureWith('wages-of-weakness', { clean: true },
            s => ({ ...s, recoilPaidThisTurn: 4 }));
        const fired = play(firedFrom, true);
        const silentFrom = fixtureWith('wages-of-weakness', { clean: true });
        const silent = play(silentFrom, true);

        // Rider bleed i2 merges into the PAID bleed i2 (intensity stacking).
        expect(enemyEffect(fired.after, 'debuff_bleed')!.intensity).toBe(4);
        expect(enemyEffect(silent.after, 'debuff_bleed')!.intensity).toBe(2);
        expect(fired.after.player.health - firedFrom.player.health).toBe(3);
        expect(silent.after.player.health).toBe(silentFrom.player.health);
        expect(conditionEvent(fired.events, 'blood already paid')).toBeDefined();
        expect(conditionEvent(silent.events, 'blood already paid')).toBeUndefined();
    });

    it('answered-in-kind: fires only when the enemy drew blood since your last turn — MARK ×2 + 2 HP back', () => {
        const firedFrom = fixtureWith('answered-in-kind', { clean: true },
            s => ({ ...s, enemyDamageLastRound: 5 }));
        const fired = play(firedFrom, true);
        const silentFrom = fixtureWith('answered-in-kind', { clean: true });
        const silent = play(silentFrom, true);

        expect(enemyEffect(fired.after, 'debuff_mark')!.intensity).toBe(2);
        expect(enemyEffect(silent.after, 'debuff_mark')).toBeUndefined();
        expect(fired.after.player.health - firedFrom.player.health).toBe(2);
        expect(silent.after.player.health).toBe(silentFrom.player.health);
        // The PAID bleed lands on both faces regardless of the ledger.
        expect(enemyEffect(fired.after, 'debuff_bleed')).toBeDefined();
        expect(enemyEffect(silent.after, 'debuff_bleed')).toBeDefined();
        expect(conditionEvent(fired.events, 'the enemy drew blood')).toBeDefined();
        expect(conditionEvent(silent.events, 'the enemy drew blood')).toBeUndefined();
    });
});

// ─── 4. WS5.3 — the falsifiable sequencing test ──────────────────────────────

/** The fixed 5-card hand: 2 microset cards (the OPENING guard card + the
 *  finale DoT) and 3 library cards whose interactions carry the engine's
 *  native sequencing grammar (the card-played DoT clock ticks poisons on
 *  every SUBSEQUENT play; MARK amplifies each tick; Guard only matters
 *  against a threat that actually swings). */
const SEQ_HAND = [
    'captatio-benevolentiae', // microset: OPENING → +5 Guard, +1 Premise
    'dying-echo',             // microset: closing play → poison i3 d4 instead of i1
    'reading-of-the-charges', // library: MARK i1 d2 + 2 PREMISES (canon re-slug)
    'unction-of-boils',       // library: poison i1 d4 (card-played clock)
    'brace-for-impact',       // library: Guard 8
] as const;

const DIE_IDS = ['seq-d0', 'seq-d1', 'seq-d2'] as const;

function threatPhase(description: string, effects: CombatThreatEffect[]): CombatThreatPhase {
    return {
        index: 1,
        enemyStance: 'body',
        threatAction: { description, effects },
        isFinalPhase: true,
    };
}

/** Three authored threat stances with distinct rider/damage profiles (same
 *  hidden stance, so the RPS read never confounds the comparison):
 *  - the BATTERER swings hard — standing fuel keeps its full value, Guard is
 *    worth real HP;
 *  - the STONEWALL never swings — Guard is worthless, only the DoT economy
 *    scores;
 *  - the PURGER scours its own wounds (the ratified WS9 `enemyCleanse`
 *    rider: sheds debuff entries in bearer order, never the last one) — the
 *    merged poison stack is first-in and gets stripped at the boundary, so
 *    fuel BANKED for later is wasted against it and only ticks REALIZED
 *    during the turn (plus the soak against its swing) count. */
const THREATS: Record<string, CombatThreatPhase> = {
    batterer: threatPhase('a crushing blow', [{ damage: 10 }]),
    stonewall: threatPhase('stands and watches', []),
    purger: threatPhase('scours its wounds clean', [
        { damage: 6 },
        { enemyCleanse: 2 },
    ]),
};

function seqBase(threat: CombatThreatPhase): CombatEncounterState {
    const base = buildFixtureState({ clean: true });
    // Three IDENTICAL wild floating dice: the die-assignment axis is
    // outcome-irrelevant by construction (see the header's dedupe argument).
    const tray = DIE_IDS.map(id => ({
        id, color: 'wild' as const, state: 'available' as const,
        temporary: false, floating: true, pips: 0,
    }));
    return {
        ...base,
        player: {
            ...base.player,
            knownCards: [...base.player.knownCards, ...MICROSET_IDS],
            effects: [], // no pre-seeded self-DoTs: end states isolate the plays
        },
        hand: SEQ_HAND.map(cardId => ({ uid: cardId, cardId })),
        dice: tray,
        draftedDieId: null,
        floatingDice: tray,
        reserve: [],
        guard: 0,
        barrier: 0,
        threatPhases: [threat],
        threatMarks: ['pending'],
        currentPhaseIndex: 0,
    };
}

/** All ordered triples from the 5-card hand (P(5,3) = 60). */
function orderedTriples(items: readonly string[]): string[][] {
    const out: string[][] = [];
    for (const a of items) {
        for (const b of items) {
            for (const c of items) {
                if (a !== b && a !== c && b !== c) out.push([a, b, c]);
            }
        }
    }
    return out;
}

/** Material end-state signature: HP + status vector + resource deltas. */
function endStateSignature(s: CombatEncounterState): string {
    const fx = (list: readonly ActiveEffect[]): string =>
        list.map(a => `${a.effectId}:${a.intensity}:${a.remainingDuration}`).sort().join(',');
    return [
        s.player.health, s.enemy.health, s.guard ?? 0, s.barrier ?? 0,
        fx(s.player.effects), fx(s.enemy.effects),
        s.premises ?? 0, s.conviction, s.souls ?? 0, s.sway ?? 0,
    ].join('|');
}

interface OrderResult { order: string[]; score: number; signature: string }

/** Plays the order PAID (k-th play ← k-th die), resolves the threat (which
 *  chains into the between-phases rollover), and scores the end state in HP
 *  units: enemy HP taken + the enemy's standing DoT fuel (the engine's own
 *  `getPendingDotTotal`, the same figure the kill-projection prices) + the
 *  player's HP delta (guard savings show up here). */
function runOrder(threat: CombatThreatPhase, order: string[]): OrderResult {
    const rng = (): number => 0.5;
    let s = seqBase(threat);
    const playerHp0 = s.player.health;
    const enemyHp0 = s.enemy.health;
    order.forEach((uid, k) => {
        const res = playCombatCard(s, { uid }, true, DIE_IDS[k], rng);
        const fizzle = res.events.find(e => e.kind === 'effect-fizzled');
        expect(fizzle, `${order.join(' > ')} play ${k + 1} (${uid}) fizzled: ${JSON.stringify(fizzle)}`)
            .toBeUndefined();
        s = res.state;
    });
    s = resolveThreatPhase(s, rng).state;
    const score = (enemyHp0 - s.enemy.health)
        + getPendingDotTotal(s.enemy, s.round).total
        + (s.player.health - playerHp0);
    return { order, score, signature: endStateSignature(s) };
}

describe('WS5.3 — sequencing grammar is real (the falsifiable test)', () => {
    beforeEach(() => {
        applyFixtureCards(SEQ_CARDS);
        mockSequentialRng(0.5);
    });

    const runAll = (): Record<string, OrderResult[]> => {
        const orders = orderedTriples(SEQ_HAND);
        expect(orders).toHaveLength(60);
        const byThreat: Record<string, OrderResult[]> = {};
        for (const [name, threat] of Object.entries(THREATS)) {
            byThreat[name] = orders.map(o => runOrder(threat, o));
        }
        return byThreat;
    };

    it('(a) ≥ 2 orders produce materially different end states against every threat', () => {
        const byThreat = runAll();
        for (const [name, results] of Object.entries(byThreat)) {
            const distinct = new Set(results.map(r => r.signature));
            expect(
                distinct.size,
                `${name}: all 60 play orders collapsed to one end state — order does not matter`,
            ).toBeGreaterThanOrEqual(2);
        }
    });

    it('(a′) the microset conditions themselves are order-sensitive (position flips change the end state)', () => {
        // Pure witness pairs on the no-noise threat: same card SET, only the
        // microset card's position flips — the condition is the delta.
        const opener = runOrder(THREATS['stonewall']!,
            ['captatio-benevolentiae', 'reading-of-the-charges', 'unction-of-boils']);
        const latecomer = runOrder(THREATS['stonewall']!,
            ['reading-of-the-charges', 'unction-of-boils', 'captatio-benevolentiae']);
        expect(opener.signature, 'OPENING first vs last must differ').not.toBe(latecomer.signature);

        const finale = runOrder(THREATS['stonewall']!,
            ['reading-of-the-charges', 'unction-of-boils', 'dying-echo']);
        const prelude = runOrder(THREATS['stonewall']!,
            ['dying-echo', 'reading-of-the-charges', 'unction-of-boils']);
        expect(finale.signature, 'finale last vs first must differ').not.toBe(prelude.signature);
    });

    it('(b) the argmax order differs across at least two of the three threats (KILL CONDITION if not)', () => {
        const byThreat = runAll();
        const argmax = (results: OrderResult[]): OrderResult =>
            results.reduce((best, r) => (r.score > best.score ? r : best)); // stable: first max wins
        const winners = Object.fromEntries(
            Object.entries(byThreat).map(([name, results]) => [name, argmax(results)]),
        );
        const distinctWinners = new Set(
            Object.values(winners).map(w => w.order.join(' > ')),
        );
        // Observed under the pinned RNG/fixture (2026-07-11 shape, re-slugged
        // onto the canon fillers 2026-08-08 — the assertion below is what is
        // load-bearing, never these literals): the poison-lead order wins the
        // batterer and the stonewall, and the purger flips the lead.
        // The purger flips the lead because enemyCleanse strips the
        // FIRST-inserted debuff entry: leading with the MARK sacrifices the
        // cheap amplifier to the scour and shields the poison stack.
        expect(
            distinctWinners.size,
            'WS5 KILL CONDITION: one dominant play order across ALL three threat stances '
            + `(${Object.entries(winners).map(([n, w]) => `${n}: ${w.order.join(' > ')} @ ${w.score.toFixed(1)}`).join(' | ')}). `
            + 'Draw-fresh does not support sequencing — do NOT rig fixtures; report the negative '
            + 'result, log to plan/CRITIQUE.md, and revisit hand retention (parent §2 deferred).',
        ).toBeGreaterThanOrEqual(2);
    });
});
