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
import { BUILD_THE_BOAT_BOARD } from '@mechanics';
import type { QuestBoardSession } from '@mechanics';
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

    /**
     * Cast and take a step. Since the 2026-08-08 two-bone redesign the board
     * no longer moves you on the cast — it puts two bones on the table and
     * waits. `boneIndex` picks which step to take.
     */
    function castAndStep(boneIndex = 0): void {
        fireEvent.press(screen.getByTestId('quest-roll'));
        fireEvent.press(screen.getByTestId(`quest-bone-${boneIndex}`));
    }

    it('the cast offers two steps and moves only once one is taken', () => {
        // The 2026-08-08 redesign's whole surface: before it, pressing CAST
        // moved you. Now it deals a choice, and the choice is a destination —
        // each button names the space it lands on.
        const { store, actions } = mount(<QuestScreen />);
        act(() => {
            actions.beginQuestBoard({ seed: 7 });
            actions.startQuestBoardPlay();
        });
        const before = store.getState().quest.session!.pos;

        fireEvent.press(screen.getByTestId('quest-roll'));
        expect(store.getState().quest.session!.phase).toBe('choosing');
        expect(store.getState().quest.session!.pos).toBe(before);
        expect(screen.getByTestId('quest-bones')).toBeTruthy();
        expect(screen.getByTestId('quest-bone-0')).toBeTruthy();
        expect(screen.getByTestId('quest-bone-1')).toBeTruthy();
        // The cast button is gone while the choice is open.
        expect(screen.queryByTestId('quest-roll')).toBeNull();

        const bones = store.getState().quest.session!.bones!;
        fireEvent.press(screen.getByTestId('quest-bone-1'));
        const after = store.getState().quest.session!;
        expect(after.pos).toBe(bones[1]!.target);
        // The bone left behind banks its pips as wind — the cost side.
        expect(after.wind).toBe(bones[0]!.windIfLeft);
    });

    it('casting the bone tumbles, walks the piece, then opens a space card; continue returns to the die', () => {
        jest.useFakeTimers();
        try {
            const { store, actions } = mount(<QuestScreen />);
            act(() => {
                actions.beginQuestBoard({ seed: 7 });
                actions.startQuestBoardPlay();
            });
            castAndStep();
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
            castAndStep();
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
        castAndStep();
        expect(store.getState().quest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('quest-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('quest-claim'));
        expect(store.getState().quest.session).toBeNull();
    });
});

describe('rest screen (Phase 52d — rest-choice)', () => {
    it('the `rest` offer heals to the outcome ledger, then claim clears the node', () => {
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            actions.beginRest({ seed: 7, shelter: 'camp' });
        });
        expect(screen.getByTestId('rest-choice-offers')).toBeTruthy();

        const before = store.getState().player.health;
        fireEvent.press(screen.getByTestId('rest-choice-offer-rest'));
        expect(store.getState().rest.session!.phase).toBe('outcome');
        expect(screen.getByTestId('rest-outcome')).toBeTruthy();

        fireEvent.press(screen.getByTestId('rest-claim'));
        expect(store.getState().rest.session).toBeNull();
        expect(store.getState().player.health).toBeGreaterThanOrEqual(before);
    });

    it('the `anvil` offer commits to anvil-pick and hands off to the blacksmith slice', () => {
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            store.setState({ player: { ...store.getState().player, currency: 999 } } as never);
            actions.beginRest({ seed: 7, shelter: 'camp' });
        });
        fireEvent.press(screen.getByTestId('rest-choice-offer-anvil'));
        expect(store.getState().rest.session!.phase).toBe('anvil-pick');
        expect(store.getState().blacksmith.session).toBeTruthy();
        expect(store.getState().blacksmith.handoff).toBe('rest-choice');
    });

    it('an unaffordable offer renders disabled with its reason spelled out', () => {
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            store.setState({ player: { ...store.getState().player, currency: 0 } } as never);
            actions.beginRest({ seed: 7, shelter: 'camp' });
        });
        // `rest` is always free — never dead-ended.
        expect(screen.getByTestId('rest-choice-offer-rest').props.accessibilityState.disabled).toBeFalsy();
        expect(screen.getByTestId('rest-choice-offer-anvil').props.accessibilityState.disabled).toBe(true);
        expect(screen.getByTestId('rest-choice-offer-anvil-reason')).toBeTruthy();
        expect(store.getState().rest.session!.offers.find(o => o.id === 'anvil')!.disabledReason)
            .toMatch(/cover/i);
    });

    it('the `cut` offer lists the real deck — duplicates and all — and previews the next price', () => {
        // A fixture deck: 12 uniques (exactly MIN_COMBAT_DECK_SIZE) plus one
        // duplicate, so removal is legal AND a repeated card renders twice.
        const DECK = [
            'spoiled-poultice', 'chilblain-watch', 'petty-indictment', 'first-spadeful',
            'grandmothers-psalter', 'thumbprick-oath', 'thin-hymn', 'threadbare-cope',
            'unction-of-boils', 'the-sextons-bell', 'the-long-lent', 'promissory-cut',
        ];
        const { store, actions } = mount(<RestScreen />);
        act(() => {
            store.setState({
                player: {
                    ...store.getState().player,
                    knownCards: [...DECK],
                    // A reward copy of an already-known card — the ONLY list
                    // whose duplicates reach `buildCombatDeck`'s output
                    // (the card-base list is de-duplicated before dealing).
                    combatRewardCards: ['spoiled-poultice'],
                    currency: 200,
                    cardRemovals: 0,
                },
                flags: [],
            } as never);
            actions.beginRest({ seed: 7, shelter: 'camp' });
        });
        fireEvent.press(screen.getByTestId('rest-choice-offer-cut'));
        expect(store.getState().rest.session!.phase).toBe('cut-pick');
        expect(screen.getByTestId('rest-cut-sheet')).toBeTruthy();
        expect(screen.getAllByTestId('rest-cut-card-spoiled-poultice:0')).toHaveLength(1);
        expect(screen.getAllByTestId('rest-cut-card-spoiled-poultice:12')).toHaveLength(1);
        expect(screen.getByTestId('rest-cut-price').props.children.join('')).toMatch(/15.*25/);

        fireEvent.press(screen.getByTestId('rest-cut-card-thin-hymn:6'));
        expect(store.getState().rest.session!.phase).toBe('outcome');
        const outcome = store.getState().rest.session!.outcome!;
        expect(outcome.chosen).toBe('cut');
        expect(outcome.removedCardId).toBe('thin-hymn');

        fireEvent.press(screen.getByTestId('rest-claim'));
        expect(store.getState().rest.session).toBeNull();
        expect(store.getState().player.cardRemovals).toBe(1);
    });
});

describe('cache screen (pick pool)', () => {
    it('walks intro → layers → delve → picking → push to resolution → ledger → claim', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: 7 });
        });
        expect(screen.getByTestId('cache-intro')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-begin'));
        expect(screen.getByTestId('cache-layers')).toBeTruthy();
        expect(screen.getByTestId('cache-decisions')).toBeTruthy();

        let guard = 0;
        while (store.getState().cache.session!.phase === 'delving'
            && store.getState().cache.session!.depth < 3 && guard++ < 10) {
            fireEvent.press(screen.getByTestId('cache-delve'));
            expect(screen.getByTestId('cache-dice-tray')).toBeTruthy();

            let pushGuard = 0;
            while (store.getState().cache.session!.phase === 'picking' && pushGuard++ < 50) {
                fireEvent.press(screen.getByTestId('cache-push'));
            }
            expect(screen.getByTestId('cache-card')).toBeTruthy();
            fireEvent.press(screen.getByTestId('cache-continue'));
        }
        if (store.getState().cache.session!.phase === 'delving') {
            fireEvent.press(screen.getByTestId('cache-seal'));
        }
        expect(store.getState().cache.session!.phase).toBe('outcome');
        expect(screen.getByTestId('cache-outcome')).toBeTruthy();
        fireEvent.press(screen.getByTestId('cache-claim'));
        expect(store.getState().cache.session).toBeNull();
    });

    it('difficulty is public from the start — every unopened layer shows its target openly', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: 7 });
        });
        fireEvent.press(screen.getByTestId('cache-begin'));
        const session = store.getState().cache.session!;
        for (const layer of session.layers) {
            expect(screen.getByTestId(`cache-layer-${layer.index}`)).toBeTruthy();
            expect(screen.getByTestId(`cache-layer-${layer.index}-difficulty`)).toBeTruthy();
        }
    });

    it('retreat exits the pick attempt without opening the layer or biting vitae', () => {
        const { store, actions } = mount(<CacheScreen />);
        act(() => {
            actions.beginLootCache({ currency: 10, seed: 7 });
        });
        fireEvent.press(screen.getByTestId('cache-begin'));
        fireEvent.press(screen.getByTestId('cache-delve'));
        expect(store.getState().cache.session!.phase).toBe('picking');

        fireEvent.press(screen.getByTestId('cache-retreat'));
        expect(store.getState().cache.session!.phase).not.toBe('picking');
    });
});
