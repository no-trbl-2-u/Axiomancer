/**
 * Hermetic E2E — the ALLY registry (Phase 62 —
 * plan/phases/phase_62_ally_cards.md).
 *
 * Allies (`cards.allies.ts`) are real `Card` records that live OUTSIDE the
 * curated library, mirroring the Haunt sibling-pool pattern
 * (`haunts.engine.test.ts`'s WS2.1 contract), resolved via `getCardById`'s
 * sandbox -> haunt -> ally -> library chain. This suite pins the contract:
 *
 *   1. EXCLUSION — no Ally ever appears in `COMBAT_REWARD_POOL` or any
 *      stage's `stageEligibleCardIds` (both derive from `cardLibrary`,
 *      which Allies never join).
 *   2. RESOLUTION — the lookup chain resolves an Ally id; a registered
 *      sandbox card still shadows it (sandbox-first); unknown ids miss the
 *      whole chain.
 *   3. THE OATH SHAPE — FREE drops a TIMED instance into `tempZone` (3
 *      rounds) and recycles the card; PAID makes it PERMANENT
 *      (`persistentZone`), unique-in-play, and the card leaves the deck
 *      cycle — the exact contract every other oath in the curated library
 *      carries (`themed-decks.engine.test.ts`'s ENCHANT/DISENCHANT suite is
 *      the template this mirrors).
 *   4. THE HOOKED PASSIVE — The Sworn Second's round-end THORNS grant fires
 *      under EITHER zone (temp or permanent) and is capped at 3 stacks.
 *   5. PRICING — every Ally scores 0 (engine text, same convention as every
 *      other oath/hex; the pricing lint only covers library spells).
 *   6. GRANT SMOKE — an Ally id can be inserted directly into a fresh
 *      combat's deck/hand exactly like any reward-granted card, drawn, and
 *      played — the round-trip Phase 65's eventual grant call will rely on.
 *
 * Fixture + RNG conventions follow `card-effectiveness.engine.test.ts` /
 * `haunts.engine.test.ts`: `buildFixtureState()` (rich board, single WILD
 * die — color-agnostic), `vi.restoreAllMocks()` in `afterEach`.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { buildFixtureState } from '../../test-utils/card-fixture';
import {
    playCombatCard, processBetweenPhases,
} from '../../Combat/combat.engine';
import type { CombatEncounterState } from '../../Combat/combat.encounter.types';
import { COMBAT_REWARD_POOL } from '../../Combat/combat.rewards';
import { COMBAT_STAGE_PROFILES, stageEligibleCardIds } from '../../Combat/combat.stage-profiles';
import { cardLibrary, getCardById } from '../cards.library';
import { allyLibrary, getAllyById, isAllyCard } from '../cards.allies';
import { getHauntById } from '../cards.haunts';
import { registerSandboxCards, clearSandboxCards } from '../cards.sandbox';
import { scoreCard } from '../cards.pricing';
import type { Card } from '../types';

afterEach(() => {
    vi.restoreAllMocks();
    clearSandboxCards();
});

const ALLY_ID = 'the-sworn-second';
const allyIds = allyLibrary.map(c => c.id);

/** Rich fixture whose player also owns the Ally (ownership gate parity with
 *  `haunts.engine.test.ts`'s `fixtureWithHand`) and whose hand carries it. */
function fixtureWithAllyInHand(): CombatEncounterState {
    const base = buildFixtureState();
    return {
        ...base,
        hand: [{ uid: 'under-test', cardId: ALLY_ID }],
        deck: [ALLY_ID, ...base.deck], // a granted card is a real deck member
        player: { ...base.player, knownCards: [...base.player.knownCards, ALLY_ID] },
    };
}

// ─── 1. Exclusion — Allies never enter library-derived pools ─────────────────

describe('ally registry — excluded from every library-derived pool', () => {
    it('carries the Phase 62 reference Ally, tagged and self-consistent', () => {
        expect(allyIds).toContain(ALLY_ID);
        for (const a of allyLibrary) {
            expect(a.tags ?? [], `${a.id} must carry the 'ally' tag`).toContain('ally');
            expect(a.cardType, `${a.id} must be an oath — the phase 62 design decision`).toBe('oath');
            expect(getAllyById(a.id)).toBe(a);
            expect(isAllyCard(a.id)).toBe(true);
        }
    });

    it('is disjoint from the pinned 57-card library and the Haunt registry', () => {
        const libraryIds = new Set(cardLibrary.map(c => c.id));
        for (const id of allyIds) {
            expect(libraryIds.has(id), `${id} must not be a library card`).toBe(false);
            expect(getHauntById(id), `${id} must not collide with a Haunt id`).toBeUndefined();
        }
    });

    it('never appears in COMBAT_REWARD_POOL', () => {
        for (const id of allyIds) {
            expect(COMBAT_REWARD_POOL, `${id} leaked into the reward pool`).not.toContain(id);
        }
    });

    it("never appears in any stage's eligible card pool", () => {
        for (const stage of Object.values(COMBAT_STAGE_PROFILES)) {
            const pool = stageEligibleCardIds(stage);
            for (const id of allyIds) {
                expect(pool, `${id} leaked into stage '${stage.id}'`).not.toContain(id);
            }
        }
    });
});

// ─── 2. Resolution — the sandbox → haunt → ally → library chain ─────────────

describe('getCardById lookup chain — resolves an Ally id, sandbox still shadows it', () => {
    it('resolves an Ally id with an empty sandbox', () => {
        expect(getCardById(ALLY_ID)?.name).toBe('The Sworn Second');
    });

    it('a registered sandbox card SHADOWS an Ally (A/B override surface)', () => {
        const shadow: Card = { ...getAllyById(ALLY_ID)!, name: 'Shadow Second' };
        registerSandboxCards([shadow]);
        expect(getCardById(ALLY_ID)?.name).toBe('Shadow Second');
        clearSandboxCards();
        expect(getCardById(ALLY_ID)?.name).toBe('The Sworn Second');
    });

    it('unknown ids miss the whole chain', () => {
        expect(getAllyById('ally-nonexistent')).toBeUndefined();
        expect(getCardById('ally-nonexistent')).toBeUndefined();
        expect(isAllyCard('ally-nonexistent')).toBe(false);
    });
});

// ─── 3. The oath shape — FREE timed vs PAID permanent ────────────────────────

describe('The Sworn Second — FREE timed line, PAID permanent, unique-in-play', () => {
    it('FREE (dieless): drops a TIMED instance into tempZone for 3 rounds and RECYCLES the card', () => {
        const state = fixtureWithAllyInHand();
        const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, false);
        expect(events.some(e => e.kind === 'enchant-played'
            && (e as { temporary?: boolean }).temporary === true)).toBe(true);
        expect(after.tempZone).toEqual([{ cardId: ALLY_ID, roundsLeft: 3 }]);
        expect(after.persistentZone).toEqual([]);
        expect(after.deck).toContain(ALLY_ID); // stays in the deck cycle
    });

    it('PAID: enters the PERMANENT zone, spends the die, and leaves the deck cycle', () => {
        const state = fixtureWithAllyInHand();
        const { state: after, events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
        expect(events.some(e => e.kind === 'enchant-played'
            && !(e as { temporary?: boolean }).temporary)).toBe(true);
        expect(after.persistentZone).toEqual([ALLY_ID]);
        expect(after.discard).not.toContain(ALLY_ID);
        expect(after.deck).not.toContain(ALLY_ID);
    });

    it('unique-in-play: a second PAID copy fizzles', () => {
        let state = fixtureWithAllyInHand();
        state = { ...state, persistentZone: [ALLY_ID] };
        const { events } = playCombatCard(state, { uid: 'under-test' }, true, 'fx-die');
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(true);
    });
});

// ─── 4. The hooked passive — capped round-end THORNS ─────────────────────────

describe('The Sworn Second — round-end THORNS, capped at 3 stacks', () => {
    it('grants THORNS at round end once PAID (permanent zone)', () => {
        const base = buildFixtureState();
        const seeded: CombatEncounterState = { ...base, persistentZone: [ALLY_ID] };
        const { state: after, events } = processBetweenPhases(seeded);
        const thorns = after.player.effects.find(e => e.effectId === 'buff_thorns');
        expect(thorns, 'THORNS did not land').toBeDefined();
        expect(thorns!.intensity).toBe(1);
        expect(events.some(e => e.kind === 'effect-landed'
            && (e as { cardId?: string }).cardId === ALLY_ID)).toBe(true);
    });

    it('fires identically from a TEMP (FREE) instance', () => {
        const base = buildFixtureState();
        const seeded: CombatEncounterState = { ...base, tempZone: [{ cardId: ALLY_ID, roundsLeft: 3 }] };
        const { state: after } = processBetweenPhases(seeded);
        expect(after.player.effects.find(e => e.effectId === 'buff_thorns')).toBeDefined();
    });

    it('caps at 3 stacks across repeated rounds — never a runaway reflect stack', () => {
        let state: CombatEncounterState = { ...buildFixtureState(), persistentZone: [ALLY_ID] };
        for (let i = 0; i < 6; i++) {
            state = processBetweenPhases(state).state;
        }
        const thorns = state.player.effects.find(e => e.effectId === 'buff_thorns');
        expect(thorns).toBeDefined();
        expect(thorns!.intensity).toBeLessThanOrEqual(3);
    });

    it('is inert with neither zone holding the id', () => {
        const base = buildFixtureState();
        const { state: after } = processBetweenPhases(base);
        expect(after.player.effects.find(e => e.effectId === 'buff_thorns')).toBeUndefined();
    });
});

// ─── 5. Pricing — every Ally is engine text (unscored), like every oath/hex ──

describe('pricing — Allies score 0 (engine text, not point-priced)', () => {
    it.each(allyLibrary.map(c => [c.id, c] as const))('%s scores 0', (_id, card) => {
        expect(scoreCard(card)).toBe(0);
    });
});

// ─── 6. Grant smoke — insert an Ally id into a fresh deck/hand, draw, play ───

describe('grant smoke — an Ally id round-trips through deck -> draw -> hand -> play', () => {
    it('a freshly "granted" Ally (present only in the deck + knownCards) draws into hand and plays', () => {
        const base = buildFixtureState();
        // The grant primitive itself is Phase 65's job; this exercises the
        // round-trip an eventual grant call would rely on — the id just has
        // to be a legal collection member (knownCards) and present to draw.
        const granted: CombatEncounterState = {
            ...base,
            hand: [],
            deck: [ALLY_ID, ...base.deck],
            drawPile: [ALLY_ID, ...base.drawPile],
            player: { ...base.player, knownCards: [...base.player.knownCards, ALLY_ID] },
        };
        const { state: drawn } = processBetweenPhases(granted, () => 0.5);
        expect(drawn.hand.some(h => h.cardId === ALLY_ID), 'granted Ally never drew into hand').toBe(true);
        const uid = drawn.hand.find(h => h.cardId === ALLY_ID)!.uid;
        // FREE (dieless) face: processBetweenPhases is a round transition, so
        // the drafted die resets to null — proving playability needs no
        // re-draft when the FREE line is dieless by design.
        const { events } = playCombatCard(drawn, { uid }, false);
        expect(events.some(e => e.kind === 'effect-fizzled')).toBe(false);
        expect(events.some(e => e.kind === 'enchant-played')).toBe(true);
    });
});
