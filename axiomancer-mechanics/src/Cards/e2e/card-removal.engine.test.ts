/**
 * Hermetic E2E — Phase 52a: the deck-removal primitive + the escalating price.
 *
 * Driven entirely through the PUBLIC BARREL (`../../index`), the same module
 * path 52d's mobile screen will import, so the barrel export is proven along
 * with the behaviour. No RNG, no clock, no disk: removal is deterministic by
 * construction — there is nothing to roll — so no stub is needed and none is
 * installed.
 *
 * What is pinned here:
 *   - `combatRewardCards` drains BEFORE `knownCards`, one copy at a time;
 *   - the `knownCards` fall-through, including the duplicate-entry case the
 *     mobile starter-bundle path produces;
 *   - loadout reconciliation ACTUALLY shrinks `buildCombatDeck`'s output;
 *   - refusals are first-class values (unknown card, deck at the floor) that
 *     leave the character byte-identical and never advance the counter;
 *   - the floor's DERIVATION from the shipped Profane Canon lineage;
 *   - the price curve at 0/1/2/3 removals and its linearity.
 */

import { describe, it, expect } from 'vitest';

import {
    removeCardFromCombatDeck,
    MIN_COMBAT_DECK_SIZE,
    cardRemovalPrice,
    cardRemovalPriceFor,
    cardRemovalsOf,
    canAffordCardRemoval,
    CARD_REMOVAL_PRICING,
    buildCombatDeck,
    createCharacter,
    addToLoadout,
    getCombatLoadout,
    getDeckPreset,
    PRESET_LINEAGE,
    COMBAT_HAND_SIZE,
} from '../../index';
import type { Character } from '../../index';

// The Threadbare Office — real canon ids, so the fixtures are the shape a real
// early-campaign save carries.
const OFFICE = [
    'spoiled-poultice', 'chilblain-watch', 'petty-indictment', 'first-spadeful',
    'grandmothers-psalter', 'thumbprick-oath', 'thin-hymn', 'threadbare-cope',
] as const;
// Earned rewards — enough to sit the fixture deck comfortably above the floor.
const EARNED = [
    'unction-of-boils', 'the-sextons-bell', 'the-long-lent', 'promissory-cut',
    'the-vig', 'dead-pledge', 'shallow-grave', 'paupers-pyre',
] as const;

function fixture(known: readonly string[], rewards: readonly string[] = []): Character {
    const base = createCharacter({
        name: 'Removal Fixture',
        level: 1,
        baseStats: { heart: 5, body: 5, mind: 5 },
    });
    return { ...base, knownCards: [...known], combatRewardCards: [...rewards] };
}

/** A fixture whose deck sits at exactly `size` cards (all above the floor). */
function deckOf(size: number): Character {
    const known = [...OFFICE].slice(0, Math.min(size, OFFICE.length));
    const rewards: string[] = [];
    while (known.length + rewards.length < size) {
        rewards.push(EARNED[rewards.length % EARNED.length]);
    }
    return fixture(known, rewards);
}

const sum = (r: Record<string, number>): number =>
    Object.values(r).reduce((a, n) => a + n, 0);

describe('Phase 52a — removeCardFromCombatDeck: source ordering', () => {
    it('drains combatRewardCards BEFORE knownCards when both hold the id', () => {
        const player = fixture(OFFICE, [...EARNED, 'thin-hymn', 'thin-hymn']);
        const result = removeCardFromCombatDeck(player, 'thin-hymn');

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.removedFrom).toBe('rewards');
        // The unlock set is the base — it keeps the card.
        expect(result.player.knownCards).toContain('thin-hymn');
        // Exactly one reward copy left.
        expect(result.player.combatRewardCards!.filter(id => id === 'thin-hymn'))
            .toHaveLength(1);
        expect(result.deckSizeAfter).toBe(result.deckSizeBefore - 1);
    });

    it('removes exactly ONE copy of a duplicated reward card, never all of them', () => {
        const player = fixture(OFFICE, [...EARNED, 'the-vig', 'the-vig', 'the-vig']);
        const before = buildCombatDeck(player).filter(id => id === 'the-vig').length;
        expect(before).toBe(4); // one from EARNED + the three extras

        const result = removeCardFromCombatDeck(player, 'the-vig');
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(buildCombatDeck(result.player).filter(id => id === 'the-vig')).toHaveLength(3);
        expect(result.deckSizeAfter).toBe(result.deckSizeBefore - 1);
    });

    it('falls through to knownCards when no reward copy exists', () => {
        const player = fixture(OFFICE, EARNED);
        const result = removeCardFromCombatDeck(player, 'threadbare-cope');

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.removedFrom).toBe('known');
        expect(result.loadoutReconciled).toBe(false);
        expect(result.player.knownCards).not.toContain('threadbare-cope');
        expect(buildCombatDeck(result.player)).not.toContain('threadbare-cope');
        expect(result.deckSizeAfter).toBe(result.deckSizeBefore - 1);
    });

    it('a duplicated knownCards entry gives up ONE copy — a 3-of stays a 2-of', () => {
        // The mobile starter-bundle path writes the preset recipe verbatim,
        // duplicates and all, into `knownCards`, and `buildCombatDeck` KEEPS
        // those copies (the de-dup was repealed 2026-09-05). Entries and deck
        // copies are one-for-one now, so one removal must take exactly one
        // entry — draining the list would delete a 3-of for a single price.
        const player = fixture(
            ['spoiled-poultice', 'spoiled-poultice', 'spoiled-poultice', ...OFFICE.slice(1)],
            EARNED,
        );
        const result = removeCardFromCombatDeck(player, 'spoiled-poultice');

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.player.knownCards.filter(id => id === 'spoiled-poultice')).toHaveLength(2);
        expect(buildCombatDeck(result.player).filter(id => id === 'spoiled-poultice')).toHaveLength(2);
        expect(result.deckSizeAfter).toBe(result.deckSizeBefore - 1);
    });

    it('never mutates the character or the lists it was handed', () => {
        const player = fixture(OFFICE, EARNED);
        const knownSnapshot = [...player.knownCards];
        const rewardSnapshot = [...player.combatRewardCards!];

        removeCardFromCombatDeck(player, 'thin-hymn');
        removeCardFromCombatDeck(player, 'the-vig');

        expect(player.knownCards).toEqual(knownSnapshot);
        expect(player.combatRewardCards).toEqual(rewardSnapshot);
        expect(player.cardRemovals).toBeUndefined();
    });
});

describe('Phase 52a — loadout reconciliation', () => {
    /** Flags seating a curated loadout over the Office + one earned card. */
    function loadoutFlags(ids: readonly string[]): string[] {
        let flags: string[] = [];
        for (const id of ids) flags = addToLoadout(flags, id);
        return flags;
    }

    it('drops the loadout slot so buildCombatDeck ACTUALLY shrinks', () => {
        const seated = [...OFFICE, ...EARNED.slice(0, 6)];
        const flags = loadoutFlags(seated);
        const player = fixture(OFFICE, EARNED.slice(0, 6));

        const deckBefore = buildCombatDeck(player, flags);
        expect(deckBefore).toContain('grandmothers-psalter');

        const result = removeCardFromCombatDeck(player, 'grandmothers-psalter', flags);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.removedFrom).toBe('known');
        expect(result.loadoutReconciled).toBe(true);
        expect(getCombatLoadout(result.flags)).not.toContain('grandmothers-psalter');

        const deckAfter = buildCombatDeck(result.player, result.flags);
        expect(deckAfter).not.toContain('grandmothers-psalter');
        expect(deckAfter.length).toBe(deckBefore.length - 1);
    });

    it('without reconciliation the removal would be INVISIBLE (the regression this guards)', () => {
        const flags = loadoutFlags([...OFFICE, ...EARNED.slice(0, 6)]);
        const player = fixture(OFFICE, EARNED.slice(0, 6));

        // Strip the id from `knownCards` only — what a naive removal would do.
        const naive: Character = {
            ...player,
            knownCards: player.knownCards.filter(id => id !== 'grandmothers-psalter'),
        };
        expect(buildCombatDeck(naive, flags)).toContain('grandmothers-psalter');

        const result = removeCardFromCombatDeck(player, 'grandmothers-psalter', flags);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(buildCombatDeck(result.player, result.flags)).not.toContain('grandmothers-psalter');
    });

    it('a multi-slot loadout entry gives up ONE slot — and knownCards is left alone', () => {
        // `buildCombatDeck` keeps the copies of whichever base is in force,
        // loadout included: three `combat-loadout-card:thin-hymn:*` slots deal
        // THREE copies. One removal un-seats one slot. `knownCards` is the
        // unlock set while a loadout is in force, so it must not be touched —
        // un-seating a copy is not un-learning the card.
        const seated = [...OFFICE, 'thin-hymn', 'thin-hymn', ...EARNED.slice(0, 5)];
        const flags = loadoutFlags(seated);
        expect(getCombatLoadout(flags).filter(id => id === 'thin-hymn')).toHaveLength(3);
        const player = fixture(OFFICE, EARNED.slice(0, 5));
        expect(buildCombatDeck(player, flags).filter(id => id === 'thin-hymn')).toHaveLength(3);

        const result = removeCardFromCombatDeck(player, 'thin-hymn', flags);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.removedFrom).toBe('known');
        expect(result.loadoutReconciled).toBe(true);
        expect(getCombatLoadout(result.flags).filter(id => id === 'thin-hymn')).toHaveLength(2);
        expect(result.player.knownCards).toContain('thin-hymn');
        // Exactly ONE deck copy left.
        expect(buildCombatDeck(result.player, result.flags).filter(id => id === 'thin-hymn'))
            .toHaveLength(2);
        expect(buildCombatDeck(result.player, result.flags).length)
            .toBe(result.deckSizeBefore - 1);
    });

    it('other cards\' loadout slots are untouched by the eviction', () => {
        const flags = loadoutFlags([...OFFICE, 'thin-hymn', ...EARNED.slice(0, 5)]);
        const player = fixture(OFFICE, EARNED.slice(0, 5));
        const result = removeCardFromCombatDeck(player, 'thin-hymn', flags);

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        // The seated list names `thin-hymn` twice (once inside OFFICE, once
        // appended). Exactly ONE slot is dropped — the FIRST — and every other
        // slot, this card's second copy included, keeps its place and order.
        const survivors = getCombatLoadout(result.flags);
        const seated = [...OFFICE, 'thin-hymn', ...EARNED.slice(0, 5)];
        const firstHymn = seated.indexOf('thin-hymn');
        expect(survivors).toEqual(seated.filter((_, i) => i !== firstHymn));
        // Non-loadout flags in the array are preserved verbatim.
        const withNoise = ['starter-bundle-chosen', ...flags, 'bundle:threadbare'];
        const noisy = removeCardFromCombatDeck(player, 'thin-hymn', withNoise);
        expect(noisy.ok).toBe(true);
        expect(noisy.flags).toContain('starter-bundle-chosen');
        expect(noisy.flags).toContain('bundle:threadbare');
    });

    it('a reward removal leaves the loadout alone — the reward copy is the one that left', () => {
        const flags = loadoutFlags([...OFFICE, ...EARNED.slice(0, 6)]);
        const player = fixture(OFFICE, [...EARNED.slice(0, 6), 'thin-hymn']);

        const result = removeCardFromCombatDeck(player, 'thin-hymn', flags);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.removedFrom).toBe('rewards');
        expect(result.loadoutReconciled).toBe(false);
        expect(result.flags).toEqual(flags);
        expect(getCombatLoadout(result.flags)).toContain('thin-hymn');
    });
});

describe('Phase 52a — refusals are first-class, loud, and inert', () => {
    it('refuses a card that is not in the deck at all', () => {
        const player = fixture(OFFICE, EARNED);
        const result = removeCardFromCombatDeck(player, 'no-such-card');

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.refusal.code).toBe('not-in-deck');
        expect(result.refusal.reason).toMatch(/not in the combat deck/i);
        expect(result.refusal.reason).toContain('no-such-card');
        // The player reference itself comes straight back — provably untouched.
        expect(result.player).toBe(player);
        expect(result.removedFrom).toBeNull();
        expect(result.deckSizeAfter).toBe(result.deckSizeBefore);
    });

    it('refuses a known-but-benched card the loadout does not seat', () => {
        let flags: string[] = [];
        for (const id of [...OFFICE.slice(0, 7), ...EARNED]) flags = addToLoadout(flags, id);
        const player = fixture(OFFICE, EARNED);

        // 'threadbare-cope' is known, but the curated loadout never seats it —
        // so it is not in the deck, and benching it was already free.
        expect(buildCombatDeck(player, flags)).not.toContain('threadbare-cope');
        const result = removeCardFromCombatDeck(player, 'threadbare-cope', flags);

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.refusal.code).toBe('not-in-deck');
        expect(result.player).toBe(player);
    });

    it('refuses AT the floor — refused, never clamped', () => {
        const player = deckOf(MIN_COMBAT_DECK_SIZE);
        expect(buildCombatDeck(player)).toHaveLength(MIN_COMBAT_DECK_SIZE);

        const result = removeCardFromCombatDeck(player, buildCombatDeck(player)[0]);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.refusal.code).toBe('deck-at-floor');
        expect(result.refusal.reason).toMatch(/floor of 10 cards/);
        expect(result.refusal.floor).toBe(MIN_COMBAT_DECK_SIZE);
        expect(result.refusal.deckSize).toBe(MIN_COMBAT_DECK_SIZE);
        expect(result.player).toBe(player);
        // Nothing was clamped down to the floor — the deck is exactly as it was.
        expect(buildCombatDeck(result.player)).toHaveLength(MIN_COMBAT_DECK_SIZE);
    });

    it('the LAST legal removal lands the deck exactly on the floor, and the next is refused', () => {
        const player = deckOf(MIN_COMBAT_DECK_SIZE + 1);
        const first = removeCardFromCombatDeck(player, buildCombatDeck(player)[0]);

        expect(first.ok).toBe(true);
        if (!first.ok) return;
        expect(first.deckSizeAfter).toBe(MIN_COMBAT_DECK_SIZE);

        const second = removeCardFromCombatDeck(
            first.player, buildCombatDeck(first.player)[0], first.flags,
        );
        expect(second.ok).toBe(false);
        if (second.ok) return;
        expect(second.refusal.code).toBe('deck-at-floor');
    });

    it('a refusal never advances the removal counter (and so never raises the price)', () => {
        const atFloor = deckOf(MIN_COMBAT_DECK_SIZE);
        const refused = removeCardFromCombatDeck(atFloor, buildCombatDeck(atFloor)[0]);

        expect(refused.ok).toBe(false);
        expect(refused.removals).toBe(0);
        expect(cardRemovalsOf(refused.player)).toBe(0);
        expect(cardRemovalPriceFor(refused.player)).toBe(cardRemovalPrice(0));
    });

    it('refuses without throwing — the refusal is a returned value, not an exception', () => {
        const player = fixture(OFFICE, EARNED);
        expect(() => removeCardFromCombatDeck(player, 'no-such-card')).not.toThrow();
        expect(() => removeCardFromCombatDeck(deckOf(MIN_COMBAT_DECK_SIZE), 'thin-hymn'))
            .not.toThrow();
    });
});

describe('Phase 52a — the per-run counter', () => {
    it('every accepted removal advances cardRemovals by one', () => {
        let player = fixture(OFFICE, [...EARNED, ...EARNED]);
        expect(cardRemovalsOf(player)).toBe(0);

        for (let expected = 1; expected <= 3; expected++) {
            const result = removeCardFromCombatDeck(player, buildCombatDeck(player)[0]);
            expect(result.ok, `removal ${expected}`).toBe(true);
            if (!result.ok) return;
            expect(result.removals).toBe(expected);
            expect(result.player.cardRemovals).toBe(expected);
            player = result.player;
        }
    });

    it('the primitive spends NO currency — pricing is the caller\'s transaction', () => {
        const player = { ...fixture(OFFICE, EARNED), currency: 100 };
        const result = removeCardFromCombatDeck(player, 'thin-hymn');
        expect(result.ok).toBe(true);
        expect(result.player.currency).toBe(100);
    });

    it('an absent counter reads as 0', () => {
        const player = fixture(OFFICE, EARNED);
        expect(player.cardRemovals).toBeUndefined();
        expect(cardRemovalsOf(player)).toBe(0);
        expect(cardRemovalsOf({ cardRemovals: 4 })).toBe(4);
        expect(cardRemovalsOf({ cardRemovals: -3 })).toBe(0);
    });
});

describe('Phase 52a — the escalating price (RATIFIED Phase 52f, measured income)', () => {
    it('is exactly 5 / 10 / 15 / 20 at 0 / 1 / 2 / 3 removals', () => {
        expect(cardRemovalPrice(0)).toBe(5);
        expect(cardRemovalPrice(1)).toBe(10);
        expect(cardRemovalPrice(2)).toBe(15);
        expect(cardRemovalPrice(3)).toBe(20);
    });

    it('is LINEAR, not exponential — the step never grows', () => {
        const steps: number[] = [];
        for (let n = 0; n < 10; n++) steps.push(cardRemovalPrice(n + 1) - cardRemovalPrice(n));
        expect(new Set(steps)).toEqual(new Set([CARD_REMOVAL_PRICING.step]));
        // The tenth removal is still payable, which is the whole point of linear.
        expect(cardRemovalPrice(9)).toBe(50);
    });

    it('is driven by the named ratified constants, not by literals', () => {
        const { base, step } = CARD_REMOVAL_PRICING;
        expect(base).toBe(5);
        expect(step).toBe(5);
        for (let n = 0; n < 6; n++) expect(cardRemovalPrice(n)).toBe(base + step * n);
    });

    it('cardRemovalPriceFor tracks a character across real removals', () => {
        let player = fixture(OFFICE, [...EARNED, ...EARNED]);
        expect(cardRemovalPriceFor(player)).toBe(5);

        const first = removeCardFromCombatDeck(player, buildCombatDeck(player)[0]);
        expect(first.ok).toBe(true);
        if (!first.ok) return;
        player = first.player;
        expect(cardRemovalPriceFor(player)).toBe(10);

        const second = removeCardFromCombatDeck(player, buildCombatDeck(player)[0]);
        expect(second.ok).toBe(true);
        if (!second.ok) return;
        expect(cardRemovalPriceFor(second.player)).toBe(15);
    });

    it('canAffordCardRemoval reads the purse against the next price only', () => {
        const player = { ...fixture(OFFICE, EARNED), currency: 5 };
        expect(canAffordCardRemoval(player)).toBe(true);
        expect(canAffordCardRemoval({ ...player, currency: 4 })).toBe(false);
        expect(canAffordCardRemoval({ ...player, currency: 5, cardRemovals: 1 })).toBe(false);
        expect(canAffordCardRemoval({ ...player, currency: 10, cardRemovals: 1 })).toBe(true);
    });
});

describe('Phase 104 — MIN_COMBAT_DECK_SIZE is DERIVED from the grey office', () => {
    it('is exactly 2x COMBAT_HAND_SIZE — the reshuffle-inside-one-round bound', () => {
        // Below ~2 hands the draw pile reshuffles inside a single round and
        // every fight deals the same hand.
        expect(MIN_COMBAT_DECK_SIZE).toBe(COMBAT_HAND_SIZE * 2);
    });

    it('matches the grey office — the smallest shipped starting deck', () => {
        expect(MIN_COMBAT_DECK_SIZE).toBe(10);
    });

    it('clears every shipped preset shape (no preset is born below the floor)', () => {
        for (const id of ['threadbare', 'pilgrim', 'apostate']) {
            expect(getDeckPreset(id)!.cardIds.length, id)
                .toBeGreaterThanOrEqual(MIN_COMBAT_DECK_SIZE);
        }
    });

    it('the campaign presets keep their own (now-superseded) low-water mark above the floor', () => {
        // History, not the current derivation (see MIN_COMBAT_DECK_SIZE's
        // doc comment): the Profane Canon lineage's own tightest point —
        // 18 − PILGRIM_REMOVED — is still a real number, just no longer the
        // one setting the floor.
        const threadbare = getDeckPreset('threadbare')!.cardIds.length;
        const pilgrim = getDeckPreset('pilgrim')!.cardIds.length;
        expect(threadbare).toBe(18);
        expect(pilgrim).toBe(30);

        const afterPilgrimCut = threadbare - sum(PRESET_LINEAGE.pilgrim.removed);
        const afterApostateCut = pilgrim - sum(PRESET_LINEAGE.apostate.removed);
        expect(afterPilgrimCut).toBe(12);
        expect(afterApostateCut).toBe(22);
        expect(Math.min(afterPilgrimCut, afterApostateCut)).toBeGreaterThan(MIN_COMBAT_DECK_SIZE);
    });
});
