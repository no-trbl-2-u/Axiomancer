/**
 * StepperRow — a labelled `−  value  +` control for the two volumes. No
 * slider dependency: a stepper is exact, a11y-friendly, and reads fine on
 * web and native alike.
 *
 * Inputs: `label`, `valueLabel` (`70%`), `onDecrement`, `onIncrement`,
 * `atMin` / `atMax` (dim the exhausted verb), `testID`.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface StepperRowProps {
    label: string;
    valueLabel: string;
    onDecrement: () => void;
    onIncrement: () => void;
    atMin?: boolean;
    atMax?: boolean;
    testID: string;
}

export function StepperRow({ label, valueLabel, onDecrement, onIncrement, atMin, atMax, testID }: StepperRowProps) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID={testID}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.controls}>
                <Pressable
                    style={[styles.step, atMin && styles.stepOff]}
                    onPress={atMin ? undefined : onDecrement}
                    disabled={atMin}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} down`}
                    testID={`${testID}-down`}
                >
                    <Text style={styles.stepLabel}>−</Text>
                </Pressable>
                <Text style={styles.value} testID={`${testID}-value`}>{valueLabel}</Text>
                <Pressable
                    style={[styles.step, atMax && styles.stepOff]}
                    onPress={atMax ? undefined : onIncrement}
                    disabled={atMax}
                    accessibilityRole="button"
                    accessibilityLabel={`${label} up`}
                    testID={`${testID}-up`}
                >
                    <Text style={styles.stepLabel}>+</Text>
                </Pressable>
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: AXM.divider,
        backgroundColor: AXM.panelBg,
    },
    label: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.parchment },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    step: {
        width: 34,
        height: 30,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepOff: { opacity: 0.35 },
    stepLabel: { fontFamily: FONTS.mono, fontSize: 16, color: AXM.sulfur },
    value: { fontFamily: FONTS.mono, fontSize: 12, color: AXM.parchment, minWidth: 40, textAlign: 'center' },
}));
