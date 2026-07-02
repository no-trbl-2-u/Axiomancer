/**
 * Hardware back button handler for Android.
 * 
 * Disables back button during combat per Phase 8 decision A.
 * Combat is modal and should not be interrupted by hardware back.
 */

import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useCombatMode } from '@/state/combat-mode';

export function HardwareBackHandler() {
  const { inCombat } = useCombatMode();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      // Disable back button during combat - combat is modal
      if (inCombat) {
        return true; // Prevent default behavior
      }
      return false; // Allow default behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [inCombat]);

  return null; // This component doesn't render anything
}