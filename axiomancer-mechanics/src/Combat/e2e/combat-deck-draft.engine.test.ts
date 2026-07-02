/**
 * Hermetic e2e — seeded combat-deck drafting (`combat.deck-draft`).
 *
 * Verifies drafting is deterministic for a given rng state, respects size /
 * maxCopies / stage maturity gates, weights the requested focus (a dot draft
 * carries strictly more DoT cards than a damage draft — status play stays the
 * headline), guarantees the defend + status floor, appends Retreat exactly
 * once, and that `resolveDeckSelection` handles all four selection kinds.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import {
    draftCombatDeck, resolveDeckSelection,
    type CombatDeckSelection, type DeckDraftOptions,
} from '../combat.deck-draft';
import { COMBAT_STAGE_PROFILES, stageEligibleCardIds, buildStagePlayer } from '../combat.stage-profiles';
import { buildPresetDeck } from '../combat.deck-presets';
import { classifyVerbClass } from '../combat.cards';
import { getCardById } from '../../Cards/cards.library';
import { lookupEffect } from '../../Effects';
import { initializeCombatEncounter } from '../combat.engine';
import { TidepoolCrab } from '../../Enemy/enemy.library';
import { deepClone } from '../../Utils';
import type { Card } from '../../Cards/types';
import type { CombatVerbClass } from '../combat.encounter.types';

afterEach(() => vi.restoreAllMocks());

/** Small local Park-Miller LCG — seeded rng without touching the global singleton. */
function lcg(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

function verbClassOf(cardId: string): CombatVerbClass | null {
    const skill = getCardById(cardId);
    return skill ? classifyVerbClass(skill, lookupEffect).verbClass : null;
}

function withoutRetreat(deck: string[]): string[] {
    return deck.filter(id => id !== 'card-retreat');
}

function countClass(deck: string[], classes: readonly CombatVerbClass[]): number {
    return withoutRetreat(deck).filter(id => classes.includes(verbClassOf(id)!)).length;
}

const STATUS_CLASSES: readonly CombatVerbClass[] = ['direct-dot', 'direct-control', 'stat-debuff'];

describe('draftCombatDeck determinism', () => {
    it('the same rng state always drafts the same deck', () => {
        const a = draftCombatDeck({ focus: 'dot', rng: lcg(42) });
        const b = draftCombatDeck({ focus: 'dot', rng: lcg(42) });
        expect(a).toEqual(b);
    });

    it('different rng states draft different decks (the sample is actually random)', () => {
        const a = draftCombatDeck({ focus: 'balanced', rng: lcg(1) });
        const b = draftCombatDeck({ focus: 'balanced', rng: lcg(2) });
        expect(a).not.toEqual(b);
    });
});

describe('draftCombatDeck size / copies / retreat', () => {
    it('drafts exactly `size` cards (default 10) plus one Retreat, max 2 copies each', () => {
        for (const seed of [1, 7, 13]) {
            const deck = draftCombatDeck({ focus: 'balanced', rng: lcg(seed) });
            const cards = withoutRetreat(deck);
            expect(cards.length).toBe(10);
            expect(deck.filter(id => id === 'card-retreat').length).toBe(1);
            expect(deck[deck.length - 1]).toBe('card-retreat');
            const counts = new Map<string, number>();
            for (const id of cards) counts.set(id, (counts.get(id) ?? 0) + 1);
            for (const [id, n] of counts) expect(n, `${id} over maxCopies`).toBeLessThanOrEqual(2);
        }
    });

    it('honors a custom size and maxCopies', () => {
        const deck = draftCombatDeck({ focus: 'dot', size: 6, maxCopies: 1, rng: lcg(5) });
        const cards = withoutRetreat(deck);
        expect(cards.length).toBe(6);
        expect(new Set(cards).size).toBe(6); // maxCopies 1 → all unique
    });

    it('caps at pool capacity when size exceeds it (early stage, exhaustive draft)', () => {
        const early = COMBAT_STAGE_PROFILES.early;
        const poolSize = stageEligibleCardIds(early).length;
        const deck = draftCombatDeck({ focus: 'balanced', stage: early, size: 999, maxCopies: 2, rng: lcg(3) });
        expect(withoutRetreat(deck).length).toBe(poolSize * 2);
    });
});

describe('draftCombatDeck focus weighting', () => {
    it('a dot-focus deck carries strictly more direct-dot cards than a damage-focus deck', () => {
        // Aggregated over fixed seeds so the assertion is a property of the 4x
        // weighting, not a fluke of one sample. Deterministic — never flakes.
        let dotCount = 0;
        let damageCount = 0;
        for (const seed of [1, 2, 3, 4, 5]) {
            dotCount += countClass(draftCombatDeck({ focus: 'dot', rng: lcg(seed) }), ['direct-dot']);
            damageCount += countClass(draftCombatDeck({ focus: 'damage', rng: lcg(seed) }), ['direct-dot']);
        }
        expect(dotCount).toBeGreaterThan(damageCount);
    });

    it('a control-focus deck leans into control/stat-debuff over a utility-focus deck', () => {
        let controlCount = 0;
        let utilityCount = 0;
        for (const seed of [1, 2, 3, 4, 5]) {
            controlCount += countClass(
                draftCombatDeck({ focus: 'control', rng: lcg(seed) }),
                ['direct-control', 'stat-debuff']);
            utilityCount += countClass(
                draftCombatDeck({ focus: 'utility', rng: lcg(seed) }),
                ['direct-control', 'stat-debuff']);
        }
        expect(controlCount).toBeGreaterThan(utilityCount);
    });

    it('every draft guarantees at least one defend and one status-applying card', () => {
        // Even the raw-damage focus keeps a status line — doctrine: status play
        // must never be locked out of a drafted deck.
        for (const seed of [1, 4, 9, 16, 25]) {
            for (const focus of ['dot', 'control', 'utility', 'damage', 'balanced'] as const) {
                const deck = draftCombatDeck({ focus, rng: lcg(seed) });
                expect(countClass(deck, ['defend']), `${focus}/${seed} lacks defend`).toBeGreaterThanOrEqual(1);
                expect(countClass(deck, STATUS_CLASSES), `${focus}/${seed} lacks status`).toBeGreaterThanOrEqual(1);
            }
        }
    });
});

describe('draftCombatDeck stage + extraCards pools', () => {
    it('an early-stage draft contains only tier-1, level-gated cards', () => {
        const early = COMBAT_STAGE_PROFILES.early;
        for (const seed of [1, 2, 3]) {
            const deck = draftCombatDeck({ focus: 'dot', stage: early, rng: lcg(seed) });
            for (const id of withoutRetreat(deck)) {
                const card = getCardById(id);
                expect(card, `unknown drafted card ${id}`).toBeDefined();
                expect(card!.tier).toBe(1);
                expect(card!.learningRequirement?.level ?? 1).toBeLessThanOrEqual(early.playerLevel);
            }
        }
    });

    it('extraCards join the pool under the stage gates (exhaustive draft proves membership)', () => {
        const extraDot: Card = {
            id: 'draft-test-extra-dot', name: 'Draft Test Dot', category: 'fallacy',
            philosophicalAspect: 'body', description: 'test-only DoT card', tier: 1,
            targetType: 'enemy', basePower: 8, scalingStat: 'body',
            combatEffects: [{ effectId: 'debuff_bleed', appliedTo: 'opponent', intensity: 2, duration: 3 }],
            learningRequirement: { level: 1 },
        };
        const overTier: Card = { ...extraDot, id: 'draft-test-extra-t3', tier: 3 };
        const options: DeckDraftOptions = {
            focus: 'dot', stage: COMBAT_STAGE_PROFILES.early,
            size: 999, maxCopies: 2, rng: lcg(11), extraCards: [extraDot, overTier],
        };
        const deck = draftCombatDeck(options);
        expect(deck.filter(id => id === 'draft-test-extra-dot').length).toBe(2);
        expect(deck).not.toContain('draft-test-extra-t3'); // tier gate still applies
    });
});

describe('resolveDeckSelection', () => {
    it("kind 'preset' delegates to buildPresetDeck (unknown preset → empty)", () => {
        const selection: CombatDeckSelection = { kind: 'preset', presetId: 'dot-erosion' };
        expect(resolveDeckSelection(selection, undefined)).toEqual(buildPresetDeck('dot-erosion'));
        expect(resolveDeckSelection({ kind: 'preset', presetId: 'nope' }, undefined)).toEqual([]);
    });

    it("kind 'draft' drafts with the given focus/size, scoped to the stage", () => {
        const selection: CombatDeckSelection = { kind: 'draft', focus: 'control', size: 8 };
        const early = COMBAT_STAGE_PROFILES.early;
        const a = resolveDeckSelection(selection, early, lcg(21));
        const b = resolveDeckSelection(selection, early, lcg(21));
        expect(a).toEqual(b);
        expect(withoutRetreat(a).length).toBe(8);
        for (const id of withoutRetreat(a)) expect(getCardById(id)!.tier).toBe(1);
    });

    it("kind 'cards' drops invalid ids and appends Retreat exactly once", () => {
        const deck = resolveDeckSelection(
            { kind: 'cards', cardIds: ['slippery-slope', 'not-a-card', 'brace-for-impact'] },
            undefined);
        expect(deck).toEqual(['slippery-slope', 'brace-for-impact', 'card-retreat']);

        const withRetreat = resolveDeckSelection(
            { kind: 'cards', cardIds: ['card-retreat', 'befriend'] }, undefined);
        expect(withRetreat.filter(id => id === 'card-retreat').length).toBe(1);
    });

    it("kind 'policy-pick' throws at this layer (the harness resolves it)", () => {
        expect(() => resolveDeckSelection({ kind: 'policy-pick' }, undefined))
            .toThrowError(/policy-pick/);
    });
});

describe('drafted decks drive the engine', () => {
    it('a stage draft initializes a real encounter (deck = drafted ids)', () => {
        const early = COMBAT_STAGE_PROFILES.early;
        const deck = draftCombatDeck({ focus: 'dot', stage: early, rng: lcg(8) });
        const state = initializeCombatEncounter(buildStagePlayer(early), deepClone(TidepoolCrab), deck, 8);
        expect(state.deck).toEqual(deck);
        expect(state.hand.length).toBeGreaterThan(0);
        expect(state.finalOutcome).toBeNull();
    });
});
