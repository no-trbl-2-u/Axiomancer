/**
 * CombatCardFace — the card face carries NO prose (owner directive 2026-08-10:
 * "there's not so much verbage on the cards — the card details already define
 * the keywords, so it's a little redundant").
 *
 * The face is the GLANCE read: art, the card NAME on the rail, the FREE glyph,
 * the rarity tag, and the PAID line as `KEYWORD` over its value. The authored
 * PAID sentence, the type strip ('MIND · SPLINTER · SPELL · DOT') and the
 * printed die lines are the explanation layer and belong to the inspect
 * overlay, which already owns the keyword definitions.
 *
 * This suite pins BOTH halves of that contract: what the face must not print,
 * and what it must still print — a face that quietly regrows a sentence, or one
 * that drops its keyword/value and becomes unreadable, both fail here.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatCardFace } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel, type CombatCardVM } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

// A hand that spans stances and card shapes: two Affliction DoTs, the Bulwark
// guard, a Charm sway (the colour-law suite's fixture) plus The Long Lent,
// whose threshold prints a DIE LINE — without it the die-line sweep below
// would pass vacuously.
const CARDS = ['spoiled-poultice', 'unction-of-boils', 'frostbitten-palisade', 'thin-hymn', 'the-long-lent'];

function handVMs(): CombatCardVM[] {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    const player = { ...base, knownCards: CARDS, baseStats: { heart: 8, body: 8, mind: 8 }, health: 200, maxHealth: 200 };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    return buildCombatViewModel(s).hand;
}

/** Collect every text leaf the rendered tree produced, in document order. */
function textLeaves(node: unknown, out: string[] = []): string[] {
    if (typeof node === 'string') { out.push(node); return out; }
    if (Array.isArray(node)) { for (const n of node) textLeaves(n, out); return out; }
    if (node && typeof node === 'object' && 'children' in node) {
        textLeaves((node as { children: unknown }).children, out);
    }
    return out;
}

/**
 * Everything the face put on screen, as ONE string. The leaves are joined with
 * no separator on purpose: a keyword-bolded sentence renders as several
 * sibling <Text> nodes ('Inflict ' / 'POISON' / ' 1 …'), so joining loosely
 * would let a reprinted sentence slip past the sweeps below.
 */
function faceText(card: CombatCardVM): string {
    const { unmount } = render(withAllProviders(<CombatCardFace card={card} width={120} height={176} />).tree);
    const flat = screen.root ? textLeaves(screen.toJSON()).join('') : '';
    unmount();
    return flat;
}

describe('CombatCardFace — no prose on the face (2026-08-10 declutter)', () => {
    const cards = handVMs();

    // Non-vacuity: the sweeps below are per-card `not.toContain` loops, so a
    // fixture that lost its prose upstream would pass them for the wrong
    // reason. Pin that the fixture still HAS a sentence and a die line to hide.
    it('the fixture actually carries the prose the face must not print', () => {
        expect(cards.length).toBeGreaterThan(0);
        expect(cards.some(c => (c.dieLines?.length ?? 0) > 0)).toBe(true);
        expect(cards.some(c => (c.bottomActionText || '').split(/\s+/).length >= 5)).toBe(true);
        expect(cards.every(c => c.face.typeStrip.length > 0)).toBe(true);
    });

    it('never prints the authored PAID sentence', () => {
        for (const card of cards) {
            const flat = faceText(card);
            // The authored sentence always carries its verb clause; sampling its
            // longest word run is enough to catch a face that reprinted it.
            const sentence = (card.bottomActionText || '').replace(/^PAID(\s*\([^)]*\))?\s*—\s*/i, '').trim();
            const clause = sentence.split(/[.·]/)[0]?.trim() ?? '';
            if (clause.split(/\s+/).length >= 4) {
                expect(flat).not.toContain(clause);
            }
        }
    });

    it('never prints the type strip', () => {
        for (const card of cards) {
            expect(faceText(card)).not.toContain(card.face.typeStrip);
        }
    });

    it('never prints the die lines', () => {
        for (const card of cards) {
            const flat = faceText(card);
            for (const line of card.dieLines ?? []) expect(flat).not.toContain(line);
        }
    });

    it('still prints the card NAME, its KEYWORD and its value — the glance read survives', () => {
        for (const card of cards) {
            const flat = faceText(card);
            expect(flat).toContain(card.name.toUpperCase());
            if (card.face.keyword) expect(flat).toContain(card.face.keyword.toUpperCase());
            // Real-units-or-no-number: a card with an honest number prints it.
            const value = (card.face.heroText || '').trim();
            if (value && !/^\s*$/.test(value)) {
                const bare = value.replace(new RegExp(`^${card.face.keyword ?? ''}\\s+`, 'i'), '').trim();
                expect(flat).toContain(bare);
            }
        }
    });
});
