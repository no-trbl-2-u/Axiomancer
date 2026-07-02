/**
 * QuestOverlays — the quest-board minigame's four overlay surfaces:
 * the board-reveal intro, the open-space card (pending vs resolved),
 * the dusk flash, and the outcome ledger. Pure presentation over the
 * presenter VMs; every interaction dispatches a prop callback. Pins the
 * conditional branches (vow marks, option enable/disable + reason,
 * result-vs-pending swap, rolls/chips/ledger gating, dusk collapsed copy,
 * outcome stat row) plus each overlay's button callback.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';

import {
    QuestIntroOverlay,
    QuestSpaceOverlay,
    QuestDuskOverlay,
    QuestOutcomeOverlay,
} from '@/components/quest/QuestOverlays';
import type {
    QuestBoardVM,
    QuestOptionVM,
    QuestOutcomeVM,
    QuestPendingVM,
    QuestResultVM,
    QuestVowVM,
} from '@/state/presenters/quest.engine';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function vow(id: string, status: QuestVowVM['status']): QuestVowVM {
    return { id, name: `vow ${id}`, desc: `desc ${id}`, status };
}

function option(id: string, enabled: boolean): QuestOptionVM {
    return {
        id,
        label: `OPT ${id}`,
        desc: `do ${id}`,
        enabled,
        disabledReason: enabled ? null : 'too tired',
    };
}

const BOARD_VM: QuestBoardVM = {
    active: true,
    phase: 'intro',
    boardId: 'boat',
    title: 'THE BOAT',
    headline: 'BUILD IT BY DUSK',
    storyBeat: 'a quiet shore',
    intro: 'The boy lays out his vows.',
    pieceName: 'skiff',
    day: 1,
    stretch: 0,
    stretchesPerDay: 6,
    fish: 3,
    vigor: 5,
    maxVigor: 5,
    wind: 0,
    pos: 0,
    spaces: [],
    parts: [],
    boatProgress: 0,
    lastRoll: null,
    charms: [
        { id: 'gull-feather', name: 'Salt Charm', desc: 'wards the tide', flavor: '', used: false, primed: false, usable: true },
    ],
    vows: [vow('a', 'active'), vow('b', 'kept'), vow('c', 'broken')],
    tierPreview: 'seaworthy',
    pending: null,
    collapsedToday: false,
    outcome: null,
};

function pending(overrides: Partial<QuestPendingVM> = {}): QuestPendingVM {
    return {
        kind: 'gather',
        title: 'A GATHER SPACE',
        body: 'Shells and driftwood litter the sand.',
        options: [option('take', true), option('leave', false)],
        result: null,
        ledger: [],
        ...overrides,
    };
}

function result(overrides: Partial<QuestResultVM> = {}): QuestResultVM {
    return {
        title: 'YOU TOOK IT',
        body: 'A fistful of nails.',
        rolls: [],
        deltaChips: [],
        ...overrides,
    };
}

const OUTCOME_VM: QuestOutcomeVM = {
    tier: 'seaworthy',
    tierLabel: 'A SEAWORTHY SKIFF',
    copy: 'It floats, and that is enough.',
    daysTaken: 3,
    fishLeft: 2,
    vigorLeft: 4,
    rolls: 11,
    vowsKept: 2,
    vows: [vow('a', 'kept'), vow('b', 'kept'), vow('c', 'broken')],
};

// ---------------------------------------------------------------------------
// QuestIntroOverlay
// ---------------------------------------------------------------------------

describe('QuestIntroOverlay', () => {
    it('renders the board reveal with story beat, title, and intro', () => {
        render(<QuestIntroOverlay vm={BOARD_VM} onBegin={jest.fn()} />);
        expect(screen.getByTestId('quest-intro')).toBeTruthy();
        // Story beat is upper-cased.
        expect(screen.getByText('A QUIET SHORE')).toBeTruthy();
        expect(screen.getByText('THE BOAT')).toBeTruthy();
        expect(screen.getByText('BUILD IT BY DUSK')).toBeTruthy();
        expect(screen.getByText('The boy lays out his vows.')).toBeTruthy();
    });

    it('lists the dealt vows with per-status marks', () => {
        render(<QuestIntroOverlay vm={BOARD_VM} onBegin={jest.fn()} />);
        // kept → ✓, broken → ✗, active → ·
        expect(screen.getByText('✓')).toBeTruthy();
        expect(screen.getByText('✗')).toBeTruthy();
        expect(screen.getByText('·')).toBeTruthy();
        expect(screen.getByText('vow a')).toBeTruthy();
    });

    it('lists the satchel charms', () => {
        render(<QuestIntroOverlay vm={BOARD_VM} onBegin={jest.fn()} />);
        expect(screen.getByText('Salt Charm')).toBeTruthy();
        expect(screen.getByText('wards the tide')).toBeTruthy();
    });

    it('fires onBegin when UNFOLD THE BOARD is pressed', () => {
        const onBegin = jest.fn();
        render(<QuestIntroOverlay vm={BOARD_VM} onBegin={onBegin} />);
        fireEvent.press(screen.getByTestId('quest-begin'));
        expect(onBegin).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// QuestSpaceOverlay — pending (unresolved) branch
// ---------------------------------------------------------------------------

describe('QuestSpaceOverlay (pending)', () => {
    it('shows the pending title/body and renders the option rows', () => {
        render(
            <QuestSpaceOverlay pending={pending()} onChoose={jest.fn()} onContinue={jest.fn()} />,
        );
        expect(screen.getByTestId('quest-space')).toBeTruthy();
        expect(screen.getByText('A GATHER SPACE')).toBeTruthy();
        expect(screen.getByTestId('quest-option-take')).toBeTruthy();
        expect(screen.getByTestId('quest-option-leave')).toBeTruthy();
    });

    it('does not show the WALK ON button while unresolved', () => {
        render(
            <QuestSpaceOverlay pending={pending()} onChoose={jest.fn()} onContinue={jest.fn()} />,
        );
        expect(screen.queryByTestId('quest-continue')).toBeNull();
    });

    it('fires onChoose with the option id for an enabled option', () => {
        const onChoose = jest.fn();
        render(
            <QuestSpaceOverlay pending={pending()} onChoose={onChoose} onContinue={jest.fn()} />,
        );
        fireEvent.press(screen.getByTestId('quest-option-take'));
        expect(onChoose).toHaveBeenCalledWith('take');
    });

    it('disables an option and annotates its reason', () => {
        const onChoose = jest.fn();
        render(
            <QuestSpaceOverlay pending={pending()} onChoose={onChoose} onContinue={jest.fn()} />,
        );
        const disabled = screen.getByTestId('quest-option-leave');
        expect(disabled.props.accessibilityState.disabled).toBe(true);
        // The disabled reason is appended to the option description.
        expect(screen.getByText(/too tired/i)).toBeTruthy();
        fireEvent.press(disabled);
        expect(onChoose).not.toHaveBeenCalled();
    });

    it('renders a market ledger only when present and unresolved', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ ledger: ['3 fish for 1 nail', 'wind favours you'] })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.getByTestId('quest-market-ledger')).toBeTruthy();
        expect(screen.getByText(/3 fish for 1 nail/)).toBeTruthy();
    });

    it('omits the ledger box when there are no ledger lines', () => {
        render(
            <QuestSpaceOverlay pending={pending()} onChoose={jest.fn()} onContinue={jest.fn()} />,
        );
        expect(screen.queryByTestId('quest-market-ledger')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// QuestSpaceOverlay — resolved (result) branch
// ---------------------------------------------------------------------------

describe('QuestSpaceOverlay (resolved)', () => {
    it('swaps to the result title/body and shows WALK ON', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result() })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.getByText('YOU TOOK IT')).toBeTruthy();
        expect(screen.getByText('A fistful of nails.')).toBeTruthy();
        expect(screen.getByTestId('quest-continue')).toBeTruthy();
    });

    it('hides the option rows once resolved', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result() })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.queryByTestId('quest-option-take')).toBeNull();
    });

    it('renders the roll faces when the result carries rolls', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result({ rolls: [5, 3] }) })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.getByTestId('quest-result-rolls')).toBeTruthy();
    });

    it('omits the roll row when the result has no rolls', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result({ rolls: [] }) })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.queryByTestId('quest-result-rolls')).toBeNull();
    });

    it('renders the delta chips when present', () => {
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result({ deltaChips: ['+2 IRON NAILS', '−1 VIGOR'] }) })}
                onChoose={jest.fn()}
                onContinue={jest.fn()}
            />,
        );
        expect(screen.getByTestId('quest-result-chips')).toBeTruthy();
        expect(screen.getByText('+2 IRON NAILS')).toBeTruthy();
    });

    it('fires onContinue when WALK ON is pressed', () => {
        const onContinue = jest.fn();
        render(
            <QuestSpaceOverlay
                pending={pending({ result: result() })}
                onChoose={jest.fn()}
                onContinue={onContinue}
            />,
        );
        fireEvent.press(screen.getByTestId('quest-continue'));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// QuestDuskOverlay
// ---------------------------------------------------------------------------

describe('QuestDuskOverlay', () => {
    it('shows the normal DUSK copy with the day number when not collapsed', () => {
        render(<QuestDuskOverlay day={2} collapsed={false} onContinue={jest.fn()} />);
        expect(screen.getByTestId('quest-dusk')).toBeTruthy();
        expect(screen.getByText('DUSK')).toBeTruthy();
        expect(screen.getByText(/Day 2 folds itself away/)).toBeTruthy();
    });

    it('shows the CARRIED HOME copy when collapsed', () => {
        render(<QuestDuskOverlay day={2} collapsed onContinue={jest.fn()} />);
        expect(screen.getByText('CARRIED HOME')).toBeTruthy();
        expect(screen.getByText(/the ground came up to meet him/)).toBeTruthy();
    });

    it('fires onContinue when A NEW DAY is pressed', () => {
        const onContinue = jest.fn();
        render(<QuestDuskOverlay day={1} collapsed={false} onContinue={onContinue} />);
        fireEvent.press(screen.getByTestId('quest-dawn'));
        expect(onContinue).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// QuestOutcomeOverlay
// ---------------------------------------------------------------------------

describe('QuestOutcomeOverlay', () => {
    it('renders the tier label, copy, and the stat row', () => {
        render(<QuestOutcomeOverlay outcome={OUTCOME_VM} onClaim={jest.fn()} />);
        expect(screen.getByTestId('quest-outcome')).toBeTruthy();
        expect(screen.getByText('A SEAWORTHY SKIFF')).toBeTruthy();
        expect(screen.getByText('It floats, and that is enough.')).toBeTruthy();
        expect(screen.getByText('DAYS 3')).toBeTruthy();
        expect(screen.getByText('ROLLS 11')).toBeTruthy();
        expect(screen.getByText('FISH 2')).toBeTruthy();
        expect(screen.getByText('VIGOR 4')).toBeTruthy();
    });

    it('shows the vows-kept count and the per-vow ledger', () => {
        render(<QuestOutcomeOverlay outcome={OUTCOME_VM} onClaim={jest.fn()} />);
        expect(screen.getByText('VOWS — 2 KEPT')).toBeTruthy();
        expect(screen.getByText('vow a')).toBeTruthy();
    });

    it('fires onClaim when TO THE WATER is pressed', () => {
        const onClaim = jest.fn();
        render(<QuestOutcomeOverlay outcome={OUTCOME_VM} onClaim={onClaim} />);
        fireEvent.press(screen.getByTestId('quest-claim'));
        expect(onClaim).toHaveBeenCalledTimes(1);
    });
});
