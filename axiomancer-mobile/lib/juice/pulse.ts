import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING } from './juice.timing';

/**
 * Pure data: the scale peak for a pulse at the given intensity (1 = the full
 * "doctrine moment" status-proc pulse, <1 = a subtler emphasis like the card
 * drop-confirm pop).
 */
export function pulsePeakScale(intensity = 1, timing = JUICE_TIMING): number {
    const base = timing.pulse.peakScale;
    return 1 + (base - 1) * Math.max(0, Math.min(1, intensity));
}

/**
 * A scale-emphasis pulse (grow then settle), triggered every time
 * `triggerKey` rises above 0. The status-proc "main event" feel and the card
 * drop-confirm pop share this primitive at different intensities — a status
 * landing should FEEL like the main event, a confirmed drop only a nudge.
 */
export function useJuicePulse(triggerKey: number, intensity = 1) {
    const reducedMotion = useReducedMotion();
    const scale = useSharedValue(1);
    useEffect(() => {
        if (triggerKey <= 0) return;
        if (resolveJuiceMode({ reducedMotion }) === 'instant') { scale.value = 1; return; }
        const peak = pulsePeakScale(intensity);
        scale.value = withSequence(
            withTiming(peak, { duration: JUICE_TIMING.pulse.inMs }),
            withTiming(1, { duration: JUICE_TIMING.pulse.outMs }),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerKey, intensity, reducedMotion]);
    return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
}
