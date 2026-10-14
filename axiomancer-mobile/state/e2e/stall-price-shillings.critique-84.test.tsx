/**
 * Hermetic tests: a stall prices in SHILLINGS, as the purse does (critique
 * pass 84).
 *
 * The purse read "240 SHILLINGS" and the rest screen priced THE CUT at
 * "5 SHILLINGS", but each stall row printed "12s". The bare "s" was the one
 * place the currency was abbreviated, met before any key to it.
 *
 * Contract asserted here: the buy and sell rows print the price with the same
 * unit word the purse header uses.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { consumableLibrary } from '@mechanics';

import VillageScreen from '@/app/village/index';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, EMPTY_EVENT_SLICE, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Hoisted above the imports by babel-plugin-jest-hoist: this screen pops the
// route the moment its slice empties, so the router must be stubbed.
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => true,
    }),
}));

const WARE = consumableLibrary[0]!;

/** A village with one stall selling `WARE` for 12, and one `WARE` in the satchel to sell. */
function villageStore(): AppStore {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    const state = store.getState();
    store.setState({
        player: {
            ...state.player,
            currency: 240,
            inventory: [{ ...WARE, quantity: 1 }],
        } as never,
        event: {
            ...EMPTY_EVENT_SLICE,
            pending: {
                state: undefined as never,
                event: {
                    kind: 'village',
                    villageName: 'Saltmarsh',
                    merchants: [],
                    shop: { wares: [{ itemId: WARE.id, price: 12 }] },
                } as never,
            },
        },
    });
    return store;
}

function flatText(children: unknown): string {
    return Array.isArray(children) ? children.join('') : String(children);
}

describe('stall prices name the currency (critique pass 84)', () => {
    it('the purse, a buy row and a sell row all say SHILLINGS', () => {
        const r = render(
            <GameStoreProvider store={villageStore()}>
                <VillageScreen />
            </GameStoreProvider>,
        );

        expect(flatText(r.getByTestId('village-purse').props.children)).toBe('240 SHILLINGS');
        expect(flatText(r.getByTestId(`village-ware-${WARE.id}-price`).props.children)).toBe('12 SHILLINGS');

        fireEvent.press(r.getByTestId('village-tab-sell'));
        const sell = flatText(r.getByTestId('village-sell-0-price').props.children);
        expect(sell).toMatch(/^\d+ SHILLINGS$/);
    });
});
