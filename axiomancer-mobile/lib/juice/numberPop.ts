import { useEffect } from 'react';
import { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING } from './juice.timing';

export interface NumberPopTimeline {
    riseDistancePx: number;
    fadeDelayMs: number;
    fadeDurationMs: number;
    riseDurationMs: number;
}

/** Pure data: the rise/fade timeline every number-pop plays. */
export function numberPopTimeline(timing = JUICE_TIMING): NumberPopTimeline {
    return { ...timing.numberPop };
}

/**
 * A rising, fading damage/heal/currency delta pop. Mounts once and plays
 * once — calls `onDone` when the rise completes so the caller can unmount
 * it. Reduced-motion / the escape hatch land the pop at its final state
 * immediately; `onDone` still fires so the float never dangles on screen.
 */
export function useJuiceNumberPop(onDone: () => void) {
    const reducedMotion = useReducedMotion();
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);
    useEffect(() => {
        const t = numberPopTimeline();
        if (resolveJuiceMode({ reducedMotion }) === 'instant') {
            translateY.value = -t.riseDistancePx;
            opacity.value = 0;
            onDone();
            return;
        }
        opacity.value = withDelay(t.fadeDelayMs, withTiming(0, { duration: t.fadeDurationMs }));
        translateY.value = withTiming(-t.riseDistancePx, { duration: t.riseDurationMs }, (finished) => {
            if (finished) runOnJS(onDone)();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
}
