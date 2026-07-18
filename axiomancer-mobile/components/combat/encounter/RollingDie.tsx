/**
 * Spec 33 §1/§4 (Phase D6f — The Roll Ritual) — the choreographed dice tumble.
 *
 * A 2.5D tumble (Reanimated worklets over the existing SVG `CombatDie` faces —
 * ZERO new deps) that ALWAYS lands on the engine-rolled face. The engine RNG is
 * the sole authority on outcomes (dice-honesty, 2026-07-09); this component only
 * choreographs the arrival. The real `CombatDie` — carrying the true settled
 * face, its a11y label, and its testID — stays mounted the whole time, so the
 * outcome a die shows is never in doubt (and screen readers / e2e read the
 * settled face immediately). The tumble is pure transform over it.
 *
 * FLAG-ON ONLY. `DiceRow` renders this in place of a bare `CombatDie` only when
 * the Upgradeable-Dice flag is on; flag-off keeps the old, untouched render.
 *
 * Modes (resolved by the caller via `resolveRollMode`):
 *   · animate  → the staggered tumble + spring settle + haptic tick.
 *   · instant  → no animation, no wait (OS reduced-motion, or the seeded-e2e
 *                instant-settle global). The die renders at rest at once.
 *
 * Skip: a rising `skipNonce` (the tray's tap-to-skip) snaps this die to its
 * settled face mid-tumble. Cracked (OVERHEAT) dice never tumble — they sit the
 * ritual out, rendered dead by `CombatDie`.
 */

import React, { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
    cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue,
    withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';

import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';
import {
    dieRollSignature, type DieRollPlan, type RollMode,
} from '@/state/combat/dice-roll-ritual';
import { DICE_ROLL_TIMING } from '@/state/combat/dice-roll-ritual.timing';
import { CombatDie } from './CombatDie';

function tick() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export const RollingDie = React.memo(function RollingDie({
    die, size = 54, dimmed = false, mode, plan, skipNonce = 0, onTumbleChange,
}: {
    die: CombatDieVM;
    size?: number;
    dimmed?: boolean;
    /** animate | instant — resolved upstream from reduced-motion + instant-settle. */
    mode: RollMode;
    /** This die's plan row (stagger + tumble length + the settled face). */
    plan: DieRollPlan;
    /** Rising nonce: a tap on the tumbling tray → snap every die to settled. */
    skipNonce?: number;
    /** Reports tumbling on/off so the tray can gate its tap-to-skip overlay. */
    onTumbleChange?: (id: string, tumbling: boolean) => void;
}) {
    // 3D tumble drivers. `spin` accrues whole turns; `lift`/`pop` arc the die up
    // and back; `landed` springs the final settle bounce. All rest at the values
    // that show the die flat and still on its engine-rolled face.
    const spin = useSharedValue(0);
    const lift = useSharedValue(0);
    const pop = useSharedValue(1);

    // The signature the tumble was last run for — so a Press-Fate reroll (a new
    // face on THIS die) replays the ritual, while an unrelated board re-render
    // (a drag elsewhere) does not.
    const sig = dieRollSignature(die);
    const lastSig = useRef<string | null>(null);
    const tumblingRef = useRef(false);

    const setTumbling = (on: boolean) => {
        if (tumblingRef.current === on) return;
        tumblingRef.current = on;
        onTumbleChange?.(die.id, on);
    };

    const snapSettled = () => {
        cancelAnimation(spin); cancelAnimation(lift); cancelAnimation(pop);
        spin.value = 0; lift.value = 0; pop.value = 1;
        setTumbling(false);
    };

    // Drive the ritual whenever this die's engine result changes (or on first
    // mount). Instant mode / cracked / X / an unchanged result all snap settled.
    useEffect(() => {
        if (lastSig.current === sig) return;
        const first = lastSig.current === null;
        lastSig.current = sig;

        if (!plan.tumbles) { snapSettled(); return; }
        // A first-mount snap with no prior signature only tumbles at true round
        // start (the plan already decided `tumbles` from the prev-signature diff).
        void first;

        const T = DICE_ROLL_TIMING;
        const half = plan.tumbleDurationMs / 2;
        setTumbling(true);
        // Spin: N whole turns over the tumble, after the per-die stagger.
        spin.value = 0;
        spin.value = withDelay(plan.startDelayMs, withTiming(T.tumbleTurns, { duration: plan.tumbleDurationMs }));
        // Lift arc: up then back to the tray line.
        lift.value = withDelay(plan.startDelayMs, withSequence(
            withTiming(1, { duration: half }),
            withTiming(0, { duration: half }),
        ));
        // Pop then the settle spring — the landing bounce onto the face.
        pop.value = withDelay(plan.startDelayMs, withSequence(
            withTiming(T.popScale, { duration: half }),
            withSpring(1, T.settleSpring, (finished) => {
                'worklet';
                if (finished) {
                    runOnJS(tick)();
                    runOnJS(setTumbling)(false);
                }
            }),
        ));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, plan.tumbles, plan.startDelayMs, plan.tumbleDurationMs, mode]);

    // Tap-to-skip: any rising nonce collapses an in-flight tumble to settled.
    const firstSkip = useRef(true);
    useEffect(() => {
        if (firstSkip.current) { firstSkip.current = false; return; }
        if (tumblingRef.current) snapSettled();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skipNonce]);

    // Report tumbling off on unmount so the tray never wedges its overlay open.
    useEffect(() => () => { setTumbling(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const animStyle = useAnimatedStyle(() => {
        const deg = spin.value * 360;
        return {
            transform: [
                { perspective: 520 },
                { translateY: -lift.value * DICE_ROLL_TIMING.liftPx },
                { rotateX: `${deg * 0.6}deg` },
                { rotateY: `${deg}deg` },
                { scale: pop.value },
            ],
        };
    });

    return (
        <Animated.View style={animStyle}>
            <CombatDie die={die} size={size} dimmed={dimmed} />
        </Animated.View>
    );
});
