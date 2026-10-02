/**
 * Hermetic e2e — level-up card unlocks.
 *
 * Verifies that `character:levelup` events emitted by the store carry
 * an `unlockedCards: string[]` payload — always empty, since card
 * eligibility does not depend on level. The computation lives in `enrichExtra` in
 * `src/Game/store.ts`; this test drives the public store surface (no
 * internal-helper calls).
 */

import { describe, it, expect } from 'vitest';

import { createCharacter } from '../../Character';
import { createGameStore } from '../store';
import { createEventEmitter } from '../events';
import { createNewGameState } from '../game.reducer';
import { nullAdapter } from '../persistence/null.adapter';
import { cardLibrary } from '../../Cards/cards.library';
import { experienceForLevel } from '../../Character/experience';
import type { TypedLevelUpEvent } from '../events.types';

function buildStore(level: number, opts: {
    experience?: number;
    knownCards?: string[];
} = {}) {
    const events = createEventEmitter();
    const player = createCharacter({
        name: 'Learner',
        level,
        baseStats: { heart: 5, body: 5, mind: 5 },
        knownCards: opts.knownCards ?? [],
    });
    const state = { ...createNewGameState(), player };
    if (opts.experience !== undefined) state.player.experience = opts.experience;
    const captured: TypedLevelUpEvent[] = [];
    events.on('character:levelup', e => captured.push(e as TypedLevelUpEvent));
    const store = createGameStore(nullAdapter, state, events);
    return { store, captured };
}

describe('character:levelup payload — cards are no longer level-gated (2026-07-08)', () => {
    it('emits no unlockedCards when LEVEL_UP fires without a level change', () => {
        const { store, captured } = buildStore(1, { experience: 0 });
        // experience < threshold → applyLevelUps is a no-op.
        store.getState().levelUp();
        expect(captured).toHaveLength(1);
        expect(captured[0].payload.unlockedCards).toBeUndefined();
        // (enrichExtra returns the unchanged extra when no promotion fired.)
    });

    it('a real promotion unlocks NOTHING — card eligibility no longer depends on level', () => {
        // Cross level 5 (and beyond): cards carry no level requirement, so
        // eligibility is identical before and after the promotion, so the diff
        // is empty (only stat/prereq gates could ever change it, and
        // none of those move on a plain level-up).
        const { store, captured } = buildStore(4, {
            experience: experienceForLevel(14),
        });
        store.getState().levelUp();
        expect(store.getState().player.level).toBeGreaterThanOrEqual(14);
        const unlocked = captured[0].payload.unlockedCards ?? [];
        expect(unlocked).toEqual([]);
    });

    it('having some cards already known does not surface them on level-up either', () => {
        const someKnown = cardLibrary[0].id;
        const { store, captured } = buildStore(4, {
            experience: experienceForLevel(5) + 1,
            knownCards: [someKnown],
        });
        store.getState().levelUp();
        const unlocked = captured[0].payload.unlockedCards ?? [];
        expect(unlocked).toEqual([]);
    });
});
