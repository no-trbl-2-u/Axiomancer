/**
 * Hardware back button handler for Android.
 *
 * Disables back button during combat per Phase 8 decision A, and during an
 * open rest-choice node (Phase 52d — "no back-out": `resolveMapEvent`
 * consumes the node on entry, before any choice, so a back-out would burn
 * it for nothing).
 */

import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useCombatMode } from '@/state/combat-mode';
import { useGameState } from '@/state/GameStoreProvider';
import { selectHasActiveRest } from '@/state/presenters/rest.engine';

export function HardwareBackHandler() {
  const { inCombat } = useCombatMode();
  const hasActiveRest = useGameState(selectHasActiveRest);
  const locked = inCombat || hasActiveRest;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      // Disable back button during combat, or an open rest-choice node —
      // both are modal and must not be interrupted by hardware back.
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