/**
 * The THEME-AWARE reward draft (2026-08-08) — the post-combat 1-of-3.
 *
 * The contract this file pins:
 *   · determinism — same player + same seeded rng ⇒ same offers, always;
 *   · the on-theme pull is REAL — a committed deck sees its own themes far
 *     more than chance would give it;
 *   · the off-theme pivot is REACHABLE — an Apostate deck (zero trial cards,
 *     one choir card) still gets shown that door at a rate a player notices;
 *   · rarity scaling holds — commons lead, rares stay a prize;
 *   · curses are NEVER offered, not even through the `extraPool` hook;
 *   · offers are always distinct and always resolvable.
 *
 * Every statistical claim here is measured over a fixed seed sweep, so the
 * assertions are exact-and-reproducible, not flaky sampling.
 */

import { describe, it, expect } from 'vitest';

import {
    COMBAT_REWARD_POOL, REWARD_OFF_THEME_RATE, REWARD_RANDOM_PICKS, REWARD_RARITY_WEIGHTS, REWARD_THEMES,
    addRewardCard, deckThemeCounts, deckThemeShares, rollCombatCardRewards,
} from './combat.rewards';
import { getDeckPreset } from './combat.starter-deck-presets';
import { cardLibrary, getCardById } from '../Cards/cards.library';
import { registerSandboxCards } from '../Cards/cards.sandbox';
import { rankToRarity } from '../Cards/types';
import { Player } from '../Character/characters.mock';
import { deepClone } from '../Utils';
import type { Character } from '../Character/types';

/**
 * Local Park-Miller LCG — this file's own generator, never the global
 * singleton. Burned in for 8 draws: a bare Park-Miller fed CONSECUTIVE small
 * seeds emits a near-monotonic first value (seed 1..400 all land under 0.01),
 * which would silently pin every first decision of a seed sweep to the same
 * branch. The burn-in decorrelates the sweep so the measured rates below are
 * the roll's behaviour, not the generator's.
 */
function seededRng(seed: number): () => number {
    let state = Math.abs(seed % 2147483647) || 1;
    const next = (): number => {
        state = (state * 48271) % 2147483647;
        return state / 2147483647;
    };
    for (let i = 0; i < 8; i++) next();
    return next;
}

/**
 * A player whose deck is `cardIds`. Phase 104: the first `REWARD_RANDOM_PICKS`
 * entries are held as TAKEN rewards (the rest as learned cards) so the
 * theme-pull assertions below exercise the leaning draft, not the uniform
 * first-three regime — the tally (`deckThemeCounts`) is the union of both
 * lists, so every count is unchanged by the split. An empty deck stays empty
 * and therefore stays in the uniform regime.
 */
function playerWithDeck(cardIds: readonly string[]): Character {
    const player = deepClone(Player);
    player.combatRewardCards = cardIds.slice(0, REWARD_RANDOM_PICKS);
    player.knownCards = cardIds.slice(REWARD_RANDOM_PICKS);
    return player;
}

/** Rolls `screens` reward screens off consecutive seeds and flattens the offers. */
function sweep(player: Character, screens: number, count = 3): string[] {
    const out: string[] = [];
    for (let seed = 1; seed <= screens; seed++) out.push(...rollCombatCardRewards(player, seededRng(seed), count));
    return out;
}

const themeOf = (id: string): string => getCardById(id)?.theme ?? 'none';
const share = (ids: string[], predicate: (id: string) => boolean): number =>
    ids.filter(predicate).length / ids.length;

const APOSTATE = getDeckPreset('apostate')!.cardIds;
const THREADBARE = getDeckPreset('threadbare')!.cardIds;

describe('theme-aware combat card rewards', () => {
    describe('the deck-theme read', () => {
        it('tallies the union of learned cards and earned reward cards', () => {
            const rotCard = cardLibrary.find(c => c.theme === 'rot')!;
            const vigilCard = cardLibrary.find(c => c.theme === 'vigil')!;
            const player = addRewardCard(playerWithDeck([rotCard.id, rotCard.id]), vigilCard.id);
            const counts = deckThemeCounts(player);
            expect(counts.rot).toBe(2);   // duplicates count — texture is the signal
            expect(counts.vigil).toBe(1); // the earned reward card is part of the deck
        });

        it('excludes curse contamination from the tally (it is never offerable)', () => {
            const curse = cardLibrary.find(c => c.theme === 'curse')!;
            const rot = cardLibrary.find(c => c.theme === 'rot')!;
            const counts = deckThemeCounts(playerWithDeck([curse.id, rot.id]));
            expect(REWARD_THEMES.reduce((sum, t) => sum + counts[t], 0)).toBe(1);
            expect(counts.rot).toBe(1);
        });

        it('shares sum to 1 for a themed deck and to 0 for an empty one', () => {
            const shares = deckThemeShares(playerWithDeck(APOSTATE));
            const total = REWARD_THEMES.reduce((sum, t) => sum + shares[t], 0);
            expect(total).toBeCloseTo(1, 10);
            const empty = deckThemeShares(playerWithDeck([]));
            expect(REWARD_THEMES.every(t => empty[t] === 0)).toBe(true);
        });
    });

    describe('determinism', () => {
        it('the same player and seed always produce the same offers', () => {
            const player = playerWithDeck(APOSTATE);
            const a = rollCombatCardRewards(player, seededRng(4242), 3);
            const b = rollCombatCardRewards(player, seededRng(4242), 3);
            expect(a).toEqual(b);
            expect(a.length).toBe(3);
        });

        it('a different seed moves the offers (the roll is not a constant)', () => {
            const player = playerWithDeck(APOSTATE);
            const seen = new Set<string>();
            for (let seed = 1; seed <= 40; seed++) {
                seen.add(rollCombatCardRewards(player, seededRng(seed), 3).join('|'));
            }
            expect(seen.size).toBeGreaterThan(20);
        });

        it('the deck itself moves the offers — two decks, one seed, different draws', () => {
            const apostate = rollCombatCardRewards(playerWithDeck(APOSTATE), seededRng(77), 3);
            const rotOnly = rollCombatCardRewards(
                playerWithDeck(cardLibrary.filter(c => c.theme === 'rot').map(c => c.id)),
                seededRng(77),
                3,
            );
            expect(apostate).not.toEqual(rotOnly);
        });
    });

    describe('the on-theme pull is real', () => {
        it('a single-theme deck is offered its own theme far above pool chance', () => {
            const graveIds = cardLibrary.filter(c => c.theme === 'grave').map(c => c.id);
            const offers = sweep(playerWithDeck(graveIds), 400);
            const onTheme = share(offers, id => themeOf(id) === 'grave');
            // Pool chance for one of six themes is ~1/6. A deck that plays
            // ONLY grave should take every on-theme slot, so the measured rate
            // lands on the on-theme slot rate itself (~65%), not near 1/6.
            expect(onTheme).toBeGreaterThan(0.55);
            expect(onTheme).toBeLessThan(1 - REWARD_OFF_THEME_RATE + 0.15);
        });

        it("the Apostate's three lead themes (rot/debt/vigil) dominate its offers", () => {
            const offers = sweep(playerWithDeck(APOSTATE), 400);
            const lead = share(offers, id => ['rot', 'debt', 'vigil'].includes(themeOf(id)));
            expect(lead).toBeGreaterThan(0.5);
        });

        it('an uncommitted (empty) deck gets no pull — every theme stays live', () => {
            const offers = sweep(playerWithDeck([]), 400);
            for (const theme of REWARD_THEMES) {
                expect(share(offers, id => themeOf(id) === theme)).toBeGreaterThan(0.05);
            }
        });
    });

    describe('the off-theme pivot stays reachable', () => {
        it('the Apostate (0 trial, 1 choir) is still shown trial and choir', () => {
            const counts = deckThemeCounts(playerWithDeck(APOSTATE));
            expect(counts.trial).toBe(0); // the seat the deck does not hold at all
            const offers = sweep(playerWithDeck(APOSTATE), 500);
            // Both unseated themes must appear at a rate a player NOTICES —
            // the design floor is "a real door", not a rounding error.
            expect(share(offers, id => themeOf(id) === 'trial')).toBeGreaterThan(0.04);
            expect(share(offers, id => themeOf(id) === 'choir')).toBeGreaterThan(0.04);
        });

        it('a 3-offer screen shows the Apostate a pivot card most of the time it matters', () => {
            const player = playerWithDeck(APOSTATE);
            let screensWithPivot = 0;
            for (let seed = 1; seed <= 500; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3);
                if (offers.some(id => themeOf(id) === 'trial' || themeOf(id) === 'choir')) screensWithPivot++;
            }
            // ~2 in 5 screens open a door out of the build. Loud enough to see,
            // quiet enough that the deck still deepens.
            expect(screensWithPivot / 500).toBeGreaterThan(0.25);
            expect(screensWithPivot / 500).toBeLessThan(0.6);
        });

        it('even a single-theme deck keeps every other theme on the table', () => {
            const rotIds = cardLibrary.filter(c => c.theme === 'rot').map(c => c.id);
            const offers = sweep(playerWithDeck(rotIds), 500);
            for (const theme of REWARD_THEMES.filter(t => t !== 'rot')) {
                expect(share(offers, id => themeOf(id) === theme)).toBeGreaterThan(0.02);
            }
        });
    });

    describe('rarity scaling holds', () => {
        it('commons lead, uncommons follow, rares stay the prize', () => {
            const offers = sweep(playerWithDeck(THREADBARE), 500);
            const rarity = (id: string): string => rankToRarity(getCardById(id)?.rank ?? 1);
            const common = share(offers, id => rarity(id) === 'common');
            const uncommon = share(offers, id => rarity(id) === 'uncommon');
            const rare = share(offers, id => rarity(id) === 'rare');
            expect(common).toBeGreaterThan(uncommon);
            expect(uncommon).toBeGreaterThan(rare);
            // The library is rare-heavy by COUNT (3 rares to 3 commons per
            // theme); the 0.2 weight is what keeps a rare an event.
            expect(rare).toBeLessThan(0.25);
            expect(rare).toBeGreaterThan(0.02);
        });

        it('the weight ladder itself is strictly descending', () => {
            expect(REWARD_RARITY_WEIGHTS.common).toBeGreaterThan(REWARD_RARITY_WEIGHTS.uncommon);
            expect(REWARD_RARITY_WEIGHTS.uncommon).toBeGreaterThan(REWARD_RARITY_WEIGHTS.rare);
        });
    });

    describe('the pool laws', () => {
        it('never offers a curse, over the whole seed sweep', () => {
            const offers = sweep(playerWithDeck(APOSTATE), 500);
            expect(offers.some(id => themeOf(id) === 'curse')).toBe(false);
            expect(COMBAT_REWARD_POOL.some(id => getCardById(id)?.theme === 'curse')).toBe(false);
        });

        it('never offers a curse smuggled in through the extraPool hook', () => {
            const curseIds = cardLibrary.filter(c => c.theme === 'curse').map(c => c.id);
            expect(curseIds.length).toBeGreaterThan(0);
            const player = playerWithDeck(APOSTATE);
            for (let seed = 1; seed <= 200; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3, curseIds);
                expect(offers.some(id => curseIds.includes(id))).toBe(false);
            }
        });

        it('offers are always distinct and always resolvable', () => {
            const player = playerWithDeck(APOSTATE);
            for (let seed = 1; seed <= 300; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3);
                expect(offers.length).toBe(3);
                expect(new Set(offers).size).toBe(3);
                for (const id of offers) {
                    expect(getCardById(id)).toBeTruthy();
                    expect(COMBAT_REWARD_POOL).toContain(id);
                }
            }
        });

        it('a registered sandbox card can compete; an unregistered id is dropped', () => {
            registerSandboxCards([{
                id: 'qa-reward-sandbox-card',
                name: 'QA Reward Sandbox Card (test fixture)',
                description: 'Sandbox candidate for the reward-pool injection hook.',
                philosophicalAspect: 'body',
                theme: 'trial',
                rank: 1,
                cardType: 'spell',
                stance: 'aggressive',
                tier: 1,
                combatEffects: [{ effectId: 'debuff_bleeding', chance: 1, duration: 2 }],
            } as never]);
            const player = playerWithDeck(APOSTATE);
            let sawSandbox = false;
            for (let seed = 1; seed <= 400; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3, ['qa-reward-sandbox-card', 'no-such-card-id']);
                expect(offers).not.toContain('no-such-card-id');
                if (offers.includes('qa-reward-sandbox-card')) sawSandbox = true;
            }
            expect(sawSandbox).toBe(true);
        });

        it('a count larger than the pool degrades to the whole pool, not a crash', () => {
            const offers = rollCombatCardRewards(playerWithDeck(APOSTATE), seededRng(9), COMBAT_REWARD_POOL.length + 25);
            expect(offers.length).toBe(COMBAT_REWARD_POOL.length);
            expect(new Set(offers).size).toBe(offers.length);
        });
    });

    describe('addRewardCard', () => {
        it('appends to the persistent reward collection without touching knownCards', () => {
            const player = playerWithDeck(APOSTATE);
            const rewarded = addRewardCard(player, COMBAT_REWARD_POOL[0]);
            expect(rewarded.combatRewardCards).toEqual([...player.combatRewardCards!, COMBAT_REWARD_POOL[0]]);
            expect(rewarded.knownCards).toEqual(player.knownCards);
        });
    });
});
