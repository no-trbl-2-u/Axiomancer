/**
 * Reduced motion — one hook every animated surface asks.
 *
 * Skip all transitions when reduced motion is on. The answer is the OS
 * switch (react-native-reanimated's `useReducedMotion`) OVERRIDDEN by the
 * SETTINGS choice:
 *
 *   - `system` → the OS accessibility switch decides;
 *   - `on`     → always reduced, whatever the OS says;
 *   - `off`    → never reduced, whatever the OS says.
 *
 * Pure over its two inputs; both are subscriptions, so a change on the
 * SETTINGS screen re-renders every consumer.
 */
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

import { useSetting } from '@/state/settings';

/** Resolve the OS switch against the player's preference. Pure. */
export function resolveReducedMotion(systemReduced: boolean, preference: 'system' | 'on' | 'off'): boolean {
    if (preference === 'on') return true;
    if (preference === 'off') return false;
    return systemReduced;
}

export function useReducedMotion(): boolean {
    const system = useReanimatedReducedMotion();
    const preference = useSetting('reducedMotion');
    return resolveReducedMotion(system, preference);
}
