/**
 * Hardware back button handler for Android.
 *
 * Disables back button during combat per Phase 8 decision A, and during an
 * open rest-choice node (Phase 52d — "no back-out": `resolveMapEvent`
 * consumes the node on entry, before any choice, so a back-out would burn
 * it for nothing).
 *
 * Audit 2026-09-12: also locked while a **paced** event is pending
 * (`/cutscene`, `/dialogue`, `/village`, `/event`). `EventGate` pushes each
 * paced route exactly once (S4-world-C03 latch) and only re-arms when the
 * event resolves, so a hardware back that popped the modal left the event
 * pending with no screen showing it — the player parked on the tabs, the
 * gate silent. Same doctrine as the rest node: the node is already consumed,
 * there is nothing to back out to.
 */

import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useCombatMode } from '@/state/combat-mode';
import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActivePacedEvent } from '@/state/presenters/event.engine';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';

export function HardwareBackHandler() {
  const { inCombat } = useCombatMode();
  const hasActiveRest = useGameState(selectHasActiveRest);
  const hasPacedEvent = useGameState(selectHasActivePacedEvent);
  const locked = inCombat || hasActiveRest || hasPacedEvent;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      // Disable back button during combat, an open rest-choice node, or a
      // pending paced event — all three are modal and must not be
      // interrupted by hardware back.
      if (locked) {
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [locked]);

  return null; // This component doesn't render anything
}