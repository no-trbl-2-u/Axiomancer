/**
 * Hermetic E2E — /labyrinth route shell (THE APORIA, W-01).
 *
 * Pins the screen's three states at the shell level over a real
 * store: a fresh boot shows the act select (three descents), entering
 * an act renders the room scene + accordion strip with pulsating POI
 * nodes, and the boss room surfaces the finale panel. Combat/minigame
 * internals live in their own suites; here the room loop is the unit.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));

import LabyrinthScreen from '@/app/labyrinth/index';
import { getAporiaAct } from '@mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

function mount() {
    const harness = withAllProviders(<LabyrinthScreen />);
    return { ...harness, r: render(harness.tree) };
}

describe('labyrinth route — act select', () => {
    it('renders the three descents on a fresh boot', () => {
        const { r } = mount();
        expect(r.getByTestId('labyrinth-act-select')).toBeTruthy();
        expect(r.getByTestId('labyrinth-act-act1')).toBeTruthy();
        expect(r.getByTestId('labyrinth-act-act2')).toBeTruthy();
        expect(r.getByTestId('labyrinth-act-act3')).toBeTruthy();
        expect(r.getByText('THE APORIA')).toBeTruthy();
    });
});

describe('labyrinth route — room scene', () => {
    it('entering act I renders the entrance scene, its doors, and the accordion strip', () => {
        const { r } = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act1'));

        expect(r.getByTestId('labyrinth-room')).toBeTruthy();
        expect(r.getByTestId('labyrinth-room-scene')).toBeTruthy();
        // ap1-1's authored doors: to ap1-2, ap1-9, ap1-10.
        expect(r.getByTestId('labyrinth-door-ap1-2')).toBeTruthy();
        expect(r.getByTestId('labyrinth-door-ap1-9')).toBeTruthy();
        // Object POIs render as (pulsating) clue nodes.
        expect(r.getByTestId('labyrinth-poi-bench')).toBeTruthy();
        // Accordion strip shows the display number.
        expect(r.getByTestId('labyrinth-accordion')).toBeTruthy();
    });

    it('tapping a clue node surfaces the Sophist remark; a door asks for confirmation', () => {
        const { r } = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act1'));

        fireEvent.press(r.getByTestId('labyrinth-poi-bench'));
        expect(r.getByTestId('labyrinth-remark')).toBeTruthy();

        fireEvent.press(r.getByTestId('labyrinth-door-ap1-2'));
        expect(r.getByTestId('labyrinth-door-confirm')).toBeTruthy();
        fireEvent.press(r.getByTestId('labyrinth-door-walk'));
        // Walked: the accordion strip now carries room 7's name strip.
        expect(r.getByTestId('labyrinth-room-scene')).toBeTruthy();
    });
});

describe('labyrinth route — finale panel', () => {
    it('the act III boss room shows the reckoning with the naming input', () => {
        const { r, store } = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act3'));

        // Stand in the boss room (the fight is deferred to the panel).
        const act3 = getAporiaAct('act3');
        const world = store.getState().world;
        act(() => {
            store.setState({
                world: {
                    ...world,
                    currentMap: { ...world.currentMap, currentNode: act3.bossRoom },
                },
            } as never);
        });

        expect(r.getByTestId('labyrinth-finale')).toBeTruthy();
        expect(r.getByTestId('labyrinth-finale-stacks')).toBeTruthy();
        expect(r.getByTestId('labyrinth-name-input')).toBeTruthy();
        expect(r.getByTestId('labyrinth-finale-fight')).toBeTruthy();
    });
});
