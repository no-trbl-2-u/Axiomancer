/**
 * The post-combat attribution summary — the other surface the 2026-08-08 audit
 * found with ZERO tests (finding 4c).
 *
 * It is pure presentation over the engine's `buildCombatSummary`, so the whole
 * contract is honesty: every number printed must be a number the summary
 * carried in (P0-truth), the empty case must coach instead of showing a blank
 * panel, and CONTINUE must be the way out on every outcome.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import type { CombatSummary } from '@mechanics';
import { CombatSummaryModal } from '@/components/combat/encounter/CombatSummaryModal';
import { withAllProviders } from '@/test-utils/withAllProviders';

const SUMMARY: CombatSummary = {
    outcome: 'victory',
    headline: 'Victory — the enemy falls',
    rows: [
        { cardId: 'spoiled-poultice', name: 'Spoiled Poultice', dotDamage: 14, damageDealt: 0, phases: 4 },
        { cardId: 'thin-hymn', name: 'Thin Hymn', dotDamage: 0, damageDealt: 6, phases: 2 },
    ],
    totalDotDamage: 14,
    directDamage: 6,
    bestCard: 'Spoiled Poultice',
};

const renderSummary = (summary: CombatSummary, onClose: () => void = () => undefined) =>
    render(withAllProviders(<CombatSummaryModal summary={summary} onClose={onClose} />).tree);

describe('CombatSummaryModal', () => {
    it('renders the headline and one row per contributing card', () => {
        renderSummary(SUMMARY);
        expect(screen.getByTestId('combat-summary')).toBeTruthy();
        expect(screen.getByText(SUMMARY.headline)).toBeTruthy();
        for (const row of SUMMARY.rows) {
            expect(screen.getByTestId(`combat-summary-row-${row.cardId}`)).toBeTruthy();
            expect(screen.getByText(row.name)).toBeTruthy();
        }
    });

    it('prints only real engine units — the DoT card its DoT, the striker its direct damage', () => {
        renderSummary(SUMMARY);
        expect(screen.getByText(/14 dmg/)).toBeTruthy();
        expect(screen.getByText(/6 dmg/)).toBeTruthy();
        expect(screen.getByText(String(SUMMARY.totalDotDamage))).toBeTruthy();
        expect(screen.getByText(String(SUMMARY.directDamage))).toBeTruthy();
    });

    it('names the best card when there is one', () => {
        renderSummary(SUMMARY);
        expect(screen.getByTestId('combat-summary-best')).toBeTruthy();
        expect(screen.getByText(`★ Best card: ${SUMMARY.bestCard}`)).toBeTruthy();
    });

    it('hides the best-card line when the engine named none', () => {
        renderSummary({ ...SUMMARY, bestCard: '' });
        expect(screen.queryByTestId('combat-summary-best')).toBeNull();
    });

    it('coaches instead of showing an empty panel when nothing contributed', () => {
        renderSummary({ ...SUMMARY, rows: [], totalDotDamage: 0, directDamage: 0, bestCard: '' });
        expect(screen.getByText('No status effects contributed.')).toBeTruthy();
        expect(screen.getByText(/POWER a status card/)).toBeTruthy();
    });

    it('caps the row list at six so the panel cannot run off the screen', () => {
        const rows = Array.from({ length: 9 }, (_, i) => ({
            cardId: `card-${i}`, name: `Card ${i}`, dotDamage: i, damageDealt: 0, phases: 1,
        }));
        renderSummary({ ...SUMMARY, rows });
        expect(screen.getByTestId('combat-summary-row-card-5')).toBeTruthy();
        expect(screen.queryByTestId('combat-summary-row-card-6')).toBeNull();
    });

    it('CONTINUE closes, on every outcome', () => {
        for (const outcome of ['victory', 'defeat', 'mercy', 'capitulate', 'concede'] as const) {
            const onClose = jest.fn();
            const view = renderSummary({ ...SUMMARY, outcome }, onClose as () => void);
            fireEvent.press(screen.getByTestId('combat-summary-close'));
            expect(onClose).toHaveBeenCalledTimes(1);
            view.unmount();
        }
    });
});
