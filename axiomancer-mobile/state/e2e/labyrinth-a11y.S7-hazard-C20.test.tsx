/**
 * S7-hazard-C20 — THE APORIA's controls must announce themselves.
 *
 * A screen-reader player met the act cards, LEAVE and the MAP toggle as
 * bare `<Pressable>`s: no role, no label, so the descent read as three
 * paragraphs of prose and the two header words read as decoration. They
 * now carry `accessibilityRole="button"` and presenter-owned labels
 * (`LABYRINTH_COPY.a11y`, Hard Rule #8).
 *
 * The suite pins what the finding is about — every one of those controls
 * is announced as a button with a spoken label, the act label names its
 * descent, and the MAP toggle's label follows the toggle — plus the
 * behaviour underneath (pressing an act card still descends).
 *
 * Hermetic = self-contained + deterministic + isolated. See docs/testing.md.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({ back: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));

import LabyrinthScreen from '@/app/labyrinth/index';
import { LABYRINTH_COPY } from '@/state/presenters/labyrinth.engine';
import { getAporiaAct } from '@mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

function mount() {
    const harness = withAllProviders(<LabyrinthScreen />);
    return render(harness.tree);
}

describe('S7-hazard-C20: the act select announces its controls', () => {
    it('every act card is a button labelled with its descent', () => {
        const r = mount();

        for (const actId of ['act1', 'act2', 'act3'] as const) {
            const card = r.getByTestId(`labyrinth-act-${actId}`);
            expect(card.props.accessibilityRole).toBe('button');
            expect(card.props.accessibilityLabel).toContain(getAporiaAct(actId).title);
        }
    });

    it('LEAVE is a button, not a caption', () => {
        const r = mount();
        const leave = r.getByTestId('labyrinth-leave');

        expect(leave.props.accessibilityRole).toBe('button');
        expect(leave.props.accessibilityLabel).toBe(LABYRINTH_COPY.a11y.leave);
    });

    it('an unwalked act is spoken differently from a walked one', () => {
        const title = getAporiaAct('act1').title;

        expect(LABYRINTH_COPY.a11y.actOption(title, false)).not.toBe(
            LABYRINTH_COPY.a11y.actOption(title, true),
        );
        expect(LABYRINTH_COPY.a11y.actOption(title, true)).toContain(title);
    });
});

describe('S7-hazard-C20: the room header announces its controls', () => {
    it('LEAVE and the MAP toggle are buttons with spoken labels', () => {
        const r = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act1'));

        const leave = r.getByTestId('labyrinth-leave');
        expect(leave.props.accessibilityRole).toBe('button');
        expect(leave.props.accessibilityLabel).toBe(LABYRINTH_COPY.a11y.leave);

        const toggle = r.getByTestId('labyrinth-map-toggle');
        expect(toggle.props.accessibilityRole).toBe('button');
        expect(toggle.props.accessibilityLabel).toBe(LABYRINTH_COPY.a11y.mapShow);
    });

    it("the MAP toggle's label follows the toggle", () => {
        const r = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act1'));

        fireEvent.press(r.getByTestId('labyrinth-map-toggle'));
        expect(r.getByTestId('labyrinth-map-toggle').props.accessibilityLabel).toBe(
            LABYRINTH_COPY.a11y.mapHide,
        );

        fireEvent.press(r.getByTestId('labyrinth-map-toggle'));
        expect(r.getByTestId('labyrinth-map-toggle').props.accessibilityLabel).toBe(
            LABYRINTH_COPY.a11y.mapShow,
        );
    });

    it('labelling the act card did not cost it its press', () => {
        const r = mount();
        fireEvent.press(r.getByTestId('labyrinth-act-act1'));

        expect(r.getByTestId('labyrinth-room')).toBeTruthy();
        expect(r.getByTestId('labyrinth-room-scene')).toBeTruthy();
    });
});
