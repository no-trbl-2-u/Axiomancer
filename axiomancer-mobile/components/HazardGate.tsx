import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveHazard } from '@/state/presenters/hazard.engine';

/**
 * Pushes the user into the full-screen `/hazard` route whenever a
 * hazard minigame session starts (hazard map event resolved, or the
 * dev entry fired). Mirrors `<EventGate>` — a side-effect-only
 * component mounted once in the root layout.
 */
export function HazardGate() {
    const hasHazard = useGameState(selectHasActiveHazard);
    const router = useRouter();
    const navigationAttempted = useRef(false);

    useEffect(() => {
        if (hasHazard && !navigationAttempted.current) {
            navigationAttempted.current = true;
            // Use setTimeout to ensure navigation happens after any current render cycle
            const timeoutId = setTimeout(() => {
                try {
                    router.push('/hazard' as never);
                } catch (error) {
                    console.warn('HazardGate navigation failed:', error);
                    // Reset flag to allow retry on next render
                    navigationAttempted.current = false;
                }
            }, 0);
            return () => clearTimeout(timeoutId);
        } else if (!hasHazard) {
            // Reset flag when hazard session ends
            navigationAttempted.current = false;
        }
    }, [hasHazard, router]);

    return null;
}
