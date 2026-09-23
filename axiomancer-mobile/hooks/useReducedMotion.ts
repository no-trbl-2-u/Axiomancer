/**
 * Reduced motion — one hook every animated surface asks.
 *
 * Per Phase 10: skip all transitions when reduced motion is on. Since
 * 2026-09-23 the answer is the OS switch (react-native-reanimated's
 * `useReducedMotion`) OVERRIDDEN by the SETTINGS choice:
 *
 *   - `system` → the OS accessibility switch decides (the old behaviour);
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
