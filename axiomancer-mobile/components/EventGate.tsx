import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { useGameState } from '@/state/GameStoreProvider';
import { selectPacedEventRoute } from '@/state/presenters/event.engine';

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
 */
export function EventGate() {
  const route = useGameState(selectPacedEventRoute);
  const router = useRouter();

  useEffect(() => {
    if (route !== null) router.push(route as never);
  }, [route, router]);

  return null;
}
