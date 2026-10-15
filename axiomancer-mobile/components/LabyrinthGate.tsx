import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from '@/lib/platform/router';

import { useGameState } from '@/state/GameStoreProvider';

/**
 * Pushes the user into the full-screen `/labyrinth` route whenever a visit
 * to THE APORIA opens: the Lantern Deep's vault door,
 * the dev menu, or a save loaded mid-visit. Mirrors `<CacheGate>`, a
 * side-effect-only component mounted once in the root layout. It does not
 * push when the player is already on the route (the act-select screen
 * opens its visit in place), and an act descent keeps the session open, so
 * it does not push again.
 *
 * It pushes at most once per visit. `useRouter()` returns a fresh object
 * every render, so an effect keyed on it re-runs on any re-render; without
 * the latch, a route pushed over the labyrinth mid-visit (the
 * `/combat-encounter` fight) moved the pathname off `/labyrinth` and this
 * gate pushed `/labyrinth` straight back on top of it.
 */
export function LabyrinthGate() {
    const hasSession = useGameState((s) => s.labyrinthUi?.session != null);
    const pathname = usePathname();
    const router = useRouter();
    const onRoute = pathname.startsWith('/labyrinth');
    const handledVisit = useRef(false);

    useEffect(() => {
        if (!hasSession) {
            handledVisit.current = false;
            return;
        }
        if (handledVisit.current) return;
        handledVisit.current = true;
        if (!onRoute) router.push('/labyrinth' as never);
        // `onRoute` is read, not watched: leaving the route while the visit
        // is still open (the LEAVE button clears the session first) must
        // not bounce the player back in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasSession, router]);

    return null;
}
