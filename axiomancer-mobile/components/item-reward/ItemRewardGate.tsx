import { useEffect } from 'react';
import { useRouter } from '@/lib/platform/router';

import { useGameState, useGameStore } from '@/state/GameStoreProvider';
import { offerFirstNodeRelicAction } from '@/state/item-reward/store-actions';
import {
    selectFirstNodeRelicMoment,
    selectHasPendingItemReward,
} from '@/state/presenters/item-reward.engine';

/**
 * Pushes the player into the full-screen `/item-reward` route whenever an item
 * is waiting on their CONFIRM / EQUIP. Mirrors `<CacheGate>` / `<HazardGate>` —
 * a side-effect-only component mounted once in the root layout.
 *
 * It also ARMS the first-node Suppliant's Ring hand-over. W1 put the grant in
 * the engine (`Character/first-node-grant.ts`) and deliberately left the
 * ceremony to "clients with a screen to show it on"; mobile resolves nodes by
 * calling `resolveMapEvent` directly rather than dispatching `PROCESS_NODE`, so
 * nothing on this platform settles the grant until the first fight floors it.
 * Watching for the quiet moment here gives the ring its screen without reaching
 * into `state/actions.ts` (W2's file). The permanent home for this trigger is
 * `resolveCurrentMapEventAction`, right where the other node kinds branch —
 * see the hand-back's cross-worker request.
 */
export function ItemRewardGate() {
    const store = useGameStore();
    const hasPending = useGameState(selectHasPendingItemReward);
    const firstNodeMoment = useGameState(selectFirstNodeRelicMoment);
    const router = useRouter();

    useEffect(() => {
        if (firstNodeMoment) offerFirstNodeRelicAction(store);
    }, [firstNodeMoment, store]);

    useEffect(() => {
        if (hasPending) router.push('/item-reward' as never);
    }, [hasPending, router]);

    return null;
}
