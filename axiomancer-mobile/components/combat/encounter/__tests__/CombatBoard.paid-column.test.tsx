/**
 * CombatCardFace — the PAID column reads whole on the 120pt hand card.
 *
 * At 1280 wide the hand sits side by side, so every card's ledger shows. A
 * Plain Word prints a percent FREE value ("+24%") beside "♥ VULNERABLE" /
 * "+60%", and the column the FREE cell left it was ~16pt: the keyword
 * ellipsized to "♥ VU…" and the value broke inside the number, "+6" over
 * "0%" (CRITIQUE pass 74). The ledger now stacks for that card, and the value
 * keeps one line at a computed size (react-native-web ignores
 * `adjustsFontSizeToFit`).
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { initializeCombatEncounter, rollEncounterDice } from '@mechanics';
import { CombatCardFace, HAND_CARD_H, HAND_CARD_W, paidLedgerFit } from '@/components/combat/encounter/CombatBoard';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { withAllProviders } from '@/test-utils/withAllProviders';

function handCard(cardId: string) {
    const { store } = withAllProviders(<></>);
    const base = store.getState().player;
    // Heart 8 scales the word to the critique's "+24%" FREE and "+60%" PAID.
    const player = { ...base, knownCards: ['grey-strike', 'grey-ward', 'grey-word'], baseStats: { heart: 8, body: 8, mind: 8 } };
    let s = initializeCombatEncounter(player, createMockEncounterEnemy(), undefined, 16);
    s = rollEncounterDice(s).state;
    const card = buildCombatViewModel(s).hand.find((c) => c.cardId === cardId);
    if (!card) throw new Error(`${cardId} not in the opening hand`);
    return card;
}

const flat = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style) as Record<string, number>;

describe('A Plain Word on the desktop hand card', () => {
    it('stacks its ledger and prints the keyword and value whole, each on one line', () => {
        const word = handCard('grey-word');
        render(withAllProviders(<CombatCardFace card={word} width={HAND_CARD_W} height={HAND_CARD_H} />).tree);
        expect(screen.getByTestId('combat-card-face-ledger-stacked')).toBeTruthy();
        expect(screen.getByTestId('combat-card-face-value').props.numberOfLines).toBe(1);
        expect(screen.getByTestId('combat-card-face-value').props.children).toMatch(/^\+\d+%$/);
        expect(flat('combat-card-face-keyword').fontSize).toBe(12);
        expect(flat('combat-card-face-value').fontSize).toBe(11);
    });

    it('DEAL and GUARD keep the side-by-side row', () => {
        for (const id of ['grey-strike', 'grey-ward']) {
            render(withAllProviders(<CombatCardFace card={handCard(id)} width={HAND_CARD_W} height={HAND_CARD_H} />).tree);
            expect(screen.getByTestId('combat-card-face-ledger')).toBeTruthy();
            expect(screen.getByTestId('combat-card-face-value').props.numberOfLines).toBe(1);
        }
    });
});

describe('paidLedgerFit', () => {
    const word = { keyword: '♥ VULNERABLE', value: '+60%', freeInner: '+24%', hasFree: true };

    it('stacks a long keyword beside a percent FREE value on the hand card', () => {
        expect(paidLedgerFit({ width: 120, ...word })).toEqual({ stacked: true, keywordSize: 12, valueSize: 11 });
    });

    it('keeps a short keyword side by side at full size', () => {
        expect(paidLedgerFit({ width: 120, keyword: '⚡ DEAL', value: '12', freeInner: '+6', hasFree: true }))
            .toEqual({ stacked: false, keywordSize: 12, valueSize: 11 });
    });

    it('always stacks a narrow face, and shrinks a value too long for its row instead of wrapping it', () => {
        const fit = paidLedgerFit({ width: 92, ...word, value: '+160% · 2 turns' });
        expect(fit.stacked).toBe(true);
        expect(fit.valueSize).toBeLessThan(11);
        expect(fit.valueSize).toBeGreaterThanOrEqual(8);
    });
});
