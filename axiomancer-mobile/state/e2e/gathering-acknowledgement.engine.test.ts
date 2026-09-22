/**
 * Hermetic E2E — the gathering node's acknowledgement (owner finding 2,
 * 2026-09-21: "the Gather node is now a no-op").
 *
 * WHAT WAS ACTUALLY WRONG. The grant was never missing. `resolveGathering`
 * appends the payload items to `player.inventory` and `resolve-map-event`
 * advances any matching `collect` objective, and all twelve authored
 * gathering nodes roll a real, named item (pinned engine-side in
 * `axiomancer-mechanics/src/World/MapEvents/e2e/gathering-grant.engine.test.ts`).
 * What was missing was the RECEIPT. Phase 76 retired "The Gleaning" and
 * replaced its screen with `pushToast('Gathered …')`; Phase 137 then filed
 * `gathering` as a dead-end kind in the event presenter. That left three
 * seconds of 10pt mono at `bottom: 80`, drawn by a `<ToastHost>` that
 * `app/_layout.tsx` declares BEFORE `<Stack>` with no `zIndex` — under an
 * opaque `<ScreenBg>`. So the node went dark and said nothing.
 *
 * The fix routes `gathering` to the same paced `/event` card that
 * `interaction` / `village` / `cutscene` already use. No session, no RNG,
 * no new route: the Gleaning stays retired (see
 * `Game/e2e/gathering-retirement-migration.engine.test.ts`); only the
 * receipt came back.
 *
 * This file pins the player-visible contract:
 *   - resolving a gather node leaves the item in the inventory;
 *   - it opens a persistent card the player must answer, not a toast;
 *   - the card NAMES what was gathered;
 *   - answering it clears the card and keeps the item;
 *   - the grant is checkpointed, so a reload keeps it too.
 */

import { describe, expect, it } from '@jest/globals';
import {
    createMapState,
    getMapDefinition,
    getNodePrimaryEventKind,
    type GameState,
    type MapEventKind,
} from '@mechanics';

import { createAppActions } from '@/state/actions';
import { createAppStore, type AppStore } from '@/state/store';
import { createMemoryAdapter, type MemoryAdapter } from '@/test-utils/memoryAdapter';
import {
    selectEventViewModel,
    selectHasActiveEvent,
    selectPacedEventRoute,
} from '@/state/presenters/event.engine';

type CoastalMap = 'fishing-village' | 'northern-forest';

/**
 * fv-5 and nf-2 are single-entry gathering pools, so no RNG pinning is
 * needed here. (`cap-5` is the one weighted gathering node — it carries the
 * Ribbon-Picker on a lighter entry — and is covered engine-side instead.)
 */
const FV_GATHER = 'fv-5';
const FV_GATHER_ITEM = 'Driftwood';

function makeHarness(adapter: MemoryAdapter = createMemoryAdapter()) {
    const store = createAppStore({ adapter });
    return { store, actions: createAppActions(store), adapter };
}

/** Seat the player on `nodeId` of `mapName`, mirroring a reachable tap. */
function seatAt(store: AppStore, mapName: CoastalMap, nodeId: string) {
    const base = store.getState() as unknown as GameState;
    const map = createMapState(getMapDefinition('coastal-continent', mapName));
    store.setState({
        world: { ...base.world, currentMap: { ...map, currentNode: nodeId } },
    } as never);
}

/** First node resolving to a given engine event kind (the engine owns kind). */
function firstNodeOfKind(mapName: CoastalMap, kind: MapEventKind): string {
    const def = getMapDefinition('coastal-continent', mapName);
    const node = def.nodes.find(
        (n) => getNodePrimaryEventKind('coastal-continent', mapName, n.id) === kind,
    );
    if (!node) throw new Error(`no ${kind} node in ${mapName}`);
    return node.id;
}

function inventoryNames(store: AppStore): string[] {
    return (store.getState().player.inventory as ReadonlyArray<{ name: string }>).map(
        (i) => i.name,
    );
}

describe('gathering node — the grant is real', () => {
    it('puts the named item in the inventory', () => {
        const { store, actions } = makeHarness();
        seatAt(store, 'fishing-village', FV_GATHER);
        expect(inventoryNames(store)).not.toContain(FV_GATHER_ITEM);

        expect(actions.resolveCurrentMapEvent('gather')).toBe(true);

        expect(inventoryNames(store)).toContain(FV_GATHER_ITEM);
    });

    it('checkpoints the grant, so a reload still carries the item', () => {
        const adapter = createMemoryAdapter();
        const { store, actions } = makeHarness(adapter);
        seatAt(store, 'fishing-village', FV_GATHER);
        const savesBefore = adapter.saveCount;

        actions.resolveCurrentMapEvent('gather');

        expect(adapter.saveCount).toBeGreaterThan(savesBefore);

        // A fresh boot off the same adapter is what an app relaunch does.
        const reloaded = createAppStore({ adapter });
        expect(inventoryNames(reloaded)).toContain(FV_GATHER_ITEM);
    });
});

describe('gathering node — the acknowledgement the player can read', () => {
    it('opens a paced /event card instead of firing a toast', () => {
        const { store, actions } = makeHarness();
        seatAt(store, 'fishing-village', FV_GATHER);

        actions.resolveCurrentMapEvent('gather');
        const state = store.getState();

        expect(selectHasActiveEvent(state)).toBe(true);
        expect(selectPacedEventRoute(state)).toBe('/event');
        // The toast was the old, unreadable acknowledgement. It must not fire
        // as well — one receipt, and it is the card.
        expect(state.notifications?.toast?.text ?? null).toBeNull();
    });

    it('names what was gathered on the card, and only offers to continue', () => {
        const { store, actions } = makeHarness();
        seatAt(store, 'fishing-village', FV_GATHER);

        actions.resolveCurrentMapEvent('gather');
        const vm = selectEventViewModel(store.getState());

        expect(vm.kind).toBe('narrative-choice');
        expect(vm.variant).toBe('gather');
        expect(vm.badge).toBe('A GATHERING');
        expect(vm.title).toBe(FV_GATHER_ITEM.toUpperCase());
        expect(vm.subtitle).toBe('into the satchel');
        // The authored node prose still carries the scene.
        expect(vm.body.length).toBeGreaterThan(0);

        expect(vm.choices).toHaveLength(1);
        const choice = vm.choices[0]!;
        expect(choice.id).toBe('acknowledge');
        expect(choice.enabled).toBe(true);
        // The item is already the player's by the time this card exists, so
        // the chip is a receipt, not an offer.
        expect(choice.consequences).toEqual([{ kind: 'item', label: FV_GATHER_ITEM }]);
    });

    it('answering the card clears it and keeps the item', () => {
        const { store, actions } = makeHarness();
        seatAt(store, 'fishing-village', FV_GATHER);
        actions.resolveCurrentMapEvent('gather');

        actions.pickEventChoice('acknowledge');

        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(selectPacedEventRoute(store.getState())).toBeNull();
        expect(inventoryNames(store)).toContain(FV_GATHER_ITEM);
    });

    it('dismissing the card outright still keeps the item', () => {
        const { store, actions } = makeHarness();
        seatAt(store, 'fishing-village', FV_GATHER);
        actions.resolveCurrentMapEvent('gather');

        actions.dismissEvent();

        expect(selectHasActiveEvent(store.getState())).toBe(false);
        expect(inventoryNames(store)).toContain(FV_GATHER_ITEM);
    });

    it('works the same on the forest gather node (not a one-map fix)', () => {
        const { store, actions } = makeHarness();
        const nodeId = firstNodeOfKind('northern-forest', 'gathering');
        seatAt(store, 'northern-forest', nodeId);
        const before = inventoryNames(store).length;

        actions.resolveCurrentMapEvent('gather');
        const vm = selectEventViewModel(store.getState());

        expect(selectPacedEventRoute(store.getState())).toBe('/event');
        expect(vm.badge).toBe('A GATHERING');
        expect(vm.title.length).toBeGreaterThan(0);
        expect(vm.title).not.toBe('NOTHING WORTH TAKING');
        expect(inventoryNames(store).length).toBe(before + 1);
        // The card's title is the thing that actually landed in the satchel.
        // `toContain`, not `toBe`, because a stacked payload appends its size
        // ("DARK BERRIES X2") — the name still has to be on the card.
        expect(vm.title).toContain(inventoryNames(store)[before]!.toUpperCase());
    });
});
