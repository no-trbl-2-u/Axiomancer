/**
 * D4 — rarity at a glance, and specifically NEVER BY COLOUR ALONE.
 *
 * Owner finding 8 was "no way to recognise a card's rarity at a glance". The
 * face's answer had been one wax pip in one of three hues, which the 2026-08-28
 * plate doctrine wrote down as deliberate ("rarity is a small wax pip … not a
 * text tag"). D4 reverses that: named label + pip row + frame colour.
 *
 * This suite is the greyscale test written as code. Every assertion below is
 * phrased so that it would still pass if `RARITY_COLOR` returned the same hue
 * for all three bands — because that is exactly the failure mode D4 exists to
 * prevent, and a test that reads the pip's `backgroundColor` to tell the bands
 * apart would be re-testing the colour instead of the signal.
 *
 * What is pinned:
 *   1. the face draws a fixed THREE-slot pip track, with `RARITY_PIPS[band]`
 *      of them filled — so the count reads as "n of three" on a single card,
 *      not only when two cards sit side by side;
 *   2. the three bands produce three DIFFERENT filled counts, with the colour
 *      channel ignored entirely;
 *   3. the `large` face prints the named label; the small face does NOT (it
 *      would cost the fanned name column — see `NAME_BAND_LEFT_CHROME`);
 *   4. the small face still announces the band in WORDS to a screen reader,
 *      so the leg it cannot print is not simply lost;
 *   5. the band is derived by the shared module, never re-banded here: the
 *      face agrees with `rarityFor` for real library cards at every rank.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import {
    cardLibrary, initializeCombatEncounter, rankToRarity, rollEncounterDice, type CardRank,
} from '@mechanics';

import { CombatCardFace, RARITY_TRACK_SLOTS } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatCardVM } from '@/state/presenters/combat-encounter.engine';
import { RARITY_LABEL, RARITY_PIPS, rarityFor } from '@/state/presenters/card-rarity.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

/**
 * One real library card id per rank on the ladder, so the hand below spans all
 * three bands through the REAL presenter rather than through a hand-built VM
 * that could disagree with what the board renders.
 */
function idsSpanningTheLadder(): string[] {
    const byRank = new Map<CardRank, string>();
    for (const card of cardLibrary) {
        if (!byRank.has(card.rank)) byRank.set(card.rank, card.id);
    }
    return [...byRank.values()];
}

function handVMs(ids: string[]): CombatCardVM[] {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = {
        ...base,
        knownCards: ids,
        baseStats: { heart: 8, body: 8, mind: 8 },
        health: 200,
        maxHealth: 200,
    };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    return buildCombatViewModel(s).hand;
}

/** Render one face and hand back the queries for it, plus an unmount. */
function renderFace(card: CombatCardVM, large: boolean) {
    const { unmount } = render(
        withAllProviders(
            <CombatCardFace card={card} width={large ? 208 : 120} height={large ? 305 : 176} large={large} />,
        ).tree,
    );
    return { unmount };
}

/**
 * The pip track's slots, as a list of "is this one filled?" booleans.
 *
 * Filled is read as "this slot was given a background colour", and empty as
 * "this slot took the hollow style". Deliberately NOT read as a specific hue:
 * see the header — the whole point is that the signal survives with the colour
 * channel thrown away.
 */
function trackSlots(): boolean[] {
    // The track exists at all — a face that dropped it would otherwise report
    // "zero slots, zero filled" and quietly satisfy several loops below.
    expect(screen.getByTestId('combat-card-face-rarity-pips')).toBeTruthy();
    return Array.from({ length: RARITY_TRACK_SLOTS }, (_, i) => {
        const pip = screen.getByTestId(`combat-card-face-rarity-pip-${i}`);
        const flat = (StyleSheet.flatten(pip.props.style as never) ?? {}) as { backgroundColor?: string };
        return flat.backgroundColor !== undefined && flat.backgroundColor !== 'transparent';
    });
}

describe('CombatCardFace — D4 rarity pip track', () => {
    const ids = idsSpanningTheLadder();
    const cards = handVMs(ids);

    it('the fixture actually spans more than one band (non-vacuity)', () => {
        expect(cards.length).toBeGreaterThan(0);
        const bands = new Set(cards.map((c) => rarityFor(c)));
        expect(bands.size).toBeGreaterThan(1);
    });

    it('always draws the full track, however common the card', () => {
        // A `common` card draws one filled pip and TWO hollow ones. Without the
        // hollow slots a lone pip means nothing on its own — the reference
        // track is what turns the count into "one of three".
        for (const card of cards) {
            const { unmount } = renderFace(card, false);
            for (let i = 0; i < RARITY_TRACK_SLOTS; i += 1) {
                expect(screen.queryByTestId(`combat-card-face-rarity-pip-${i}`)).toBeTruthy();
            }
            expect(screen.queryByTestId(`combat-card-face-rarity-pip-${RARITY_TRACK_SLOTS}`)).toBeNull();
            unmount();
        }
    });

    it('fills exactly RARITY_PIPS[band] slots, and fills them from the top', () => {
        for (const card of cards) {
            const band = rarityFor(card);
            const { unmount } = renderFace(card, false);
            const slots = trackSlots();
            expect(slots.filter(Boolean)).toHaveLength(RARITY_PIPS[band]);
            // Filled slots lead: [on, on, off], never [on, off, on].
            expect(slots).toEqual(
                Array.from({ length: RARITY_TRACK_SLOTS }, (_, i) => i < RARITY_PIPS[band]),
            );
            unmount();
        }
    });

    it('separates the bands by COUNT alone — the signal survives greyscale', () => {
        // Group the fixture by band, then assert that the filled-pip count is a
        // one-to-one function of the band. Colour is never consulted, so this
        // would still pass with RARITY_COLOR returning one hue for all three —
        // which is what "never colour alone" has to mean to be worth anything.
        const countsByBand = new Map<string, Set<number>>();
        for (const card of cards) {
            const band = rarityFor(card);
            const { unmount } = renderFace(card, false);
            const filled = trackSlots().filter(Boolean).length;
            unmount();
            const seen = countsByBand.get(band) ?? new Set<number>();
            seen.add(filled);
            countsByBand.set(band, seen);
        }
        // Each band renders exactly one count …
        for (const [, counts] of countsByBand) expect(counts.size).toBe(1);
        // … and no two bands share theirs.
        const counts = [...countsByBand.values()].map((s) => [...s][0]);
        expect(new Set(counts).size).toBe(counts.length);
    });

    it('tracks the ENGINE rank, not a mobile-side re-band', () => {
        // Deliberately asserted against `rankToRarity` from mechanics rather
        // than against `rarityFor`: if the board ever inlines `rank <= 2 ? …`
        // again, a test phrased in terms of the mobile module could drift along
        // with it, where this one cannot.
        for (const card of cards) {
            expect(card.rank).toBeDefined();
            const { unmount } = renderFace(card, false);
            const filled = trackSlots().filter(Boolean).length;
            unmount();
            expect(filled).toBe(RARITY_PIPS[rankToRarity(card.rank as CardRank)]);
        }
    });
});

describe('CombatCardFace — D4 named label', () => {
    const cards = handVMs(idsSpanningTheLadder());

    it('prints the band by NAME on the large face', () => {
        for (const card of cards) {
            const { unmount } = renderFace(card, true);
            const tag = screen.getByTestId('combat-card-face-rarity');
            expect(String(tag.props.children)).toBe(RARITY_LABEL[rarityFor(card)].toUpperCase());
            unmount();
        }
    });

    it('does NOT print it on the small face — the fanned name column is not for sale', () => {
        // The word costs ~34pt of a 120pt band, and the fan already clips names
        // down to a ~40pt sliver (cluster CB-handfan). The small face pays for
        // the signal in pips, which cost nothing horizontally.
        for (const card of cards) {
            const { unmount } = renderFace(card, false);
            expect(screen.queryByTestId('combat-card-face-rarity')).toBeNull();
            unmount();
        }
    });

    it('still SAYS the band on the small face, for a screen reader', () => {
        // The leg the small face cannot print is not dropped: it moves to the
        // pip track's accessibility label, so a non-sighted player gets the
        // word the sighted player gets from the count.
        for (const card of cards) {
            const { unmount } = renderFace(card, false);
            const track = screen.getByTestId('combat-card-face-rarity-pips');
            expect(track.props.accessibilityLabel).toBe(RARITY_LABEL[rarityFor(card)]);
            unmount();
        }
    });
});
