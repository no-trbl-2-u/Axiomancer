/**
 * CacheDie — a pip-based SVG d6 face for the Reliquary's pick-pool dice
 * tray. Pure presentation: draws the classic 1-6 pip arrangement and
 * plays a per-die tumble (rotate/translateY/scale) whenever `rollToken`
 * changes, settling on `face`. A die showing 1 ("slip") renders its pips
 * dimmed/blood-tinted; `warning` pulses that tint for one-away-from-jam
 * tension.
 */

import React, { useEffect } from 'react';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';

import { usePalette } from '@/theme/runtime';

/** Column/row (0-2 grid) pip positions per face, classic d6 layout. */
const PIP_LAYOUT: Record<number, readonly [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

export interface CacheDieProps {
    /** Settled face value (1-6). */
    face: number;
    /** Bumped by the parent on every roll — retriggers the tumble. */
    rollToken: number;
    /** Stagger index so dice in a tray don't tumble in lockstep. */
    index?: number;
    /** True when this die is the bonus (insight) die — subtle accent ring. */
    bonus?: boolean;
    size?: number;
    testID?: string;
}

export const CacheDie = React.memo(function CacheDie({
    face, rollToken, index = 0, bonus = false, size = 44, testID,
}: CacheDieProps) {
    const AXM = usePalette();
    const rotate = useSharedValue(0);
    const lift = useSharedValue(0);
    const scale = useSharedValue(1);
    const warnPulse = useSharedValue(0);

    const slip = face === 1;

    useEffect(() => {
        if (rollToken === 0) return; // skip the mount frame
        const delay = index * 60;
        rotate.value = withDelay(
            delay,
            withSequence(
                withTiming(-22, { duration: 70 }),
                withTiming(26, { duration: 90 }),
                withTiming(-14, { duration: 90 }),
                withTiming(8, { duration: 80 }),
                withTiming(0, { duration: 90 }),
            ),
        );
        lift.value = withDelay(
            delay,
            withSequence(
                withTiming(-10, { duration: 90 }),
                withTiming(3, { duration: 110 }),
                withTiming(0, { duration: 140 }),
            ),
        );
        scale.value = withDelay(
            delay,
            withSequence(
                withTiming(1.16, { duration: 90 }),
                withTiming(0.94, { duration: 110 }),
                withTiming(1, { duration: 140 }),
            ),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollToken]);

    useEffect(() => {
        if (!slip) {
            warnPulse.value = 0;
            return;
        }
        warnPulse.value = withRepeat(
            withSequence(withTiming(1, { duration: 380 }), withTiming(0.35, { duration: 380 })),
            -1,
            true,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slip]);

    const dieStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: lift.value },
            { rotate: `${rotate.value}deg` },
            { scale: scale.value },
        ],
    }));

    const pipColor = slip ? AXM.blood : AXM.parchment;
    const faceStroke = slip ? AXM.blood : bonus ? AXM.sulfur : AXM.ash;
    const cell = size / 3;
    const pipR = size * 0.075;

    return (
        <Animated.View style={dieStyle} testID={testID}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Rect
                    x={1}
                    y={1}
                    width={size - 2}
                    height={size - 2}
                    rx={size * 0.14}
                    fill={AXM.panelBg}
                    stroke={faceStroke}
                    strokeWidth={bonus ? 2.4 : 1.6}
                />
                {(PIP_LAYOUT[face] ?? PIP_LAYOUT[1]).map(([col, row], i) => (
                    <Circle
                        key={i}
                        cx={cell * col + cell / 2}
                        cy={cell * row + cell / 2}
                        r={pipR}
                        fill={pipColor}
                        opacity={slip ? 0.85 : 1}
                    />
                ))}
            </Svg>
        </Animated.View>
    );
});
