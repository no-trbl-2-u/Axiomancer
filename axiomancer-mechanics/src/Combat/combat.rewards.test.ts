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
 *
 * After the card purge (P1, 2026-09-27) the library is the grey office —
 * three themeless cards — so no library card carries a reward theme. The
 * theme-aware roll is still the live reward code (a guided session's next
 * card will carry a theme), so its contract is pinned on a THEMED FIXTURE
 * POOL: six themes x eight sandbox cards (3 common, 2 uncommon, 3 rare —
 * rare-heavy by count, the old canon's shape), plus one sandbox curse,
 * registered for the file and injected through the `extraPool` hook.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import {
    COMBAT_REWARD_POOL, REWARD_OFF_THEME_RATE, REWARD_RARITY_WEIGHTS, REWARD_THEMES,
    STARTING_CARD_IDS, addRewardCard, deckThemeCounts, deckThemeShares, rollCombatCardRewards,
    type RewardTheme,
} from './combat.rewards';
import { getCardById } from '../Cards/cards.library';
import { clearSandboxCards, registerSandboxCards } from '../Cards/cards.sandbox';
import { rankToRarity, type Card, type CardRank } from '../Cards/types';
import { Player } from '../Character/characters.mock';
import { deepClone } from '../Utils';
import type { Character } from '../Character/types';

// ─── The themed fixture pool ────────────────────────────────────────────────

const FIXTURE_RANKS: readonly CardRank[] = [1, 1, 1, 3, 3, 5, 5, 5];

function fixtureCard(id: string, theme: Card['theme'], rank: CardRank): Card {
    return {
        id, theme, rank,
        name: `Reward Fixture ${id}`,
        description: 'Test-only themed reward candidate.',
        color: 'any',
        tier: 1,
        cardType: 'spell',
        targetType: 'enemy',
        free: { damage: 1 },
        specialMechanics: [{ kind: 'deal', amount: 3 }],
    };
}

const THEMED_FIXTURES: readonly Card[] = REWARD_THEMES.flatMap(theme =>
    FIXTURE_RANKS.map((rank, i) => fixtureCard(`rw-fx-${theme}-${i}`, theme, rank)));
const CURSE_FIXTURE: Card = fixtureCard('rw-fx-curse', 'curse', 1);

/** Every themed fixture id — passed as `extraPool` so the roll sees them. */
const FIXTURE_POOL: readonly string[] = THEMED_FIXTURES.map(c => c.id);
const idsOf = (theme: RewardTheme): string[] =>
    THEMED_FIXTURES.filter(c => c.theme === theme).map(c => c.id);

/** The pivot-deck fixture (the old Apostate's shape): leans on rot, debt and
 *  vigil, holds a little grave, ONE choir card, and ZERO trial. */
const APOSTATE: readonly string[] = [
    ...idsOf('rot').slice(0, 4), ...idsOf('debt').slice(0, 4), ...idsOf('vigil').slice(0, 4),
    ...idsOf('grave').slice(0, 2), idsOf('choir')[0],
];

beforeAll(() => registerSandboxCards([...THEMED_FIXTURES, CURSE_FIXTURE]));
afterAll(() => clearSandboxCards());

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

function playerWithDeck(cardIds: readonly string[]): Character {
    const player = deepClone(Player);
    player.knownCards = [...cardIds];
    player.combatRewardCards = [];
    return player;
}

/**
 * Phase 104 — the theme/rarity-aware roll only activates once
 * `REWARD_RANDOM_PICKS` (3) reward cards are already held; below that every
 * slot is uniform (see `combat.rewards.ts`). The theme/rarity tests in this
 * file pin the WEIGHTED path's behaviour, so their fixtures must already be
 * past that gate. Filler is drawn from the deck's own cards (when it has
 * any) so it never introduces a theme the deck doesn't already play.
 */
function pastRandomPicksFloor(player: Character): Character {
    const filler = player.knownCards.slice(0, 3);
    return { ...player, combatRewardCards: [...(player.combatRewardCards ?? []), ...filler] };
}

/** Rolls `screens` reward screens off consecutive seeds and flattens the offers. */
function sweep(player: Character, screens: number, count = 3): string[] {
    const out: string[] = [];
    for (let seed = 1; seed <= screens; seed++) {
        out.push(...rollCombatCardRewards(player, seededRng(seed), count, FIXTURE_POOL));
    }
    return out;
}

const themeOf = (id: string): string => getCardById(id)?.theme ?? 'none';
const share = (ids: string[], predicate: (id: string) => boolean): number =>
    ids.filter(predicate).length / ids.length;


describe('theme-aware combat card rewards', () => {
    describe('the deck-theme read', () => {
        it('tallies the union of learned cards and earned reward cards', () => {
            const rotId = idsOf('rot')[0];
            const vigilId = idsOf('vigil')[0];
            const player = addRewardCard(playerWithDeck([rotId, rotId]), vigilId);
            const counts = deckThemeCounts(player);
            expect(counts.rot).toBe(2);   // duplicates count — texture is the signal
            expect(counts.vigil).toBe(1); // the earned reward card is part of the deck
        });

        it('excludes curse contamination from the tally (it is never offerable)', () => {
            const counts = deckThemeCounts(playerWithDeck([CURSE_FIXTURE.id, idsOf('rot')[0]]));
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

        it('the grey office is themeless — the fresh deck reads as uncommitted', () => {
            const shares = deckThemeShares(playerWithDeck(STARTING_CARD_IDS));
            expect(REWARD_THEMES.every(t => shares[t] === 0)).toBe(true);
        });
    });

    describe('determinism', () => {
        it('the same player and seed always produce the same offers', () => {
            const player = playerWithDeck(APOSTATE);
            const a = rollCombatCardRewards(player, seededRng(4242), 3, FIXTURE_POOL);
            const b = rollCombatCardRewards(player, seededRng(4242), 3, FIXTURE_POOL);
            expect(a).toEqual(b);
            expect(a.length).toBe(3);
        });

        it('a different seed moves the offers (the roll is not a constant)', () => {
            const player = playerWithDeck(APOSTATE);
            const seen = new Set<string>();
            for (let seed = 1; seed <= 40; seed++) {
                seen.add(rollCombatCardRewards(player, seededRng(seed), 3, FIXTURE_POOL).join('|'));
            }
            expect(seen.size).toBeGreaterThan(20);
        });

        it('the deck itself moves the offers — two decks, one seed, different draws', () => {
            // Phase 104 — deck composition only steers the roll once
            // REWARD_RANDOM_PICKS reward cards are already held (below that,
            // every draw is uniform and deck-blind by design).
            const apostate = rollCombatCardRewards(
                pastRandomPicksFloor(playerWithDeck(APOSTATE)), seededRng(77), 3, FIXTURE_POOL);
            const rotOnly = rollCombatCardRewards(
                pastRandomPicksFloor(playerWithDeck(idsOf('rot'))),
                seededRng(77),
                3,
                FIXTURE_POOL,
            );
            expect(apostate).not.toEqual(rotOnly);
        });
    });

    describe('the on-theme pull is real', () => {
        it('a single-theme deck is offered its own theme far above pool chance', () => {
            const offers = sweep(pastRandomPicksFloor(playerWithDeck(idsOf('grave'))), 400);
            const onTheme = share(offers, id => themeOf(id) === 'grave');
            // Pool chance for one of six themes is ~1/6. A deck that plays
            // ONLY grave should take every on-theme slot, so the measured rate
            // lands on the on-theme slot rate itself (~65%), not near 1/6.
            expect(onTheme).toBeGreaterThan(0.55);
            expect(onTheme).toBeLessThan(1 - REWARD_OFF_THEME_RATE + 0.15);
        });

        it("the Apostate's three lead themes (rot/debt/vigil) dominate its offers", () => {
            const offers = sweep(pastRandomPicksFloor(playerWithDeck(APOSTATE)), 400);
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
            const offers = sweep(pastRandomPicksFloor(playerWithDeck(APOSTATE)), 500);
            // Both unseated themes must appear at a rate a player NOTICES —
            // the design floor is "a real door", not a rounding error.
            expect(share(offers, id => themeOf(id) === 'trial')).toBeGreaterThan(0.04);
            expect(share(offers, id => themeOf(id) === 'choir')).toBeGreaterThan(0.04);
        });

        it('a 3-offer screen shows the Apostate a pivot card most of the time it matters', () => {
            const player = pastRandomPicksFloor(playerWithDeck(APOSTATE));
            let screensWithPivot = 0;
            for (let seed = 1; seed <= 500; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3, FIXTURE_POOL);
                if (offers.some(id => themeOf(id) === 'trial' || themeOf(id) === 'choir')) screensWithPivot++;
            }
            // ~2 in 5 screens open a door out of the build. Loud enough to see,
            // quiet enough that the deck still deepens.
            expect(screensWithPivot / 500).toBeGreaterThan(0.25);
            expect(screensWithPivot / 500).toBeLessThan(0.6);
        });

        it('even a single-theme deck keeps every other theme on the table', () => {
            const offers = sweep(pastRandomPicksFloor(playerWithDeck(idsOf('rot'))), 500);
            for (const theme of REWARD_THEMES.filter(t => t !== 'rot')) {
                expect(share(offers, id => themeOf(id) === theme)).toBeGreaterThan(0.02);
            }
        });
    });

    describe('rarity scaling holds', () => {
        it('commons lead, uncommons follow, rares stay the prize', () => {
            // The fresh grey deck: themeless, so every theme stays equally live.
            const offers = sweep(pastRandomPicksFloor(playerWithDeck(STARTING_CARD_IDS)), 500);
            const rarity = (id: string): string => rankToRarity(getCardById(id)?.rank ?? 1);
            const common = share(offers, id => rarity(id) === 'common');
            const uncommon = share(offers, id => rarity(id) === 'uncommon');
            const rare = share(offers, id => rarity(id) === 'rare');
            expect(common).toBeGreaterThan(uncommon);
            expect(uncommon).toBeGreaterThan(rare);
            // The fixture pool is rare-heavy by COUNT (3 rares to 3 commons per
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
            const curseIds = [CURSE_FIXTURE.id];
            expect(getCardById(CURSE_FIXTURE.id)?.theme).toBe('curse');
            const player = playerWithDeck(APOSTATE);
            for (let seed = 1; seed <= 200; seed++) {
                const offers = rollCombatCardRewards(player, seededRng(seed), 3, [...FIXTURE_POOL, ...curseIds]);
                expect(offers.some(id => curseIds.includes(id))).toBe(false);
            }
        });

        it('offers are always distinct and always resolvable', () => {
            const player = playerWithDeck(APOSTATE);
            for (let seed = 1; seed <= 300; seed++) {
                // The bare pool: the grey office (D44), no injection.
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
                color: 'body',
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
            expect(rewarded.combatRewardCards).toEqual([COMBAT_REWARD_POOL[0]]);
            expect(rewarded.knownCards).toEqual(player.knownCards);
        });
    });
});
