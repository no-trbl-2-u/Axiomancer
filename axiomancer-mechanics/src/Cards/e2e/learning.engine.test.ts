/**
 * Hermetic e2e — card learning (Spec 06 Q7, revised 2026-07-08).
 *
 * Drives `getAvailableSkills`, `meetsLearningRequirement`, and `learnSkill`
 * through the public Skills barrel. No I/O, no RNG.
 *
 * 2026-07-08 — the character-LEVEL requirement was REMOVED from cards (a legacy
 * combat carry-over). Cards are now learnable regardless of level; only the
 * optional stat / prerequisite / alignment clauses gate. These tests assert
 * that new reality: level independence plus the surviving gates.
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character';
import {
    getAvailableSkills,
    learnSkill,
    meetsLearningRequirement,
} from '../skill.engine';
import { cardLibrary } from '../cards.library';

const buildPlayer = (level: number, overrides: Partial<{
    baseStats: { heart: number; body: number; mind: number };
    knownSkills: string[];
}> = {}) => createCharacter({
    name: 'Learner',
    level,
    baseStats: overrides.baseStats ?? { heart: 5, body: 5, mind: 5 },
    knownSkills: overrides.knownSkills ?? [],
});

const bareCard = (tier: 1 | 2 | 3, rank: 1 | 5 = 1): typeof cardLibrary[number] => ({
    id: `fab-bare-t${tier}-r${rank}`,
    name: `Fabricated T${tier}`,
    category: 'fallacy',
    philosophicalAspect: 'mind',
    description: 'Fabricated no-requirement fixture.',
    tier,
    rank,
    cardType: 'spell',
    targetType: 'enemy',
});

// The two real-library cards that still carry an alignment gate.
const PACT = 'pact-of-akrasia';       // outlook <= -34
const HEART = 'heart-of-the-matter';  // scope >= 34
const PASS_BOTH = { epistemology: 0, outlook: -50, scope: 50 };

describe('meetsLearningRequirement — cards carry NO level gate', () => {
    it('admits a level-1 character to any no-requirement card, every tier/rank', () => {
        for (const tier of [1, 2, 3] as const) {
            expect(meetsLearningRequirement(buildPlayer(1), bareCard(tier))).toBe(true);
        }
        // A rank-6-equivalent, tier-3 card is still learnable at level 1.
        expect(meetsLearningRequirement(buildPlayer(1), bareCard(3, 5))).toBe(true);
    });

    it('no library card is gated by level — a level-1 character qualifies for the whole library (bar alignment)', () => {
        const ch = buildPlayer(1);
        for (const s of cardLibrary) {
            expect(meetsLearningRequirement(ch, s, PASS_BOTH), s.id).toBe(true);
        }
    });
});

describe('meetsLearningRequirement — stat / prerequisite gates (fabricated fixtures)', () => {
    it('honours a stat-threshold gate independent of level', () => {
        const gated = { ...bareCard(1), id: 'fab-stat-gate',
            learningRequirement: { statRequirementType: 'mind' as const, statRequirementValue: 8 } };
        expect(meetsLearningRequirement(buildPlayer(99, { baseStats: { heart: 5, body: 5, mind: 5 } }), gated)).toBe(false);
        expect(meetsLearningRequirement(buildPlayer(1, { baseStats: { heart: 5, body: 5, mind: 8 } }), gated)).toBe(true);
    });

    it('honours a prerequisite-skill gate independent of level', () => {
        const gated = { ...bareCard(1), id: 'fab-prereq-gate',
            learningRequirement: { prerequisiteSkill: 'some-prior' } };
        expect(meetsLearningRequirement(buildPlayer(99), gated)).toBe(false);
        expect(meetsLearningRequirement(buildPlayer(1, { knownSkills: ['some-prior'] }), gated)).toBe(true);
    });
});

describe('meetsLearningRequirement — requiresAlignment (Phase 46, level-independent)', () => {
    const gatedLte: typeof cardLibrary[number] = {
        ...bareCard(3, 5), id: 'p46-gated-pessimistic',
        learningRequirement: { requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 } },
    };

    it('passes when the alignment meets the threshold — at ANY level', () => {
        expect(meetsLearningRequirement(buildPlayer(1), gatedLte, { epistemology: 0, outlook: -50, scope: 0 })).toBe(true);
    });

    it('fails when the alignment misses the threshold', () => {
        expect(meetsLearningRequirement(buildPlayer(99), gatedLte, { epistemology: 0, outlook: 0, scope: 0 })).toBe(false);
    });

    it('fails when no alignment is passed in (parallel to dialogue behaviour)', () => {
        expect(meetsLearningRequirement(buildPlayer(99), gatedLte)).toBe(false);
    });

    it('the two real-library alignment gates behave the same', () => {
        const pact = cardLibrary.find(s => s.id === PACT)!;
        const heart = cardLibrary.find(s => s.id === HEART)!;
        expect(meetsLearningRequirement(buildPlayer(1), pact, PASS_BOTH)).toBe(true);
        expect(meetsLearningRequirement(buildPlayer(1), pact, { epistemology: 0, outlook: 0, scope: 0 })).toBe(false);
        expect(meetsLearningRequirement(buildPlayer(1), heart, PASS_BOTH)).toBe(true);
        expect(meetsLearningRequirement(buildPlayer(1), heart, { epistemology: 0, outlook: 0, scope: 0 })).toBe(false);
    });
});

describe('getAvailableSkills', () => {
    it('returns every library skill the character does not already know AND qualifies for', () => {
        const ch = buildPlayer(1);
        const available = getAvailableSkills(ch, PASS_BOTH);
        const expected = cardLibrary.filter(s => meetsLearningRequirement(ch, s, PASS_BOTH));
        expect(available.length).toBe(expected.length);
        expect(available.length).toBeGreaterThan(0);
    });

    it('excludes an alignment-gated skill the player misses', () => {
        const ch = buildPlayer(1);
        const neutral = { epistemology: 0, outlook: 0, scope: 0 };
        const availIds = getAvailableSkills(ch, neutral).map(s => s.id);
        expect(availIds).not.toContain(PACT);
        expect(availIds).not.toContain(HEART);
    });

    it('omits already-known skills from the result', () => {
        const known = cardLibrary.map(s => s.id);
        const ch = buildPlayer(1, { knownSkills: known });
        expect(getAvailableSkills(ch, PASS_BOTH)).toEqual([]);
    });

    it('preserves library order so the UI list is stable', () => {
        const ch = buildPlayer(1);
        const available = getAvailableSkills(ch, PASS_BOTH).map(s => s.id);
        const expected = cardLibrary
            .filter(s => meetsLearningRequirement(ch, s, PASS_BOTH))
            .map(s => s.id);
        expect(available).toEqual(expected);
    });
});

describe('learnSkill', () => {
    it('appends the id to knownSkills when eligible — regardless of level', () => {
        const ch = buildPlayer(1);
        const anyCard = cardLibrary.find(s => !s.learningRequirement)!;
        const after = learnSkill(ch, anyCard.id);
        expect(after.knownSkills).toContain(anyCard.id);
        expect(after.knownSkills.length).toBe(ch.knownSkills.length + 1);
    });

    it('is a no-op (same reference) when the skill is already known', () => {
        const anyCard = cardLibrary.find(s => !s.learningRequirement)!;
        const ch = buildPlayer(1, { knownSkills: [anyCard.id] });
        expect(learnSkill(ch, anyCard.id)).toBe(ch);
    });

    it('is a no-op when the skill id is unknown to the library', () => {
        const ch = buildPlayer(1);
        expect(learnSkill(ch, 'no-such-skill')).toBe(ch);
    });

    it('is a no-op when an alignment requirement is not met (learnSkill passes no alignment)', () => {
        // The real alignment-gated cards fail with no alignment threaded in.
        const ch = buildPlayer(1);
        expect(learnSkill(ch, PACT)).toBe(ch);
    });
});
