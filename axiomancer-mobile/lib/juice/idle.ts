import { useEffect } from 'react';
import {
    Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';

import { resolveJuiceMode } from './instant';
import { JUICE_TIMING } from './juice.timing';

export interface IdleBreathProfile {
    /** Peak scale of the breath swell (1 = no swell). */
    swellScale: number;
    /** Half-period of the swell — one inhale. */
    breathMs: number;
    /** Peak upward drift, in px. */
    floatPx: number;
    /** Half-period of the float. */
    floatMs: number;
}

/**
 * Pure data layer: the idle profile for a figure of the given `weight`
 * (0 = a small, quick thing; 1 = something enormous and slow). Heavier
 * figures breathe deeper AND slower — a boss that twitched at vermin tempo
 * reads as a sprite, not a threat.
 */
export function idleBreathProfile(weight = 0, timing = JUICE_TIMING): IdleBreathProfile {
    const w = Math.max(0, Math.min(1, weight));
    const lerp = (a: number, b: number) => a + (b - a) * w;
    const { breathMs, breathScale, floatMs, floatPx } = timing.idle;
    return {
        swellScale: lerp(breathScale.light, breathScale.heavy),
        breathMs: lerp(breathMs.light, breathMs.heavy),
        floatPx: lerp(floatPx.light, floatPx.heavy),
        floatMs: lerp(floatMs.light, floatMs.heavy),
    };
}

/**
 * A never-ending idle breath — a scale swell plus a slower upward float, each
 * mirrored back on itself forever. This is the "it is alive between turns"
 * primitive: nothing about it is outcome-relevant, so reduced motion and the
 * e2e escape hatch both collapse it to a still figure.
 *
 * The float starts a third of a breath late so the two loops sit permanently
 * out of phase (their periods differ too), which is what keeps a long fight
 * from feeling like a looping GIF.
 *
 * Returns a style carrying its own `transform` array — React Native cannot
 * merge two transform arrays from a style list, so mount this on its own
 * wrapper rather than alongside another animated transform. Pair it with
 * `transformOrigin: 'center bottom'` on that wrapper when the figure stands
 * on the ground: swelling from the centre lifts a creature off its own feet.
 */
export function useJuiceIdleBreath(weight = 0, enabled = true) {
    const reducedMotion = useReducedMotion();
    const swell = useSharedValue(1);
    const rise = useSharedValue(0);
    useEffect(() => {
        if (!enabled || resolveJuiceMode({ reducedMotion }) === 'instant') {
            cancelAnimation(swell);
            cancelAnimation(rise);
            swell.value = 1;
            rise.value = 0;
            return;
        }
        const p = idleBreathProfile(weight);
        const ease = Easing.inOut(Easing.sin);
        swell.value = withRepeat(withTiming(p.swellScale, { duration: p.breathMs, easing: ease }), -1, true);
        rise.value = withDelay(
            Math.round(p.breathMs / 3),
            withRepeat(withTiming(-p.floatPx, { duration: p.floatMs, easing: ease }), -1, true),
        );
        return () => {
            cancelAnimation(swell);
            cancelAnimation(rise);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weight, enabled, reducedMotion]);
    return useAnimatedStyle(() => ({
        transform: [{ translateY: rise.value }, { scale: swell.value }],
    }));
}
