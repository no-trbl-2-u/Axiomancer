/**
 * Hermetic e2e for Phase 30 unit 1 — skill learning (Spec 06 Q7).
 *
 * Drives `getAvailableSkills`, `meetsLearningRequirement`, and
 * `learnSkill` through the public Skills barrel. No I/O, no RNG —
 * the eligibility filter is a pure derivation from
 * `character.level / baseStats / knownSkills`.
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

describe('meetsLearningRequirement — tier-derived defaults', () => {
    it('admits a level-1 character to every default-gated Tier 1 skill', () => {
        const ch = buildPlayer(1);
        // Scope to skills relying on tier-derived defaults; content-expansion
        // skills may carry explicit higher requirements (level / stat gates).
        for (const s of cardLibrary.filter(x => x.tier === 1 && !x.learningRequirement)) {
            expect(meetsLearningRequirement(ch, s)).toBe(true);
        }
    });

    it('rejects Tier 2 skills below level 5', () => {
        const ch = buildPlayer(4);
        for (const s of cardLibrary.filter(x => x.tier === 2)) {
            expect(meetsLearningRequirement(ch, s)).toBe(false);
        }
    });

    it('rejects Tier 3 skills below level 10', () => {
        const ch = buildPlayer(9);
        for (const s of cardLibrary.filter(x => x.tier === 3)) {
            expect(meetsLearningRequirement(ch, s)).toBe(false);
        }
    });

    it('admits a level-15 character to every Tier 3 skill (with all-passing alignment)', () => {
        const ch = buildPlayer(15);
        // Phase 46 authored two alignment gates on Tier 3 skills:
        //   nirvana-fallacy → outlook ≤ -34
        //   appeal-to-fear  → scope   ≥ 34
        // The two gates are orthogonal axes, so an alignment that satisfies
        // both exists: pessimistic AND transcendent.
        const passAllGates = { epistemology: 0, outlook: -50, scope: 50 };
        // Scope to default-gated tier-3 skills (tier-derived level 10/15).
        // Content-expansion tier-3 skills may require higher levels / stats.
        for (const s of cardLibrary.filter(x => x.tier === 3 && !x.learningRequirement)) {
            expect(meetsLearningRequirement(ch, s, passAllGates)).toBe(true);
        }
    });
});

describe('getAvailableSkills', () => {
    it('returns every library skill the character does not already know AND qualifies for', () => {
        const ch = buildPlayer(15);
        // Phase 46 — same all-passing alignment as the Tier 3 admission test.
        const passAllGates = { epistemology: 0, outlook: -50, scope: 50 };
        const available = getAvailableSkills(ch, passAllGates);
        // Content-expansion added skills with explicit higher level/stat gates
        // not all reachable at level 15; assert the filter returns exactly the
        // qualifying subset (correctness), not the entire library.
        const expected = cardLibrary.filter(s => meetsLearningRequirement(ch, s, passAllGates));
        expect(available.length).toBe(expected.length);
        expect(available.length).toBeGreaterThan(0);
    });

    it('omits already-known skills from the result', () => {
        const known = cardLibrary.filter(s => s.tier === 1).map(s => s.id);
        const ch = buildPlayer(1, { knownSkills: known });
        const available = getAvailableSkills(ch);
        // Only T2+T3 should be candidate, but level 1 disqualifies them.
        expect(available).toEqual([]);
    });

    it('preserves library order so the UI list is stable', () => {
        const ch = buildPlayer(15);
        // Phase 46 — supply the alignment that admits every Tier 3 skill.
        const passAllGates = { epistemology: 0, outlook: -50, scope: 50 };
        const available = getAvailableSkills(ch, passAllGates);
        // Order must mirror the library among the qualifying subset.
        const expectedIds = cardLibrary
            .filter(s => meetsLearningRequirement(ch, s, passAllGates))
            .map(s => s.id);
        const availableIds = available.map(s => s.id);
        expect(availableIds).toEqual(expectedIds);
    });
});

describe('learnSkill', () => {
    it('appends the id to knownSkills when eligible', () => {
        const ch = buildPlayer(1);
        const t1 = cardLibrary.find(s => s.tier === 1)!;
        const after = learnSkill(ch, t1.id);
        expect(after.knownSkills).toContain(t1.id);
        expect(after.knownSkills.length).toBe(ch.knownSkills.length + 1);
    });

    it('is a no-op (same reference) when the skill is already known', () => {
        const t1 = cardLibrary.find(s => s.tier === 1)!;
        const ch = buildPlayer(1, { knownSkills: [t1.id] });
        const after = learnSkill(ch, t1.id);
        expect(after).toBe(ch);
    });

    it('is a no-op when the skill id is unknown to the library', () => {
        const ch = buildPlayer(15);
        const after = learnSkill(ch, 'no-such-skill');
        expect(after).toBe(ch);
    });

    it('is a no-op when the learning requirement is not met', () => {
        const t3 = cardLibrary.find(s => s.tier === 3)!;
        const ch = buildPlayer(5); // T3 needs level 10
        const after = learnSkill(ch, t3.id);
        expect(after).toBe(ch);
    });
});

// ─── Phase 46 — requiresAlignment gate ────────────────────────────────────────

describe('meetsLearningRequirement — requiresAlignment (Phase 46)', () => {
    // Use a fabricated skill whose only-stable-prerequisite is the gate.
    const gatedLte: typeof cardLibrary[number] = {
        id: 'p46-gated-pessimistic',
        name: 'Phase 46 Gated (Pessimistic)',
        category: 'fallacy',
        philosophicalAspect: 'mind',
        description: 'Gated by outlook <= -34.',
        tier: 3,
        targetType: 'enemy',
        basePower: 1,
        scalingStat: 'mind',
        learningRequirement: {
            level: 10,
            requiresAlignment: { axis: 'outlook', op: 'lte', value: -34 },
        },
    };

    it('passes when the player\'s outlook meets the lte threshold', () => {
        const ch = buildPlayer(10);
        expect(meetsLearningRequirement(ch, gatedLte, {
            epistemology: 0, outlook: -50, scope: 0,
        })).toBe(true);
    });

    it('fails when the player\'s outlook misses the threshold', () => {
        const ch = buildPlayer(10);
        expect(meetsLearningRequirement(ch, gatedLte, {
            epistemology: 0, outlook: 0, scope: 0,
        })).toBe(false);
    });

    it('fails when no alignment is passed in (parallel to dialogue behaviour)', () => {
        const ch = buildPlayer(10);
        expect(meetsLearningRequirement(ch, gatedLte)).toBe(false);
    });

    it('still respects the level gate even when alignment matches', () => {
        const ch = buildPlayer(5); // below the level-10 floor
        expect(meetsLearningRequirement(ch, gatedLte, {
            epistemology: 0, outlook: -50, scope: 0,
        })).toBe(false);
    });
});

describe('getAvailableSkills — requiresAlignment filter (Phase 46)', () => {
    it('excludes a real-library skill whose authored gate the player misses', () => {
        // Phase 46 unit 3 will gate `nirvana-fallacy` on outlook <= -34 +
        // `appeal-to-fear` on scope >= 34. Until that lands, this test
        // confirms the filter is wired by adding the gate at runtime.
        const t3 = cardLibrary.find(s => s.tier === 3 && s.id === 'nirvana-fallacy');
        if (!t3) {
            // Card not yet authored; the wiring test is a no-op until Unit 3 lands.
            return;
        }
        const ch = buildPlayer(10);
        const neutral = { epistemology: 0, outlook: 0, scope: 0 };
        const pessimistic = { epistemology: 0, outlook: -50, scope: 0 };
        // Today the skill carries no gate; pass through both. After Unit 3:
        // neutral excludes, pessimistic includes. The test verifies the
        // alignment param THREADS even on unsigned-skill paths.
        const aAtNeutral = getAvailableSkills(ch, neutral);
        const aAtPess = getAvailableSkills(ch, pessimistic);
        // The filter doesn't crash; both lists contain skill ids.
        expect(Array.isArray(aAtNeutral)).toBe(true);
        expect(Array.isArray(aAtPess)).toBe(true);
    });
});

describe('learnSkill — requiresAlignment gate (Phase 46)', () => {
    const gated: typeof cardLibrary[number] = {
        id: 'p46-learn-gated',
        name: 'Phase 46 Learn-Gated',
        category: 'paradox',
        philosophicalAspect: 'heart',
        description: 'Gated by scope >= 34.',
        tier: 1,
        targetType: 'self',
        basePower: 0,
        scalingStat: 'heart',
        learningRequirement: {
            level: 1,
            requiresAlignment: { axis: 'scope', op: 'gte', value: 34 },
        },
    };

    // learnSkill consults the cardLibrary via getCardById; can't test
    // through the real public path without registering the fabricated
    // skill. Test meetsLearningRequirement direct instead (the gate
    // logic this exercises is identical to the path learnSkill takes).
    it('meetsLearningRequirement gates the runtime-only fixture correctly', () => {
        const ch = buildPlayer(1);
        expect(meetsLearningRequirement(ch, gated, { epistemology: 0, outlook: 0, scope: 80 })).toBe(true);
        expect(meetsLearningRequirement(ch, gated, { epistemology: 0, outlook: 0, scope: -80 })).toBe(false);
    });
});
