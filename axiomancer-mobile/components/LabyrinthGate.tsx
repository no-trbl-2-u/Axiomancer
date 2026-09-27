import { useEffect } from 'react';
import { usePathname, useRouter } from '@/lib/platform/router';

import { useGameState } from '@/state/GameStoreProvider';

/**
 * Pushes the user into the full-screen `/labyrinth` route whenever a visit
 * to THE APORIA opens: the Lantern Deep's vault door (map revamp M4, D24),
 * the dev menu, or a save loaded mid-visit. Mirrors `<CacheGate>`, a
 * side-effect-only component mounted once in the root layout. It does not
 * push when the player is already on the route (the act-select screen
 * opens its visit in place), and an act descent keeps the session open, so
 * it does not push again.
 */
export function LabyrinthGate() {
    const hasSession = useGameState((s) => s.labyrinthUi?.session != null);
    const pathname = usePathname();
    const router = useRouter();
    const onRoute = pathname.startsWith('/labyrinth');

    useEffect(() => {
        if (hasSession && !onRoute) router.push('/labyrinth' as never);
        // `onRoute` is read, not watched: leaving the route while the visit
        // is still open (the LEAVE button clears the session first) must
        // not bounce the player back in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSession, router]);

    return null;
}
