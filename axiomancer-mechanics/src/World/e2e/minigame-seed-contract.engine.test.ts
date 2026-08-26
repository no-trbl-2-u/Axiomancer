/**
 * Mechanics minigame seed contract — hermetic reproducibility suite.
 *
 * These tests pin the shared seed semantics used by minigame engines,
 * CLIs, and playtest harnesses: string seeds are first-class, numeric
 * seeds keep legacy uint32 behavior, same seeds replay exactly, and
 * different seed labels produce different dealt state.
 */
import { describe, expect, it } from 'vitest';

import { createHazardSession } from '../Hazard/hazard.engine';
import { hazardStarterBag } from '../Hazard/hazard.deck-flags';
import { minigameRunSeed, seedInputToUint32, type SeedInput } from '../seed';

function scrubSeed<T>(value: T): unknown {
    return JSON.parse(JSON.stringify(value, (key, val) => (key === 'seed' ? '<seed>' : val)));
}

function expectReplayable<T>(label: string, build: (seed: SeedInput) => T): void {
    const first = scrubSeed(build('mechanics-seed-contract'));
    const replay = scrubSeed(build('mechanics-seed-contract'));
    const different = scrubSeed(build('mechanics-seed-contract-alt'));

    expect(first, `${label} should replay exactly for the same string seed`).toEqual(replay);
    expect(first, `${label} should vary for a different string seed`).not.toEqual(different);
}

describe('shared minigame seed utility', () => {
    it('normalizes numeric and string seeds to deterministic uint32 values', () => {
        expect(seedInputToUint32(42)).toBe(42);
        expect(seedInputToUint32(-1)).toBe(0xffffffff);
        expect(seedInputToUint32('contract-alpha')).toBe(seedInputToUint32('contract-alpha'));
        expect(seedInputToUint32('contract-alpha')).not.toBe(seedInputToUint32('contract-beta'));
    });

    it('derives stable per-run seeds without collapsing adjacent runs', () => {
        expect(minigameRunSeed('contract-alpha', 0)).toBe(minigameRunSeed('contract-alpha', 0));
        expect(minigameRunSeed('contract-alpha', 0)).not.toBe(minigameRunSeed('contract-alpha', 1));
        expect(minigameRunSeed(123, 2)).toBe(((123 >>> 0) + 2) >>> 0);
    });
});

describe('minigame engine seed contract', () => {
    it('Hazard sessions accept string seeds and replay dealt state', () => {
        expectReplayable('Hazard', seed => createHazardSession(seed, hazardStarterBag(), 'cracked-cliff'));
    });

    // Rest-choice (Phase 52c-d, replacing the retired rest minigame — Phase
    // 52e) has no entry here: `createRestChoiceSession` is deterministic
    // given its inputs — no dealt state depends on the seed, so this
    // contract doesn't apply to it.

    // Loot-cache-choice (Phase 63, replacing the retired Pick Pool
    // dice-pool minigame) has no entry here either, for the same reason as
    // rest-choice: `createLootCacheChoiceSession` is deterministic given
    // its host-rolled inputs — no dealt state depends on the seed.

    // QuestBoard (Phase 61 — the minigame is retired) had an entry here;
    // removed along with `World/QuestBoard/`.
});
