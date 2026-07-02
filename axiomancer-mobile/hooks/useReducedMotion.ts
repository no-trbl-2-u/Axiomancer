/**
 * Hook that wraps react-native-reanimated's useReducedMotion
 * Per Phase 10 spec: skip all transitions when reduced motion is enabled
 */
import { useReducedMotion as useReanimatedReducedMotion } from 'react-native-reanimated';

export function useReducedMotion(): boolean {
    return useReanimatedReducedMotion();
}