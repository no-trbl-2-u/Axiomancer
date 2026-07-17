/**
 * IntentIcon — wall-math readout (phase 28).
 *
 * `intent.damage` is the raw face value (unchanged, pre-existing contract);
 * `intent.wallMath` is what phase 28 adds — the live projection netted
 * against guard/barrier/denial. This pins the new DENIED / net-damage
 * badges and the a11y label stating the REAL outcome, not the raw one.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { IntentIcon } from '@/components/combat/encounter/IntentIcon';
import type { CombatIntentVM } from '@/state/presenters/combat-encounter.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

const baseIntent: CombatIntentVM = {
    type: 'damage', icon: '⚔', label: 'ATTACKS', color: '#e2543b',
    description: 'A telegraphed strike.', damage: 10, debuffs: false, branch: null, next: null,
    wallMath: { projectedDamage: 10, netDamage: 10, willDeny: false, guard: 0, barrier: 0, rungsTotal: 2, rungsLost: 0 },
};

describe('IntentIcon — wall-math readout', () => {
    it('shows no wall-math badge when net damage matches the raw stake', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.queryByTestId('combat-intent-wallmath')).toBeNull();
    });

    it('shows the net damage when it diverges from the raw stake (guard absorbed some)', () => {
        const intent: CombatIntentVM = { ...baseIntent, wallMath: { ...baseIntent.wallMath, netDamage: 4 } };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toEqual(['→', 4]);
    });

    it('shows DENIED and states the real outcome in a11y when the turn will be denied', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { projectedDamage: 0, netDamage: 0, willDeny: true, guard: 0, barrier: 0, rungsTotal: 2, rungsLost: 2 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toBe('DENIED');
        const node = screen.getByTestId('combat-intent');
        expect(node.props.accessibilityLabel).toMatch(/DENIED — no damage lands/);
    });
});

describe('IntentIcon — variable-rung telegraph (phase 33b)', () => {
    it('renders one pip per rung, all filled when none are stripped', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getAllByText('●')).toHaveLength(2);
        expect(screen.queryAllByText('○')).toHaveLength(0);
    });

    it('renders hollow pips for stripped rungs and filled pips for the remainder', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { ...baseIntent.wallMath, rungsTotal: 3, rungsLost: 1 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getAllByText('●')).toHaveLength(2);
        expect(screen.getAllByText('○')).toHaveLength(1);
    });

    it('states the rung magnitude in the a11y label', () => {
        const intent: CombatIntentVM = {
            ...baseIntent,
            wallMath: { ...baseIntent.wallMath, rungsTotal: 4, rungsLost: 1 },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        const node = screen.getByTestId('combat-intent');
        expect(node.props.accessibilityLabel).toMatch(/Carries 4 STAGGER rungs, 3 remaining\./);
    });
});
