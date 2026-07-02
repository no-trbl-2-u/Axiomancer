/**
 * Hermetic component tests — CombatDefeatPanel (Phase 70 Tick C).
 *
 * Pins the defeat-panel render contract + the two action handlers.
 * The killer block, damage ledger, run-summary ledger, and the
 * blood seep collectively make this the densest of the three
 * outcome panels — pin each band so a future refactor can't silently
 * lose one.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { CombatDefeatPanel } from '@/components/event/aftermath/CombatDefeatPanel';
import type { AftermathDefeatViewModel } from '@/state/presenters/aftermath.engine';

const BASE_VM: AftermathDefeatViewModel = {
    kind: 'defeat',
    characterName: 'WORM-EATEN PILGRIM',
    killer: {
        name: 'THE HIEROPHANT',
        epithet: 'iron-tongued',
        finalSkill: 'AXE-FALL',
        damage: 28,
    },
    causePhrase: 'And so the pilgrim laid down where it stood.',
    runSummary: {
        rounds: 4,
        encountersFaced: 12,
        deepestNodeId: 'iii.b',
    },
};

describe('CombatDefeatPanel: render contract', () => {
    it('mounts the panel root', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(tree.queryByTestId('combat-defeat-panel')).not.toBeNull();
    });

    it('renders the character name in gothic caps', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(
            tree.queryByTestId('combat-defeat-panel-character-name')?.props.children,
        ).toBe('WORM-EATEN PILGRIM');
    });

    it('renders the THE PAGE CLOSES eyebrow', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(tree.queryByText('✠ THE PAGE CLOSES')).not.toBeNull();
    });

    it('renders the killer name + epithet when killer is populated', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        // The killer block is a single <Text> with nested <Text>
        // children for the name + epithet; query for the inner
        // strings directly.
        expect(tree.queryByText('THE HIEROPHANT')).not.toBeNull();
        expect(tree.queryByText('iron-tongued')).not.toBeNull();
    });

    it('renders the damage ledger when killer is populated', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        // 'AXE-FALL · 28' — Text concatenation in JSX shows up as
        // joined children; check via the killer-format string.
        expect(tree.queryByText(/AXE-FALL.*28/)).not.toBeNull();
    });

    it('collapses the killer + damage ledger when killer is null', () => {
        const tree = render(
            <CombatDefeatPanel
                vm={{ ...BASE_VM, killer: null }}
                onBeginAgain={() => {}}
                onLetClose={() => {}}
            />,
        );
        expect(tree.queryByTestId('combat-defeat-panel-killer')).toBeNull();
    });

    it('renders the cause phrase verbatim', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(
            tree.queryByTestId('combat-defeat-panel-cause-phrase')?.props.children,
        ).toBe('And so the pilgrim laid down where it stood.');
    });

    it('renders the run-summary ledger with all three rows', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        const ledger = tree.queryByTestId('combat-defeat-panel-ledger');
        expect(ledger).not.toBeNull();
        // Labels are static; values are lowercase-roman + the raw
        // node id.
        expect(tree.queryByText('rounds endured')).not.toBeNull();
        expect(tree.queryByText('encounters survived')).not.toBeNull();
        expect(tree.queryByText('deepest node')).not.toBeNull();
        // 4 -> iv, 12 -> xii
        expect(tree.queryByText('iv')).not.toBeNull();
        expect(tree.queryByText('xii')).not.toBeNull();
        expect(tree.queryByText('iii.b')).not.toBeNull();
    });

    it('renders an em-dash placeholder for deepest node when null', () => {
        const tree = render(
            <CombatDefeatPanel
                vm={{ ...BASE_VM, runSummary: { ...BASE_VM.runSummary, deepestNodeId: null } }}
                onBeginAgain={() => {}}
                onLetClose={() => {}}
            />,
        );
        // '·' middle-dot for null node — design's roman(0) sentinel.
        const middotMatches = tree.queryAllByText('·');
        expect(middotMatches.length).toBeGreaterThanOrEqual(1);
    });
});

describe('CombatDefeatPanel: action handlers', () => {
    it('exposes BEGIN AGAIN + let-the-page-close by testID', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(tree.queryByTestId('combat-defeat-panel-begin-again')).not.toBeNull();
        expect(tree.queryByTestId('combat-defeat-panel-let-close')).not.toBeNull();
    });

    it('renders the BEGIN AGAIN + let-the-page-close labels', () => {
        const tree = render(
            <CombatDefeatPanel vm={BASE_VM} onBeginAgain={() => {}} onLetClose={() => {}} />,
        );
        expect(tree.queryByText('✠ BEGIN AGAIN')).not.toBeNull();
        expect(tree.queryByText('let the page close')).not.toBeNull();
    });

    it('fires onBeginAgain exactly once when BEGIN AGAIN is pressed', () => {
        const onBeginAgain = jest.fn();
        const tree = render(
            <CombatDefeatPanel
                vm={BASE_VM}
                onBeginAgain={onBeginAgain}
                onLetClose={() => {}}
            />,
        );
        fireEvent.press(tree.getByTestId('combat-defeat-panel-begin-again'));
        expect(onBeginAgain).toHaveBeenCalledTimes(1);
    });

    it('fires onLetClose exactly once when let-the-page-close is pressed', () => {
        const onLetClose = jest.fn();
        const tree = render(
            <CombatDefeatPanel
                vm={BASE_VM}
                onBeginAgain={() => {}}
                onLetClose={onLetClose}
            />,
        );
        fireEvent.press(tree.getByTestId('combat-defeat-panel-let-close'));
        expect(onLetClose).toHaveBeenCalledTimes(1);
    });
});
