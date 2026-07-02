/**
 * Hermetic e2e — Phase 30 unit 2 (Spec 06 Q7 + Phase 30 brief).
 *
 * Verifies that `character:levelup` events emitted by the store carry
 * an `unlockedSkills: string[]` payload listing skill ids that crossed
 * their `learningRequirement` threshold during the promotion. The
 * computation lives in `enrichExtra` in `src/Game/store.ts`; this test
 * drives the public store surface (no internal-helper calls).
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character';
import { createGameStore } from '../store';
import { createEventEmitter } from '../events';
import { createNewGameState } from '../game.reducer';
import { nullAdapter } from '../persistence/null.adapter';
import { cardLibrary } from '../../Cards/cards.library';
import { EXPERIENCE_PER_LEVEL } from '../game-mechanics.constants';
import type { TypedLevelUpEvent } from '../events.types';

function buildStore(level: number, opts: {
    experience?: number;
    knownSkills?: string[];
    /** Phase 46 — override alignment so alignment-gated tier-3 skills can pass. */
    philosophicalAlignment?: { epistemology: number; outlook: number; scope: number };
} = {}) {
    const events = createEventEmitter();
    const player = createCharacter({
        name: 'Learner',
        level,
        baseStats: { heart: 5, body: 5, mind: 5 },
        knownSkills: opts.knownSkills ?? [],
    });
    const state = { ...createNewGameState(), player };
    if (opts.experience !== undefined) state.player.experience = opts.experience;
    if (opts.philosophicalAlignment !== undefined) {
        state.philosophicalAlignment = opts.philosophicalAlignment;
    }
    const captured: TypedLevelUpEvent[] = [];
    events.on('character:levelup', e => captured.push(e as TypedLevelUpEvent));
    const store = createGameStore(nullAdapter, state, events);
    return { store, captured };
}

describe('character:levelup payload — Phase 30 unit 2', () => {
    it('emits unlockedSkills = [] when LEVEL_UP fires without a level change', () => {
        const { store, captured } = buildStore(1, { experience: 0 });
        // experience < threshold → applyLevelUps is a no-op.
        store.getState().levelUp();
        expect(captured).toHaveLength(1);
        expect(captured[0].payload.unlockedSkills).toBeUndefined();
        // (enrichExtra returns the unchanged extra when no promotion fired.)
    });

    it('lists newly-eligible tier-2 skills when crossing level 5', () => {
        // Level 4 → level 5 unlocks the 3 tier-2 skills (default level requirement = 5).
        // Seed XP just over the level-5 threshold.
        const { store, captured } = buildStore(4, {
            experience: 4 * EXPERIENCE_PER_LEVEL + 1,
        });
        store.getState().levelUp();
        expect(captured).toHaveLength(1);
        const unlocked = captured[0].payload.unlockedSkills ?? [];
        // Default-gated tier-2 skills (level requirement = 5) unlock at L5.
        // Content-expansion tier-2 skills carry higher explicit levels and
        // unlock later, so assert containment rather than exact equality.
        const defaultTier2Ids = cardLibrary
            .filter(s => s.tier === 2 && !s.learningRequirement)
            .map(s => s.id);
        expect(unlocked).toEqual(expect.arrayContaining(defaultTier2Ids));
    });

    it('lists both tier-2 and tier-3 skills when a cascade crosses both thresholds', () => {
        // Level 4 with 14000 XP (level-14 worth) cascades through 5..14.
        // Crosses both T2 (level 5) and T3 (level 10) gates.
        // Phase 46 — pass an alignment that satisfies both authored tier-3
        // gates (nirvana-fallacy outlook ≤ -34, appeal-to-fear scope ≥ 34).
        const { store, captured } = buildStore(4, {
            experience: 14 * EXPERIENCE_PER_LEVEL,
            philosophicalAlignment: { epistemology: 0, outlook: -50, scope: 50 },
        });
        store.getState().levelUp();
        const finalLevel = store.getState().player.level;
        expect(finalLevel).toBeGreaterThanOrEqual(14);

        const unlocked = captured[0].payload.unlockedSkills ?? [];
        // Default-gated tier-2 (level 5) and tier-3 (level 10) skills must all
        // unlock by level 14. Higher explicit-requirement content skills only
        // appear once their level is reached, so assert containment.
        const defaultT2T3Ids = cardLibrary
            .filter(s => (s.tier === 2 || s.tier === 3) && !s.learningRequirement)
            .map(s => s.id);
        expect(unlocked).toEqual(expect.arrayContaining(defaultT2T3Ids));
    });

    it('omits already-known skills from the unlock list', () => {
        const tier2KnownId = cardLibrary.find(s => s.tier === 2)!.id;
        const { store, captured } = buildStore(4, {
            experience: 4 * EXPERIENCE_PER_LEVEL + 1,
            knownSkills: [tier2KnownId],
        });
        store.getState().levelUp();
        const unlocked = captured[0].payload.unlockedSkills ?? [];
        expect(unlocked).not.toContain(tier2KnownId);
    });
});
