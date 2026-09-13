import { useEffect, useRef } from 'react';
import { useRouter } from '@/lib/platform/router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectPacedEventRoute, type PacedEventRoute } from '@/state/presenters/event.engine';

/**
 * Pushes the user into the matching full-screen route whenever the
 * engine reports an active **paced** event (narrative-choice kind):
 * `/dialogue` for interactions, `/village` for settlements,
 * `/cutscene` for omens, `/event` for everything else (Phase 137).
 * Combat-adjacent events (combat-prelude) render in-place over the
 * exploration map via `<EncounterModalOverlay>` and stay out of the
 * router — see chat 2 §VI "two event shells (combat-adjacent vs
 * paced)" + Phase 40 audit (2026-05-19) for the split rationale.
 * Rendered as a side-effect-only component so the gate runs anywhere
 * inside the navigation tree.
 *
 * S4-world-C03: the push is latched to the route it already opened.
 * `useRouter()` (lib/platform/router.ts) builds a FRESH object literal
 * on every call, so `router` changes identity on every render and the
 * `[route, router]` effect re-ran — and re-pushed — each time the root
 * layout re-rendered with an event still pending. The opening omen
 * stacked twice on the deep-linked screen, and dismissing it once left
 * the player on a second, eventless copy instead of where they asked to
 * go. The latch clears when the event resolves (route back to `null`),
 * so the next event still routes.
 */
export function EventGate() {
  const route = useGameState(selectPacedEventRoute);
  const router = useRouter();
  const pushedRoute = useRef<PacedEventRoute | null>(null);

  useEffect(() => {
    if (route === null) {
      pushedRoute.current = null;
      return;
    }
    if (pushedRoute.current === route) return;
    pushedRoute.current = route;
    router.push(route as never);
  }, [route, router]);

  return null;
}
