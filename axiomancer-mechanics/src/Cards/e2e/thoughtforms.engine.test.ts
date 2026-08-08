/**
 * Hermetic E2E — the THOUGHTFORM registry + CONJURE exercise (WS2.1,
 * plan/tuning/2026-07-11-card-library-improvement-plan-detailed.md,
 * correction C-11).
 *
 * Thoughtforms (`cards.thoughtforms.ts`) are real `Card` records that live
 * OUTSIDE the pinned 57-card library: reachable only through a
 * `conjure_card` play, resolved via `getCardById`'s
 * sandbox → thoughtform → library chain. This suite pins the whole
 * contract:
 *
 *   1. EXCLUSION — no Thoughtform ever appears in `COMBAT_REWARD_POOL` or
 *      any stage's `stageEligibleCardIds` (both derive from `cardLibrary`,
 *      which Thoughtforms never join — the 57/45 pins stay intact).
 *   2. RESOLUTION — the lookup chain resolves a Thoughtform id, and a
 *      registered sandbox card still shadows it (sandbox-first).
 *   3. ONE-USE — a conjured Thoughtform is playable (PAID and FREE faces)
 *      and leaves the combat entirely on play OR scrap: it never enters
 *      the discard pile, so a reshuffle can never resurrect it.
 *   4. EFFECTIVENESS — every Thoughtform's and every CONJURE-exerciser
 *      card's PAID face produces its promised, kind-aware observable
 *      delta (same convention as card-effectiveness.engine.test.ts —
 *      magnitude-checked deltas, never mere event presence).
 *   5. PRICING — the pricing lint only covers the library spells, so
 *      this suite carries the rank-band check for Thoughtforms and the
 *      synthetic CONJURE exercisers.
 *
 * Fixture + RNG conventions follow card-effectiveness.engine.test.ts:
 * `buildFixtureState()` (rich board), `mockSequentialRng(0.5)` (neutral
 * d20), `vi.restoreAllMocks()` in afterEach.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';

import { mockSequentialRng } from '../../test-utils/rng';
import { buildFixtureState } from '../../test-utils/card-fixture';
import { playCombatCard, discardCombatCard, resolveThreatPhase } from '../../Combat/combat.engine';
import type { CombatEncounterState, CombatEvent } from '../../Combat/combat.encounter.types';
import { COMBAT_REWARD_POOL } from '../../Combat/combat.rewards';
import { COMBAT_STAGE_PROFILES, stageEligibleCardIds } from '../../Combat/combat.stage-profiles';
import { cardLibrary, getCardById } from '../cards.library';
import { thoughtformLibrary, getThoughtformById } from '../cards.thoughtforms';
import { registerSandboxCards, clearSandboxCards } from '../cards.sandbox';
import { scoreCard } from '../cards.pricing';
import { rankToRarity } from '../types';
import type { Card, CardSpecialMechanic } from '../types';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

/**
 * The CONJURE exercisers. These were the retired `conjure-exercise` sandbox
 * SET (cleared with the spec-32 library at the Profane-Canon reset,
 * 2026-08-08); the VERB is still live in the engine and the Thoughtform
 * registry they reach for is untouched, so the carriers now live here as
 * synthetic fixture cards registered through `registerSandboxCards`. The
 * conjured targets (tf-cinder, tf-minor-premise) are NOT sandbox cards —
 * they live permanently in `cards.thoughtforms.ts`.
 */
const foundrySprite: Card = {
    id: 'foundry-sprite',
    theme: 'grave',
    name: 'Foundry Sprite',
    philosophicalAspect: 'mind',
    description:
        'A leftover intention that never cooled. It ripens what waits in ' +
        'the racks, then hammers a stray thought into something you can ' +
        'throw exactly once.',
    tier: 2, rank: 3, cardType: 'spell',
    targetType: 'self',
    // pts: CONJURE (2) + PIP 1 (1.5) + FREE pips 1 (1.5) = 5.0 by scoreCard
    // → uncommon band 4.5-13 (Thesis).
    free: { pips: 1 },
    specialMechanics: [
        { kind: 'conjure_card', cardId: 'tf-cinder' },
        { kind: 'grant_pip', count: 1 },
    ],
    addedIn: '2026-07-11',
    tags: ['grave', 'dice', 'conjure'],
};

const corollary: Card = {
    id: 'corollary',
    theme: 'trial',
    name: 'Corollary',
    philosophicalAspect: 'heart',
    description:
        'State the premise and its consequence arrives unbidden, already ' +
        'phrased. You did not argue it; it follows.',
    tier: 1, rank: 2, cardType: 'spell',
    targetType: 'self',
    // pts: PREMISE 1 (0.8) + CONJURE (2) + FREE premise 1 (0.8) = 3.6 by
    // scoreCard → common band 1.5-7.5 (Lemma).
    free: { premises: 1 },
    specialMechanics: [
        { kind: 'premise', count: 1 },
        { kind: 'conjure_card', cardId: 'tf-minor-premise' },
    ],
    addedIn: '2026-07-11',
    tags: ['trial', 'conjure'],
};

const CONJURE_CARDS: readonly Card[] = [foundrySprite, corollary];
/** Stand-in for the retired `applySandboxSet('conjure-exercise')`. */
const applyConjureExercise = () => registerSandboxCards([...CONJURE_CARDS]);
const tfIds = thoughtformLibrary.map(c => c.id);

// ─── Shared helpers (the kind-aware convention of the main effectiveness lint) ─

function findEvent<K extends CombatEvent['kind']>(
    events: CombatEvent[], kind: K,
): Extract<CombatEvent, { kind: K }> | undefined {
    return events.find((e): e is Extract<CombatEvent, { kind: K }> => e.kind === kind);
}

/** Rich fixture whose player also OWNS the sandbox exercisers (the fixture's
 *  `knownCards` covers only the library; Thoughtforms need no ownership —
 *  the conjuring play is their provenance). */
function fixtureWithHand(hand: Array<{ uid: string; cardId: string }>): CombatEncounterState {
    const base = buildFixtureState();
    return {
        ...base,
        hand,
        player: {
            ...base.player,
            knownCards: [...base.player.knownCards, ...CONJURE_CARDS.map(c => c.id)],
        },
    };
}

function reservePips(state: CombatEncounterState): number {
    return (state.reserve ?? []).reduce((n, d) => n + (d.pips ?? 0), 0);
}

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
    expect(grew, `${label} — did not deepen`).toBe(true);
}

/** Kind-aware mechanic assertion for the kinds this suite's cards use.
 *  Unmapped kinds throw loudly (extend this when a new Thoughtform ships). */
function assertMechanic(
    card: Card, mech: CardSpecialMechanic, events: CombatEvent[],
    before: CombatEncounterState, after: CombatEncounterState,
): void {
    const label = `${card.id} :: ${mech.kind}`;
    switch (mech.kind) {
        case 'premise':
            expect(after.premises ?? 0, label).toBe((before.premises ?? 0) + mech.count);
            return;
        case 'grant_pip':
            expect(reservePips(after), label).toBeGreaterThan(reservePips(before));
            return;
        case 'conjure_card': {
            const ev = findEvent(events, 'hand-drawn');
            expect(ev, label).toBeDefined();
            expect(ev!.cards, label).toContain(mech.cardId);
            const entry = after.hand.find(h => h.cardId === mech.cardId);
            expect(entry, `${label} — conjured entry missing from hand`).toBeDefined();
            expect(after.conjuredUids ?? [], `${label} — uid not tracked one-use`)
                .toContain(entry!.uid);
            expect(getCardById(mech.cardId), `${label} — conjured id unresolvable`).toBeDefined();
            return;
        }
        default:
            throw new Error(`unmapped mechanic kind for the thoughtform suite: ${mech.kind}`);
    }
}

/** Plays `cardId`'s PAID face from a fresh rich fixture and runs the full
 *  kind-aware assertion set (no fizzles, combatEffects landed, mechanics
 *  delivered). `dieId` defaults to the drafted wild die. */
function assertPaidFaceEffective(cardId: string, dieId?: string): void {
    mockSequentialRng(0.5);
    const card = getCardById(cardId);
    expect(card, cardId).toBeDefined();
    const before = fixtureWithHand([{ uid: 'under-test', cardId }]);
    const { state: after, events } = playCombatCard(before, { uid: 'under-test' }, true, dieId);
    expect(
        events.find(e => e.kind === 'effect-fizzled'),
        `${cardId}: unexpected fizzle`,
    ).toBeUndefined();
    for (const ce of card!.combatEffects ?? []) {
        assertCombatEffectLanded(cardId, ce, before, after);
    }
    for (const mech of card!.specialMechanics ?? []) {
        assertMechanic(card!, mech, events, before, after);
    }
}

// ─── 1. Exclusion — Thoughtforms never enter library-derived pools ────────────

describe('thoughtform registry — excluded from every library-derived pool', () => {
    it('carries at least the two WS2.1 Thoughtforms, all tagged and self-consistent', () => {
        expect(tfIds).toContain('tf-cinder');
        expect(tfIds).toContain('tf-minor-premise');
        for (const tf of thoughtformLibrary) {
            expect(tf.tags ?? [], `${tf.id} must carry the 'thoughtform' tag`).toContain('thoughtform');
            expect(getThoughtformById(tf.id)).toBe(tf);
        }
    });

    it('is disjoint from the pinned 57-card library (the canon pins stay intact)', () => {
        const libraryIds = new Set(cardLibrary.map(c => c.id));
        for (const id of tfIds) {
            expect(libraryIds.has(id), `${id} must not be a library card (C-11)`).toBe(false);
        }
        expect(cardLibrary.length).toBe(57);
        // PROFANE CANON (2026-08-08): 57 cards = 45 spells + 6 enchantments +
        // 6 disenchants (8 starters, 3 dice valves, 4 curses, 6 archetype
        // packages of 7).
        expect(cardLibrary.filter(c => c.cardType === 'spell').length).toBe(45);
    });

    it('never appears in COMBAT_REWARD_POOL', () => {
        for (const id of tfIds) {
            expect(COMBAT_REWARD_POOL, `${id} leaked into the reward pool`).not.toContain(id);
        }
    });

    it('never appears in any stage\'s eligible card pool', () => {
        for (const stage of Object.values(COMBAT_STAGE_PROFILES)) {
            const pool = stageEligibleCardIds(stage);
            for (const id of tfIds) {
                expect(pool, `${id} leaked into stage '${stage.id}'`).not.toContain(id);
            }
        }
    });
});

// ─── 2. Resolution — the sandbox → thoughtform → library chain ───────────────

describe('getCardById lookup chain — sandbox first, then thoughtforms, then the library', () => {
    it('resolves a Thoughtform id with an empty sandbox', () => {
        expect(getCardById('tf-cinder')?.name).toBe('Cinder');
        expect(getCardById('tf-minor-premise')?.name).toBe('Minor Premise');
    });

    it('a registered sandbox card SHADOWS a Thoughtform (A/B override surface)', () => {
        const shadow: Card = { ...getThoughtformById('tf-cinder')!, name: 'Shadow Cinder' };
        registerSandboxCards([shadow]);
        expect(getCardById('tf-cinder')?.name).toBe('Shadow Cinder');
        clearSandboxCards();
        expect(getCardById('tf-cinder')?.name).toBe('Cinder');
    });

    it('unknown ids still miss the whole chain', () => {
        expect(getThoughtformById('tf-nonexistent')).toBeUndefined();
        expect(getCardById('tf-nonexistent')).toBeUndefined();
    });
});

// ─── 3. Conjure flow — playable and one-use on every exit path ────────────────

describe('conjured Thoughtforms — playable, one-use on play (both faces) and on scrap', () => {
    beforeEach(() => { applyConjureExercise(); });

    /** Plays Foundry Sprite's PAID face and returns the post-conjure state +
     *  the conjured Cinder's hand uid. */
    function conjureCinder(): { state: CombatEncounterState; cjUid: string } {
        mockSequentialRng(0.5);
        const start = fixtureWithHand([{ uid: 'sprite', cardId: 'foundry-sprite' }]);
        const { state, events } = playCombatCard(start, { uid: 'sprite' }, true);
        expect(findEvent(events, 'effect-fizzled'), 'sprite fizzled').toBeUndefined();
        const entry = state.hand.find(h => h.cardId === 'tf-cinder');
        expect(entry, 'conjured Cinder missing from hand').toBeDefined();
        expect(state.conjuredUids ?? []).toContain(entry!.uid);
        return { state, cjUid: entry!.uid };
    }

    it('PAID face: the conjured Cinder lands its ember, then leaves the combat entirely', () => {
        const { state, cjUid } = conjureCinder();
        // Re-arm the tray (the Sprite play spent the drafted die): a fresh
        // drafted WILD die, exactly as a new turn's draft would provide.
        const armed: CombatEncounterState = {
            ...state,
            dice: [{ id: 'fx-die-2', color: 'wild', state: 'available', temporary: false }],
            draftedDieId: 'fx-die-2',
        };
        const { state: after, events } = playCombatCard(armed, { uid: cjUid }, true);
        expect(findEvent(events, 'effect-fizzled'), 'cinder fizzled').toBeUndefined();
        const ember = after.enemy.effects.find(e => e.effectId === 'debuff_kindling_ember');
        expect(ember, 'ember did not land').toBeDefined();
        expect(ember!.intensity).toBeGreaterThanOrEqual(3);
        // One-use: gone from hand, NOT in the discard cycle, uid untracked.
        expect(after.hand.some(h => h.uid === cjUid)).toBe(false);
        expect(after.discard).not.toContain('tf-cinder');
        expect(after.conjuredUids ?? []).not.toContain(cjUid);
    });

    it('FREE face: the dieless line fires and the token still leaves the combat', () => {
        const { state: conjured, cjUid } = conjureCinder();
        // Cinder's FREE line is PIP 1 (post-Phase-30 merge: TICK is dead —
        // forge's currency ripens the Reserve). Park a Reserve die so the
        // deposit has material; a ripen event must fire.
        const state: CombatEncounterState = {
            ...conjured,
            reserve: [{ id: 'fx-res-1', color: 'mind', state: 'available', temporary: false, pips: 0 }],
        };
        const { state: after, events } = playCombatCard(state, { uid: cjUid }, false);
        expect(events.some(e => e.kind === 'die-ripened'), 'FREE pip').toBe(true);
        expect(after.hand.some(h => h.uid === cjUid)).toBe(false);
        expect(after.discard).not.toContain('tf-cinder');
        expect(after.conjuredUids ?? []).not.toContain(cjUid);
    });

    it('scrap: +1 Conviction is paid, but the token never joins the discard cycle', () => {
        const { state, cjUid } = conjureCinder();
        const { state: after, events } = discardCombatCard(state, cjUid);
        expect(findEvent(events, 'conviction-gained')?.amount).toBe(1);
        expect(after.conviction).toBe(state.conviction + 1);
        expect(after.hand.some(h => h.uid === cjUid)).toBe(false);
        expect(after.discard).not.toContain('tf-cinder');
        expect(after.conjuredUids ?? []).not.toContain(cjUid);
    });

    it('phase boundary: an UNPLAYED conjured token evaporates — never swept into the discard', () => {
        // The third one-use path (2026-07-12 fix): holding the token through
        // the fresh-hand redraw must not deposit it in the discard pile,
        // where a reshuffle would resurrect it as a permanent deck card.
        const { state, cjUid } = conjureCinder();
        const { state: after } = resolveThreatPhase(state, () => 0.5);
        expect(after.hand.some(h => h.uid === cjUid)).toBe(false);
        expect(after.discard).not.toContain('tf-cinder');
        expect(after.drawPile).not.toContain('tf-cinder');
        // The stale uid is released from the one-use ledger too.
        expect(after.conjuredUids ?? []).not.toContain(cjUid);
    });

    it('Corollary conjures a Minor Premise whose FREE face cashes the tally and vanishes', () => {
        mockSequentialRng(0.5);
        const start = fixtureWithHand([{ uid: 'corollary', cardId: 'corollary' }]);
        const first = playCombatCard(start, { uid: 'corollary' }, true);
        expect(findEvent(first.events, 'effect-fizzled')).toBeUndefined();
        expect(first.state.premises ?? 0).toBe((start.premises ?? 0) + 1);
        const entry = first.state.hand.find(h => h.cardId === 'tf-minor-premise');
        expect(entry, 'conjured Minor Premise missing').toBeDefined();
        const second = playCombatCard(first.state, { uid: entry!.uid }, false);
        expect(second.state.premises ?? 0).toBe((first.state.premises ?? 0) + 1);
        expect(second.state.hand.some(h => h.uid === entry!.uid)).toBe(false);
        expect(second.state.discard).not.toContain('tf-minor-premise');
        expect(second.state.conjuredUids ?? []).not.toContain(entry!.uid);
    });
});

// ─── 4. Effectiveness — the PAID face of every card in this exercise ─────────

describe('effectiveness — every Thoughtform and conjure-exercise PAID face delivers', () => {
    beforeEach(() => { applyConjureExercise(); });

    const allIds = [...tfIds, ...CONJURE_CARDS.map(c => c.id)];
    it.each(allIds.map(id => [id] as const))(
        "'%s' PAID face produces its promised observable delta",
        (cardId) => { assertPaidFaceEffective(cardId); },
    );
});

// ─── 5. Pricing — the band check the library lint cannot see ──────────────────

describe('pricing — thoughtforms and conjure-exercise cards land in their rank bands', () => {
    // Same bands as pricing.engine.test.ts (spec 32 v3 §4, widened per the
    // shipped library).
    const RANK_BANDS: Record<'common' | 'uncommon' | 'rare', [number, number]> = {
        common: [1.5, 7.5],
        uncommon: [4.5, 13],
        rare: [7, 19],
    };

    const priced: Card[] = [...thoughtformLibrary, ...CONJURE_CARDS];
    it.each(priced.map(c => [c.id, c] as const))('%s scores within its band', (_id, card) => {
        const [lo, hi] = RANK_BANDS[rankToRarity(card.rank)];
        const pts = scoreCard(card);
        expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — below ${lo}`)
            .toBeGreaterThanOrEqual(lo);
        expect(pts, `${card.id} (rank ${card.rank}) scored ${pts.toFixed(2)} — above ${hi}`)
            .toBeLessThanOrEqual(hi);
    });

    it('the authored // pts: comments are the executable arithmetic (regression anchors)', () => {
        // tf-cinder: ember i3 d3 (printed 9 → phase-36b tempo-weighted 6.94) ÷ 3
        // = 2.31 + FREE pip 1.5 = 3.81
        expect(scoreCard(getThoughtformById('tf-cinder')!)).toBeCloseTo(3.8125, 2);
        // tf-minor-premise: premise 0.8 + FREE premise 0.8 = 1.6
        expect(scoreCard(getThoughtformById('tf-minor-premise')!)).toBeCloseTo(1.6, 2);
        const byId = new Map(CONJURE_CARDS.map(c => [c.id, c]));
        // foundry-sprite: conjure 2 + pip 1.5 + FREE pips 1.5 = 5.0
        expect(scoreCard(byId.get('foundry-sprite')!)).toBeCloseTo(5.0, 2);
        // corollary: premise 0.8 + conjure 2 + FREE premise 0.8 = 3.6
        expect(scoreCard(byId.get('corollary')!)).toBeCloseTo(3.6, 2);
    });
});
