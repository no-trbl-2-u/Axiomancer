/**
 * RC walk item 10 — the cache and the Anvil stand on their map's plate.
 *
 * Both screens used to draw Ludgate Hill, a London street, in every region,
 * so a cache in the Charcoal Wood opened over a city skyline. Each now takes
 * the plate of the map it was opened from (`mapBackdropFor`); Ludgate Hill
 * stays only for a screen opened off any mapped region.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import BlacksmithScreen from '@/app/blacksmith/index';
import CacheScreen from '@/app/cache/index';
import { ACT1_PLATES } from '@/assets/images/maps';
import { screenBackdropFor } from '@/assets/images/screens';
import { ScreenBg } from '@/components/ScreenBg';
import { createAppActions } from '@/state/actions';
import { ALL_MAP_LAYOUTS, mapBackdropFor } from '@/state/exploration-maps';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Both screens pop the route the moment their slice empties.
jest.mock('@/lib/platform/router', () => ({
    useRouter: () => ({
        replace: jest.fn(),
        push: jest.fn(),
        back: jest.fn(),
        canGoBack: () => true,
    }),
}));

/** A store standing on `mapName`, or on no map at all. */
function storeOn(mapName: string | null): AppStore {
    const s = createAppStore({ adapter: createMemoryAdapter() });
    s.setState({ world: (mapName ? { currentMap: { name: mapName } } : null) as never });
    return s;
}

/** The platform `Image` passes `source` on as a one-entry array. */
function sourceOf(node: { props: { source: unknown } }): unknown {
    const src = node.props.source;
    return Array.isArray(src) ? src[0] : src;
}

/** The asset module id as jest's asset transform renders it. */
function asset(id: number | null): unknown {
    return sourceOf(render(<ScreenBg regionPlate={id}><Text>x</Text></ScreenBg>).getByTestId('screen-backdrop'));
}

function backdropOf(s: AppStore, child: React.ReactNode): unknown {
    const tree = render(<GameStoreProvider store={s}>{child}</GameStoreProvider>);
    return sourceOf(tree.getByTestId('screen-backdrop'));
}

describe('mapBackdropFor', () => {
    it.each([
        ['breakwater', ACT1_PLATES.coast],
        ['charcoal-wood', ACT1_PLATES.forest],
        ['beacon-crags', ACT1_PLATES.mountains],
        ['lantern-deep', ACT1_PLATES.underworld],
    ])('%s resolves to its own plate', (mapId, plate) => {
        expect(mapBackdropFor(mapId)).toBe(plate);
    });

    it('covers every shipped map', () => {
        expect(ALL_MAP_LAYOUTS).toHaveLength(4);
    });

    it('is null for no map or an unmapped one', () => {
        expect(mapBackdropFor(undefined)).toBeNull();
        expect(mapBackdropFor('')).toBeNull();
        expect(mapBackdropFor('nowhere')).toBeNull();
    });
});

describe('ScreenBg regionPlate', () => {
    it('wins over the art key', () => {
        const tree = render(
            <ScreenBg art="cache" regionPlate={ACT1_PLATES.forest}><Text>x</Text></ScreenBg>,
        );
        expect(sourceOf(tree.getByTestId('screen-backdrop'))).toEqual(asset(ACT1_PLATES.forest));
    });

    it('falls back to the art key when null', () => {
        const tree = render(<ScreenBg art="cache" regionPlate={null}><Text>x</Text></ScreenBg>);
        expect(sourceOf(tree.getByTestId('screen-backdrop'))).toEqual(asset(screenBackdropFor('cache')));
        expect(asset(screenBackdropFor('cache'))).not.toEqual(asset(ACT1_PLATES.forest));
    });
});

describe('the cache and the Anvil take the current map plate', () => {
    it('the Anvil in the Charcoal Wood stands on the forest plate', () => {
        const s = storeOn('charcoal-wood');
        createAppActions(s).beginBlacksmith();
        expect(backdropOf(s, <BlacksmithScreen />)).toEqual(asset(ACT1_PLATES.forest));
    });

    it('the cache in the Charcoal Wood stands on the forest plate', () => {
        expect(backdropOf(storeOn('charcoal-wood'), <CacheScreen />)).toEqual(asset(ACT1_PLATES.forest));
    });

    it('off any map, both keep their fallback plate', () => {
        const s = storeOn(null);
        createAppActions(s).beginBlacksmith();
        expect(backdropOf(s, <BlacksmithScreen />)).toEqual(asset(screenBackdropFor('blacksmith')));
        expect(backdropOf(storeOn(null), <CacheScreen />)).toEqual(asset(screenBackdropFor('cache')));
    });
});
