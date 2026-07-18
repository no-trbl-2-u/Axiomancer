/**
 * Hermetic sim e2e — card coverage: EVERY card in the library is exercisable.
 *
 * The dead-card detector. For each of the 70 spec 32 v3 library ids, one
 * seeded `runOneEncounter` against a weak enemy carries a deck stacked with
 * three copies of the card plus a tiny known-good support kit, and
 * `focusCardIds` boosts the card to the front of every ranking band — so if
 * the card can be played AT ALL, it will be. A card that registers zero plays
 * under all three fallback seeds FAILS the suite: that is the point (doctrine:
 * status effects are the MAIN fun, and a card nobody can fire is dead weight
 * in the status toolbox).
 *
 * Coverage counts fizzle-drains honestly: the sim drains a token-gated or
 * resource-starved bottom via the card's free top action (a real play).
 * Spec 32 v4 — enchant/disenchant carry a FREE line too (a timed 3-round
 * instance of the passive), so their top action is a real play; the PAID line
 * is permanent + unique-in-play, so a second PAID copy drains as a fizzle.
 *
 * There is no synthetic retreat card (no in-combat retreat exists), so the
 * coverage universe is exactly the 70-card library.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { cardLibrary } from '../../Cards/cards.library';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import type { Character } from '../../Character/types';
import { deepClone } from '../../Utils';
import { COMBAT_STAGE_PROFILES, buildStagePlayer } from '../combat.stage-profiles';
import { runOneEncounter } from '../combat.encounter.sim';

afterEach(() => vi.restoreAllMocks());

const BASE_SEED = 11;
/** Up to three attempts per card before declaring it dead: seed, +1000, +2000. */
const SEED_OFFSETS = [0, 1000, 2000] as const;

/** Known-good support kit rounding out every coverage deck (defend + DoT +
 *  bleed keep the encounter honest while the focused card takes the lead). */
const SUPPORT_KIT = ['brace-for-impact', 'slippery-slope', 'festering-argument'] as const;

const WEAK_ENEMY: Enemy = deepClone(
    (ENEMY_REGISTRY as Record<string, Enemy>)['grave-larva'],
);

/** Late-stage player who additionally knows EVERY library card — the engine's
 *  `executeCard` throws on unknown cards, and coverage must reach cards the
 *  stage pool might not include. (`runOneEncounter` deep-clones per run, so a
 *  single shared player is safe.) */
function buildCoveragePlayer(): Character {
    const player = buildStagePlayer(COMBAT_STAGE_PROFILES.late);
    player.knownCards = [...new Set([
        ...player.knownCards,
        ...cardLibrary.map(c => c.id),
    ])];
    return player;
}

const PLAYER: Character = buildCoveragePlayer();

/** Plays recorded for `cardId` on the first seed that exercises it (0 if none). */
function coveragePlays(cardId: string): { plays: number; seedsTried: number[] } {
    const seedsTried: number[] = [];
    for (const offset of SEED_OFFSETS) {
        const seed = BASE_SEED + offset;
        seedsTried.push(seed);
        const run = runOneEncounter(PLAYER, WEAK_ENEMY, seed, 'greedy', {
            deck: [cardId, cardId, cardId, ...SUPPORT_KIT],
            focusCardIds: [cardId],
        });
        const plays = run.cardUsage[cardId]?.plays ?? 0;
        if (plays >= 1) return { plays, seedsTried };
    }
    return { plays: 0, seedsTried };
}

describe('card coverage — every library card is exercisable', () => {
    it('the coverage universe is the 70-card themed library (spec 32 v3 §7)', () => {
        // 10 themes × 7 uniques = 70; zero cross-theme overlap.
        expect(cardLibrary.length).toBe(70);
        expect(new Set(cardLibrary.map(c => c.id)).size).toBe(70);
    });

    it.each(cardLibrary.map(c => [c.id] as const))(
        "'%s' registers at least one play in a focused seeded encounter",
        (cardId) => {
            const { plays, seedsTried } = coveragePlays(cardId);
            expect(
                plays,
                `DEAD CARD: '${cardId}' never played under seeds ${seedsTried.join(', ')} — `
                + 'it cannot be fired even when focus-boosted with 3 copies in a 6-card deck',
            ).toBeGreaterThanOrEqual(1);
        },
        30_000,
    );
});
