/**
 * Hermetic component tests — GateSockets (Gate of Assent / Foundation
 * socket UI, DESIGN.md sections 5-7). Owns real interactive state
 * (lay/take-back, the openSockets capacity guard, the distinct-word
 * pocket dedupe) that no existing labyrinth e2e/screen test exercises.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { GateSockets } from '@/components/labyrinth/GateSockets';
import type { LabyrinthGateVM, LabyrinthPocketChipVM } from '@/state/presenters/labyrinth.engine';

function flattenStyle(node: { props: { style?: unknown } }): Record<string, unknown> {
    const raw = node.props.style;
    const arr = Array.isArray(raw) ? raw : [raw];
    return arr.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === 'object') Object.assign(acc, entry);
        return acc;
    }, {});
}

const GATE: LabyrinthGateVM = {
    riddle: 'What walks on three legs by evening?',
    socketCount: 3,
    preConfirmed: ['old'],
};

const POCKET: readonly LabyrinthPocketChipVM[] = [
    { word: 'sun', source: 'found in the atrium' },
    { word: 'moon', source: 'found in the vault' },
];

describe('GateSockets: rendering', () => {
    it('renders the riddle, the pre-confirmed socket, and the open sockets', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        expect(tree.queryByText(GATE.riddle)).not.toBeNull();
        expect(tree.queryByText('old')).not.toBeNull();
        // socketCount 3 - preConfirmed 1 = 2 open sockets
        expect(tree.getByTestId('labyrinth-socket-0')).not.toBeNull();
        expect(tree.getByTestId('labyrinth-socket-1')).not.toBeNull();
        expect(tree.queryByTestId('labyrinth-socket-2')).toBeNull();
    });

    it('dedupes pocket chips by word — duplicate words render one chip', () => {
        const dupPocket: readonly LabyrinthPocketChipVM[] = [
            { word: 'sun', source: 'found in the atrium' },
            { word: 'sun', source: 'found in the vault' },
            { word: 'moon', source: 'found in the crypt' },
        ];
        const tree = render(
            <GateSockets gate={GATE} pocket={dupPocket} resultLine={null} onSubmit={jest.fn()} />,
        );
        expect(tree.queryAllByTestId('labyrinth-gate-chip-sun')).toHaveLength(1);
        expect(tree.queryAllByTestId('labyrinth-gate-chip-moon')).toHaveLength(1);
    });

    it('renders the result line only when provided', () => {
        const hidden = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        expect(hidden.queryByTestId('labyrinth-gate-line')).toBeNull();

        const shown = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine="The house does not agree." onSubmit={jest.fn()} />,
        );
        expect(shown.getByTestId('labyrinth-gate-line')).toHaveTextContent('The house does not agree.');
    });
});

describe('GateSockets: laying and taking back words', () => {
    it('laying a chip fills the next empty socket with that word', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        expect(tree.getByTestId('labyrinth-socket-0')).toHaveTextContent('sun');
        expect(tree.getByTestId('labyrinth-socket-1')).not.toHaveTextContent('sun');
    });

    it('a laid chip reads as spent (dimmed) and a second press on it is a no-op', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        const chip = tree.getByTestId('labyrinth-gate-chip-sun');
        expect(flattenStyle(chip).opacity).toBeUndefined();

        fireEvent.press(chip);
        expect(flattenStyle(tree.getByTestId('labyrinth-gate-chip-sun')).opacity).toBe(0.35);

        // Pressing the now-spent chip again must not lay a second copy into socket-1.
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        expect(tree.getByTestId('labyrinth-socket-1')).toHaveTextContent('·');
    });

    it('the capacity guard stops laying once every open socket is full', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-moon'));
        // Both open sockets (0, 1) are now full — take-back on socket-0 should
        // still work (proves the guard only blocks laying, not reading state).
        expect(tree.getByTestId('labyrinth-socket-0')).toHaveTextContent('sun');
        expect(tree.getByTestId('labyrinth-socket-1')).toHaveTextContent('moon');
    });

    it('tapping a laid socket takes the word back and un-dims its chip', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        expect(flattenStyle(tree.getByTestId('labyrinth-gate-chip-sun')).opacity).toBe(0.35);

        fireEvent.press(tree.getByTestId('labyrinth-socket-0'));
        expect(tree.getByTestId('labyrinth-socket-0')).toHaveTextContent('·');
        expect(flattenStyle(tree.getByTestId('labyrinth-gate-chip-sun')).opacity).toBeUndefined();
    });

    it('the clear button resets every laid word back to the pocket', () => {
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={jest.fn()} />,
        );
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-moon'));
        fireEvent.press(tree.getByTestId('labyrinth-gate-clear'));

        expect(tree.getByTestId('labyrinth-socket-0')).toHaveTextContent('·');
        expect(tree.getByTestId('labyrinth-socket-1')).toHaveTextContent('·');
        expect(flattenStyle(tree.getByTestId('labyrinth-gate-chip-sun')).opacity).toBeUndefined();
    });
});

describe('GateSockets: submit', () => {
    it('submits the pre-confirmed words followed by the laid words, in lay order', () => {
        const onSubmit = jest.fn();
        const tree = render(
            <GateSockets gate={GATE} pocket={POCKET} resultLine={null} onSubmit={onSubmit} />,
        );
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-moon'));
        fireEvent.press(tree.getByTestId('labyrinth-gate-chip-sun'));
        fireEvent.press(tree.getByTestId('labyrinth-gate-submit'));

        expect(onSubmit).toHaveBeenCalledWith(['old', 'moon', 'sun']);
    });
});
