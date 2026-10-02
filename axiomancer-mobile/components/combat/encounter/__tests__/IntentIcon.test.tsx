/**
 * IntentIcon — wall-math readout.
 *
 * `intent.damage` is the raw face value; `intent.wallMath` is the live
 * projection netted against guard/barrier/denial. This pins the DENIED /
 * net-damage badges and the a11y label stating the REAL outcome, not the raw one.
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
    wallMath: {
        projectedDamage: 10, netDamage: 10, willDeny: false, guard: 0, barrier: 0,
    },
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
            wallMath: {
                projectedDamage: 0, netDamage: 0, willDeny: true, guard: 0, barrier: 0,
            },
        };
        const { tree } = withAllProviders(<IntentIcon intent={intent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent-wallmath').props.children).toBe('DENIED');
        const node = screen.getByTestId('combat-intent');
        expect(node.props.accessibilityLabel).toMatch(/DENIED — no damage lands/);
    });
});

/**
 * The enemy intent pill prints the damage it will deal with a minus, never a
 * heart: the board uses '♥ 160' on the player rail for the player's own
 * VITAE, so a heart on the pill would mean the player's health in one corner
 * and the foe's outgoing damage in the other.
 */
describe('FE-020: the intent pill does not wear a heart', () => {
    it('prints incoming damage with a minus, not a heart', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getByText('−10')).toBeTruthy();
        expect(screen.queryByText('♥10')).toBeNull();
    });

    it('still states the damage plainly for a screen reader', () => {
        const { tree } = withAllProviders(<IntentIcon intent={baseIntent} />);
        render(tree);
        expect(screen.getByTestId('combat-intent').props.accessibilityLabel).toMatch(/Deals 10 damage/);
    });
});
