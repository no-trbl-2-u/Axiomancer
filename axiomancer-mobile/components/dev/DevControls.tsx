/**
 * Shared presentational primitives for the `/dev` route.
 *
 * Every Debug* leaf used to carry its own copy of the same dashed-border
 * row, mono label, and sulfur button styles. This module centralises
 * them so the dev surface reads as ONE system and a leaf is only its
 * behaviour: which store action it calls and what feedback it prints.
 *
 * Three primitives, composed top-down:
 *
 *   <DevRow label sub>            one control group — label column on the
 *                                 left, `children` (buttons/chips) on the
 *                                 right. `sub` is the live feedback line.
 *   <DevButton label onPress>     the primary action affordance.
 *   <DevChip label active onPress> a small toggle/pick affordance, meant
 *                                 to be rendered in a wrapping <DevChips>.
 *
 * All primitives are pure functions of their props — no store access —
 * so the leaves stay the only place that touches state.
 */

import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

/** Props for a labelled control group. */
export interface DevRowProps {
    /** Mono, letter-spaced caption — e.g. `DEBUG · XP`. */
    label: string;
    /** Live feedback / hint line under the label. */
    sub?: string | null;
    /** Optional tone for the sub line: `ok` (heal), `err` (blood). */
    subTone?: 'ok' | 'err' | null;
    /** Stack children under the label instead of beside it. */
    stacked?: boolean;
    /** Forwarded to the outer View for automation hooks. */
    testID?: string;
    children?: React.ReactNode;
}

/**
 * One control group. Renders the caption + sub line, then the children
 * either beside (default) or beneath (`stacked`) the label column.
 */
export function DevRow({ label, sub, subTone, stacked, testID, children }: DevRowProps) {
    const styles = useStyles();
    return (
        <View style={[styles.row, stacked && styles.rowStacked]} testID={testID}>
            <View style={styles.labelCol}>
                <Text style={styles.label}>{label}</Text>
                {sub ? (
                    <Text
                        style={[
                            styles.sub,
                            subTone === 'ok' && styles.subOk,
                            subTone === 'err' && styles.subErr,
                        ]}
                        numberOfLines={3}
                        testID={testID ? `${testID}-sub` : undefined}
                    >
                        {sub}
                    </Text>
                ) : null}
            </View>
            <View style={[styles.controls, stacked && styles.controlsStacked]}>{children}</View>
        </View>
    );
}

/** Props for the primary action button. */
export interface DevButtonProps {
    label: string;
    onPress: () => void;
    /** Accessibility label; defaults to `label`. */
    a11y?: string;
    testID?: string;
    /** Render in the "active/selected" treatment (inverted colours). */
    active?: boolean;
    /** Render in the destructive treatment (blood border). */
    danger?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
}

/** The primary dev action affordance — gothic label, sulfur border. */
export function DevButton({ label, onPress, a11y, testID, active, danger, disabled, style }: DevButtonProps) {
    const styles = useStyles();
    return (
        <Pressable
            style={[
                styles.button,
                active && styles.buttonActive,
                danger && styles.buttonDanger,
                disabled && styles.buttonDisabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={a11y ?? label}
            accessibilityState={{ selected: Boolean(active), disabled: Boolean(disabled) }}
            testID={testID}
        >
            <Text
                style={[
                    styles.buttonLabel,
                    active && styles.buttonLabelActive,
                    danger && styles.buttonLabelDanger,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

/** Props for a small pick/toggle chip. */
export interface DevChipProps {
    label: string;
    onPress: () => void;
    active?: boolean;
    a11y?: string;
    testID?: string;
    /** Secondary tone for chips that mark something notable (e.g. a boss). */
    accent?: boolean;
}

/** A compact selectable chip; render many inside `<DevChips>`. */
export function DevChip({ label, onPress, active, a11y, testID, accent }: DevChipProps) {
    const styles = useStyles();
    return (
        <Pressable
            style={[styles.chip, active && styles.chipActive, accent && styles.chipAccent]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={a11y ?? label}
            accessibilityState={{ selected: Boolean(active) }}
            testID={testID}
        >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive, accent && styles.chipLabelAccent]}>
                {label}
            </Text>
        </Pressable>
    );
}

/** Wrapping flex container for chips. */
export function DevChips({ children, testID }: { children: React.ReactNode; testID?: string }) {
    const styles = useStyles();
    return (
        <View style={styles.chips} testID={testID}>
            {children}
        </View>
    );
}

/** Horizontal button group. */
export function DevButtons({ children }: { children: React.ReactNode }) {
    const styles = useStyles();
    return <View style={styles.buttons}>{children}</View>;
}

/** Key/value line used by the state inspector. */
export function DevKv({ k, v, testID }: { k: string; v: string; testID?: string }) {
    const styles = useStyles();
    return (
        <View style={styles.kv} testID={testID}>
            <Text style={styles.kvKey}>{k}</Text>
            <Text style={styles.kvVal} selectable>
                {v}
            </Text>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
        gap: 8,
    },
    rowStacked: { flexDirection: 'column' },
    labelCol: { flex: 1, minWidth: 96 },
    label: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1.5, color: AXM.bone },
    sub: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.parchment, marginTop: 2 },
    subOk: { color: AXM.heal },
    subErr: { color: AXM.blood },
    controls: { flexShrink: 1, alignItems: 'flex-end' },
    controlsStacked: { alignItems: 'stretch', width: '100%' },
    buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
    button: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.bg,
    },
    buttonActive: { backgroundColor: AXM.sulfur },
    buttonDanger: { borderColor: AXM.blood },
    buttonDisabled: { opacity: 0.4 },
    buttonLabel: { fontFamily: FONTS.gothic, fontSize: 12, letterSpacing: 1.5, color: AXM.sulfur },
    buttonLabelActive: { color: AXM.bg },
    buttonLabelDanger: { color: AXM.blood },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingTop: 4 },
    chip: {
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
    },
    chipActive: { borderColor: AXM.sulfur, backgroundColor: AXM.sulfur },
    chipAccent: { borderColor: AXM.blood },
    chipLabel: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 0.5, color: AXM.parchment },
    chipLabelActive: { color: AXM.bg },
    chipLabelAccent: { color: AXM.blood },
    kv: { flexDirection: 'row', gap: 8, paddingVertical: 1 },
    kvKey: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, width: 92 },
    kvVal: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.parchment, flex: 1 },
}));
