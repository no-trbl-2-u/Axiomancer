import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING, type ShakeIntensity } from './juice.timing';

export interface ShakeStep { offsetPx: number; durationMs: number }

/**
 * Pure data layer: an alternating, decaying offset sequence. The hermetic
 * part every shake is tested against without touching a worklet.
 */
export function shakeTimeline(intensity: ShakeIntensity, timing = JUICE_TIMING): ShakeStep[] {
    const amp = timing.shake.amplitudePx[intensity];
    const { stepMs, steps } = timing.shake;
    const out: ShakeStep[] = [];
    for (let i = 0; i < steps; i += 1) {
        const decay = 1 - i / steps;
        const sign = i % 2 === 0 ? -1 : 1;
        out.push({ offsetPx: sign * amp * decay, durationMs: stepMs });
    }
    out.push({ offsetPx: 0, durationMs: stepMs });
    return out;
}

/**
 * A translateX shake (screen/container, intensity-tiered), triggered every
 * time `triggerKey` rises above 0. Reduced-motion / the e2e escape hatch
 * collapse to a no-op — the shake decides nothing outcome-relevant, so
 * skipping it is always safe. `delayMs` lets a caller sync the shake to a
 * later beat in a longer choreography (e.g. an anticipation lunge landing
 * first) instead of firing on the same frame as the trigger.
 */
export function useJuiceShake(triggerKey: number, intensity: ShakeIntensity = 'medium', delayMs = 0) {
    const reducedMotion = useReducedMotion();
    const offset = useSharedValue(0);
    useEffect(() => {
        if (triggerKey <= 0) return;
        if (resolveJuiceMode({ reducedMotion }) === 'instant') { offset.value = 0; return; }
        const steps = shakeTimeline(intensity);
        const sequence = withSequence(...steps.map((s) => withTiming(s.offsetPx, { duration: s.durationMs })));
        offset.value = delayMs > 0 ? withDelay(delayMs, sequence) : sequence;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [triggerKey, intensity, delayMs, reducedMotion]);
    return useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
}
