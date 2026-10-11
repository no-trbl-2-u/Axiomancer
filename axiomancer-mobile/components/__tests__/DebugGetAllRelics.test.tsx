/**
 * Hermetic component tests — DebugGetAllRelics.
 *
 * Pins the DEV gate and the action: one press adds every relic in the
 * library the player does not own (none twice), displaces nothing, and a
 * relic landing in a free trinket position is worn for real (its +max VITAE
 * and its signature reach the loadout).
 */

import { describe, expect, it } from '@jest/globals';
import { fireEvent, render } from '@testing-library/react-native';
import { grantFirstNodeRelic, initializeCombatEncounter, isEquipment, relicLibrary } from '@mechanics';
import React from 'react';

import { DebugGetAllRelics } from '@/components/DebugGetAllRelics';
import { buildCombatViewModel } from '@/state/presenters/combat-encounter.engine';
import { createMockEncounterEnemy } from '@/state/mocks/combat.mock';
import { selectInventoryViewModel } from '@/state/presenters/inventory.engine';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

function makeStore(): AppStore {
    return createAppStore({ adapter: createMemoryAdapter() });
}

function withProvider(store: AppStore, child: React.ReactNode) {
    return <GameStoreProvider store={store}>{child}</GameStoreProvider>;
}

const relicIds = (store: AppStore): string[] =>
    store.getState().player.inventory.filter(isEquipment).map((i) => i.id);

describe('DebugGetAllRelics', () => {
    it('renders the button in dev and nothing when __DEV__ is false', () => {
        expect(render(withProvider(makeStore(), <DebugGetAllRelics />)).queryByTestId('debug-get-all-relics')).not.toBeNull();
        const g = global as { __DEV__?: boolean };
        const original = g.__DEV__;
        g.__DEV__ = false;
        try {
            expect(render(withProvider(makeStore(), <DebugGetAllRelics />)).queryByTestId('debug-get-all-relics')).toBeNull();
        } finally {
            g.__DEV__ = original;
        }
    });

    it('adds every relic once, skipping ones already owned, and a second press adds nothing', () => {
        const store = makeStore();
        const owned = new Set(relicIds(store));
        const tree = render(withProvider(store, <DebugGetAllRelics />));
        fireEvent.press(tree.getByTestId('debug-get-all-relics'));
        const after = relicIds(store);
        for (const r of relicLibrary) expect(after.filter((id) => id === r.id)).toHaveLength(1);
        expect(after.length).toBe(new Set([...owned, ...relicLibrary.map((r) => r.id)]).size);
        fireEvent.press(tree.getByTestId('debug-get-all-relics'));
        expect(relicIds(store)).toEqual(after);
        expect(tree.getByTestId('debug-relics-sub').props.children).toBe('every relic is already owned');
    });

    it('a relic in a free trinket position is worn for real: the Bleeding Signet adds 20 max VITAE and Crimson Covenant', () => {
        const store = makeStore();
        const before = store.getState().player;
        const tree = render(withProvider(store, <DebugGetAllRelics />));
        fireEvent.press(tree.getByTestId('debug-get-all-relics'));
        const player = store.getState().player;
        expect(player.equipment.accessories.map((a) => a.id)).toContain('relic-bleeding-signet');
        expect(player.maxHealth).toBe(before.maxHealth + 20);
        // The dock shows it in a trinket slot beside the Ring.
        const dock = selectInventoryViewModel(store.getState()).equipmentDock.slots
            .filter((sl) => sl.key === 'accessory').map((sl) => sl.item?.id ?? null);
        expect(dock).toContain('relic-bleeding-signet');
        // The signature bar lists every signature the worn signets grant, and both cast.
        const fight = initializeCombatEncounter(player, createMockEncounterEnemy(), ['grey-strike'], 1);
        const bar = buildCombatViewModel({ ...fight, conviction: 8 }).signatures;
        expect(bar.map((sig) => sig.name)).toEqual(
            player.equipment.accessories.map((a) => a.grantsSignature === 'sig-disarming-plea' ? 'The Open Hand' : 'Crimson Covenant'),
        );
        expect(bar.find((sig) => sig.name === 'Crimson Covenant')?.affordable).toBe(true);
    });

    it('beside the Suppliant\'s Ring: two trinket slots worn, both signatures on the bar', () => {
        const store = makeStore();
        const granted = grantFirstNodeRelic(store.getState().player, []);
        store.setState({ player: granted.character });
        const tree = render(withProvider(store, <DebugGetAllRelics />));
        fireEvent.press(tree.getByTestId('debug-get-all-relics'));
        const player = store.getState().player;
        expect(player.equipment.accessories.map((a) => a.id)).toEqual(['relic-disarming-plea', 'relic-bleeding-signet']);
        const fight = initializeCombatEncounter(player, createMockEncounterEnemy(), ['grey-strike'], 1);
        expect(buildCombatViewModel(fight).signatures.map((sig) => sig.name)).toEqual(['The Open Hand', 'Crimson Covenant']);
    });
});
