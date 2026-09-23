/**
 * OptionRow — a labelled segmented choice (SMALL / DEFAULT / LARGE …,
 * SYSTEM / ON / OFF, ON / OFF). One row, one setting.
 *
 * Inputs: `label`, `hint`, `options` (value + label), `value`, `onChange`,
 * `testID`. Generic over the option value; the row never inspects it
 * beyond equality.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { OptionVM } from '@/state/presenters/settings.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface OptionRowProps<V> {
    label: string;
    hint?: string;
    options: readonly OptionVM<V>[];
    value: V;
    onChange: (value: V) => void;
    testID: string;
}

export function OptionRow<V extends string | number | boolean>({
    label, hint, options, value, onChange, testID,
}: OptionRowProps<V>) {
    const styles = useStyles();
    return (
        <View style={styles.root} testID={testID}>
            <View style={styles.text}>
                <Text style={styles.label}>{label}</Text>
                {hint ? <Text style={styles.hint}>{hint}</Text> : null}
            </View>
            <View style={styles.segments} accessibilityRole="radiogroup">
                {options.map((opt) => {
                    const selected = opt.value === value;
                    return (
                        <Pressable
                            key={String(opt.value)}
                            style={[styles.segment, selected && styles.segmentOn]}
                            onPress={() => onChange(opt.value)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected, checked: selected }}
                            accessibilityLabel={`${label}: ${opt.label}`}
                            testID={`${testID}-${String(opt.value)}`}
                        >
                            <Text style={[styles.segmentLabel, selected && styles.segmentLabelOn]}>{opt.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: AXM.divider,
        backgroundColor: AXM.panelBg,
        gap: 8,
    },
    text: {},
    label: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 2, color: AXM.parchment },
    hint: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, marginTop: 2 },
    segments: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    segment: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: 'transparent',
        minWidth: 64,
        alignItems: 'center',
    },
    segmentOn: { borderColor: AXM.sulfur, backgroundColor: AXM.selectFill },
    segmentLabel: { fontFamily: FONTS.gothic, fontSize: 12, letterSpacing: 1.5, color: AXM.bone },
    segmentLabelOn: { color: AXM.sulfur },
}));
