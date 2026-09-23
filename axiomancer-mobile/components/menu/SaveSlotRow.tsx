/**
 * SaveSlotRow — one of the three chronicle rows on the slot screen.
 *
 * Draws the numeral, the detail line (`Level 3 · Northern Forest` / `an
 * empty page` / the torn line), the stamp, and up to two verbs: the primary
 * action for the mode (BEGIN / OVERWRITE / JOURNEY ON…) and DELETE SAVE for
 * any non-empty slot. Confirmation for the destructive verbs is the SCREEN's
 * job (it owns the sheet); this row only reports the tap.
 *
 * Inputs: `row` (a `SaveSlotRowVM`), `onAction`, `onClear`.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { SaveSlotRowVM } from '@/state/presenters/main-menu.engine';
import { SAVE_SLOTS_COPY } from '@/state/presenters/main-menu.engine';
import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';

export interface SaveSlotRowProps {
    row: SaveSlotRowVM;
    onAction: (row: SaveSlotRowVM) => void;
    onClear: (row: SaveSlotRowVM) => void;
}

export function SaveSlotRow({ row, onAction, onClear }: SaveSlotRowProps) {
    const styles = useStyles();
    const torn = row.status === 'unreadable';
    const hasAction = row.action !== 'none';
    return (
        <View
            style={[styles.root, row.mostRecent && styles.recent, torn && styles.torn]}
            testID={`save-slot-${row.id}`}
            accessibilityLabel={`Chronicle ${row.numeral}: ${row.detail}${row.stamp ? `, ${row.stamp}` : ''}`}
        >
            <View style={styles.numeralBox}>
                <Text style={styles.numeral}>{row.numeral}</Text>
            </View>
            <View style={styles.text}>
                <Text style={[styles.detail, torn && styles.detailTorn]} numberOfLines={2}>{row.detail}</Text>
                {row.stamp ? <Text style={styles.stamp}>{row.stamp}</Text> : null}
            </View>
            <View style={styles.verbs}>
                {hasAction ? (
                    <Pressable
                        style={({ pressed }) => [
                            styles.verb,
                            row.action === 'overwrite' && styles.verbDanger,
                            pressed && styles.verbPressed,
                        ]}
                        onPress={() => onAction(row)}
                        accessibilityRole="button"
                        accessibilityLabel={`${row.actionLabel} chronicle ${row.numeral}`}
                        testID={`save-slot-${row.id}-action`}
                    >
                        <Text style={[styles.verbLabel, row.action === 'overwrite' && styles.verbLabelDanger]}>
                            {row.actionLabel}
                        </Text>
                    </Pressable>
                ) : null}
                {row.clearable ? (
                    <Pressable
                        style={({ pressed }) => [styles.verb, styles.verbGhost, pressed && styles.verbPressed]}
                        onPress={() => onClear(row)}
                        accessibilityRole="button"
                        accessibilityLabel={`${SAVE_SLOTS_COPY.clearAction} chronicle ${row.numeral}`}
                        testID={`save-slot-${row.id}-clear`}
                    >
                        <Text style={styles.verbLabelGhost}>{SAVE_SLOTS_COPY.clearAction}</Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    root: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    recent: { borderColor: AXM.sulfur },
    torn: { borderColor: AXM.blood, borderStyle: 'dashed' },
    numeralBox: {
        width: 44,
        height: 48,
        borderWidth: 1,
        borderColor: AXM.parchment,
        backgroundColor: AXM.deepBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    numeral: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.sulfur },
    text: { flex: 1 },
    detail: { fontFamily: FONTS.serif, fontSize: 14, color: AXM.parchment },
    detailTorn: { color: AXM.blood, fontFamily: FONTS.serifItalic },
    stamp: { fontFamily: FONTS.mono, fontSize: 9, letterSpacing: 1, color: AXM.bone, marginTop: 3 },
    verbs: { gap: 6, alignItems: 'stretch' },
    verb: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
        alignItems: 'center',
    },
    verbDanger: { borderColor: AXM.blood, backgroundColor: AXM.bg },
    verbGhost: { borderColor: AXM.ash, borderStyle: 'dashed', backgroundColor: 'transparent' },
    verbPressed: { opacity: 0.7 },
    verbLabel: { fontFamily: FONTS.gothic, fontSize: 12, letterSpacing: 1.5, color: AXM.sulfur },
    verbLabelDanger: { color: AXM.blood },
    verbLabelGhost: { fontFamily: FONTS.gothic, fontSize: 11, letterSpacing: 1.5, color: AXM.bone },
}));
