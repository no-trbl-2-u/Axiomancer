import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING } from './juice.timing';

/** Pure data: the two-step in/out opacity curve's peak value at a given intensity. */
export function flashPeakOpacity(intensity: number, timing = JUICE_TIMING): number {
    return Math.max(0, Math.min(1, timing.flash.peakOpacity * Math.max(0.1, intensity)));
}

/**
 * An impact-flash overlay (opacity in/out), triggered every time `triggerKey`
 * rises above 0. `intensity` (0..1, e.g. damage as a fraction of max HP)
 * scales the peak opacity. Reduced-motion / the e2e escape hatch skip
 * straight to transparent. `delayMs` syncs the flash to a later beat in a
 * longer choreography (e.g. an anticipation lunge landing first).
 */
export function useJuiceFlash(triggerKey: number, intensity = 1, delayMs = 0) {
    const reducedMotion = useReducedMotion();
    const opacity = useSharedValue(0);
    useEffect(() => {
        if (triggerKey <= 0) return;
        if (resolveJuiceMode({ reducedMotion }) === 'instant') { opacity.value = 0; return; }
        const peak = flashPeakOpacity(intensity);
        const sequence = withSequence(
            withTiming(peak, { duration: JUICE_TIMING.flash.inMs }),
            withTiming(0, { duration: JUICE_TIMING.flash.outMs }),
        );
        opacity.value = delayMs > 0 ? withDelay(delayMs, sequence) : sequence;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerKey, intensity, delayMs, reducedMotion]);
    return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
