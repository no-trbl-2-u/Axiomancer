/**
 * Hermetic E2E Tests — Phase 137 encounter screens rendering &
 * dispatch. Mounts the real /quest, /rest, and /cache screens against
 * rigged stores and walks their visible phases. Seeded; no timers,
 * no network.
 */

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import * as Haptics from 'expo-haptics';

import CacheScreen from '@/app/cache/index';
import QuestScreen from '@/app/quest/index';
import RestScreen from '@/app/rest/index';
import { QUEST_LANDING_TIMING } from '@/components/quest/useQuestLanding';
import { createAppActions, type AppActions } from '@/state/actions';
import type { AppStore } from '@/state/store';
import { BUILD_THE_BOAT_BOARD, createLootCacheSession } from 'axiomancer-mechanics';
import type { QuestBoardSession } from 'axiomancer-mechanics';
import { withAllProviders } from '@/test-utils/withAllProviders';

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: jest.fn(),
        push: jest.fn(),
        canGoBack: () => false,
    }),
}));

// Override the global haptics mock with spies so the arrival flourish
// (U2) can be asserted on.
jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(() => Promise.resolve()),
    notificationAsync: jest.fn(() => Promise.resolve()),
    selectionAsync: jest.fn(() => Promise.resolve()),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

afterEach(() => {
    jest.clearAllMocks();
});

function mount(element: React.ReactElement): { store: AppStore; actions: AppActions } {
    const { tree, store } = withAllProviders(element);
    render(tree);
    return { store, actions: createAppActions(store) };
}

function rigQuest(store: AppStore, over: Partial<QuestBoardSession>): void {
    const s = store.getState().quest.session;
    if (!s) throw new Error('no quest session');
    store.setState({ quest: { session: { ...s, ...over } } });
}

/** Concatenates all rendered text under a testID (handles nested <Text>). */
function flattenText(testID: string): string {
    const out: string[] = [];
    const walk = (c: unknown): void => {
        if (c == null || c === false) return;
        if (typeof c === 'string' || typeof c === 'number') { out.push(String(c)); return; }
        if (Array.isArray(c)) { c.forEach(walk); return; }
        const el = c as { props?: { children?: unknown } };
        if (el.props && el.props.children !== undefined) walk(el.props.children);
    };
    walk(screen.getByTestId(testID).props.children);
    return out.join('');
}

describe('quest screen', () => {
    it('shows the board reveal, then the track, resources, and charms', () => {
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7, boardId: 'build-the-boat' });
        });
        expect(screen.getByTestId('quest-intro')).toBeTruthy();
        expect(screen.getAllByText(BUILD_THE_BOAT_BOARD.title).length).toBeGreaterThan(0);

        fireEvent.press(screen.getByTestId('quest-begin'));
        expect(screen.queryByTestId('quest-intro')).toBeNull();
        expect(store.getState().quest.session?.phase).toBe('idle');
        expect(screen.getByTestId('quest-board-track')).toBeTruthy();
        expect(screen.getByTestId('quest-piece')).toBeTruthy();
        expect(screen.getByTestId('quest-resources')).toBeTruthy();
        expect(screen.getByTestId('quest-roll')).toBeTruthy();
        // Both dealt charms render.
        const session = store.getState().quest.session!;
        for (const charm of session.charms) {
            expect(screen.getByTestId(`quest-charm-${charm.id}`)).toBeTruthy();
        }
    });

    it('casting the bone tumbles, walks the piece, then opens a space card; continue returns to the die', () => {
        jest.useFakeTimers();
        try {
            const { store, actions } = mount(<QuestScreen />);
            act(() => {
                actions.beginQuestBoard({ seed: 7 });
                actions.startQuestBoardPlay();
            });
            fireEvent.press(screen.getByTestId('quest-roll'));
            const s = store.getState().quest.session!;
            // Engine has resolved, but the card stays shut while the die
            // tumbles and the piece walks.
            expect(s.phase).toBe('space');
            expect(screen.queryByTestId('quest-space')).toBeNull();
            expect(screen.getByTestId('quest-die')).toBeTruthy();

            // Flush the tumble + walk + reveal beats.
            act(() => {
                jest.runAllTimers();
            });
            expect(screen.getByTestId('quest-space')).toBeTruthy();

            // Resolve: pick the first enabled option if any, then continue.
            if (s.pending!.result === null) {
                const enabled = s.pending!.options.filter(o => !o.disabledReason);
                const pick = s.pending!.kind === 'market'
                    ? enabled.find(o => o.id === 'leave')!
                    : enabled[0];
                fireEvent.press(screen.getByTestId(`quest-option-${pick.id}`));
            }
            fireEvent.press(screen.getByTestId('quest-continue'));
            expect(['idle', 'dusk']).toContain(store.getState().quest.session!.phase);
        } finally {
            jest.useRealTimers();
        }
    });

    it('flags the destination while the piece walks and fires a haptic on arrival (U1/U2)', () => {
        const impact = jest.mocked(Haptics.impactAsync);
        const notify = jest.mocked(Haptics.notificationAsync);
        jest.useFakeTimers();
        try {
            const { store, actions } = mount(<QuestScreen />);
            act(() => {
                actions.beginQuestBoard({ seed: 7 });
                actions.startQuestBoardPlay();
            });
            fireEvent.press(screen.getByTestId('quest-roll'));
            const dest = store.getState().quest.session!.pos;

            // Settle the die → walking begins; the destination is flagged but
            // the piece hasn't reached it yet.
            act(() => {
                jest.advanceTimersByTime(QUEST_LANDING_TIMING.rollMs + 1);
            });
            expect(screen.getByTestId(`quest-target-${dest}`)).toBeTruthy();
            expect(screen.queryByTestId('quest-space')).toBeNull();

            // Finish the walk: the flag is consumed by the piece and the
            // arrival haptic fires exactly once.
            act(() => {
                jest.runAllTimers();
            });
            expect(screen.queryByTestId(`quest-target-${dest}`)).toBeNull();
            expect(screen.getByTestId('quest-piece')).toBeTruthy();
            expect(impact.mock.calls.length + notify.mock.calls.length).toBe(1);
        } finally {
            jest.useRealTimers();
        }
    });

    it('draws the boat-build hull meter with the tier preview (U3)', () => {
        const { actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7, boardId: 'build-the-boat' });
            actions.startQuestBoardPlay();
        });
        expect(screen.getByTestId('quest-hull-meter')).toBeTruthy();
        expect(screen.getByTestId('quest-hull-fill')).toBeTruthy();
        // Tier preview text is present (one of the three outcome tiers).
        const tier = screen.getByTestId('quest-hull-tier').props.children;
        expect(String(tier.join ? tier.join('') : tier)).toMatch(/MASTERWORK|SEAWORTHY|DRIFTWOOD/);
    });

    it('the legend unfolds the marks key on demand', () => {
        const { actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7 });
            actions.startQuestBoardPlay();
        });
        // Collapsed by default.
        expect(screen.queryByTestId('quest-legend-slipway')).toBeNull();
        fireEvent.press(screen.getByTestId('quest-legend-toggle'));
        // The slipway is always on the board, so its row must appear.
        expect(screen.getByTestId('quest-legend-slipway')).toBeTruthy();
    });

    it('holds the gathered-parts ledger and hull steady until the cast resolves', () => {
        jest.useFakeTimers();
        try {
            const { store, actions } = mount(<QuestScreen />);
            act(() => {
                actions.beginQuestBoard({ seed: 7, boardId: 'build-the-boat' });
                actions.startQuestBoardPlay();
            });
            const beforeParts = flattenText('quest-parts');
            const beforeHull = flattenText('quest-hull-tier');

            // Mid-cast: the engine has already fitted new parts, but the space
            // hasn't been walked-on yet (phase is still 'space').
            const s = store.getState().quest.session!;
            const bumpedFitted = Object.fromEntries(
                Object.keys(s.fitted).map(k => [k, (s.fitted as Record<string, number>)[k] + 1]),
            );
            act(() => {
                rigQuest(store, { phase: 'space', fitted: bumpedFitted as typeof s.fitted });
            });
            // Frozen — neither the middle ledger nor the hull bar moved.
            expect(flattenText('quest-parts')).toBe(beforeParts);
            expect(flattenText('quest-hull-tier')).toBe(beforeHull);

            // The cast resolves (phase leaves 'space') → both catch up.
            act(() => {
                rigQuest(store, { phase: 'idle' });
            });
            expect(flattenText('quest-parts')).not.toBe(beforeParts);
            expect(flattenText('quest-hull-tier')).not.toBe(beforeHull);
        } finally {
            jest.useRealTimers();
        }
    });

    it('the outcome ledger claims and clears the table', () => {
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7 });
            actions.startQuestBoardPlay();
        });
        act(() => {
            rigQuest(store, {
                pos: BUILD_THE_BOAT_BOARD.spaces.length - 1,
                parts: { ...BUILD_THE_BOAT_BOARD.partsRequired },
            });
        });
        fireEvent.press(screen.getByTestId('quest-roll'));
        expect(store.getState().quest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('quest-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('quest-claim'));
        expect(store.getState().quest.session).toBeNull();
    });
});

describe('rest screen', () => {
    it('walks posture → watch card → dawn ledger → claim', () => {
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            actions.beginRest({ seed: 7 });
        });
        expect(screen.getByTestId('rest-postures')).toBeTruthy();
        fireEvent.press(screen.getByTestId('rest-posture-doze'));
        expect(store.getState().rest.session!.phase).toBe('watch');
        expect(screen.getByTestId('rest-card')).toBeTruthy();

        // Drive the night through the UI: tap options/continue as offered.
        for (let i = 0; i < 12 && store.getState().rest.session!.phase === 'watch'; i++) {
            const s = store.getState().rest.session!;
            if (s.pending!.result === null) {
                const enabled = s.pending!.options.filter(o => !o.disabledReason);
                fireEvent.press(screen.getByTestId(`rest-option-${enabled[0].id}`));
            } else {
                fireEvent.press(screen.getByTestId('rest-continue'));
            }
        }
        expect(store.getState().rest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('rest-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('rest-claim'));
        expect(store.getState().rest.session).toBeNull();
    });
});

describe('cache screen', () => {
    function dudSeed(): number {
        for (let seed = 1; seed < 3000; seed++) {
            if (createLootCacheSession(seed, [], 10).layers.every(l => !l.trapped)) return seed;
        }
        throw new Error('no all-dud seed');
    }

    it('walks intro → layers → delve cards → ledger → claim', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: dudSeed() });
        });
        expect(screen.getByTestId('cache-intro')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-begin'));
        expect(screen.getByTestId('cache-layers')).toBeTruthy();
        expect(screen.getByTestId('cache-decisions')).toBeTruthy();

        for (let i = 0; i < 3; i++) {
            fireEvent.press(screen.getByTestId('cache-delve'));
            expect(screen.getByTestId('cache-card')).toBeTruthy();
            fireEvent.press(screen.getByTestId('cache-continue'));
        }
        expect(store.getState().cache.session!.phase).toBe('outcome');
        expect(screen.getByTestId('cache-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-claim'));
        expect(store.getState().cache.session).toBeNull();
    });

    it('hides sealed trap fates until probed', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: 7 });
        });
        fireEvent.press(screen.getByTestId('cache-begin'));
        // All unopened layers read SEALED — no fate leaks.
        const session = store.getState().cache.session!;
        for (const layer of session.layers.slice(1)) {
            if (layer.opened || layer.revealed) continue;
            expect(screen.getByTestId(`cache-layer-${layer.index}`)).toBeTruthy();
        }
        expect(screen.queryByText('TRAP — LIVE')).toBeNull();
        expect(screen.queryByText('TRAP — DEAD')).toBeNull();
    });
});
