/**
 * Hermetic sim e2e — card coverage: EVERY card in the library is exercisable.
 *
 * The dead-card detector. For each of the 65 library ids, one seeded
 * `runOneEncounter` against a weak enemy carries a deck stacked with three
 * copies of the card plus a tiny known-good support kit, and `focusCardIds`
 * boosts the card to the front of every ranking band — so if the card can be
 * played AT ALL, it will be. A card that registers zero plays under all three
 * fallback seeds FAILS the suite: that is the point (doctrine: status effects
 * are the MAIN fun, and a card nobody can fire is dead weight in the status
 * toolbox).
 *
 * Coverage counts fizzle-drains honestly: the sim drains a token-gated or
 * resource-starved bottom via the card's free top action (a real play), and a
 * gated Befriend attempt against a non-vulnerable enemy still resolves as a
 * bottom play (`befriend-attempted`, successful: false) — so 'befriend' needs
 * no hpGate staging to be exercised here; its SUCCESS path is covered by the
 * balance sim's mercy loadout.
 *
 * The synthetic 'card-retreat' is policy-invisible (every policy filters the
 * retreat verb), so it is covered by a direct engine assertion instead: its
 * bottom action must end the encounter with outcome 'retreat'.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';

import { cardLibrary } from '../../Cards/cards.library';
import { ENEMY_REGISTRY } from '../../Enemy/enemy.library';
import type { Enemy } from '../../Enemy/types';
import type { Character } from '../../Character/types';
import { deepClone } from '../../Utils';
import { COMBAT_STAGE_PROFILES, buildStagePlayer } from '../combat.stage-profiles';
import { runOneEncounter } from '../combat.encounter.sim';
import {
    initializeCombatEncounter, rollEncounterDice, playCombatCard, handCards,
} from '../combat.engine';

afterEach(() => vi.restoreAllMocks());

const BASE_SEED = 11;
/** Up to three attempts per card before declaring it dead: seed, +1000, +2000. */
const SEED_OFFSETS = [0, 1000, 2000] as const;

/** Known-good support kit rounding out every coverage deck (defend + DoT +
 *  befriend keep the encounter honest while the focused card takes the lead). */
const SUPPORT_KIT = ['brace-for-impact', 'slippery-slope', 'befriend'] as const;

const WEAK_ENEMY: Enemy = deepClone(
    (ENEMY_REGISTRY as Record<string, Enemy>)['tidepool-crab'],
);

/** Late-stage player who additionally knows EVERY library card — the engine's
 *  `executeSkill` throws on unknown skills, and coverage must reach cards the
 *  stage pool might not include. (`runOneEncounter` deep-clones per run, so a
 *  single shared player is safe.) */
function buildCoveragePlayer(): Character {
    const player = buildStagePlayer(COMBAT_STAGE_PROFILES.late);
    player.knownSkills = [...new Set([
        ...player.knownSkills,
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
    it('the coverage universe is the full 65-card library', () => {
        expect(cardLibrary.length).toBe(65);
        expect(new Set(cardLibrary.map(c => c.id)).size).toBe(65);
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

describe('card coverage — synthetic retreat card (direct engine assertion)', () => {
    it("the retreat bottom action ends the encounter with outcome 'retreat'", () => {
        // A 5-card deck is drawn whole into the opening hand, so the retreat
        // card is guaranteed to be present without any draw luck.
        const deck = ['card-retreat', ...SUPPORT_KIT, 'ad-hominem-strike'];
        let state = initializeCombatEncounter(PLAYER, WEAK_ENEMY, deck, BASE_SEED);
        state = rollEncounterDice(state).state;
        expect(state.phase).toBe('phase-play');

        const retreat = handCards(state).find(c => c.card.verbClass === 'retreat');
        expect(retreat, 'card-retreat missing from the opening hand').toBeDefined();

        const res = playCombatCard(state, { uid: retreat!.uid }, true);
        expect(res.state.finalOutcome).toBe('retreat');
        expect(res.state.phase).toBe('complete');
        expect(res.events.some(e => e.kind === 'combat-ended' && e.outcome === 'retreat')).toBe(true);
    }, 30_000);
});
