/**
 * CacheProgressMeter — the active layer's pick progress bar (progress
 * out of difficulty). Animates its fill with `withTiming` on every
 * successful push so a roll's gain reads as a physical advance, not a
 * snap.
 */

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';

export interface CacheProgressMeterProps {
    progress: number;
    difficulty: number;
    /** 0-1, precomputed by the presenter. */
    fraction: number;
}

export function CacheProgressMeter({ progress, difficulty, fraction }: CacheProgressMeterProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const [trackWidth, setTrackWidth] = useState(0);
    const width = useSharedValue(0);

    useEffect(() => {
        width.value = withTiming(trackWidth * Math.max(0, Math.min(1, fraction)), { duration: 320 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fraction, trackWidth]);

    const fillStyle = useAnimatedStyle(() => ({ width: width.value }));

    return (
        <View style={styles.wrap} testID="cache-progress-meter">
            <View style={styles.row}>
                <Text style={styles.label}>PICK PROGRESS</Text>
                <Text style={styles.value} testID="cache-progress-value">
                    {progress} / {difficulty}
                </Text>
            </View>
            <View
                style={styles.track}
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            >
                <Animated.View style={[styles.fill, { backgroundColor: AXM.sulfur }, fillStyle]} />
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    wrap: { marginTop: 6 },
    row: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 3,
    },
    label: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.bone },
    value: { fontFamily: FONTS.mono, fontSize: 12, letterSpacing: 1, color: AXM.sulfur },
    track: {
        height: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        overflow: 'hidden',
    },
    fill: { height: '100%' },
}));
