/**
 * Hermetic component tests — StatusCard.
 *
 * StatusCard is the SELF-tab summary header: name + level
 * badge + HP bar. Wired to engine `state.player` via
 * `useGameState` post-2026-05-22 (live-drive playtest found
 * the prop-less render on the exploration screen was
 * displaying hardcoded placeholder values; the [5.5] AUDIT
 * row drove the engine-state wiring).
 *
 * Tests cover three regimes:
 * - **store-driven defaults** — no props passed; values read
 *   from the engine store via the provider.
 * - **prop overrides** — explicit props win over the store
 *   read (useful for test fixtures + the rare case a caller
 *   wants to display synthetic state).
 * - **structural landmarks** — HP bar present; NO MP/MANA
 *   bar (Phase-62 bug-sweep dropped mana out of combat).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { StatusCard } from '@/components/StatusCard';
import { withAllProviders } from '@/test-utils/withAllProviders';

function mount(node: React.ReactElement) {
    const { tree } = withAllProviders(node);
    return render(tree);
}

describe('StatusCard: store-driven defaults (no props)', () => {
    it('renders without crashing when no props are given', () => {
        const tree = mount(<StatusCard />);
        expect(tree.toJSON()).not.toBeNull();
    });

    it('reads name + level from `state.player` via the provider', () => {
        // Fresh game-store player: `createNewGameState` ships a
        // canonical starting character. Name + level surface
        // verbatim from the store.
        const { store, tree } = withAllProviders(<StatusCard />);
        const expectedName = store.getState().player.name;
        const expectedLevel = store.getState().player.level;

        const rendered = render(tree);
        expect(rendered.queryByText(expectedName)).not.toBeNull();
        expect(rendered.queryByText(new RegExp(`LVL ${expectedLevel}`))).not.toBeNull();
    });

    it('reads HP / maxHealth from `state.player.health` via the provider', () => {
        const { store, tree } = withAllProviders(<StatusCard />);
        const hp = store.getState().player.health;
        const hpMax = store.getState().player.maxHealth;

        const rendered = render(tree);
        expect(rendered.queryByText('VITAE')).not.toBeNull();
        expect(rendered.queryByText(`${hp}/${hpMax}`)).not.toBeNull();
    });
});

describe('StatusCard: explicit prop overrides', () => {
    it('name prop wins over the store-read name', () => {
        const tree = mount(<StatusCard name="ASHEN WAYFARER" />);
        expect(tree.queryByText('ASHEN WAYFARER')).not.toBeNull();
    });

    it('level prop wins over the store-read level (badge + label)', () => {
        const tree = mount(<StatusCard level={42} />);
        expect(tree.queryByText('42')).not.toBeNull();
        expect(tree.queryByText(/LVL 42/)).not.toBeNull();
    });

    it('hp/hpMax props win over the store-read HP', () => {
        const tree = mount(<StatusCard hp={5} hpMax={50} />);
        expect(tree.queryByText('5/50')).not.toBeNull();
    });

    it('multiple props compose without crashing (name + level + hp)', () => {
        const tree = mount(
            <StatusCard name="STILLED WALKER" level={1} hp={1} hpMax={1} />,
        );
        expect(tree.queryByText('STILLED WALKER')).not.toBeNull();
        expect(tree.queryByText(/LVL 1/)).not.toBeNull();
        expect(tree.queryByText('1/1')).not.toBeNull();
    });
});

describe('StatusCard: structural landmarks', () => {
    it('renders the HP bar label and no MP/MANA bar (Phase-62 bug-sweep)', () => {
        const tree = mount(<StatusCard />);
        expect(tree.queryByText('VITAE')).not.toBeNull();
        expect(tree.queryByText('MP')).toBeNull();
        expect(tree.queryByText('MANA')).toBeNull();
    });

    it('renders the LEVEL section label', () => {
        const tree = mount(<StatusCard />);
        // Match the SectionLabel's text content; the LEVEL chip
        // composes the formatted level number into a "LEVEL · LVL N PILGRIM"
        // string.
        expect(tree.queryByText(/^LEVEL · LVL/)).not.toBeNull();
    });
});
