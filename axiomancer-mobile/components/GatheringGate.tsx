import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveGathering } from '@/state/presenters/gathering.engine';

/**
 * Pushes the user into the full-screen `/gathering` route whenever a
 * gleaning session starts (gathering map event resolved, or the dev
 * entry fired). Mirrors `<HazardGate>` — a side-effect-only component
 * mounted once in the root layout.
 */
export function GatheringGate() {
    const hasGathering = useGameState(selectHasActiveGathering);
    const router = useRouter();

    useEffect(() => {
        if (hasGathering) router.push('/gathering' as never);
    }, [hasGathering, router]);

    return null;
}
