/**
 * Hermetic component tests — EnemyActionCard (2026-08-10).
 *
 * The reveal of what the foe just did. Pins the three things that make it
 * useful rather than decorative: it says the action, it clears itself, and it
 * never eats a touch (the board underneath is mid-drag territory).
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
    EnemyActionCard, ENEMY_ACTION_CARD_TOTAL_MS,
} from '@/components/combat/encounter/EnemyActionCard';
import type { EnemyActionCardVM } from '@/state/presenters/combat-encounter.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

const FIRED: EnemyActionCardVM = {
    phaseIndex: 2,
    icon: '⚔',
    label: 'ATTACKS',
    color: '#e2543b',
    actionText: 'Cairn-rot exhales rot',
    lines: [
        { text: '4 DAMAGE', color: '#e2543b' },
        { text: 'POISON ×2', color: '#a86bdc' },
    ],
    denied: false,
};

const DENIED: EnemyActionCardVM = { ...FIRED, denied: true };

beforeEach(() => { jest.useFakeTimers(); });
afterEach(() => { jest.useRealTimers(); });

describe('EnemyActionCard: what it says', () => {
    it('names the foe, the action, and every payload line', () => {
        const { tree } = withAllProviders(
            <EnemyActionCard vm={FIRED} enemyName="Cairn-rot" revealKey={1} onDone={() => {}} />,
        );
        const r = render(tree);
        expect(r.queryByTestId('combat-enemy-action-card')).not.toBeNull();
        expect(r.queryByText('ATTACKS')).not.toBeNull();
        expect(r.queryByText('Cairn-rot exhales rot')).not.toBeNull();
        expect(r.queryByText('4 DAMAGE')).not.toBeNull();
        expect(r.queryByText('POISON ×2')).not.toBeNull();
        expect(r.queryByText('PHASE 2')).not.toBeNull();
    });

    it('reads DENIED when the player\'s control held', () => {
        const { tree } = withAllProviders(
            <EnemyActionCard vm={DENIED} enemyName="Cairn-rot" revealKey={1} onDone={() => {}} />,
        );
        const r = render(tree);
        expect(r.queryByText('DENIED')).not.toBeNull();
        expect(r.queryByText('ATTACKS')).toBeNull();
        // The payload still shows — struck through — as what was averted.
        expect(r.queryByText('4 DAMAGE')).not.toBeNull();
    });
});

describe('EnemyActionCard: it clears itself', () => {
    it('fires onDone once the hold elapses, never before', () => {
        const onDone = jest.fn();
        const { tree } = withAllProviders(
            <EnemyActionCard vm={FIRED} enemyName="Cairn-rot" revealKey={1} onDone={onDone} />,
        );
        render(tree);
        act(() => { jest.advanceTimersByTime(ENEMY_ACTION_CARD_TOTAL_MS - 1); });
        expect(onDone).not.toHaveBeenCalled();
        act(() => { jest.advanceTimersByTime(1); });
        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('restarts the hold when a new reveal lands on the same mount', () => {
        const onDone = jest.fn();
        const { tree } = withAllProviders(
            <EnemyActionCard vm={FIRED} enemyName="Cairn-rot" revealKey={1} onDone={onDone} />,
        );
        const r = render(tree);
        act(() => { jest.advanceTimersByTime(ENEMY_ACTION_CARD_TOTAL_MS - 50); });
        const next = withAllProviders(
            <EnemyActionCard vm={FIRED} enemyName="Cairn-rot" revealKey={2} onDone={onDone} />,
        );
        r.rerender(next.tree);
        // The first reveal's timer was cancelled with its effect — the second
        // reveal gets the full hold, not the 50ms remaining on the first.
        act(() => { jest.advanceTimersByTime(60); });
        expect(onDone).not.toHaveBeenCalled();
        act(() => { jest.advanceTimersByTime(ENEMY_ACTION_CARD_TOTAL_MS); });
        expect(onDone).toHaveBeenCalledTimes(1);
    });
});

describe('EnemyActionCard: it never eats a touch', () => {
    it('is pointer-transparent — the board underneath stays draggable', () => {
        const { tree } = withAllProviders(
            <EnemyActionCard vm={FIRED} enemyName="Cairn-rot" revealKey={1} onDone={() => {}} />,
        );
        const r = render(tree);
        expect(r.getByTestId('combat-enemy-action-card').props.pointerEvents).toBe('none');
    });
});
