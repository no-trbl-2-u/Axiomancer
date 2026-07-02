/**
 * Hermetic E2E Tests — Gathering screen rendering & dispatch.
 *
 * Mounts the real `/gathering` screen against a rigged store and walks
 * the visible phases: site intro, the stacked approach panels, the
 * foraging board (spread, wrath meter, satchel, the two ways out),
 * harvest taps, the reprisal flash, the outcome screen, and the
 * spoils ledger. Seeded; no timers, no network.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import GatheringScreen from '@/app/gathering/index';
import { createAppActions, type AppActions } from '@/state/actions';
import type { AppStore } from '@/state/store';
import { GATHER_WRATH_MAX } from 'axiomancer-mechanics';
import type { GatherPlotEntry, GatheringSessionState } from 'axiomancer-mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        push: jest.fn(),
        canGoBack: () => false,
    }),
}));

afterEach(() => {
    jest.clearAllMocks();
});

function mountGathering(): { store: AppStore; actions: AppActions } {
    const { tree, store } = withAllProviders(<GatheringScreen />);
    render(tree);
    const actions = createAppActions(store);
    return { store, actions };
}

function rigSession(store: AppStore, over: Partial<GatheringSessionState>): void {
    const s = store.getState().gathering.session;
    if (!s) throw new Error('no session');
    store.setState({ gathering: { ...store.getState().gathering, session: { ...s, ...over } } });
}

function plot(uid: string, plotId: string): GatherPlotEntry {
    return { uid, plotId };
}

function begin(store: AppStore, actions: AppActions, approach: 'glean' | 'strip' | null = 'glean'): void {
    act(() => {
        actions.beginGathering({ seed: 7, siteId: 'mire-mint' });
    });
    fireEvent.press(screen.getByTestId('gathering-intro-continue'));
    if (approach) {
        fireEvent.press(screen.getByTestId(`gathering-approach-${approach}`));
    }
}

describe('gathering screen — site intro', () => {
    it('shows the hushed site reveal first; APPROACH hands off to the choice', () => {
        const { store, actions } = mountGathering();
        act(() => {
            actions.beginGathering({ seed: 7, siteId: 'mire-mint' });
        });
        expect(screen.getByTestId('gathering-intro')).toBeTruthy();
        expect(screen.queryByTestId('gathering-approach-select')).toBeNull();
        expect(screen.getAllByText('A STAND OF MIRE-MINT').length).toBeGreaterThan(0);
        fireEvent.press(screen.getByTestId('gathering-intro-continue'));
        expect(screen.queryByTestId('gathering-intro')).toBeNull();
        expect(screen.getByTestId('gathering-approach-select')).toBeTruthy();
        // The verge spread is already face-up before the commitment.
        expect(screen.getByTestId('gathering-opening-spread')).toBeTruthy();
        expect(store.getState().gathering.session?.phase).toBe('approach-select');
    });
});

describe('gathering screen — approach select', () => {
    it('offers both stances and binds the pick', () => {
        const { store, actions } = mountGathering();
        act(() => {
            actions.beginGathering({ seed: 7, siteId: 'mire-mint' });
        });
        fireEvent.press(screen.getByTestId('gathering-intro-continue'));
        expect(screen.getByText('THE TENDER HAND')).toBeTruthy();
        expect(screen.getByText('THE STRIPPING HAND')).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-approach-strip'));
        expect(store.getState().gathering.session?.approach).toBe('strip');
        expect(screen.getByTestId('gathering-board')).toBeTruthy();
    });
});

describe('gathering screen — the board', () => {
    it('renders the spread, wrath meter, satchel, and the two ways out', () => {
        const { store, actions } = mountGathering();
        begin(store, actions);
        expect(screen.getByTestId('gathering-board')).toBeTruthy();
        expect(screen.getByTestId('gathering-wrath')).toBeTruthy();
        expect(screen.getByTestId('gathering-satchel')).toBeTruthy();
        expect(screen.getByTestId('gathering-spread')).toBeTruthy();
        expect(screen.getByTestId('gathering-descend')).toBeTruthy();
        expect(screen.getByTestId('gathering-withdraw')).toBeTruthy();
    });

    it('TAKE harvests into the satchel; tapping the card opens the detail', () => {
        const { store, actions } = mountGathering();
        begin(store, actions);
        act(() => {
            rigSession(store, { spread: [plot('a', 'widow-moss'), plot('b', 'wax-shelf'), plot('c', 'mint-crown')] });
        });
        // Tap the card face → detail overlay with keywords + TAKE.
        fireEvent.press(screen.getByTestId('gathering-plot-a'));
        expect(screen.getByTestId('gathering-plot-detail')).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-detail-take'));
        expect(screen.queryByTestId('gathering-plot-detail')).toBeNull();
        expect(store.getState().gathering.session?.satchel).toHaveLength(1);
        // Quick TAKE under the next card.
        fireEvent.press(screen.getByTestId('gathering-take-b'));
        expect(store.getState().gathering.session?.satchel).toHaveLength(2);
    });

    it('the reprisal flash interrupts and continues on tap', () => {
        const { store, actions } = mountGathering();
        begin(store, actions);
        act(() => {
            rigSession(store, {
                wrath: 3,
                spread: [plot('a', 'widow-moss')],
                reprisalDeck: ['thorns', 'rot', 'mire', 'watcher'],
            });
        });
        fireEvent.press(screen.getByTestId('gathering-take-a'));
        expect(screen.getByTestId('gathering-reprisal')).toBeTruthy();
        expect(screen.getByText("THE BRIAR'S TOLL")).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-reprisal'));
        expect(screen.queryByTestId('gathering-reprisal')).toBeNull();
        expect(store.getState().gathering.session?.phase).toBe('foraging');
    });
});

describe('gathering screen — the tutorial coach', () => {
    it('rides the guided first gleaning and advances with play', () => {
        const { store, actions } = mountGathering();
        act(() => {
            actions.beginGathering({ tutorial: true });
        });
        fireEvent.press(screen.getByTestId('gathering-intro-continue'));
        // Step 1 coaches the approach choice over the approach screen.
        expect(screen.getByTestId('gathering-tutorial')).toBeTruthy();
        expect(screen.getByText('THE PLACE IS WATCHING')).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-approach-glean'));
        // Step 2: TAKE.
        expect(screen.getByText('TAKE SOMETHING')).toBeTruthy();
        const taking = store
            .getState()
            .gathering.session!.spread.find((e) => e.plotId !== 'green-breath')!;
        fireEvent.press(screen.getByTestId(`gathering-take-${taking.uid}`));
        // Step 3: TEND.
        expect(screen.getByText('WRATH — AND HOW TO BREATHE IT OUT')).toBeTruthy();
    });

    it('SKIP sets the persistent flag and dismisses the coach', () => {
        const { store, actions } = mountGathering();
        act(() => {
            actions.beginGathering({ tutorial: true });
        });
        fireEvent.press(screen.getByTestId('gathering-intro-continue'));
        fireEvent.press(screen.getByTestId('gathering-tutorial-skip'));
        expect(screen.queryByTestId('gathering-tutorial')).toBeNull();
        const flags = (store.getState() as unknown as { flags: string[] }).flags;
        expect(flags).toContain('gleaning-tutorial-done');
        // The session keeps running as normal play.
        expect(store.getState().gathering.session).not.toBeNull();
    });

    it('never shows on a normal (non-tutorial) gleaning', () => {
        const { store, actions } = mountGathering();
        begin(store, actions, 'glean');
        expect(screen.queryByTestId('gathering-tutorial')).toBeNull();
    });
});

describe('gathering screen — outcome and spoils', () => {
    it('withdraw walks outcome → spoils → claim, then the session clears', () => {
        const { store, actions } = mountGathering();
        begin(store, actions);
        act(() => {
            rigSession(store, { spread: [plot('a', 'widow-moss')] });
        });
        fireEvent.press(screen.getByTestId('gathering-take-a'));
        fireEvent.press(screen.getByTestId('gathering-withdraw'));
        expect(screen.getByTestId('gathering-outcome')).toBeTruthy();
        expect(screen.getByText('LADEN')).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-outcome-continue'));
        expect(screen.getByTestId('gathering-spoils')).toBeTruthy();
        expect(screen.getByText(/Widow's Moss/)).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-spoils-confirm'));
        expect(store.getState().gathering.session).toBeNull();
        expect(screen.getByTestId('gathering-empty')).toBeTruthy();
    });

    it('an eruption shows the ROUTED outcome', () => {
        const { store, actions } = mountGathering();
        begin(store, actions, 'strip');
        act(() => {
            rigSession(store, {
                wrath: GATHER_WRATH_MAX - 1,
                thresholdsFired: [true, true],
                spread: [plot('a', 'gilt-scab')],
                satchel: [
                    { uid: 's1', plotId: 'amber-weep', family: 'resin', richness: 2, name: 'Amber Weeping' },
                    { uid: 's2', plotId: 'salt-lace', family: 'vein', richness: 1, name: 'Salt Lace' },
                ],
            });
        });
        fireEvent.press(screen.getByTestId('gathering-take-a'));
        expect(screen.getByTestId('gathering-reprisal')).toBeTruthy();
        expect(screen.getByText('THE SITE ERUPTS')).toBeTruthy();
        fireEvent.press(screen.getByTestId('gathering-reprisal'));
        expect(screen.getByTestId('gathering-outcome')).toBeTruthy();
        expect(screen.getByText('ROUTED')).toBeTruthy();
    });
});
