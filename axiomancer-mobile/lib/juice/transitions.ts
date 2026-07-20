import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING } from './juice.timing';

/** Pure data: the enter/exit duration for the given visibility transition. */
export function transitionDurationMs(visible: boolean, timing = JUICE_TIMING): number {
    return visible ? timing.transitions.enterMs : timing.transitions.exitMs;
}

/**
 * A standard mount/unmount opacity+scale transition (card/modal/chip).
 * Reduced-motion / the escape hatch snap instantly to the target state
 * instead of tweening the 0ms-duration case through Reanimated.
 */
export function useJuiceEnterExit(visible: boolean) {
    const reducedMotion = useReducedMotion();
    const progress = useSharedValue(visible ? 1 : 0);
    useEffect(() => {
        const instant = resolveJuiceMode({ reducedMotion }) === 'instant';
        progress.value = withTiming(visible ? 1 : 0, { duration: instant ? 0 : transitionDurationMs(visible) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, reducedMotion]);
    return useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: 0.94 + progress.value * 0.06 }],
    }));
}
