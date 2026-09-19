/**
 * FE-022 — an alt-win meter must name what filling it does.
 *
 * The board draws '🕊 PLEA 0/42' as a second full-width bar directly under the
 * enemy's VITAE bar — the slot genre convention reserves for armour or a
 * shield. Nothing said that filling it makes the foe RELENT (or, for CHARGE,
 * CONDEMN), so a first-time player could not tell whether filling it helped
 * them or the enemy.
 *
 * `AltWinMeter` is module-private, so these guards drive the pane that mounts
 * it and assert on the meter's rendered label and accessible name.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { CombatCombatantPane } from '@/components/combat/encounter/CombatCombatantPane';
import type {
    CombatEnemyPaneVM,
    CombatPlayerPaneVM,
} from '@/state/presenters/combat-encounter.engine';
import { withAllProviders } from '@/test-utils/withAllProviders';

const PLAYER: CombatPlayerPaneVM = {
    name: 'Pilgrim', hp: 40, maxHp: 50, hpPct: 0.8, guard: 0, effects: [], seals: [],
    wrath: 0, wrathVisible: false, chain: 0, chainVisible: false, twinArmed: false,
};

/** A minimal enemy pane VM with every meter off; tests switch one on. */
const BASE_ENEMY = {
    name: 'Brine Hag', hp: 120, maxHp: 120, hpPct: 1, guard: 0, effects: [], seals: [],
    intent: {
        type: 'damage', icon: '⚔', label: 'ATTACKS', color: '#e2543b',
        description: 'A telegraphed strike.', damage: 10, debuffs: false, branch: null, next: null,
        wallMath: { projectedDamage: 10, netDamage: 10, willDeny: false, guard: 0, barrier: 0, rungsTotal: 2, rungsLost: 0, addDamage: 0, addNetDamage: 0, totalNetDamage: 10 },
    },
    sway: 0, swayTarget: 42, swayVisible: false,
    premises: 0, premiseAt: 5, premiseVisible: false,
    flay: 0, flayVisible: false,
    pendingDot: 0, roundsToKill: 0, isLethalInFlight: false, healPerRound: 0,
    stanceKnown: false, stance: null, traits: [],
    keywords: [],
    // Phase 102 — no brood, which is what every foe but the summoner has. This
    // fixture is cast through `unknown`, so tsc cannot tell it when the VM
    // gains a field; the omission surfaced as a render crash instead.
    adds: [], strikeAddCost: 2, canStrikeAdd: false,
} as unknown as CombatEnemyPaneVM;

function renderPane(enemyOverrides: Partial<CombatEnemyPaneVM>) {
    const enemy = { ...BASE_ENEMY, ...enemyOverrides } as CombatEnemyPaneVM;
    const { tree } = withAllProviders(
        <CombatCombatantPane enemy={enemy} player={PLAYER} />,
    );
    render(tree);
}

describe('FE-022: alt-win meters name their payoff', () => {
    it('the PLEA meter says it fills toward RELENT', () => {
        renderPane({ swayVisible: true, sway: 0, swayTarget: 42 } as Partial<CombatEnemyPaneVM>);
        const meter = screen.getByTestId('combat-sway-meter');
        expect(meter.props.accessibilityLabel).toMatch(/RELENT/);
        expect(screen.getByText(/→ RELENT/)).toBeTruthy();
    });

    it('the CHARGE meter says it fills toward CONDEMN', () => {
        renderPane({ premiseVisible: true, premises: 1, premiseAt: 5 } as Partial<CombatEnemyPaneVM>);
        const meter = screen.getByTestId('combat-premise-meter');
        expect(meter.props.accessibilityLabel).toMatch(/CONDEMN/);
    });

    it('a meter with no target to fill toward names no payoff', () => {
        renderPane({ flayVisible: true, flay: 3 } as Partial<CombatEnemyPaneVM>);
        const meter = screen.getByTestId('combat-flay-meter');
        expect(meter.props.accessibilityLabel).not.toMatch(/RELENT|CONDEMN/);
    });
});
