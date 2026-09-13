/**
 * Hermetic screen test — the village merchant card is flavour, not a dead
 * control (cluster S5-talk-C11).
 *
 * A named merchant under VOICES OF THE PLACE is an inert `View` by design —
 * there is nothing to open. It was drawn as a full ash-bordered panel on
 * `panelBg`, which is this app's DISABLED grammar (`offerDisabled` on /rest
 * and /blacksmith; the greyed tab of FE-028), so a first-time player read it
 * as a locked button and pressed it to no effect.
 *
 * Contract asserted here: the card carries NONE of the disabled box
 * treatment (no full border, no ash border colour, no panel fill) and
 * instead carries the screen's flavour rule — a sulfur bar down the left.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import VillageScreen from '@/app/village/index';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';
import { AXM } from '@/theme/axm';

// Hoisted above the imports by babel-plugin-jest-hoist: these screens pop the
// route the moment their slice empties, so the router must be stubbed.
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => true,
    }),
}));

const MERCHANT = 'Old Marrow';

/** A store seated on a village event carrying one speaking merchant. */
function makeStore(): AppStore {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    store.setState({
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: {
                state: undefined as never,
                event: {
                    kind: 'village',
                    villageName: 'Saltmarsh',
                    merchants: [
                        {
                            name: MERCHANT,
                            dialogueTree: {
                                rootId: 'root',
                                nodes: {
                                    root: { id: 'root', text: 'Tide took the good stock.', choices: [] },
                                },
                            },
                        },
                    ],
                } as never,
            },
        },
    });
    return store;
}

function merchantCardStyle() {
    const store = makeStore();
    const r = render(
        <GameStoreProvider store={store}>
            <VillageScreen />
        </GameStoreProvider>,
    );
    return StyleSheet.flatten(
        r.getByTestId(`village-merchant-${MERCHANT}`).props.style,
    ) as Record<string, unknown>;
}

describe('village merchant card reads as flavour (S5-talk-C11)', () => {
    it('wears none of the disabled-box treatment', () => {
        const style = merchantCardStyle();

        expect(style.borderWidth ?? 0).toBe(0);
        expect(style.borderColor).toBeUndefined();
        expect(style.backgroundColor).toBeUndefined();
    });

    it('carries the flavour rule instead', () => {
        const style = merchantCardStyle();

        expect(style.borderLeftWidth as number).toBeGreaterThan(0);
        expect(style.borderLeftColor).toBe(AXM.sulfur);
        expect(style.borderLeftColor).not.toBe(AXM.ash);
    });
});
